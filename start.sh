#!/bin/bash
export DATABASE_URL="postgresql://chamabri_user:hlCWi8Pcztf71bGcbqdtNVPqUxsDxB2K@dpg-d78hkpqdbo4c7385inhg-a.oregon-postgres.render.com:5432/chamabri"
export NEXTAUTH_URL="https://chambari-academy-v3.onrender.com"
export NEXTAUTH_SECRET="chambari-academy-secret-2024-production"
exec npx next start -p 10000
