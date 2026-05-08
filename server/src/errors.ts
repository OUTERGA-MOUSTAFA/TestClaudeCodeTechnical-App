import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not Found' });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.flatten() });
  }
  // Prisma known errors are mapped here once @prisma/client is generated.
  const code = (err as { code?: string }).code;
  if (code === 'P2025') return res.status(404).json({ error: 'Not Found' });
  if (code === 'P2002')
    return res
      .status(409)
      .json({ error: 'Unique constraint violation', details: (err as { meta?: unknown }).meta });

  console.error('[server] unhandled error', err);
  res.status(500).json({ error: 'Internal Server Error' });
};
