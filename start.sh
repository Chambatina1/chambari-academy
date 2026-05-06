#!/bin/bash
# Production startup script

# Set defaults for required environment variables
export DATABASE_URL="${DATABASE_URL:-file:./dev.db}"
export JWT_SECRET="${JWT_SECRET:-chambari-academy-secret-key-2024}"

# Initialize database if needed
if [ ! -f "dev.db" ]; then
  echo "Initializing database..."
fi
npx prisma db push --skip-generate 2>/dev/null || true

exec node .next/standalone/server.js -p ${PORT:-10000}
