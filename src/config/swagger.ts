// Arquivo: src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const extension = import.meta.url.endsWith('.ts') ? '.ts' : '.js';
const routeGlob = fileURLToPath(new URL(`../routes/*${extension}`, import.meta.url)).replace(/\\/g, '/');

export const swaggerSpec = swaggerJsdoc({
  failOnErrors: true,
  definition: {
    openapi: '3.0.3',
    info: { title: 'API Express e Prisma 8', version: '1.0.0' },
    servers: [{ url: env.API_ORIGIN }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [routeGlob],
});

export const setupSwagger = (app: Express) => {
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};