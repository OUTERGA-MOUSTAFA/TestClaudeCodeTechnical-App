import { Router } from 'express';
import {
  CreateUserInputSchema,
  IdParamsSchema,
  PaginationQuerySchema,
  UpdateUserInputSchema,
} from '@hc/shared';
import { prisma } from '../prisma.js';
import { HttpError } from '../errors.js';
import { validate } from '../validate.js';
import { authenticate, authorize } from '../auth/middleware.js';
import { hashPassword } from '../auth/password.js';

export const adminRouter: Router = Router();

adminRouter.use(authenticate, authorize('ADMIN'));

const userPublicSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

adminRouter.get('/users', validate('query', PaginationQuerySchema), async (req, res, next) => {
  try {
    const { search, take, skip } = req.query as unknown as {
      search?: string;
      take: number;
      skip: number;
    };
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        select: userPublicSelect,
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ items, total, take, skip });
  } catch (e) {
    next(e);
  }
});

adminRouter.get('/users/:id', validate('params', IdParamsSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: userPublicSelect,
    });
    if (!user) throw new HttpError(404, 'User not found');
    res.json(user);
  } catch (e) {
    next(e);
  }
});

adminRouter.post('/users', validate('body', CreateUserInputSchema), async (req, res, next) => {
  try {
    const body = req.body as import('@hc/shared').CreateUserInput;
    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) throw new HttpError(409, 'Email already in use');
    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        isActive: body.isActive ?? true,
      },
      select: userPublicSelect,
    });
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
});

adminRouter.patch(
  '/users/:id',
  validate('params', IdParamsSchema),
  validate('body', UpdateUserInputSchema),
  async (req, res, next) => {
    try {
      const body = req.body as import('@hc/shared').UpdateUserInput;
      const data: {
        email?: string;
        firstName?: string;
        lastName?: string;
        role?: 'ADMIN' | 'SECRETARY' | 'PATIENT';
        isActive?: boolean;
        passwordHash?: string;
      } = {};
      if (body.email !== undefined) data.email = body.email;
      if (body.firstName !== undefined) data.firstName = body.firstName;
      if (body.lastName !== undefined) data.lastName = body.lastName;
      if (body.role !== undefined) data.role = body.role;
      if (body.isActive !== undefined) data.isActive = body.isActive;
      if (body.password !== undefined) data.passwordHash = await hashPassword(body.password);

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data,
        select: userPublicSelect,
      });
      res.json(user);
    } catch (e) {
      next(e);
    }
  },
);

adminRouter.delete('/users/:id', validate('params', IdParamsSchema), async (req, res, next) => {
  try {
    if (req.params.id === req.user!.sub) {
      throw new HttpError(400, 'Cannot delete your own account');
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

adminRouter.get('/stats', async (_req, res, next) => {
  try {
    const [
      totalUsers,
      adminCount,
      secretaryCount,
      patientCount,
      doctorCount,
      appointmentCount,
      scheduledCount,
      completedCount,
      medicalRecordCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'SECRETARY' } }),
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.doctor.count(),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'SCHEDULED' } }),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.medicalRecord.count(),
    ]);
    res.json({
      users: {
        total: totalUsers,
        admin: adminCount,
        secretary: secretaryCount,
        patient: patientCount,
      },
      doctors: doctorCount,
      appointments: {
        total: appointmentCount,
        scheduled: scheduledCount,
        completed: completedCount,
      },
      medicalRecords: medicalRecordCount,
    });
  } catch (e) {
    next(e);
  }
});
