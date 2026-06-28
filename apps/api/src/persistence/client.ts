import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadDotenv } from 'dotenv';
import { type Prisma, PrismaClient } from '../generated/prisma/client.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: path.join(currentDirectory, '..', '..', '.env') });

function buildAdapter(): PrismaPg {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to initialize the database client.');
  }

  return new PrismaPg({ connectionString });
}

@Injectable()
export class DatabaseClient extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: buildAdapter() });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

export type DatabaseExecutor = DatabaseClient | Prisma.TransactionClient;
