const { PrismaClient } = require('@prisma/client');

async function seed() {
  console.log('Seeding database...');
  const db = new PrismaClient();

  try {
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
  } catch (e) {
    console.error('Seed error:', e.message);
  } finally {
    await db.$disconnect();
  }
}

seed();
