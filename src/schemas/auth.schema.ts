// Arquivo: src/schemas/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
    password: z.string().min(1).refine(value => Buffer.byteLength(value, 'utf8') <= 72),
  }).strict(),
});