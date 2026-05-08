import { Router } from 'express';
import { IdParamsSchema, PaginationQuerySchema } from '@hc/shared';
import { prisma } from '../prisma.js';
import { HttpError } from '../errors.js';
import { validate } from '../validate.js';
import { authenticate, authorize } from '../auth/middleware.js';

export const patientRouter: Router = Router();

patientRouter.use(authenticate, authorize('PATIENT'));

async function loadOwnPatient(userId: string) {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) throw new HttpError(404, 'Patient profile not found');
  return patient;
}

patientRouter.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: { patient: true },
    });
    if (!user || !user.patient) throw new HttpError(404, 'Profile not found');
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      patient: user.patient,
    });
  } catch (e) {
    next(e);
  }
});

patientRouter.get(
  '/appointments',
  validate('query', PaginationQuerySchema),
  async (req, res, next) => {
    try {
      const { take, skip } = req.query as unknown as { take: number; skip: number };
      const patient = await loadOwnPatient(req.user!.sub);
      const [items, total] = await Promise.all([
        prisma.appointment.findMany({
          where: { patientId: patient.id },
          take,
          skip,
          orderBy: { scheduledAt: 'desc' },
          include: {
            doctor: {
              select: {
                id: true,
                specialty: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        }),
        prisma.appointment.count({ where: { patientId: patient.id } }),
      ]);
      res.json({ items, total, take, skip });
    } catch (e) {
      next(e);
    }
  },
);

patientRouter.get(
  '/appointments/:id',
  validate('params', IdParamsSchema),
  async (req, res, next) => {
    try {
      const patient = await loadOwnPatient(req.user!.sub);
      const appt = await prisma.appointment.findUnique({
        where: { id: req.params.id },
        include: { doctor: true },
      });
      if (!appt) throw new HttpError(404, 'Appointment not found');
      if (appt.patientId !== patient.id) throw new HttpError(403, 'Not your appointment');
      res.json(appt);
    } catch (e) {
      next(e);
    }
  },
);

patientRouter.get(
  '/medical-records',
  validate('query', PaginationQuerySchema),
  async (req, res, next) => {
    try {
      const { take, skip } = req.query as unknown as { take: number; skip: number };
      const patient = await loadOwnPatient(req.user!.sub);
      const [items, total] = await Promise.all([
        prisma.medicalRecord.findMany({
          where: { patientId: patient.id },
          take,
          skip,
          orderBy: { recordedAt: 'desc' },
          include: {
            doctor: {
              select: {
                id: true,
                specialty: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        }),
        prisma.medicalRecord.count({ where: { patientId: patient.id } }),
      ]);
      res.json({ items, total, take, skip });
    } catch (e) {
      next(e);
    }
  },
);
