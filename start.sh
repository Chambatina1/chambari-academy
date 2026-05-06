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

# Copy prisma schema
mkdir -p "$APP_DIR/prisma"
cp prisma/schema.prisma "$APP_DIR/prisma/"

# Copy public folder
if [ -d "public" ]; then
  cp -r public "$APP_DIR/public" 2>/dev/null || true
fi

# Copy static assets
if [ -d ".next/static" ]; then
  mkdir -p "$APP_DIR/.next/static"
  cp -r .next/static/* "$APP_DIR/.next/static/" 2>/dev/null || true
fi

# Go to app directory
cd "$APP_DIR"

# Initialize database
echo "Initializing database..."
npx prisma db push --skip-generate
echo "Database ready!"

# Start server
exec node server.js -p ${PORT:-10000}
