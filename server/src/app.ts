import express, { type Express } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { usersRouter } from './routes/users.js';
import { productsRouter } from './routes/products.js';
import { errorHandler, notFoundHandler } from './errors.js';

export function createApp(): Express {
  const app = express();
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/products', productsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
