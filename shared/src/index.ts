import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserInputSchema = UserSchema.pick({
  email: true,
  name: true,
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
