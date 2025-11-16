import { CookieOptions, Request, Response } from 'express';
import * as authService from '../../services/admin/auth.service';
import env from '../../config/env';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../../validators/adminAuth.validator';

const COOKIE_NAME = 'admin_token';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000
};

export function renderLogin(req: Request, res: Response) {
  res.render('auth/login', {
    pageTitle: 'Admin Login',
    error: null,
    success: null,
    formData: {}
  });
}

export async function handleLogin(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    const errorMessage = parsed.error.issues[0]?.message ?? 'Invalid credentials';
    return res.status(400).render('auth/login', {
      pageTitle: 'Admin Login',
      error: errorMessage,
      success: null,
      formData: { identifier: req.body?.identifier ?? '' }
    });
  }

  const { identifier, password } = parsed.data;

  try {
    const { token, user } = await authService.login(identifier, password);
    res.cookie(COOKIE_NAME, token, cookieOptions);
    req.adminUser = { id: user.id, username: user.username, email: user.email };
    res.locals.adminUser = req.adminUser;
    return res.redirect('/admin/dashboard');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to authenticate';
    return res.status(401).render('auth/login', {
      pageTitle: 'Admin Login',
      error: message,
      success: null,
      formData: { identifier }
    });
  }
}

export function renderForgotPassword(req: Request, res: Response) {
  res.render('auth/forgot-password', {
    pageTitle: 'Forgot Password',
    error: null,
    success: null
  });
}

export async function handleForgotPassword(req: Request, res: Response) {
  const parsed = forgotPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    const errorMessage = parsed.error.issues[0]?.message ?? 'Email is required';
    return res.status(400).render('auth/forgot-password', {
      pageTitle: 'Forgot Password',
      error: errorMessage,
      success: null
    });
  }

  const { email } = parsed.data;

  try {
    await authService.forgotPassword(email);
    return res.render('auth/forgot-password', {
      pageTitle: 'Forgot Password',
      error: null,
      success: 'If the email exists, a reset link has been sent.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process request';
    return res.status(400).render('auth/forgot-password', {
      pageTitle: 'Forgot Password',
      error: message,
      success: null
    });
  }
}

export function renderResetPassword(req: Request, res: Response) {
  const { token } = req.query as { token?: string };

  if (!token) {
    return res.status(400).render('auth/reset-password', {
      pageTitle: 'Reset Password',
      error: 'Reset token is missing',
      success: null,
      token: ''
    });
  }

  res.render('auth/reset-password', {
    pageTitle: 'Reset Password',
    error: null,
    success: null,
    token
  });
}

export async function handleResetPassword(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return res.status(400).render('auth/reset-password', {
      pageTitle: 'Reset Password',
      error: issue?.message ?? 'Invalid input',
      success: null,
      token: req.body?.token ?? ''
    });
  }

  const { token, password } = parsed.data;

  try {
    await authService.resetPassword(token, password);
    return res.render('auth/reset-password', {
      pageTitle: 'Reset Password',
      error: null,
      success: 'Password has been reset. You can now login.',
      token: ''
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reset password';
    return res.status(400).render('auth/reset-password', {
      pageTitle: 'Reset Password',
      error: message,
      success: null,
      token: ''
    });
  }
}

export function handleLogout(req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME);
  return res.redirect('/admin/login');
}

export function renderDashboard(req: Request, res: Response) {
  res.render('admin/dashboard', {
    pageTitle: 'Admin Dashboard',
    adminUser: req.adminUser,
    activePage: 'dashboard'
  });
}
