import crypto from 'node:crypto';
import { Router } from 'express';
import { PublicBookingInputSchema } from '@hc/shared';
import { prisma } from '../prisma.js';
import { HttpError } from '../errors.js';
import { validate } from '../validate.js';
import { hashPassword } from '../auth/password.js';

export const publicRouter: Router = Router();

publicRouter.get('/doctors', async (_req, res, next) => {
  try {
    const doctors = await prisma.doctor.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        specialty: true,
        bio: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });
    res.json({
      items: doctors.map((d) => ({
        id: d.id,
        specialty: d.specialty,
        bio: d.bio,
        firstName: d.user.firstName,
        lastName: d.user.lastName,
      })),
    });
  } catch (e) {
    next(e);
  }
});

publicRouter.post(
  '/appointments',
  validate('body', PublicBookingInputSchema),
  async (req, res, next) => {
    try {
      const body = req.body as import('@hc/shared').PublicBookingInput;

      const doctor = await prisma.doctor.findUnique({ where: { id: body.doctorId } });
      if (!doctor) throw new HttpError(404, 'Doctor not found');

      const existing = await prisma.user.findUnique({
        where: { email: body.email },
        include: { patient: true },
      });

      let patientId: string;
      if (existing?.patient) {
        patientId = existing.patient.id;
      } else if (existing) {
        throw new HttpError(
          409,
          'This email is registered without a patient profile. Please log in.',
        );
      } else {
        const tempPassword = crypto.randomBytes(16).toString('hex');
        const created = await prisma.user.create({
          data: {
            email: body.email,
            passwordHash: await hashPassword(tempPassword),
            firstName: body.firstName,
            lastName: body.lastName,
            role: 'PATIENT',
            patient: {
              create: {
                dateOfBirth: new Date(body.dateOfBirth),
                gender: body.gender,
                phone: body.phone,
              },
            },
          },
          include: { patient: true },
        });
        patientId = created.patient!.id;
      }

      const appt = await prisma.appointment.create({
        data: {
          patientId,
          doctorId: body.doctorId,
          scheduledAt: new Date(body.scheduledAt),
          reason: body.reason,
          status: 'PENDING',
        },
      });

      res.status(201).json({
        appointmentId: appt.id,
        status: appt.status,
        message: 'Booking submitted. The clinic will confirm it shortly.',
      });
    } catch (e) {
      next(e);
    }
  },
);
