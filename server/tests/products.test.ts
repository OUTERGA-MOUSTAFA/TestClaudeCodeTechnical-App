import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';

let app: Express;

beforeAll(() => {
  app = createApp();
});

const sample = {
  name: 'Test Product',
  description: 'A product used in tests',
  priceCents: 1234,
  stock: 7,
};

describe('POST /api/products', () => {
  it('creates a product with valid input', async () => {
    const res = await request(app).post('/api/products').send(sample);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(sample);
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(typeof res.body.createdAt).toBe('string');
  });

  it('rejects missing name with 400', async () => {
    const res = await request(app).post('/api/products').send({ priceCents: 100 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('rejects negative priceCents with 400', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'X', priceCents: -1 });
    expect(res.status).toBe(400);
  });

  it('defaults stock to 0 when omitted', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'NoStock', priceCents: 500 });
    expect(res.status).toBe(201);
    expect(res.body.stock).toBe(0);
  });
});

describe('GET /api/products', () => {
  it('returns paginated empty list when no products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 0, take: 20, skip: 0 });
  });

  it('returns created products with total', async () => {
    await request(app).post('/api/products').send(sample);
    await request(app).post('/api/products').send({ ...sample, name: 'Other' });
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items).toHaveLength(2);
  });

  it('filters by search (case-insensitive)', async () => {
    await request(app).post('/api/products').send({ ...sample, name: 'Apple Mouse' });
    await request(app).post('/api/products').send({ ...sample, name: 'Keyboard' });
    const res = await request(app).get('/api/products').query({ search: 'mouse' });
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].name).toBe('Apple Mouse');
  });

  it('respects take/skip pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/products').send({ ...sample, name: `P${i}` });
    }
    const res = await request(app).get('/api/products').query({ take: 2, skip: 1 });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.take).toBe(2);
    expect(res.body.skip).toBe(1);
  });
});

describe('GET /api/products/:id', () => {
  it('returns 404 for unknown id', async () => {
    const res = await request(app).get(
      '/api/products/00000000-0000-0000-0000-000000000000',
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid uuid', async () => {
    const res = await request(app).get('/api/products/not-a-uuid');
    expect(res.status).toBe(400);
  });

  it('returns the product when it exists', async () => {
    const created = await request(app).post('/api/products').send(sample);
    const res = await request(app).get(`/api/products/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });
});

describe('PATCH /api/products/:id', () => {
  it('updates the provided fields', async () => {
    const created = await request(app).post('/api/products').send(sample);
    const res = await request(app)
      .patch(`/api/products/${created.body.id}`)
      .send({ stock: 99 });
    expect(res.status).toBe(200);
    expect(res.body.stock).toBe(99);
    expect(res.body.name).toBe(sample.name);
  });

  it('returns 404 when the product does not exist', async () => {
    const res = await request(app)
      .patch('/api/products/00000000-0000-0000-0000-000000000000')
      .send({ stock: 1 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/products/:id', () => {
  it('deletes an existing product', async () => {
    const created = await request(app).post('/api/products').send(sample);
    const del = await request(app).delete(`/api/products/${created.body.id}`);
    expect(del.status).toBe(204);
    const after = await request(app).get(`/api/products/${created.body.id}`);
    expect(after.status).toBe(404);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete(
      '/api/products/00000000-0000-0000-0000-000000000000',
    );
    expect(res.status).toBe(404);
  });
});
