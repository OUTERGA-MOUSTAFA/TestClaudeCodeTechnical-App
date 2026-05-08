import bcrypt from 'bcryptjs';
import type { Role } from '@hc/shared';
import { prisma } from '../src/prisma.js';
import { signAccessToken } from '../src/auth/jwt.js';

export interface SeededUser {
  id: string;
  email: string;
  role: Role;
  token: string;
  patientId?: string;
  doctorId?: string;
}

export async function createUser(opts: {
  email: string;
  password?: string;
  role: Role;
  firstName?: string;
  lastName?: string;
}): Promise<SeededUser> {
  const password = opts.password ?? 'Password123!';
  const user = await prisma.user.create({
    data: {
      email: opts.email,
      passwordHash: await bcrypt.hash(password, 10),
      firstName: opts.firstName ?? 'First',
      lastName: opts.lastName ?? 'Last',
      role: opts.role,
    },
  });
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token: signAccessToken({ sub: user.id, email: user.email, role: user.role }),
  };
}

export async function createPatientUser(opts: {
  email?: string;
  password?: string;
}): Promise<SeededUser> {
  const email = opts.email ?? `patient-${Date.now()}-${Math.random()}@test.local`;
  const base = await createUser({ email, password: opts.password, role: 'PATIENT' });
  const patient = await prisma.patient.create({
    data: {
      userId: base.id,
      dateOfBirth: new Date('1990-01-01'),
      gender: 'OTHER',
    },
  });
  return { ...base, patientId: patient.id };
}

export async function createDoctorUser(opts: {
  email?: string;
  specialty?: string;
  licenseNumber?: string;
}): Promise<SeededUser> {
  const email = opts.email ?? `doctor-${Date.now()}-${Math.random()}@test.local`;
  const base = await createUser({ email, role: 'PATIENT' });
  const doctor = await prisma.doctor.create({
    data: {
      userId: base.id,
      specialty: opts.specialty ?? 'General',
      licenseNumber: opts.licenseNumber ?? `LIC-${Date.now()}-${Math.random()}`,
    },
  });
  return { ...base, doctorId: doctor.id };
}

export function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
