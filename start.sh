#!/bin/sh
set -e

echo "🚀 Starting QRBag..."

# Create data directory if it doesn't exist
mkdir -p /app/data

# Set database URL
export DATABASE_URL=file:/app/data/qrbag.db

# Check if database exists, if not initialize it
if [ ! -f /app/data/qrbag.db ]; then
    echo "📦 Initializing database..."
    cd /app
    npx prisma db push --skip-generate
    npx tsx prisma/seed.ts 2>/dev/null || echo "Seed skipped"
else
    echo "📊 Database exists, syncing schema..."
    cd /app
    npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || true
fi

echo "✅ Starting server..."
exec node server.js
