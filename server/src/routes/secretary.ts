import { Router } from 'express';
import {
  CreateAppointmentInputSchema,
  CreateMedicalRecordInputSchema,
  CreatePatientInputSchema,
  IdParamsSchema,
  PaginationQuerySchema,
  UpdateAppointmentInputSchema,
  UpdateMedicalRecordInputSchema,
  UpdatePatientInputSchema,
} from '@hc/shared';
import { prisma } from '../prisma.js';
import { HttpError } from '../errors.js';
import { validate } from '../validate.js';
import { authenticate, authorize } from '../auth/middleware.js';
import { hashPassword } from '../auth/password.js';

export const secretaryRouter: Router = Router();

secretaryRouter.use(authenticate, authorize('ADMIN', 'SECRETARY'));

// ─── Patients ───────────────────────────────────────────────────────────────
secretaryRouter.get(
  '/patients',
  validate('query', PaginationQuerySchema),
  async (req, res, next) => {
    try {
      const { search, take, skip } = req.query as unknown as {
        search?: string;
        take: number;
        skip: number;
      };
      const where = search
        ? {
            user: {
              OR: [
                { email: { contains: search, mode: 'insensitive' as const } },
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
              ],
            },
          }
        : undefined;
      const [items, total] = await Promise.all([
        prisma.patient.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { email: true, firstName: true, lastName: true } } },
        }),
        prisma.patient.count({ where }),
      ]);
      res.json({ items, total, take, skip });
    } catch (e) {
      next(e);
    }
  },
);

secretaryRouter.get(
  '/patients/:id',
  validate('params', IdParamsSchema),
  async (req, res, next) => {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: req.params.id },
        include: {
          user: { select: { email: true, firstName: true, lastName: true, isActive: true } },
        },
      });
      if (!patient) throw new HttpError(404, 'Patient not found');
      res.json(patient);
    } catch (e) {
      next(e);
    }
  },
);

secretaryRouter.post(
  '/patients',
  validate('body', CreatePatientInputSchema),
  async (req, res, next) => {
    try {
      const body = req.body as import('@hc/shared').CreatePatientInput;
      const exists = await prisma.user.findUnique({ where: { email: body.email } });
      if (exists) throw new HttpError(409, 'Email already in use');
      const passwordHash = await hashPassword(body.password);
      const user = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          firstName: body.firstName,
          lastName: body.lastName,
          role: 'PATIENT',
          patient: {
            create: {
              dateOfBirth: new Date(body.dateOfBirth),
              gender: body.gender,
              phone: body.phone,
              address: body.address,
              bloodType: body.bloodType,
              allergies: body.allergies,
              medicalHistory: body.medicalHistory,
            },
          },
        },
        include: { patient: true },
      });
      res.status(201).json(user.patient);
    } catch (e) {
      next(e);
    }
  },
);

secretaryRouter.patch(
  '/patients/:id',
  validate('params', IdParamsSchema),
  validate('body', UpdatePatientInputSchema),
  async (req, res, next) => {
    try {
      const body = req.body as import('@hc/shared').UpdatePatientInput;
      const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
      if (!patient) throw new HttpError(404, 'Patient not found');

      const userData: { firstName?: string; lastName?: string } = {};
      if (body.firstName !== undefined) userData.firstName = body.firstName;
      if (body.lastName !== undefined) userData.lastName = body.lastName;

      const patientData: {
        dateOfBirth?: Date;
        gender?: 'MALE' | 'FEMALE' | 'OTHER';
        phone?: string | null;
        address?: string | null;
        bloodType?: string | null;
        allergies?: string | null;
        medicalHistory?: string | null;
      } = {};
      if (body.dateOfBirth !== undefined) patientData.dateOfBirth = new Date(body.dateOfBirth);
      if (body.gender !== undefined) patientData.gender = body.gender;
      if (body.phone !== undefined) patientData.phone = body.phone;
      if (body.address !== undefined) patientData.address = body.address;
      if (body.bloodType !== undefined) patientData.bloodType = body.bloodType;
      if (body.allergies !== undefined) patientData.allergies = body.allergies;
      if (body.medicalHistory !== undefined) patientData.medicalHistory = body.medicalHistory;

      const updated = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          ...patientData,
          ...(Object.keys(userData).length > 0 ? { user: { update: userData } } : {}),
        },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },
);

secretaryRouter.delete(
  '/patients/:id',
  validate('params', IdParamsSchema),
  async (req, res, next) => {
    try {
      const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
      if (!patient) throw new HttpError(404, 'Patient not found');
      await prisma.user.delete({ where: { id: patient.userId } });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
);

// ─── Appointments ───────────────────────────────────────────────────────────
secretaryRouter.get(
  '/appointments',
  validate('query', PaginationQuerySchema),
  async (req, res, next) => {
    try {
      const { take, skip } = req.query as unknown as { take: number; skip: number };
      const [items, total] = await Promise.all([
        prisma.appointment.findMany({
          take,
          skip,
          orderBy: { scheduledAt: 'desc' },
          include: {
            patient: {
              select: { id: true, user: { select: { firstName: true, lastName: true } } },
            },
            doctor: { select: { id: true, specialty: true } },
          },
        }),
        prisma.appointment.count(),
      ]);
      res.json({ items, total, take, skip });
    } catch (e) {
      next(e);
    }
  },
);

secretaryRouter.get(
  '/appointments/:id',
  validate('params', IdParamsSchema),
  async (req, res, next) => {
    try {
      const appt = await prisma.appointment.findUnique({
        where: { id: req.params.id },
        include: { patient: true, doctor: true },
      });
      if (!appt) throw new HttpError(404, 'Appointment not found');
      res.json(appt);
    } catch (e) {
      next(e);
    }
  },
);

secretaryRouter.post(
  '/appointments',
  validate('body', CreateAppointmentInputSchema),
  async (req, res, next) => {
    try {
      const body = req.body as import('@hc/shared').CreateAppointmentInput;
      const appt = await prisma.appointment.create({
        data: {
          patientId: body.patientId,
          doctorId: body.doctorId,
          scheduledAt: new Date(body.scheduledAt),
          durationMinutes: body.durationMinutes ?? 30,
          reason: body.reason,
          notes: body.notes,
        },
      });
      res.status(201).json(appt);
    } catch (e) {
      next(e);
    }
  },
);

secretaryRouter.patch(
  '/appointments/:id',
  validate('params', IdParamsSchema),
  validate('body', UpdateAppointmentInputSchema),
  async (req, res, next) => {
    try {
      const body = req.body as import('@hc/shared').UpdateAppointmentInput;
      const data: {
        scheduledAt?: Date;
        durationMinutes?: number;
        status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
        reason?: string | null;
        notes?: string | null;
      } = {};
      if (body.scheduledAt !== undefined) data.scheduledAt = new Date(body.scheduledAt);
      if (body.durationMinutes !== undefined) data.durationMinutes = body.durationMinutes;
      if (body.status !== undefined) data.status = body.status;
      if (body.reason !== undefined) data.reason = body.reason;
      if (body.notes !== undefined) data.notes = body.notes;
      const appt = await prisma.appointment.update({ where: { id: req.params.id }, data });
      res.json(appt);
    } catch (e) {
      next(e);
    }
  },
);

secretaryRouter.delete(
  '/appointments/:id',
  validate('params', IdParamsSchema),
  async (req, res, next) => {
    try {
      await prisma.appointment.delete({ where: { id: req.params.id } });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
);

// ─── Medical Records ────────────────────────────────────────────────────────
secretaryRouter.get(
  '/medical-records',
  validate('query', PaginationQuerySchema),
  async (req, res, next) => {
    try {
      const { take, skip } = req.query as unknown as { take: number; skip: number };
      const [items, total] = await Promise.all([
        prisma.medicalRecord.findMany({
          take,
          skip,
          orderBy: { recordedAt: 'desc' },
          include: {
            patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
            doctor: { select: { id: true, specialty: true } },
          },
        }),
        prisma.medicalRecord.count(),
      ]);
      res.json({ items, total, take, skip });
    } catch (e) {
      next(e);
    }
  },
);

secretaryRouter.get(
  '/medical-records/:id',
  validate('params', IdParamsSchema),
  async (req, res, next) => {
    try {
      const record = await prisma.medicalRecord.findUnique({
        where: { id: req.params.id },
        include: { patient: true, doctor: true, appointment: true },
      });
      if (!record) throw new HttpError(404, 'Medical record not found');
      res.json(record);
    } catch (e) {
      next(e);
    }
  },
);

secretaryRouter.post(
  '/medical-records',
  validate('body', CreateMedicalRecordInputSchema),
  async (req, res, next) => {
    try {
      const body = req.body as import('@hc/shared').CreateMedicalRecordInput;
      const record = await prisma.medicalRecord.create({
        data: {
          patientId: body.patientId,
          doctorId: body.doctorId,
          appointmentId: body.appointmentId,
          diagnosis: body.diagnosis,
          treatment: body.treatment,
          prescription: body.prescription,
          notes: body.notes,
        },
      });
      res.status(201).json(record);
    } catch (e) {
      next(e);
    }
  },
);

secretaryRouter.patch(
  '/medical-records/:id',
  validate('params', IdParamsSchema),
  validate('body', UpdateMedicalRecordInputSchema),
  async (req, res, next) => {
    try {
      const body = req.body as import('@hc/shared').UpdateMedicalRecordInput;
      const data: {
        diagnosis?: string;
        treatment?: string | null;
        prescription?: string | null;
        notes?: string | null;
      } = {};
      if (body.diagnosis !== undefined) data.diagnosis = body.diagnosis;
      if (body.treatment !== undefined) data.treatment = body.treatment;
      if (body.prescription !== undefined) data.prescription = body.prescription;
      if (body.notes !== undefined) data.notes = body.notes;
      const record = await prisma.medicalRecord.update({ where: { id: req.params.id }, data });
      res.json(record);
    } catch (e) {
      next(e);
    }
  },
);

secretaryRouter.delete(
  '/medical-records/:id',
  validate('params', IdParamsSchema),
  async (req, res, next) => {
    try {
      await prisma.medicalRecord.delete({ where: { id: req.params.id } });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
);
