import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { initialData } from './seed';

import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.reviews.deleteMany();
  await prisma.user.deleteMany();

  const { reviews, users } = initialData;

  await prisma.reviews.createMany({
    data: reviews,
  });

  await prisma.user.createMany({
    data: users,
  });

  console.log('DB sync successful!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
