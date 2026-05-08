import { Router } from 'express';
import { LoginInputSchema, RefreshInputSchema, RegisterInputSchema } from '@hc/shared';
import { prisma } from '../prisma.js';
import { HttpError } from '../errors.js';
import { validate } from '../validate.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type JwtPayload,
} from '../auth/jwt.js';
import { authenticate } from '../auth/middleware.js';

export const authRouter: Router = Router();

import type { Role } from '@hc/shared';

function userPayload(u: { id: string; email: string; role: Role }): JwtPayload {
  return { sub: u.id, email: u.email, role: u.role };
}

function publicUser(u: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

authRouter.post('/register', validate('body', RegisterInputSchema), async (req, res, next) => {
  try {
    const body = req.body as import('@hc/shared').RegisterInput;
    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) throw new HttpError(409, 'Email already registered');

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
          },
        },
      },
    });

    const tokens = {
      accessToken: signAccessToken(userPayload(user)),
      refreshToken: signRefreshToken(userPayload(user)),
    };
    res.status(201).json({ user: publicUser(user), ...tokens });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/login', validate('body', LoginInputSchema), async (req, res, next) => {
  try {
    const body = req.body as import('@hc/shared').LoginInput;
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.isActive) throw new HttpError(401, 'Invalid credentials');
    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) throw new HttpError(401, 'Invalid credentials');

    const tokens = {
      accessToken: signAccessToken(userPayload(user)),
      refreshToken: signRefreshToken(userPayload(user)),
    };
    res.json({ user: publicUser(user), ...tokens });
  } catch (e) {
    next(e);
  }
});

authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: { patient: true, doctor: true },
    });
    if (!user) throw new HttpError(404, 'User not found');
    res.json({
      ...publicUser(user),
      patient: user.patient
        ? {
            ...user.patient,
            dateOfBirth: user.patient.dateOfBirth.toISOString(),
            createdAt: user.patient.createdAt.toISOString(),
            updatedAt: user.patient.updatedAt.toISOString(),
          }
        : null,
      doctor: user.doctor
        ? {
            ...user.doctor,
            createdAt: user.doctor.createdAt.toISOString(),
            updatedAt: user.doctor.updatedAt.toISOString(),
          }
        : null,
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/refresh', validate('body', RefreshInputSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body as import('@hc/shared').RefreshInput;
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new HttpError(401, 'Invalid or expired refresh token');
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new HttpError(401, 'User no longer valid');
    res.json({
      accessToken: signAccessToken(userPayload(user)),
      refreshToken: signRefreshToken(userPayload(user)),
    });
  } catch (e) {
    next(e);
  }
});
