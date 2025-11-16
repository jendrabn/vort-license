import { z } from 'zod';

const statusEnum = z.enum(['active', 'banned', 'expired']);

const maxDevicesField = z.preprocess(
  (val) => (typeof val === 'string' ? Number(val) : val),
  z.number().int().positive('Max devices must be at least 1')
);

const expiryDateField = z.preprocess((val) => {
  if (val === '' || val === null || typeof val === 'undefined') {
    return undefined;
  }
  if (typeof val === 'string') {
    return new Date(val);
  }
  if (val instanceof Date) {
    return val;
  }
  return undefined;
}, z.date().optional());

export const createLicenseSchema = z.object({
  licenseKey: z.string().trim().optional(),
  scriptId: z.string().min(1, 'Script is required'),
  maxDevices: maxDevicesField.default(1),
  status: statusEnum.default('active'),
  expiryDate: expiryDateField
});

export const updateLicenseSchema = z.object({
  scriptId: z.string().min(1, 'Script is required'),
  maxDevices: maxDevicesField.default(1),
  status: statusEnum.default('active'),
  expiryDate: expiryDateField
});
