import crypto from 'crypto';

import prisma from '../../config/prismaClient';
import { validateAuthPayload } from '../../validators/api/auth.validator';
import { ServiceError } from '../errors';
import { encryptText } from '../../utils/crypto';
import env from '../../config/env';

const TOKEN_DURATION_MS = 3 * 60 * 1000;

function error(message: string): ServiceError {
  return new ServiceError(message);
}

async function logAction(licenseKey: string, action: string, message: string, userId?: string, deviceId?: string) {
  await prisma.licenseLog.create({
    data: {
      licenseKey,
      action,
      message,
      userId: userId || null,
      deviceId: deviceId || null
    }
  });
}

async function failWithLog(message: string, licenseKey: string, userId?: string, deviceId?: string): Promise<never> {
  await logAction(licenseKey, 'error', message, userId, deviceId);
  throw error(message);
}

export async function issueToken(payload: unknown) {
  const parsed = validateAuthPayload(payload);

  if (!parsed.success) {
    throw error('license, bot_userid, and hwid are required.');
  }

  if (!env.encryptionKey || env.encryptionKey.trim().length === 0) {
    throw error('Encryption key is not configured.');
  }

  const { license: licenseKey, bot_userid: botUserId, hwid } = parsed.data;

  const license = await prisma.license.findUnique({
    where: { licenseKey }
  });

  if (!license) {
    await logAction(licenseKey, 'error', 'License not found.', botUserId, hwid);
    throw error('License not found.');
  }

  if (license.status !== 'active') {
    return failWithLog('License is not active.', licenseKey, botUserId, hwid);
  }

  const now = Date.now();

  if (license.expiryDate && license.expiryDate.getTime() < now) {
    return failWithLog('License expired.', licenseKey, botUserId, hwid);
  }

  const updates: Record<string, unknown> = {};

  if (!license.boundUserid && !license.boundDeviceId) {
    updates.boundUserid = botUserId;
    updates.boundDeviceId = hwid;
  } else if (license.boundUserid !== botUserId) {
    return failWithLog('License is bound to another user.', licenseKey, botUserId, hwid);
  } else if (license.boundDeviceId !== hwid) {
    return failWithLog('License is bound to another device.', licenseKey, botUserId, hwid);
  }

  await prisma.activeSession.deleteMany({
    where: {
      licenseKey,
      expiryTimestamp: {
        lt: BigInt(Date.now())
      }
    }
  });

  const activeSessionsCount = await prisma.activeSession.count({
    where: { licenseKey }
  });

  const existingSession = await prisma.activeSession.findFirst({
    where: {
      licenseKey,
      userId: botUserId,
      deviceId: hwid
    }
  });

  if (!existingSession && activeSessionsCount >= license.maxDevices) {
    return failWithLog('License is already in use.', licenseKey, botUserId, hwid);
  }

  const token = crypto.randomBytes(16).toString('hex');
  const expiresAt = now + TOKEN_DURATION_MS;

  const expiryDateToSet = !license.expiryDate && typeof license.days === 'number'
    ? new Date(now + license.days * 24 * 60 * 60 * 1000)
    : null;

  if (expiryDateToSet) {
    updates.expiryDate = expiryDateToSet;
  }

  const operations = [];

  if (existingSession) {
    operations.push(
      prisma.activeSession.update({
        where: { id: existingSession.id },
        data: {
          expiryTimestamp: BigInt(expiresAt)
        }
      })
    );
  } else {
    operations.push(
      prisma.activeSession.create({
        data: {
          licenseKey,
          userId: botUserId,
          deviceId: hwid,
          expiryTimestamp: BigInt(expiresAt)
        }
      })
    );
  }

  if (Object.keys(updates).length > 0) {
    operations.push(
      prisma.license.update({
        where: { id: license.id },
        data: updates
      })
    );
  }

  await prisma.$transaction(operations);

  // Safety net: if the transaction succeeded but expiry was not updated (e.g., stale client/schema),
  // ensure expiryDate is persisted when we expected to set it.
  if (expiryDateToSet) {
    await prisma.license.update({
      where: { id: license.id },
      data: { expiryDate: expiryDateToSet }
    });
  }

  await logAction(licenseKey, 'success', 'Token issued', botUserId, hwid);

  const responsePayload = JSON.stringify({
    status: 'success',
    token,
    expired_at: new Date(expiresAt).toISOString()
  });

  return encryptText(responsePayload);
}

export async function logout(payload: unknown) {
  const parsed = validateAuthPayload(payload);

  if (!parsed.success) {
    throw error('license, bot_userid, and hwid are required.');
  }

  const { license: licenseKey, bot_userid: botUserId, hwid } = parsed.data;

  await prisma.activeSession.deleteMany({
    where: {
      licenseKey,
      userId: botUserId,
      deviceId: hwid
    }
  });

  await logAction(licenseKey, 'logout', 'Logout requested', botUserId, hwid);

  return {
    status: 'success',
    message: 'Logout successful.'
  };
}
