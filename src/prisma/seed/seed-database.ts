import { PrismaClient } from '../../generated/prisma/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { initialData } from './seed';

import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  const { reviews, users, admins } = initialData;

  await prisma.review.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.deleteMany();

  await prisma.review.createMany({
    data: reviews,
  });

  await prisma.user.createMany({
    data: users,
  });

  await prisma.admin.createMany({
    data: admins,
  });

  console.log('DB sync successful!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
