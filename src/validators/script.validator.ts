import { z } from 'zod';

export const scriptBaseSchema = z.object({
  name: z.string().min(1, 'Script name is required'),
  scriptUrl: z.string().url('Valid script URL is required').optional().or(z.literal('')),
  description: z.string().max(255, 'Description too long').optional().or(z.literal(''))
});

export const createScriptSchema = scriptBaseSchema;

export const updateScriptSchema = scriptBaseSchema;
