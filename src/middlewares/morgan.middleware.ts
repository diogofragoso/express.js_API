// Arquivo: src/middlewares/morgan.middleware.ts
import morgan from 'morgan';
import { logger } from '../config/logger.js';

morgan.token('safe-path', req => (req.url ?? '/').split('?')[0]);
export const morganMiddleware = morgan(
  ':method :safe-path :status :response-time ms',
  { stream: { write: message => logger.http(message.trim()) } },
);