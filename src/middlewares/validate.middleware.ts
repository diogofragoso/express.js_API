// Arquivo: src/middlewares/validate.middleware.ts
import type { RequestHandler } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodType): RequestHandler => async (req, res, next) => {
  const result = await schema.safeParseAsync({ body: req.body, params: req.params, query: req.query });
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
    })) });
    return;
  }
  const parsed = result.data as { body?: unknown };
  if ('body' in parsed) req.body = parsed.body;
  next();
};