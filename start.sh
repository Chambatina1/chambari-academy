#!/bin/bash
# Production startup script
# Environment variables should be set in the deployment platform (Render, etc.)
# NEVER commit production credentials to version control

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "ERROR: JWT_SECRET environment variable is not set"
  exit 1
fi

exec npx next start -p ${PORT:-10000}
