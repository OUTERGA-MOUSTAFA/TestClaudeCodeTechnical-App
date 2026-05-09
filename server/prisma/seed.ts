import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const staff = [
  {
    email: 'admin@clinique.ma',
    password: 'Admin123!',
    firstName: 'Hassan',
    lastName: 'El Amrani',
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

const doctors = [
  {
    email: 'dr.alaoui@clinique.ma',
    password: 'Doctor123!',
    firstName: 'Karim',
    lastName: 'Alaoui',
    specialty: 'Médecine Générale',
    licenseNumber: 'LIC-2026-0001',
    phone: '+212600000001',
    bio: '15 ans d’expérience en médecine générale.',
  },
  {
    email: 'dr.tazi@clinique.ma',
    password: 'Doctor123!',
    firstName: 'Nadia',
    lastName: 'Tazi',
    specialty: 'Cardiologie',
    licenseNumber: 'LIC-2026-0002',
    phone: '+212600000002',
    bio: 'Cardiologue, hôpital Ibn Sina.',
  },
];

const patients = [
  {
    email: 'patient1@clinique.ma',
    password: 'Patient123!',
    firstName: 'Yassine',
    lastName: 'Benani',
    dateOfBirth: '1990-04-12',
    gender: 'MALE' as const,
    phone: '+212600100001',
    address: 'Av. Mohammed V, Rabat',
    bloodType: 'O+',
    allergies: null,
    medicalHistory: 'Hypertension contrôlée',
    emergencyContactName: 'Aïcha Benani',
    emergencyContactPhone: '+212600100099',
    insuranceProvider: 'CNSS',
    insuranceNumber: 'CNSS-19900412-001',
  },
  {
    email: 'patient2@clinique.ma',
    password: 'Patient123!',
    firstName: 'Salma',
    lastName: 'Tazi',
    dateOfBirth: '1995-09-23',
    gender: 'FEMALE' as const,
    phone: '+212600100002',
    address: 'Quartier Maârif, Casablanca',
    bloodType: 'A-',
    allergies: 'Pénicilline',
    medicalHistory: null,
    emergencyContactName: 'Mehdi Tazi',
    emergencyContactPhone: '+212600100098',
    insuranceProvider: 'CNOPS',
    insuranceNumber: 'CNOPS-19950923-002',
  },
  {
    email: 'patient3@clinique.ma',
    password: 'Patient123!',
    firstName: 'Omar',
    lastName: 'Idrissi',
    dateOfBirth: '1985-12-01',
    gender: 'MALE' as const,
    phone: '+212600100003',
    address: 'Av. Hassan II, Marrakech',
    bloodType: 'B+',
    allergies: null,
    medicalHistory: 'Asthme léger',
    emergencyContactName: 'Khadija Idrissi',
    emergencyContactPhone: '+212600100097',
    insuranceProvider: 'AXA Assurance',
    insuranceNumber: 'AXA-19851201-003',
  },
];

async function upsertStaff(s: (typeof staff)[number]): Promise<void> {
  await prisma.user.upsert({
    where: { email: s.email },
    update: { firstName: s.firstName, lastName: s.lastName, role: s.role, isActive: true },
    create: {
      email: s.email,
      passwordHash: await bcrypt.hash(s.password, 10),
      firstName: s.firstName,
      lastName: s.lastName,
      role: s.role,
    },
  });
}

async function upsertDoctor(d: (typeof doctors)[number]): Promise<{ id: string }> {
  const user = await prisma.user.upsert({
    where: { email: d.email },
    update: {
      firstName: d.firstName,
      lastName: d.lastName,
      role: 'DOCTOR',
      doctor: {
        update: {
          specialty: d.specialty,
          licenseNumber: d.licenseNumber,
          phone: d.phone,
          bio: d.bio,
        },
      },
    },
    create: {
      email: d.email,
      passwordHash: await bcrypt.hash(d.password, 10),
      firstName: d.firstName,
      lastName: d.lastName,
      role: 'DOCTOR',
      doctor: {
        create: {
          specialty: d.specialty,
          licenseNumber: d.licenseNumber,
          phone: d.phone,
          bio: d.bio,
        },
      },
    },
    include: { doctor: true },
  });
  return { id: user.doctor!.id };
}

async function upsertPatient(p: (typeof patients)[number]): Promise<{ id: string }> {
  const user = await prisma.user.upsert({
    where: { email: p.email },
    update: {
      firstName: p.firstName,
      lastName: p.lastName,
      role: 'PATIENT',
      patient: {
        update: {
          dateOfBirth: new Date(p.dateOfBirth),
          gender: p.gender,
          phone: p.phone,
          address: p.address,
          bloodType: p.bloodType,
          allergies: p.allergies,
          medicalHistory: p.medicalHistory,
          emergencyContactName: p.emergencyContactName,
          emergencyContactPhone: p.emergencyContactPhone,
          insuranceProvider: p.insuranceProvider,
          insuranceNumber: p.insuranceNumber,
        },
      },
    },
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
          address: p.address,
          bloodType: p.bloodType,
          allergies: p.allergies,
          medicalHistory: p.medicalHistory,
          emergencyContactName: p.emergencyContactName,
          emergencyContactPhone: p.emergencyContactPhone,
          insuranceProvider: p.insuranceProvider,
          insuranceNumber: p.insuranceNumber,
        },
      },
    },
    include: { patient: true },
  });
  return { id: user.patient!.id };
}

async function main(): Promise<void> {
  for (const s of staff) await upsertStaff(s);

  const seededDoctors: Array<{ id: string }> = [];
  for (const d of doctors) seededDoctors.push(await upsertDoctor(d));

  const seededPatients: Array<{ id: string }> = [];
  for (const p of patients) seededPatients.push(await upsertPatient(p));

  for (let i = 0; i < seededPatients.length; i++) {
    const p = seededPatients[i]!;
    const d = seededDoctors[i % seededDoctors.length]!;
    const existing = await prisma.appointment.findFirst({
      where: { patientId: p.id, doctorId: d.id },
    });
    if (!existing) {
      await prisma.appointment.create({
        data: {
          patientId: p.id,
          doctorId: d.id,
          scheduledAt: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          durationMinutes: 30,
          reason: i === 0 ? 'Consultation annuelle' : i === 1 ? 'Suivi traitement' : 'Bilan',
          status: i === 0 ? 'SCHEDULED' : 'PENDING',
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
