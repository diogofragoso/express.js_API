// Arquivo: src/app.ts
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import routes from './routes/index.js';
import { env } from './config/env.js';
import { setupSwagger } from './config/swagger.js';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { morganMiddleware } from './middlewares/morgan.middleware.js';
import { originGuard } from './middlewares/origin.middleware.js';
import { limiter, loginLimiter } from './middlewares/rateLimit.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const app = express();
app.use(morganMiddleware);
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : {
    directives: { 'upgrade-insecure-requests': null },
  },
}));
app.use(corsMiddleware);
app.use(originGuard);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(limiter);
app.use('/login', loginLimiter);
app.use(cookieParser());
app.use(express.json({ limit: '16kb' }));
app.use(routes);
setupSwagger(app);
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use(errorHandler);