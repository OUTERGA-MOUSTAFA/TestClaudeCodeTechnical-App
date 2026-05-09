import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { prisma } from '../src/prisma.js';
import {
  bearer,
  createDoctorUser,
  createPatientUser,
  createUser,
  type SeededUser,
} from './helpers.js';

let app: Express;
beforeAll(() => {
  app = createApp();
});

let secretary: SeededUser;
let patient: SeededUser;
let doctor: SeededUser;
let pendingApptId: string;

beforeEach(async () => {
  secretary = await createUser({ email: 'sec@test.local', role: 'SECRETARY' });
  patient = await createPatientUser({ email: 'pat@test.local' });
  doctor = await createDoctorUser({ licenseNumber: 'LIC-LC-1' });
  const appt = await prisma.appointment.create({
    data: {
      patientId: patient.patientId!,
      doctorId: doctor.doctorId!,
      scheduledAt: new Date(Date.now() + 86400000),
      status: 'PENDING',
    },
  });
  pendingApptId = appt.id;
});

describe('PATCH /api/secretary/appointments/:id/accept', () => {
  it('moves PENDING -> SCHEDULED', async () => {
    const res = await request(app)
      .patch(`/api/secretary/appointments/${pendingApptId}/accept`)
      .set(bearer(secretary.token));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SCHEDULED');
  });

  it('returns 409 if not PENDING', async () => {
    await prisma.appointment.update({
      where: { id: pendingApptId },
      data: { status: 'COMPLETED' },
    });
    const res = await request(app)
      .patch(`/api/secretary/appointments/${pendingApptId}/accept`)
      .set(bearer(secretary.token));
    expect(res.status).toBe(409);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .patch('/api/secretary/appointments/00000000-0000-0000-0000-000000000000/accept')
      .set(bearer(secretary.token));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/secretary/appointments/:id/refuse', () => {
  it('moves PENDING -> CANCELLED with rejectionReason', async () => {
    const res = await request(app)
      .patch(`/api/secretary/appointments/${pendingApptId}/refuse`)
      .set(bearer(secretary.token))
      .send({ rejectionReason: 'Doctor unavailable that day' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
    expect(res.body.rejectionReason).toBe('Doctor unavailable that day');
  });

  it('rejects empty rejectionReason with 400', async () => {
    const res = await request(app)
      .patch(`/api/secretary/appointments/${pendingApptId}/refuse`)
      .set(bearer(secretary.token))
      .send({ rejectionReason: '' });
    expect(res.status).toBe(400);
  });
});
