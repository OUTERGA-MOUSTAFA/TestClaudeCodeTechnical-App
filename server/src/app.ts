import express, { type Express } from 'express';
import cors from 'cors';
import { env } from './env.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { secretaryRouter } from './routes/secretary.js';
import { patientRouter } from './routes/patient.js';
import { publicRouter } from './routes/public.js';
import { errorHandler, notFoundHandler } from './errors.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/secretary', secretaryRouter);
  app.use('/api/patient', patientRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
