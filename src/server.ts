// Arquivo: src/server.ts
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { db } from './prisma/db.js';

const server = app.listen(env.PORT, () => {
  logger.info(`API disponível em http://localhost:${env.PORT}`);
});
const shutdown = () => {
  server.close(() => {
    void db.close().then(() => {
      logger.info('Servidor encerrado.');
      process.exit(0);
    }).catch(() => process.exit(1));
  });
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);