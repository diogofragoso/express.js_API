// Arquivo: src/middlewares/origin.middleware.ts
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';

export const originGuard: RequestHandler = (req, res, next) => {
  const origin = req.get('origin');
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (unsafe && origin !== undefined && ![env.FRONTEND_ORIGIN, env.API_ORIGIN].includes(origin)) {
    res.status(403).json({ error: 'Origem não permitida.' });
    return;
  }
  next();
};