// Arquivo: src/schemas/user.schema.ts
import { z } from 'zod';

export const idParams = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser numérico.').refine(value => {
    const id = Number(value);
    return Number.isSafeInteger(id) && id >= 1 && id <= 2147483647;
  }, 'ID fora do intervalo permitido.'),
});

const password = z.string().min(8, 'Use pelo menos 8 caracteres.').refine(
  value => Buffer.byteLength(value, 'utf8') <= 72,
  'A senha deve ter no máximo 72 bytes em UTF-8.',
);

export const createUserBody = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password,
}).strict();

export const updateUserBody = createUserBody.partial().refine(
  value => Object.keys(value).length > 0,
  'Informe pelo menos um campo.',
);

export const createUserSchema = z.object({ body: createUserBody });
export const updateUserSchema = z.object({ body: updateUserBody, params: idParams });
export const userIdSchema = z.object({ params: idParams });