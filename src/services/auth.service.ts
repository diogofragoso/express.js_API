// Arquivo: src/services/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../prisma/db.js';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';
import { toPublicUser } from './user.service.js';

export class AuthService {
  static async login(data: { email: string; password: string }) {
    const user = await db.orm.public.User.first({ email: data.email });
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new HttpError(401, 'Credenciais inválidas.');
    }
    const token = jwt.sign({ id: user.id }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '15m',
      issuer: 'express-tutorial',
      audience: 'express-api',
    });
    return { token, user: toPublicUser(user) };
  }
}