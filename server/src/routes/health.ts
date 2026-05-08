import { Router } from 'express';
import type { HealthResponse } from '@app/shared';

export const healthRouter: Router = Router();

healthRouter.get('/', (_req, res) => {
  const body: HealthResponse = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  res.json(body);
});
