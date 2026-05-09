import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { bearer, createDoctorUser, createUser, type SeededUser } from './helpers.js';

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

describe('Secretary doctors CRUD', () => {
  it('rejects PATIENT with 403', async () => {
    const res = await request(app).get('/api/secretary/doctors').set(bearer(patient.token));
    expect(res.status).toBe(403);
  });

  it('SECRETARY can create + list a doctor', async () => {
    const create = await request(app)
      .post('/api/secretary/doctors')
      .set(bearer(secretary.token))
      .send({
        email: 'd1@test.local',
        password: 'Password1!',
        firstName: 'Doc',
        lastName: 'One',
        specialty: 'Pédiatrie',
        licenseNumber: 'LIC-T-1',
      });
    expect(create.status).toBe(201);
    expect(create.body.specialty).toBe('Pédiatrie');

    const list = await request(app).get('/api/secretary/doctors').set(bearer(admin.token));
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);
  });

  it('rejects duplicate license number with 409', async () => {
    const seeded = await createDoctorUser({ licenseNumber: 'LIC-DUP-1' });
    const res = await request(app)
      .post('/api/secretary/doctors')
      .set(bearer(secretary.token))
      .send({
        email: 'dup@test.local',
        password: 'Password1!',
        firstName: 'X',
        lastName: 'Y',
        specialty: 'Z',
        licenseNumber: 'LIC-DUP-1',
      });
    expect(res.status).toBe(409);
    expect(seeded.doctorId).toBeTruthy();
  });

  it('PATCH updates doctor and underlying user', async () => {
    const seeded = await createDoctorUser({ licenseNumber: 'LIC-PATCH' });
    const res = await request(app)
      .patch(`/api/secretary/doctors/${seeded.doctorId}`)
      .set(bearer(secretary.token))
      .send({ specialty: 'Cardiologie', firstName: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.specialty).toBe('Cardiologie');
    expect(res.body.user.firstName).toBe('Renamed');
  });

  it('DELETE cascades to user', async () => {
    const seeded = await createDoctorUser({ licenseNumber: 'LIC-DEL' });
    const res = await request(app)
      .delete(`/api/secretary/doctors/${seeded.doctorId}`)
      .set(bearer(secretary.token));
    expect(res.status).toBe(204);
    const after = await request(app)
      .get(`/api/secretary/doctors/${seeded.doctorId}`)
      .set(bearer(secretary.token));
    expect(after.status).toBe(404);
  });
});
