import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const accounts = [
  {
    email: 'admin@clinique.ma',
    password: 'Admin123!',
    firstName: 'Hassan',
    lastName: 'Admin',
    role: 'ADMIN' as const,
  },
  {
    email: 'fatima@clinique.ma',
    password: 'Secret123!',
    firstName: 'Fatima',
    lastName: 'Zahra',
    role: 'SECRETARY' as const,
  },
];

const doctorAccount = {
  email: 'dr.alaoui@clinique.ma',
  password: 'Doctor123!',
  firstName: 'Karim',
  lastName: 'Alaoui',
  specialty: 'Médecine Générale',
  licenseNumber: 'LIC-2026-0001',
  phone: '+212600000001',
  bio: '15 ans d’expérience en médecine générale.',
};

const patientAccounts = [
  {
    email: 'patient1@clinique.ma',
    password: 'Patient123!',
    firstName: 'Yassine',
    lastName: 'Benani',
    dateOfBirth: '1990-04-12',
    gender: 'MALE' as const,
    phone: '+212600100001',
    bloodType: 'O+',
  },
  {
    email: 'patient2@clinique.ma',
    password: 'Patient123!',
    firstName: 'Salma',
    lastName: 'Tazi',
    dateOfBirth: '1995-09-23',
    gender: 'FEMALE' as const,
    phone: '+212600100002',
    bloodType: 'A-',
    allergies: 'Pénicilline',
  },
  {
    email: 'patient3@clinique.ma',
    password: 'Patient123!',
    firstName: 'Omar',
    lastName: 'Idrissi',
    dateOfBirth: '1985-12-01',
    gender: 'MALE' as const,
    phone: '+212600100003',
    bloodType: 'B+',
  },
];

async function upsertAdminLike(a: (typeof accounts)[number]): Promise<void> {
  await prisma.user.upsert({
    where: { email: a.email },
    update: { firstName: a.firstName, lastName: a.lastName, role: a.role, isActive: true },
    create: {
      email: a.email,
      passwordHash: await bcrypt.hash(a.password, 10),
      firstName: a.firstName,
      lastName: a.lastName,
      role: a.role,
    },
  });
}

async function upsertDoctor(): Promise<{ id: string }> {
  const user = await prisma.user.upsert({
    where: { email: doctorAccount.email },
    update: { firstName: doctorAccount.firstName, lastName: doctorAccount.lastName },
    create: {
      email: doctorAccount.email,
      passwordHash: await bcrypt.hash(doctorAccount.password, 10),
      firstName: doctorAccount.firstName,
      lastName: doctorAccount.lastName,
      role: 'PATIENT',
      doctor: {
        create: {
          specialty: doctorAccount.specialty,
          licenseNumber: doctorAccount.licenseNumber,
          phone: doctorAccount.phone,
          bio: doctorAccount.bio,
        },
      },
    },
    include: { doctor: true },
  });
  return { id: user.doctor!.id };
}

async function upsertPatient(p: (typeof patientAccounts)[number]): Promise<{ id: string }> {
  const user = await prisma.user.upsert({
    where: { email: p.email },
    update: { firstName: p.firstName, lastName: p.lastName },
    create: {
      email: p.email,
      passwordHash: await bcrypt.hash(p.password, 10),
      firstName: p.firstName,
      lastName: p.lastName,
      role: 'PATIENT',
      patient: {
        create: {
          dateOfBirth: new Date(p.dateOfBirth),
          gender: p.gender,
          phone: p.phone,
          bloodType: p.bloodType,
          allergies: 'allergies' in p ? p.allergies : undefined,
        },
      },
    },
    include: { patient: true },
  });
  return { id: user.patient!.id };
}

async function main(): Promise<void> {
  for (const a of accounts) await upsertAdminLike(a);
  const doctor = await upsertDoctor();

  const patients: Array<{ id: string }> = [];
  for (const p of patientAccounts) patients.push(await upsertPatient(p));

  for (let i = 0; i < patients.length; i++) {
    const p = patients[i]!;
    const existing = await prisma.appointment.findFirst({
      where: { patientId: p.id, doctorId: doctor.id, status: 'SCHEDULED' },
    });
    if (!existing) {
      await prisma.appointment.create({
        data: {
          patientId: p.id,
          doctorId: doctor.id,
          scheduledAt: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          durationMinutes: 30,
          reason: i === 0 ? 'Consultation annuelle' : i === 1 ? 'Suivi traitement' : 'Bilan',
        },
      });
    }
  }

  const counts = {
    users: await prisma.user.count(),
    patients: await prisma.patient.count(),
    doctors: await prisma.doctor.count(),
    appointments: await prisma.appointment.count(),
  };
  console.log('[seed]', counts);
}

main()
  .catch((e) => {
    console.error('[seed] failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
