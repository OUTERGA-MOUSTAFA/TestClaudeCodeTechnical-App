import { z } from 'zod';

// ─── Enums (mirror Prisma) ──────────────────────────────────────────────────
export const RoleSchema = z.enum(['ADMIN', 'SECRETARY', 'PATIENT']);
export type Role = z.infer<typeof RoleSchema>;

export const GenderSchema = z.enum(['MALE', 'FEMALE', 'OTHER']);
export type Gender = z.infer<typeof GenderSchema>;

export const AppointmentStatusSchema = z.enum([
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

// ─── Common ─────────────────────────────────────────────────────────────────
export const UuidSchema = z.string().uuid();
export const IdParamsSchema = z.object({ id: UuidSchema });

export const PaginationQuerySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().nonnegative().default(0),
  search: z.string().trim().min(1).max(100).optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

// ─── User ───────────────────────────────────────────────────────────────────
export const UserSchema = z.object({
  id: UuidSchema,
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: RoleSchema,
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

// ─── Auth ───────────────────────────────────────────────────────────────────
export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  gender: GenderSchema,
  phone: z.string().max(30).optional(),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RefreshInputSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof RefreshInputSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

// ─── Admin: User CRUD ───────────────────────────────────────────────────────
export const CreateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: RoleSchema,
  isActive: z.boolean().default(true).optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const UpdateUserInputSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    role: RoleSchema,
    isActive: z.boolean(),
  })
  .partial();
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

// ─── Patient ────────────────────────────────────────────────────────────────
export const PatientSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  dateOfBirth: z.string(),
  gender: GenderSchema,
  phone: z.string().nullable(),
  address: z.string().nullable(),
  bloodType: z.string().nullable(),
  allergies: z.string().nullable(),
  medicalHistory: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Patient = z.infer<typeof PatientSchema>;

export const CreatePatientInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string(),
  gender: GenderSchema,
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  bloodType: z.string().max(10).optional(),
  allergies: z.string().max(2000).optional(),
  medicalHistory: z.string().max(5000).optional(),
});
export type CreatePatientInput = z.infer<typeof CreatePatientInputSchema>;

export const UpdatePatientInputSchema = z
  .object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    dateOfBirth: z.string(),
    gender: GenderSchema,
    phone: z.string().max(30).nullable(),
    address: z.string().max(500).nullable(),
    bloodType: z.string().max(10).nullable(),
    allergies: z.string().max(2000).nullable(),
    medicalHistory: z.string().max(5000).nullable(),
  })
  .partial();
export type UpdatePatientInput = z.infer<typeof UpdatePatientInputSchema>;

// ─── Appointment ────────────────────────────────────────────────────────────
export const AppointmentSchema = z.object({
  id: UuidSchema,
  patientId: UuidSchema,
  doctorId: UuidSchema,
  scheduledAt: z.string(),
  durationMinutes: z.number().int().positive(),
  status: AppointmentStatusSchema,
  reason: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Appointment = z.infer<typeof AppointmentSchema>;

export const CreateAppointmentInputSchema = z.object({
  patientId: UuidSchema,
  doctorId: UuidSchema,
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(5).max(480).default(30).optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentInputSchema>;

export const UpdateAppointmentInputSchema = z
  .object({
    scheduledAt: z.string().datetime(),
    durationMinutes: z.number().int().min(5).max(480),
    status: AppointmentStatusSchema,
    reason: z.string().max(500).nullable(),
    notes: z.string().max(2000).nullable(),
  })
  .partial();
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentInputSchema>;

// ─── Medical Record ─────────────────────────────────────────────────────────
export const MedicalRecordSchema = z.object({
  id: UuidSchema,
  patientId: UuidSchema,
  doctorId: UuidSchema,
  appointmentId: UuidSchema.nullable(),
  diagnosis: z.string(),
  treatment: z.string().nullable(),
  prescription: z.string().nullable(),
  notes: z.string().nullable(),
  recordedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MedicalRecord = z.infer<typeof MedicalRecordSchema>;

export const CreateMedicalRecordInputSchema = z.object({
  patientId: UuidSchema,
  doctorId: UuidSchema,
  appointmentId: UuidSchema.optional(),
  diagnosis: z.string().min(1).max(2000),
  treatment: z.string().max(5000).optional(),
  prescription: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
});
export type CreateMedicalRecordInput = z.infer<typeof CreateMedicalRecordInputSchema>;

export const UpdateMedicalRecordInputSchema = z
  .object({
    diagnosis: z.string().min(1).max(2000),
    treatment: z.string().max(5000).nullable(),
    prescription: z.string().max(5000).nullable(),
    notes: z.string().max(5000).nullable(),
  })
  .partial();
export type UpdateMedicalRecordInput = z.infer<typeof UpdateMedicalRecordInputSchema>;
