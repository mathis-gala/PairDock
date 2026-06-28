import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: path.join(currentDirectory, '.env') });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
