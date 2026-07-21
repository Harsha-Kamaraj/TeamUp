import { z } from 'zod';

/** Expressing interest can carry an optional short note to the author. */
export const expressInterestSchema = z.object({
  message: z.string().trim().max(500, 'Message is too long').optional().default(''),
});
