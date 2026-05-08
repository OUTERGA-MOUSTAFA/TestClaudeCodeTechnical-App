import { Router } from 'express';
import { CreateUserInputSchema } from '@app/shared';
import { prisma } from '../prisma.js';

export const usersRouter: Router = Router();

usersRouter.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users);
});

usersRouter.post('/', async (req, res) => {
  const parsed = CreateUserInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const user = await prisma.user.create({ data: parsed.data });
  res.status(201).json(user);
});
