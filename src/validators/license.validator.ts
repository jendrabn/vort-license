import { z } from 'zod';

const statusEnum = z.enum(['active', 'banned', 'expired']);

const maxDevicesField = z.preprocess(
  (val) => (typeof val === 'string' ? Number(val) : val),
  z.number().int().positive('Max devices must be at least 1')
);

const daysField = z.preprocess(
  (val) => (typeof val === 'string' ? Number(val) : val),
  z.number().int().positive('Days must be at least 1')
);

export const createLicenseSchema = z.object({
  licenseKey: z.string().trim().optional(),
  scriptId: z.string().min(1, 'Script is required'),
  maxDevices: maxDevicesField.default(1),
  days: daysField,
  status: statusEnum.default('active')
});

export const updateLicenseSchema = z.object({
  scriptId: z.string().min(1, 'Script is required'),
  maxDevices: maxDevicesField.default(1),
  days: daysField,
  status: statusEnum.default('active')
});
