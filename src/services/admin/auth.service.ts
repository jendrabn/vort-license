import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer, { Transporter } from 'nodemailer';

import prisma from '../../config/prismaClient';
import env from '../../config/env';

type AdminRole = 'admin' | 'user';

interface AuthTokenPayload extends JwtPayload {
  userId: string;
  role: AdminRole;
}

let mailTransporter: Transporter | null = null;

function getJwtSecret(): string {
  if (!env.jwtSecret) {
    throw new Error('JWT secret is not configured');
  }

  return env.jwtSecret;
}

function getTransporter(): Transporter | null {
  if (mailTransporter) {
    return mailTransporter;
  }

  if (!env.mail.host || !env.mail.user || !env.mail.pass) {
    return null;
  }

  mailTransporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port ?? 587,
    secure: env.mail.secure ?? false,
    auth: {
      user: env.mail.user,
      pass: env.mail.pass
    }
  });

  return mailTransporter;
}

export async function login(identifier: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: identifier },
        { email: identifier }
      ]
    }
  });

  if (!user || user.role !== 'admin') {
    throw new Error('Invalid username or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new Error('Invalid username or password');
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    getJwtSecret(),
    { expiresIn: '1d' }
  );

  return { token, user };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || user.role !== 'admin') {
    throw new Error('Admin account not found');
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpiry: expiresAt
    }
  });

  const resetLink = `${env.appUrl}/admin/reset-password?token=${rawToken}`;
  await sendResetEmail(user.email, resetLink);

  return { resetLink };
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpiry: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    throw new Error('Reset token is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordTokenExpiry: null
    }
  });
}

async function sendResetEmail(email: string, resetLink: string) {
  const transporter = getTransporter();
  const subject = 'Password Reset Request';
  const text = `You requested to reset your password. Use the link below to set a new password. The link expires in 1 hour.\n\n${resetLink}`;
  const html = `
    <p>You requested to reset your password.</p>
    <p>Use the link below to set a new password. The link expires in 1 hour.</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
  `;

  if (!transporter) {
    console.warn('Email transport is not configured. Reset link:', resetLink);
    return;
  }

  await transporter.sendMail({
    from: env.mail.from || env.mail.user,
    to: email,
    subject,
    text,
    html
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
}
