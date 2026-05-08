import 'dotenv/config';
import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/prisma.js';

beforeEach(async () => {
  // Truncate all tables in dependency order.
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
