import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { prisma } from '../src/prisma.js';
import {
  bearer,
  createDoctorUser,
  createPatientUser,
  type SeededUser,
} from './helpers.js';

let app: Express;
beforeAll(() => {
  app = createApp();
});

let patientA: SeededUser;
let patientB: SeededUser;
let doctor: SeededUser;
let myAppointmentId: string;

beforeEach(async () => {
  patientA = await createPatientUser({ email: 'a@test.local' });
  patientB = await createPatientUser({ email: 'b@test.local' });
  doctor = await createDoctorUser({ licenseNumber: 'LIC-Z' });
  const ownAppt = await prisma.appointment.create({
    data: {
      patientId: patientA.patientId!,
      doctorId: doctor.doctorId!,
      scheduledAt: new Date(Date.now() + 86400000),
    },
  });
  myAppointmentId = ownAppt.id;
  await prisma.appointment.create({
    data: {
      patientId: patientB.patientId!,
      doctorId: doctor.doctorId!,
      scheduledAt: new Date(Date.now() + 172800000),
    },
  });
});

describe('GET /api/patient/me', () => {
  it('returns own profile', async () => {
    const res = await request(app).get('/api/patient/me').set(bearer(patientA.token));
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('a@test.local');
    expect(res.body.patient).toBeTruthy();
  });

  it('rejects ADMIN with 403', async () => {
    const admin = await createPatientUser({ email: 'x@test.local' });
    // Force admin role check by patching the JWT path: use a real ADMIN token instead.
    const adminUser = await prisma.user.update({
      where: { id: admin.id },
      data: { role: 'ADMIN' },
    });
    const { signAccessToken } = await import('../src/auth/jwt.js');
    const token = signAccessToken({
      sub: adminUser.id,
      email: adminUser.email,
      role: 'ADMIN',
    });
    const res = await request(app).get('/api/patient/me').set(bearer(token));
    expect(res.status).toBe(403);
  });
});

describe('GET /api/patient/appointments', () => {
  it('lists only own appointments', async () => {
    const res = await request(app).get('/api/patient/appointments').set(bearer(patientA.token));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].patientId).toBe(patientA.patientId);
  });

  it('returns 200/empty for new patient with no appts', async () => {
    const fresh = await createPatientUser({ email: 'fresh@test.local' });
    const res = await request(app).get('/api/patient/appointments').set(bearer(fresh.token));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
  });
});

describe('GET /api/patient/appointments/:id', () => {
  it('returns the appointment if it belongs to the patient', async () => {
    const res = await request(app)
      .get(`/api/patient/appointments/${myAppointmentId}`)
      .set(bearer(patientA.token));
    expect(res.status).toBe(200);
  });

  it('returns 403 when accessing another patient appointment', async () => {
    const otherAppt = await prisma.appointment.findFirst({
      where: { patientId: patientB.patientId! },
    });
    const res = await request(app)
      .get(`/api/patient/appointments/${otherAppt!.id}`)
      .set(bearer(patientA.token));
    expect(res.status).toBe(403);
  });
});
