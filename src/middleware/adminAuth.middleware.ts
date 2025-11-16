import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

import env from '../config/env';
import prisma from '../config/prismaClient';

const COOKIE_NAME = 'admin_token';

interface AdminTokenPayload extends JwtPayload {
  userId: string;
  role: string;
}

async function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies ? req.cookies[COOKIE_NAME] : null;

  if (!token) {
    return res.redirect('/admin/login');
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AdminTokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    req.adminUser = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    res.locals.adminUser = req.adminUser;

    return next();
  } catch (error) {
    res.clearCookie(COOKIE_NAME);
    return res.redirect('/admin/login');
  }
}

export default adminAuthMiddleware;
