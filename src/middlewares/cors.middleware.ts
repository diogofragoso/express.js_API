// Arquivo: src/middlewares/cors.middleware.ts
import cors from 'cors';
import { env } from '../config/env.js';

export const corsMiddleware = cors({
  origin: [env.FRONTEND_ORIGIN, env.API_ORIGIN],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});