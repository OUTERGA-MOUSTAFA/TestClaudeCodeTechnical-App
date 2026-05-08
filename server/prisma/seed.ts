import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', name: 'Admin' },
  });

  const products = [
    { name: 'Wireless Mouse', description: 'Ergonomic 2.4GHz mouse', priceCents: 1999, stock: 50 },
    { name: 'Mechanical Keyboard', description: 'Hot-swappable, RGB', priceCents: 8999, stock: 25 },
    { name: 'USB-C Hub', description: '7-in-1 multiport adapter', priceCents: 3499, stock: 80 },
    { name: 'Webcam 1080p', description: null, priceCents: 4599, stock: 15 },
  ] as const;

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: p });
    } else {
      await prisma.product.create({ data: p });
    }
  }

  const userCount = await prisma.user.count();
  const productCount = await prisma.product.count();
  console.log(`[seed] users=${userCount} products=${productCount}`);
}

main()
  .catch((e) => {
    console.error('[seed] failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
