web: mkdir -p /app/data && export DATABASE_URL=file:/app/data/qrbag.db && npx prisma db push --skip-generate 2>/dev/null || true && node .next/standalone/server.js
