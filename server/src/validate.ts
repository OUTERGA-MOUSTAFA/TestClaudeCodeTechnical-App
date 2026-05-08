import type { RequestHandler } from 'express';
import { ZodError, type ZodTypeAny, type z } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate<S extends ZodTypeAny>(source: Source, schema: S): RequestHandler {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse(req[source]) as z.infer<S>;
      (req as unknown as Record<Source, unknown>)[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) return next(err);
      next(err);
    }
  };
}
