#!/bin/sh
# QRBag Startup Script
# Creates admin user on first run

echo "🚀 Starting QRBag..."

# Create data directory
mkdir -p /app/data

# Set database URL
export DATABASE_URL=file:/app/data/qrbag.db

# Initialize database schema
echo "📊 Initializing database..."
npx prisma db push --skip-generate 2>/dev/null || true

# Create admin user directly via SQLite
echo "👤 Creating admin user..."
sqlite3 /app/data/qrbag.db "INSERT OR IGNORE INTO User (id, email, name, password, role, createdAt, updatedAt) VALUES ('admin-001', 'admin@qrbag.com', 'SuperAdmin', '\$2a\$10\$EqKcp1WFKVQISheBxmXNGexPR.i7QYXOJC.OFfQDT8iSaHuuPdlrW', 'superadmin', datetime('now'), datetime('now'));" 2>/dev/null || true

echo "✅ Admin: admin@qrbag.com / admin123"
echo "🌐 Starting server..."
exec node .next/standalone/server.js
