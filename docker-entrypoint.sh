#!/bin/sh
set -e

echo "→ Running database migrations…"
echo "DEBUG: DATABASE_URL is ${DATABASE_URL}"
npx prisma migrate deploy

echo "→ Starting Mist…"
exec npm start
