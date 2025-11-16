import { Request, Response } from 'express';
import { ServiceError } from '../../services/errors';
import * as userService from '../../services/admin/user.service';

export async function listUsers(req: Request, res: Response) {
  const users = await userService.listUsers();

  res.render('users/index', {
    pageTitle: 'Manage Users',
    users,
    adminUser: req.adminUser,
    activePage: 'users'
  });
}

export function renderCreateForm(req: Request, res: Response) {
  res.render('users/create', {
    pageTitle: 'Create User',
    error: null,
    formData: userService.getDefaultUserFormData()
  });
}

export async function createUser(req: Request, res: Response) {
  try {
    await userService.createUser(req.body);
    return res.redirect('/admin/users');
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return res.status(400).render('users/create', {
        pageTitle: 'Create User',
        error: error.message,
        formData: (error.formData as userService.UserFormData) ?? userService.getDefaultUserFormData()
      });
    }

    return res.status(400).render('users/create', {
      pageTitle: 'Create User',
      error: 'Failed to create user',
      formData: userService.getDefaultUserFormData({
        username: req.body?.username ?? '',
        email: req.body?.email ?? '',
        role: req.body?.role ?? 'user'
      })
    });
  }
}

export async function renderEditForm(req: Request, res: Response) {
  const { id } = req.params;
  const user = await userService.findUserById(id);

  if (!user) {
    return res.redirect('/admin/users');
  }

  res.render('users/edit', {
    pageTitle: 'Edit User',
    error: null,
    user
  });
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const user = await userService.findUserById(id);

  if (!user) {
    return res.redirect('/admin/users');
  }

  try {
    await userService.updateUser(id, req.body);
    return res.redirect('/admin/users');
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return res.status(400).render('users/edit', {
        pageTitle: 'Edit User',
        error: error.message,
        user: {
          ...user,
          username: (error.formData?.username as string) ?? user.username,
          email: (error.formData?.email as string) ?? user.email,
          role: (error.formData?.role as string) ?? user.role
        }
      });
    }

    return res.status(400).render('users/edit', {
      pageTitle: 'Edit User',
      error: 'Failed to update user',
      user: {
        ...user,
        username: req.body?.username ?? user.username,
        email: req.body?.email ?? user.email,
        role: req.body?.role ?? user.role
      }
    });
  }
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await userService.deleteUser(id);
  } catch (error) {
    // TODO: log error
  }

  return res.redirect('/admin/users');
}
