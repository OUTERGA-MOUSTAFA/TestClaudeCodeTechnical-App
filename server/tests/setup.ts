import 'dotenv/config';
import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/prisma.js';

beforeEach(async () => {
  await prisma.product.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
