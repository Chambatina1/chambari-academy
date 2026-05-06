#!/bin/bash
set -e

echo "=== Starting Chambari Academy ==="

# Ensure prisma directory exists
mkdir -p prisma

# Set default DATABASE_URL if not set
export DATABASE_URL="${DATABASE_URL:-file:./prisma/dev.db}"

# Initialize database schema
echo "Setting up database..."
npx prisma db push --skip-generate 2>&1 || true

# Seed default users
echo "Seeding users..."
npx tsx scripts/seed.ts 2>&1 || true

# Start the server
echo "Starting Next.js..."
exec npx next start -p ${PORT:-10000}
