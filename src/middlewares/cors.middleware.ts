// Arquivo: src/middlewares/cors.middleware.ts
import cors from 'cors';
import { getAllowedOrigins } from '../config/origins.js';

export const corsMiddleware = cors({
  origin: (requestOrigin, callback) => {
    // Permite chamadas sem Origin (ex: ferramentas CLI, curl, requisições internas)
    if (!requestOrigin) {
      return callback(null, true);
    }
    const allowed = getAllowedOrigins();
    if (allowed.includes(requestOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origem [${requestOrigin}] não permitida por política de CORS.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
