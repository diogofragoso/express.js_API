// Arquivo: src/config/logger.ts
import winston from 'winston';
import { env } from './env.js';

const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
winston.addColors({ error: 'red', warn: 'yellow', info: 'green', http: 'magenta', debug: 'white' });

export const logger = winston.createLogger({
  levels,
  level: env.NODE_ENV === 'production' ? 'http' : 'debug',
  silent: env.NODE_ENV === 'test',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: env.NODE_ENV === 'test' ? [] : [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5242880, maxFiles: 3 }),
    new winston.transports.File({ filename: 'logs/all.log', maxsize: 5242880, maxFiles: 3 }),
  ],
});