#!/bin/bash
set -e

echo "=== Chambari Academy Starting ==="

export DATABASE_URL="${DATABASE_URL:-file:./dev.db}"
export JWT_SECRET="${JWT_SECRET:-chambari-academy-secret-key-2024}"
export NODE_ENV="production"

echo "DATABASE_URL=$DATABASE_URL"

APP_DIR=""

# Find server.js location
if [ -f ".next/standalone/server.js" ]; then
  APP_DIR=".next/standalone"
elif [ -f ".next/standalone/my-project/server.js" ]; then
  APP_DIR=".next/standalone/my-project"
else
  echo "ERROR: Cannot find server.js"
  ls -la .next/standalone/ 2>/dev/null || echo "No standalone directory"
  exit 1
fi

echo "App directory: $APP_DIR"

# Copy prisma schema and existing database
mkdir -p "$APP_DIR/prisma"
cp prisma/schema.prisma "$APP_DIR/prisma/"
if [ -f "prisma/dev.db" ]; then
  cp prisma/dev.db "$APP_DIR/prisma/dev.db"
  echo "Copied existing database"
fi

# Copy public folder
if [ -d "public" ]; then
  cp -r public "$APP_DIR/public" 2>/dev/null || true
fi

# Copy static assets
if [ -d ".next/static" ]; then
  mkdir -p "$APP_DIR/.next/static"
  cp -r .next/static/* "$APP_DIR/.next/static/" 2>/dev/null || true
fi

# Copy uploads folder if exists
if [ -d "public/uploads" ]; then
  mkdir -p "$APP_DIR/public/uploads"
  cp -r public/uploads/* "$APP_DIR/public/uploads/" 2>/dev/null || true
fi

# Go to app directory
cd "$APP_DIR"

# Initialize database
echo "Initializing database..."
npx prisma db push --skip-generate
echo "Database ready!"

# Seed default users using a simple Node script
echo "Seeding default users..."
node -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function seed() {
  const teacher = await db.user.upsert({
    where: { email: 'profesor@chambari.com' },
    update: {},
    create: { id: 'default-teacher', email: 'profesor@chambari.com', name: 'Profesor Chambari', password: 'chambari2024', role: 'TEACHER' }
  });
  console.log('Teacher created:', teacher.name);
  const student = await db.user.upsert({
    where: { email: 'alumno@chambari.com' },
    update: {},
    create: { id: 'default-student', email: 'alumno@chambari.com', name: 'Alumno Demo', password: 'chambari2024', role: 'STUDENT' }
  });
  console.log('Student created:', student.name);
  await db.\$disconnect();
}
seed().catch(e => { console.error('Seed error:', e.message); process.exit(0); });
"
echo "Seed complete!"

# Start server
exec node server.js -p ${PORT:-10000}
