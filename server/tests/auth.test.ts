import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { createUser, bearer } from './helpers.js';

let app: Express;
beforeAll(() => {
  app = createApp();
});

const validRegister = {
  email: 'newuser@test.local',
  password: 'StrongPass123',
  firstName: 'New',
  lastName: 'User',
  dateOfBirth: '1995-03-12',
  gender: 'MALE' as const,
};

describe('POST /api/auth/register', () => {
  it('creates a PATIENT user with profile and returns tokens', async () => {
    const res = await request(app).post('/api/auth/register').send(validRegister);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(validRegister.email);
    expect(res.body.user.role).toBe('PATIENT');
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it('rejects duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(validRegister);
    const res = await request(app).post('/api/auth/register').send(validRegister);
    expect(res.status).toBe(409);
  });

  it('rejects weak password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegister, password: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('returns tokens for correct credentials', async () => {
    await request(app).post('/api/auth/register').send(validRegister);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validRegister.email, password: validRegister.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it('rejects wrong password with 401', async () => {
    await request(app).post('/api/auth/register').send(validRegister);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validRegister.email, password: 'WrongPass1' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown email with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.local', password: 'Whatever1' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('returns current user with valid token', async () => {
    const u = await createUser({ email: 'me@test.local', role: 'ADMIN' });
    const res = await request(app).get('/api/auth/me').set(bearer(u.token));
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@test.local');
    expect(res.body.role).toBe('ADMIN');
  });
});

describe('POST /api/auth/refresh', () => {
  it('issues new tokens from valid refresh token', async () => {
    const reg = await request(app).post('/api/auth/register').send(validRegister);
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: reg.body.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it('returns 401 for invalid refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'garbage' });
    expect(res.status).toBe(401);
  });
});
