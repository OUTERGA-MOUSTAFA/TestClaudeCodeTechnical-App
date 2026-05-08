import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
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
let admin: SeededUser;
let patient: SeededUser;

beforeEach(async () => {
  secretary = await createUser({ email: 'sec@test.local', role: 'SECRETARY' });
  admin = await createUser({ email: 'admin@test.local', role: 'ADMIN' });
  patient = await createUser({ email: 'pat@test.local', role: 'PATIENT' });
});

describe('Access control on /api/secretary/*', () => {
  it('rejects PATIENT with 403', async () => {
    const res = await request(app).get('/api/secretary/patients').set(bearer(patient.token));
    expect(res.status).toBe(403);
  });

  it('allows SECRETARY', async () => {
    const res = await request(app).get('/api/secretary/patients').set(bearer(secretary.token));
    expect(res.status).toBe(200);
  });

  it('allows ADMIN as well', async () => {
    const res = await request(app).get('/api/secretary/patients').set(bearer(admin.token));
    expect(res.status).toBe(200);
  });
});

describe('Patients CRUD', () => {
  it('creates and lists a patient', async () => {
    const create = await request(app)
      .post('/api/secretary/patients')
      .set(bearer(secretary.token))
      .send({
        email: 'p1@test.local',
        password: 'Password1!',
        firstName: 'Pat',
        lastName: 'One',
        dateOfBirth: '1990-01-01',
        gender: 'FEMALE',
        bloodType: 'A+',
      });
    expect(create.status).toBe(201);
    const list = await request(app).get('/api/secretary/patients').set(bearer(secretary.token));
    expect(list.body.total).toBe(1);
  });

  it('returns 404 for unknown patient id', async () => {
    const res = await request(app)
      .get('/api/secretary/patients/00000000-0000-0000-0000-000000000000')
      .set(bearer(secretary.token));
    expect(res.status).toBe(404);
  });

  it('updates and deletes a patient', async () => {
    const seeded = await createPatientUser({ email: 'p2@test.local' });
    const upd = await request(app)
      .patch(`/api/secretary/patients/${seeded.patientId}`)
      .set(bearer(secretary.token))
      .send({ phone: '+212600000001', bloodType: 'O-' });
    expect(upd.status).toBe(200);
    expect(upd.body.phone).toBe('+212600000001');
    const del = await request(app)
      .delete(`/api/secretary/patients/${seeded.patientId}`)
      .set(bearer(secretary.token));
    expect(del.status).toBe(204);
  });
});

describe('Appointments + medical records CRUD', () => {
  it('creates an appointment then a medical record', async () => {
    const p = await createPatientUser({ email: 'pp@test.local' });
    const d = await createDoctorUser({ email: 'dd@test.local', licenseNumber: 'LIC-DD' });

    const apptRes = await request(app)
      .post('/api/secretary/appointments')
      .set(bearer(secretary.token))
      .send({
        patientId: p.patientId,
        doctorId: d.doctorId,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 30,
        reason: 'Routine',
      });
    expect(apptRes.status).toBe(201);
    expect(apptRes.body.status).toBe('SCHEDULED');

    const updRes = await request(app)
      .patch(`/api/secretary/appointments/${apptRes.body.id}`)
      .set(bearer(secretary.token))
      .send({ status: 'COMPLETED' });
    expect(updRes.status).toBe(200);
    expect(updRes.body.status).toBe('COMPLETED');

    const recRes = await request(app)
      .post('/api/secretary/medical-records')
      .set(bearer(secretary.token))
      .send({
        patientId: p.patientId,
        doctorId: d.doctorId,
        appointmentId: apptRes.body.id,
        diagnosis: 'Healthy',
        treatment: 'Continue current routine',
      });
    expect(recRes.status).toBe(201);

    const recList = await request(app)
      .get('/api/secretary/medical-records')
      .set(bearer(secretary.token));
    expect(recList.body.total).toBe(1);

    const recDel = await request(app)
      .delete(`/api/secretary/medical-records/${recRes.body.id}`)
      .set(bearer(secretary.token));
    expect(recDel.status).toBe(204);
  });

  it('rejects creating appointment with invalid input (400)', async () => {
    const res = await request(app)
      .post('/api/secretary/appointments')
      .set(bearer(secretary.token))
      .send({ patientId: 'not-a-uuid' });
    expect(res.status).toBe(400);
  });
});
