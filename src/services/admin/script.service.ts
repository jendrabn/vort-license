import path from 'path';
import fs from 'fs';

import prisma from '../../config/prismaClient';
import {
  createScriptSchema,
  updateScriptSchema
} from '../../validators/script.validator';
import { ServiceError } from '../errors';

const uploadRelativeDir = path.join('uploads', 'scripts');
const uploadDir = path.join(process.cwd(), 'public', uploadRelativeDir);

function ensureUploadDir(): void {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

function normalizeStoredPath(filename: string): string {
  return `/${path.join(uploadRelativeDir, filename).replace(/\\/g, '/')}`;
}

function isLocalUpload(url: string): boolean {
  return url.startsWith(`/${uploadRelativeDir.replace(/\\/g, '/')}`);
}

function deleteLocalFile(url?: string | null): void {
  if (!url || !isLocalUpload(url)) {
    return;
  }
  const absolutePath = path.join(process.cwd(), 'public', url.replace(/^\//, ''));
  if (fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to delete file', absolutePath, error);
    }
  }
}

export type ScriptFormData = {
  name: string;
  scriptUrl: string;
  description: string;
};

export function getDefaultScriptFormData(overrides: Partial<ScriptFormData> = {}): ScriptFormData {
  return {
    name: '',
    scriptUrl: '',
    description: '',
    ...overrides
  };
}

export async function listScripts() {
  return prisma.script.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createScript(input: unknown, file?: Express.Multer.File | null) {
  const parsed = createScriptSchema.safeParse(input);

  if (!parsed.success) {
    throw new ServiceError(parsed.error.issues[0]?.message ?? 'Invalid input', getDefaultScriptFormData({
      name: (input as Record<string, unknown>)?.name as string || '',
      scriptUrl: (input as Record<string, unknown>)?.scriptUrl as string || '',
      description: (input as Record<string, unknown>)?.description as string || ''
    }));
  }

  const data = parsed.data;
  let finalUrl = data.scriptUrl?.trim() || '';

  if (file) {
    ensureUploadDir();
    finalUrl = normalizeStoredPath(file.filename);
  }

  if (!finalUrl) {
    throw new ServiceError('Provide a script URL or upload a file.', getDefaultScriptFormData({
      name: data.name,
      scriptUrl: '',
      description: data.description || ''
    }));
  }

  try {
    await prisma.script.create({
      data: {
        name: data.name,
        scriptUrl: finalUrl,
        description: data.description || null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create script';
    if (file) {
      deleteLocalFile(finalUrl);
    }
    throw new ServiceError(message, getDefaultScriptFormData({
      name: data.name,
      scriptUrl: data.scriptUrl || '',
      description: data.description || ''
    }));
  }
}

export async function getScriptById(id: string) {
  return prisma.script.findUnique({ where: { id } });
}

export async function updateScript(id: string, input: unknown, file?: Express.Multer.File | null) {
  const parsed = updateScriptSchema.safeParse(input);

  if (!parsed.success) {
    throw new ServiceError(parsed.error.issues[0]?.message ?? 'Invalid input');
  }

  const data = parsed.data;
  let finalUrl = data.scriptUrl?.trim() || '';
  let newFilePath: string | undefined;

  if (file) {
    ensureUploadDir();
    newFilePath = normalizeStoredPath(file.filename);
    finalUrl = newFilePath;
  }

  if (!finalUrl) {
    throw new ServiceError('Provide a script URL or upload a file.');
  }

  const previous = await prisma.script.findUnique({ where: { id } });

  if (!previous) {
    if (newFilePath) {
      deleteLocalFile(newFilePath);
    }
    throw new ServiceError('Script not found');
  }

  try {
    await prisma.script.update({
      where: { id },
      data: {
        name: data.name,
        scriptUrl: finalUrl,
        description: data.description || null
      }
    });

    if (newFilePath) {
      deleteLocalFile(previous.scriptUrl);
    }
  } catch (error) {
    if (newFilePath) {
      deleteLocalFile(newFilePath);
    }
    const message = error instanceof Error ? error.message : 'Failed to update script';
    throw new ServiceError(message);
  }
}

export async function deleteScript(id: string) {
  const script = await prisma.script.findUnique({ where: { id } });

  if (!script) {
    return;
  }

  await prisma.script.delete({
    where: { id }
  });

  deleteLocalFile(script.scriptUrl);
}
