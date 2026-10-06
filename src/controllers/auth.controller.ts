// Arquivo: src/controllers/auth.controller.ts
import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { env } from '../config/env.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const login = async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);
  res.cookie('token', result.token, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.json(result);
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('token', cookieOptions);
  res.status(204).send();
};