#!/bin/sh
set -e

echo "🚀 Starting QRBag..."

# Create data directory if it doesn't exist
mkdir -p /app/data

# Check if database exists, if not initialize it
if [ ! -f /app/data/custom.db ]; then
    echo "📦 Initializing database..."
    cd /app
    bun run db:push 2>/dev/null || npx prisma db push --skip-generate --accept-data-loss
    bun run prisma/seed.ts 2>/dev/null || npx tsx prisma/seed.ts 2>/dev/null || echo "Seed skipped"
fi

# Run Prisma migrations on startup
# --accept-data-loss : synchronise AUSSI les suppressions (colonnes obsolètes
# comme Checklist.reference NOT NULL → P2011 en prod si on ne la drop pas).
echo "🔄 Syncing database schema..."
cd /app
npx prisma db push --skip-generate --accept-data-loss \
  || node_modules/.bin/prisma db push --skip-generate --accept-data-loss \
  || echo "⚠️  [start] prisma db push a échoué — le self-heal applicatif prendra le relais"

echo "✅ Starting server..."
exec node server.js
