import { Prisma } from '@prisma/client';

import prisma from '../../config/prismaClient';
import {
  createLicenseSchema,
  updateLicenseSchema
} from '../../validators/license.validator';
import { ServiceError } from '../errors';

export interface LicenseFormData {
  licenseKey: string;
  maxDevices: number;
  status: string;
  expiryDate: string;
  scriptId: string;
}

function randomFrom(characters: string): string {
  const index = Math.floor(Math.random() * characters.length);
  return characters[index];
}

export function generateLicenseKey(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const alphaNum = letters + digits;

  const partLetters = Array.from({ length: 4 }, () => randomFrom(letters)).join('');
  const partDigits = Array.from({ length: 4 }, () => randomFrom(digits)).join('');
  const partMix = `${randomFrom(alphaNum)}${randomFrom(alphaNum)}`;

  return `GROW-${partLetters}-${partDigits}-${partMix}`.toUpperCase();
}

export function getDefaultLicenseFormData(overrides: Partial<LicenseFormData> = {}): LicenseFormData {
  return {
    licenseKey: '',
    maxDevices: 1,
    status: 'active',
    expiryDate: '',
    scriptId: '',
    ...overrides
  };
}

export async function listLicenses() {
  return prisma.license.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      script: true
    }
  });
}

export async function getScriptOptions() {
  return prisma.script.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function createLicense(input: unknown) {
  const parsed = createLicenseSchema.safeParse(input);

  if (!parsed.success) {
    throw new ServiceError(parsed.error.issues[0]?.message ?? 'Invalid input', {
      licenseKey: (input as Record<string, unknown>)?.licenseKey ?? '',
      maxDevices: (input as Record<string, unknown>)?.maxDevices ?? 1,
      status: (input as Record<string, unknown>)?.status ?? 'active',
      expiryDate: (input as Record<string, unknown>)?.expiryDate ?? '',
      scriptId: (input as Record<string, unknown>)?.scriptId ?? ''
    });
  }

  const data = parsed.data;
  const licenseKey = data.licenseKey && data.licenseKey.trim().length > 0
    ? data.licenseKey.trim().toUpperCase()
    : generateLicenseKey();

  const createData: Prisma.LicenseCreateInput = {
    licenseKey,
    maxDevices: data.maxDevices,
    status: data.status,
    expiryDate: data.expiryDate ?? null,
    script: {
      connect: {
        id: data.scriptId
      }
    }
  };

  try {
    await prisma.license.create({
      data: createData
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create license';
    throw new ServiceError(message, {
      licenseKey,
      maxDevices: data.maxDevices,
      status: data.status,
      expiryDate: data.expiryDate ?? '',
      scriptId: data.scriptId
    });
  }
}

export async function getLicenseDetail(id: string) {
  return prisma.license.findUnique({
    where: { id },
    include: {
      script: true,
      activeSessions: {
        orderBy: { expiryTimestamp: 'desc' }
      }
    }
  });
}

export async function getLicenseById(id: string) {
  return prisma.license.findUnique({
    where: { id },
    include: { script: true }
  });
}

export async function updateLicense(id: string, input: unknown) {
  const parsed = updateLicenseSchema.safeParse(input);

  if (!parsed.success) {
    throw new ServiceError(parsed.error.issues[0]?.message ?? 'Invalid input', {
      maxDevices: (input as Record<string, unknown>)?.maxDevices ?? 1,
      status: (input as Record<string, unknown>)?.status ?? 'active',
      expiryDate: (input as Record<string, unknown>)?.expiryDate ?? '',
      scriptId: (input as Record<string, unknown>)?.scriptId ?? ''
    });
  }

  const data = parsed.data;

  const updateData: Prisma.LicenseUpdateInput = {
    maxDevices: data.maxDevices,
    status: data.status,
    expiryDate: data.expiryDate ?? null,
    script: {
      connect: {
        id: data.scriptId
      }
    }
  };

  try {
    await prisma.license.update({
      where: { id },
      data: updateData
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update license';
    throw new ServiceError(message, {
      maxDevices: data.maxDevices,
      status: data.status,
      expiryDate: data.expiryDate ?? '',
      scriptId: data.scriptId
    });
  }
}

export async function resetBinding(id: string) {
  const license = await prisma.license.findUnique({ where: { id } });

  if (!license) {
    return;
  }

  await prisma.$transaction([
    prisma.license.update({
      where: { id },
      data: {
        boundUserid: null,
        boundDeviceId: null
      }
    }),
    prisma.activeSession.deleteMany({
      where: { licenseKey: license.licenseKey }
    })
  ]);
}

export async function banLicense(id: string) {
  await prisma.license.update({
    where: { id },
    data: { status: 'banned' }
  });
}

export async function unbanLicense(id: string) {
  await prisma.license.update({
    where: { id },
    data: { status: 'active' }
  });
}

export async function deleteLicense(id: string) {
  const license = await prisma.license.findUnique({ where: { id } });

  if (!license) {
    return;
  }

  await prisma.$transaction([
    prisma.activeSession.deleteMany({
      where: { licenseKey: license.licenseKey }
    }),
    prisma.license.delete({
      where: { id }
    })
  ]);
}
