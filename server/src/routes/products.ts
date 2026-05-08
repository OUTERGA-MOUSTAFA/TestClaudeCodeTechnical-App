import { Router } from 'express';
import {
  CreateProductInputSchema,
  ProductIdParamsSchema,
  ProductListQuerySchema,
  UpdateProductInputSchema,
} from '@app/shared';
import { prisma } from '../prisma.js';
import { HttpError } from '../errors.js';
import { validate } from '../validate.js';

export const productsRouter: Router = Router();

productsRouter.get(
  '/',
  validate('query', ProductListQuerySchema),
  async (req, res, next) => {
    try {
      const { search, take, skip } = req.query as unknown as {
        search?: string;
        take: number;
        skip: number;
      };
      const where = search
        ? { name: { contains: search, mode: 'insensitive' as const } }
        : undefined;
      const [items, total] = await Promise.all([
        prisma.product.findMany({ where, take, skip, orderBy: { createdAt: 'desc' } }),
        prisma.product.count({ where }),
      ]);
      res.json({ items, total, take, skip });
    } catch (e) {
      next(e);
    }
  },
);

productsRouter.get(
  '/:id',
  validate('params', ProductIdParamsSchema),
  async (req, res, next) => {
    try {
      const product = await prisma.product.findUnique({ where: { id: req.params.id } });
      if (!product) throw new HttpError(404, 'Product not found');
      res.json(product);
    } catch (e) {
      next(e);
    }
  },
);

productsRouter.post(
  '/',
  validate('body', CreateProductInputSchema),
  async (req, res, next) => {
    try {
      const product = await prisma.product.create({ data: req.body as never });
      res.status(201).json(product);
    } catch (e) {
      next(e);
    }
  },
);

productsRouter.patch(
  '/:id',
  validate('params', ProductIdParamsSchema),
  validate('body', UpdateProductInputSchema),
  async (req, res, next) => {
    try {
      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: req.body as never,
      });
      res.json(product);
    } catch (e) {
      next(e);
    }
  },
);

productsRouter.delete(
  '/:id',
  validate('params', ProductIdParamsSchema),
  async (req, res, next) => {
    try {
      await prisma.product.delete({ where: { id: req.params.id } });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
);
