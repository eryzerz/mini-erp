#!/bin/sh
set -e

echo "Applying database migrations..."
cd /app/libs/prisma
node_modules/.bin/prisma migrate deploy

echo "Seeding demo data (idempotent)..."
node_modules/.bin/tsx prisma/seed.ts

echo "Starting API..."
cd /app
exec node apps/api/dist/src/main.js
