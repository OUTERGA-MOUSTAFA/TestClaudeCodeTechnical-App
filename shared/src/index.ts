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

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable(),
  priceCents: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Product = z.infer<typeof ProductSchema>;

export const CreateProductInputSchema = ProductSchema.pick({
  name: true,
  description: true,
  priceCents: true,
  stock: true,
}).partial({ description: true, stock: true });

export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

export const UpdateProductInputSchema = CreateProductInputSchema.partial();

export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;

export const ProductIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const ProductListQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().nonnegative().default(0),
});

export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
