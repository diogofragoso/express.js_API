// Arquivo: src/middlewares/origin.middleware.ts
import type { RequestHandler } from 'express';
import { getAllowedOrigins } from '../config/origins.js';

export const originGuard: RequestHandler = (req, res, next) => {
  const origin = req.get('origin');
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (unsafe && origin !== undefined) {
    const allowed = getAllowedOrigins();
    if (!allowed.includes(origin)) {
      res.status(403).json({ error: 'Origem não permitida.' });
      return;
    }
  }
  next();
};
