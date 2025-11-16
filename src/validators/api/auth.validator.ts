import { z } from 'zod';

const payloadSchema = z.object({
  license: z.string().min(1, 'license, bot_userid, and hwid are required.'),
  bot_userid: z.string().min(1, 'license, bot_userid, and hwid are required.'),
  hwid: z.string().min(1, 'license, bot_userid, and hwid are required.')
});

export function validateAuthPayload(data: unknown) {
  return payloadSchema.safeParse(data);
}
