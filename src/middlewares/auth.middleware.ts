// Arquivo: src/middlewares/auth.middleware.ts
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { db } from '../prisma/db.js';

export const authMiddleware: RequestHandler = async (req, res, next) => {
  const authorization = req.get('authorization');
  let token: string | undefined;
  if (authorization !== undefined) {
    const match = /^Bearer ([^\s]+)$/i.exec(authorization);
    if (!match) {
      res.status(401).json({ error: 'Cabeçalho Authorization inválido.' });
      return;
    }
    token = match[1];
  } else if (typeof req.cookies?.token === 'string') {
    token = req.cookies.token;
  }
  if (!token) {
    res.status(401).json({ error: 'Token não fornecido.' });
    return;
  }
  // Cookies são enviados automaticamente pelo navegador: mutações exigem origem confiável.
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (authorization === undefined && unsafe &&
      ![env.FRONTEND_ORIGIN, env.API_ORIGIN].includes(req.get('origin') ?? '')) {
    res.status(403).json({ error: 'Origem obrigatória e confiável para autenticação por cookie.' });
    return;
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'], issuer: 'express-tutorial', audience: 'express-api',
    });
    if (typeof payload === 'string' || !Number.isInteger(payload.id) ||
        payload.id < 1 || payload.id > 2147483647) {
      throw new Error('Payload inválido.');
    }
    const user = await db.orm.public.User.first({ id: payload.id });
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }
    res.locals.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido, expirado ou usuário inexistente.' });
  }
};

export const requireSelf: RequestHandler = (req, res, next) => {
  if (Number(req.params.id) !== res.locals.userId) {
    res.status(403).json({ error: 'Você só pode acessar a própria conta.' });
    return;
  }
  next();
};