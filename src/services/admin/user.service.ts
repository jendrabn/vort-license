import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';

import prisma from '../../config/prismaClient';
import { createUserSchema, updateUserSchema } from '../../validators/user.validator';
import { ServiceError } from '../errors';

export type UserFormData = {
  username: string;
  email: string;
  role: string;
};

export function getDefaultUserFormData(overrides: Partial<UserFormData> = {}): UserFormData {
  return {
    username: '',
    email: '',
    role: 'user',
    ...overrides
  };
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createUser(input: unknown) {
  const parsed = createUserSchema.safeParse(input);

  if (!parsed.success) {
    throw new ServiceError(parsed.error.issues[0]?.message ?? 'Invalid input', {
      username: (input as Record<string, unknown>)?.username ?? '',
      email: (input as Record<string, unknown>)?.email ?? '',
      role: (input as Record<string, unknown>)?.role ?? 'user'
    });
  }

  const { username, email, password, role } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
    throw new ServiceError(message, {
      username,
      email,
      role
    });
  }
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function updateUser(id: string, input: unknown) {
  const parsed = updateUserSchema.safeParse(input);

  if (!parsed.success) {
    throw new ServiceError(parsed.error.issues[0]?.message ?? 'Invalid input', {
      username: (input as Record<string, unknown>)?.username ?? '',
      email: (input as Record<string, unknown>)?.email ?? '',
      role: (input as Record<string, unknown>)?.role ?? 'user'
    });
  }

  const { username, email, password, role } = parsed.data;

  const data: Prisma.UserUpdateInput = {
    username,
    email,
    role
  };

  if (password && password.length >= 6) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  try {
    await prisma.user.update({
      where: { id },
      data
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user';
    throw new ServiceError(message, {
      username,
      email,
      role
    });
  }
}

export async function deleteUser(id: string) {
  await prisma.user.delete({
    where: { id }
  });
}
