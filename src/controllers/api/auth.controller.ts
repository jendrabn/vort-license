import { Request, Response } from 'express';

import { ServiceError } from '../../services/errors';
import * as authService from '../../services/api/auth.service';

function sendError(res: Response, message: string) {
  return res.status(200).json({
    status: 'error',
    message
  });
}

export async function issueToken(req: Request, res: Response) {
  try {
    const response = await authService.issueToken(req.body);
    return res.status(200).json(response);
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return sendError(res, error.message);
    }

    return sendError(res, 'Unexpected error.');
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const response = await authService.logout(req.body);
    return res.status(200).json(response);
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return sendError(res, error.message);
    }

    return sendError(res, 'Unexpected error.');
  }
}
