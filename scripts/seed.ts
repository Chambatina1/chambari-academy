import { PrismaClient } from '@prisma/client';
import path from 'path';

const dbUrl = process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
const db = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function seed() {
  console.log('Seeding database...');

  await db.user.upsert({
    where: { email: 'profesor@chambari.com' },
    update: {},
    create: {
      id: 'default-teacher',
      email: 'profesor@chambari.com',
      name: 'Profesor Chambari',
      password: 'chambari2024',
      role: 'TEACHER',
    },
  });

  await db.user.upsert({
    where: { email: 'alumno@chambari.com' },
    update: {},
    create: {
      id: 'default-student',
      email: 'alumno@chambari.com',
      name: 'Alumno Demo',
      password: 'chambari2024',
      role: 'STUDENT',
    },
  });

  console.log('Seed complete!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
  })
  .finally(() => db.$disconnect());
