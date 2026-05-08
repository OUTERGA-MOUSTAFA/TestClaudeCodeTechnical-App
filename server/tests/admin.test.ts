import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { bearer, createUser, type SeededUser } from './helpers.js';

let app: Express;
beforeAll(() => {
  app = createApp();
});

let admin: SeededUser;
let secretary: SeededUser;
let patient: SeededUser;

beforeEach(async () => {
  admin = await createUser({ email: 'admin@test.local', role: 'ADMIN' });
  secretary = await createUser({ email: 'sec@test.local', role: 'SECRETARY' });
  patient = await createUser({ email: 'pat@test.local', role: 'PATIENT' });
});

describe('Access control on /api/admin/*', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('rejects SECRETARY with 403', async () => {
    const res = await request(app).get('/api/admin/users').set(bearer(secretary.token));
    expect(res.status).toBe(403);
  });

  it('rejects PATIENT with 403', async () => {
    const res = await request(app).get('/api/admin/users').set(bearer(patient.token));
    expect(res.status).toBe(403);
  });

  it('allows ADMIN', async () => {
    const res = await request(app).get('/api/admin/users').set(bearer(admin.token));
    expect(res.status).toBe(200);
  });
});

describe('GET /api/admin/users', () => {
  it('returns paginated users', async () => {
    const res = await request(app).get('/api/admin/users').set(bearer(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.items).toHaveLength(3);
  });

  it('filters by search', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .query({ search: 'sec' })
      .set(bearer(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });
});

describe('POST /api/admin/users', () => {
  it('creates a user with given role', async () => {
    const res = await request(app).post('/api/admin/users').set(bearer(admin.token)).send({
      email: 'new@test.local',
      password: 'Password1!',
      firstName: 'New',
      lastName: 'User',
      role: 'SECRETARY',
    });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('SECRETARY');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('rejects duplicate email with 409', async () => {
    const res = await request(app).post('/api/admin/users').set(bearer(admin.token)).send({
      email: admin.email,
      password: 'Password1!',
      firstName: 'X',
      lastName: 'Y',
      role: 'ADMIN',
    });
    expect(res.status).toBe(409);
  });
});

describe('PATCH /api/admin/users/:id', () => {
  it('updates fields', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${patient.id}`)
      .set(bearer(admin.token))
      .send({ firstName: 'Renamed', isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe('Renamed');
    expect(res.body.isActive).toBe(false);
  });

  it('returns 404 for missing user', async () => {
    const res = await request(app)
      .patch('/api/admin/users/00000000-0000-0000-0000-000000000000')
      .set(bearer(admin.token))
      .send({ firstName: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/admin/users/:id', () => {
  it('deletes another user', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${patient.id}`)
      .set(bearer(admin.token));
    expect(res.status).toBe(204);
  });

  it('blocks self-deletion with 400', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${admin.id}`)
      .set(bearer(admin.token));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/stats', () => {
  it('returns role counts', async () => {
    const res = await request(app).get('/api/admin/stats').set(bearer(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.users.total).toBe(3);
    expect(res.body.users.admin).toBe(1);
    expect(res.body.users.secretary).toBe(1);
    expect(res.body.users.patient).toBe(1);
  });
});
