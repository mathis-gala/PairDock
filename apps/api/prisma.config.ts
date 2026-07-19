import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { defineConfig } from 'prisma/config';
import { resolveDatabaseConnectionString } from './src/persistence/database-url.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: path.join(currentDirectory, '.env') });

const databaseTargetEnvironment = {
  ...process.env,
  NODE_ENV: process.env.PAIRDOCK_DATABASE_TARGET === 'test' ? 'test' : 'development',
};

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  datasource: {
    url: resolveDatabaseConnectionString(databaseTargetEnvironment),
  },
});
