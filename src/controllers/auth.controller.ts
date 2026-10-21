// Arquivo: src/controllers/auth.controller.ts
import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { env } from '../config/env.js';

/**
 * Determina dinamicamente as opções de cookie com base no protocolo e contexto da requisição.
 * Garante que em ambientes na nuvem (Azure Static Web Apps + Azure App Service)
 * o cookie receba obrigatoriamente 'secure: true' e 'sameSite: none', permitindo que o navegador
 * armazene o cookie HttpOnly em contextos cross-domain sem bloqueio.
 */
export const getCookieOptions = (req: Request) => {
  const isHttps = req.secure || req.get('x-forwarded-proto') === 'https' || env.NODE_ENV === 'production';
  const origin = req.get('origin') || '';
  const isCrossDomain = Boolean(origin && !origin.includes('localhost') && !origin.includes('127.0.0.1'));
  const useSecure = isHttps || isCrossDomain;

  return {
    httpOnly: true,
    secure: useSecure,
    sameSite: useSecure ? ('none' as const) : ('lax' as const),
    path: '/',
  };
};

export const login = async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);
  const options = getCookieOptions(req);
  res.cookie('token', result.token, { ...options, maxAge: 15 * 60 * 1000 });
  res.json(result);
};

export const logout = (req: Request, res: Response) => {
  const options = getCookieOptions(req);
  res.clearCookie('token', options);
  res.status(204).send();
};
