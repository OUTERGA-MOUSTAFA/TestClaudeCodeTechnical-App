import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { bearer, createDoctorUser, createPatientUser, type SeededUser } from './helpers.js';

let app: Express;
beforeAll(() => {
  app = createApp();
});

let doctor: SeededUser;
let patient: SeededUser;

beforeEach(async () => {
  doctor = await createDoctorUser({ licenseNumber: 'LIC-BK-1' });
  patient = await createPatientUser({ email: 'pat-bk@test.local' });
});

describe('GET /api/public/doctors', () => {
  it('lists doctors without auth', async () => {
    const res = await request(app).get('/api/public/doctors');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0]).toHaveProperty('specialty');
    expect(res.body.items[0]).toHaveProperty('firstName');
  });
});

describe('POST /api/public/appointments', () => {
  const validBooking = {
    email: 'newbooker@test.local',
    firstName: 'Walk',
    lastName: 'In',
    dateOfBirth: '1992-06-01',
    gender: 'FEMALE' as const,
    phone: '+212600000000',
  };

  it('creates User+Patient+PENDING appointment without auth', async () => {
    const res = await request(app)
      .post('/api/public/appointments')
      .send({
        ...validBooking,
        doctorId: doctor.doctorId,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        reason: 'First visit',
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
  });

  it('returns 404 when doctor does not exist', async () => {
    const res = await request(app)
      .post('/api/public/appointments')
      .send({
        ...validBooking,
        email: 'other@test.local',
        doctorId: '00000000-0000-0000-0000-000000000000',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/public/appointments')
      .send({
        ...validBooking,
        email: 'not-an-email',
        doctorId: doctor.doctorId,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
    expect(res.status).toBe(400);
  });
});

describe('Patient self-booking', () => {
  it('GET /api/patient/doctors lists available doctors', async () => {
    const res = await request(app).get('/api/patient/doctors').set(bearer(patient.token));
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('POST /api/patient/appointments creates a PENDING appointment', async () => {
    const res = await request(app)
      .post('/api/patient/appointments')
      .set(bearer(patient.token))
      .send({
        doctorId: doctor.doctorId,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        reason: 'Self-booked',
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.patientId).toBe(patient.patientId);
  });

  it('POST /api/patient/appointments returns 404 for unknown doctor', async () => {
    const res = await request(app)
      .post('/api/patient/appointments')
      .set(bearer(patient.token))
      .send({
        doctorId: '00000000-0000-0000-0000-000000000000',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
    expect(res.status).toBe(404);
  });
});
