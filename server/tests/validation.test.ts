import { describe, it, expect } from 'vitest';
import {
  AppointmentStatusSchema,
  CreateAppointmentInputSchema,
  CreateMedicalRecordInputSchema,
  CreateUserInputSchema,
  GenderSchema,
  LoginInputSchema,
  PaginationQuerySchema,
  RegisterInputSchema,
  RoleSchema,
  UpdatePatientInputSchema,
  UpdateUserInputSchema,
} from '@hc/shared';

describe('Enum schemas', () => {
  it('RoleSchema accepts ADMIN/SECRETARY/PATIENT', () => {
    expect(RoleSchema.parse('ADMIN')).toBe('ADMIN');
    expect(() => RoleSchema.parse('NOPE')).toThrow();
  });
  it('GenderSchema accepts MALE/FEMALE/OTHER', () => {
    expect(GenderSchema.parse('OTHER')).toBe('OTHER');
    expect(() => GenderSchema.parse('male')).toThrow();
  });
  it('AppointmentStatusSchema accepts PENDING/SCHEDULED/COMPLETED/CANCELLED/NO_SHOW', () => {
    expect(AppointmentStatusSchema.parse('PENDING')).toBe('PENDING');
    expect(AppointmentStatusSchema.parse('NO_SHOW')).toBe('NO_SHOW');
    expect(() => AppointmentStatusSchema.parse('UNKNOWN')).toThrow();
  });

  it('RoleSchema accepts DOCTOR', () => {
    expect(RoleSchema.parse('DOCTOR')).toBe('DOCTOR');
  });
});

describe('Auth schemas', () => {
  it('LoginInputSchema requires valid email', () => {
    expect(() => LoginInputSchema.parse({ email: 'no', password: 'x' })).toThrow();
    expect(LoginInputSchema.parse({ email: 'a@b.co', password: 'x' }).email).toBe('a@b.co');
  });

  it('RegisterInputSchema enforces password length and required fields', () => {
    expect(() =>
      RegisterInputSchema.parse({
        email: 'a@b.c',
        password: 'short',
        firstName: 'A',
        lastName: 'B',
        dateOfBirth: '1990-01-01',
        gender: 'OTHER',
      }),
    ).toThrow();
  });
});

describe('Admin schemas', () => {
  it('CreateUserInputSchema requires role', () => {
    expect(() =>
      CreateUserInputSchema.parse({
        email: 'a@b.c',
        password: 'Password1!',
        firstName: 'A',
        lastName: 'B',
      }),
    ).toThrow();
  });

  it('UpdateUserInputSchema accepts partial', () => {
    const out = UpdateUserInputSchema.parse({ firstName: 'X' });
    expect(out.firstName).toBe('X');
  });
});

describe('Domain schemas', () => {
  it('UpdatePatientInputSchema allows nullable fields', () => {
    const out = UpdatePatientInputSchema.parse({ phone: null, bloodType: null });
    expect(out.phone).toBeNull();
  });

  it('CreateAppointmentInputSchema requires UUID ids', () => {
    expect(() =>
      CreateAppointmentInputSchema.parse({
        patientId: 'x',
        doctorId: '00000000-0000-0000-0000-000000000000',
        scheduledAt: new Date().toISOString(),
      }),
    ).toThrow();
  });

  it('CreateMedicalRecordInputSchema requires diagnosis', () => {
    expect(() =>
      CreateMedicalRecordInputSchema.parse({
        patientId: '00000000-0000-0000-0000-000000000000',
        doctorId: '00000000-0000-0000-0000-000000000000',
      }),
    ).toThrow();
  });
});

describe('PaginationQuerySchema', () => {
  it('coerces and applies defaults', () => {
    const out = PaginationQuerySchema.parse({});
    expect(out.take).toBe(20);
    expect(out.skip).toBe(0);
  });

  it('caps take at 100', () => {
    expect(() => PaginationQuerySchema.parse({ take: 9999 })).toThrow();
  });
});
