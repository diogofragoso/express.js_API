/// <reference types="node" />
// Arquivo: prisma.config.ts
import 'dotenv/config';
import { definePrismaConfig } from 'prisma/config';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

let connection = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connection && process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
  const pass = process.env.DB_PASSWORD ? process.env.DB_PASSWORD.replace(/^"|"$/g, '') : '';
  connection = `postgresql://${process.env.DB_USER}:${encodeURIComponent(pass)}@${process.env.DB_HOST}:5432/${process.env.DB_NAME}`;
}
if (!connection) throw new Error('Configure DATABASE_URL ou DIRECT_URL antes de usar a CLI.');

export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/prisma/contract.prisma',
    db: { connection },
  }),
  skills: { agents: ['agents'] },
});
