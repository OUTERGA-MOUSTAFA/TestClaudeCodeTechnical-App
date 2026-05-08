import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import express from 'express';
import { authenticate, authorize } from '../src/auth/middleware.js';
import { errorHandler } from '../src/errors.js';
import { signAccessToken } from '../src/auth/jwt.js';

let app: Express;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.get('/protected', authenticate, (req, res) => {
    res.json({ userId: req.user?.sub });
  });
  app.get('/admin-only', authenticate, authorize('ADMIN'), (_req, res) => {
    res.json({ ok: true });
  });
  app.get('/admin-or-sec', authenticate, authorize('ADMIN', 'SECRETARY'), (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
});

describe('authenticate', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });

  it('returns 401 when scheme is not Bearer', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Basic abc');
    expect(res.status).toBe(401);
  });

  it('returns 401 when token is invalid', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });

  it('attaches req.user when token is valid', async () => {
    const token = signAccessToken({
      sub: '11111111-1111-1111-1111-111111111111',
      email: 'x@y.z',
      role: 'PATIENT',
    });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('11111111-1111-1111-1111-111111111111');
  });
});

describe('authorize', () => {
  function tok(role: 'ADMIN' | 'SECRETARY' | 'PATIENT'): string {
    return signAccessToken({
      sub: '22222222-2222-2222-2222-222222222222',
      email: 'a@b.c',
      role,
    });
  }

  it('returns 403 when role not in allowed list', async () => {
    const res = await request(app)
      .get('/admin-only')
      .set('Authorization', `Bearer ${tok('PATIENT')}`);
    expect(res.status).toBe(403);
  });

  it('lets through allowed role', async () => {
    const res = await request(app)
      .get('/admin-only')
      .set('Authorization', `Bearer ${tok('ADMIN')}`);
    expect(res.status).toBe(200);
  });

  it('supports multiple allowed roles', async () => {
    const a = await request(app)
      .get('/admin-or-sec')
      .set('Authorization', `Bearer ${tok('ADMIN')}`);
    const s = await request(app)
      .get('/admin-or-sec')
      .set('Authorization', `Bearer ${tok('SECRETARY')}`);
    const p = await request(app)
      .get('/admin-or-sec')
      .set('Authorization', `Bearer ${tok('PATIENT')}`);
    expect(a.status).toBe(200);
    expect(s.status).toBe(200);
    expect(p.status).toBe(403);
  });
});
