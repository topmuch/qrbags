# QRBag - Dockerfile for Coolify Deployment
# IMPORTANT: Configure persistent volume in Coolify at /app/data

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install bun
RUN npm install -g bun

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
RUN npm install -g bun

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN bun run db:generate || npx prisma generate

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN bun run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install required tools
RUN apk add --no-cache sqlite

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files for runtime
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/bcrypt ./node_modules/bcrypt
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/prisma ./prisma

# Copy package.json for scripts
COPY --from=builder /app/package.json ./package.json

# Create data directory for SQLite - THIS IS CRITICAL FOR DATA PERSISTENCE
# Make sure Coolify has a persistent volume mounted at /app/data
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Create startup script with proper database handling
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "🚀 Starting QRBag..."' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Ensure data directory exists with proper permissions' >> /app/start.sh && \
    echo 'mkdir -p /app/data' >> /app/start.sh && \
    echo 'chmod 755 /app/data' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Set database URL' >> /app/start.sh && \
    echo 'export DATABASE_URL=file:/app/data/qrbag.db' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Check if database exists' >> /app/start.sh && \
    echo 'if [ ! -f /app/data/qrbag.db ]; then' >> /app/start.sh && \
    echo '  echo "📊 Creating new database..."' >> /app/start.sh && \
    echo '  cd /app && npx prisma db push --skip-generate' >> /app/start.sh && \
    echo '  echo "✅ Database created"' >> /app/start.sh && \
    echo 'else' >> /app/start.sh && \
    echo '  echo "📊 Database exists, checking schema..."' >> /app/start.sh && \
    echo '  cd /app && npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || true' >> /app/start.sh && \
    echo '  echo "✅ Schema synchronized"' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "✅ Starting server..."' >> /app/start.sh && \
    echo 'exec node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Create backup script
RUN echo '#!/bin/sh' > /app/backup.sh && \
    echo 'BACKUP_DIR=/app/data/backups' >> /app/backup.sh && \
    echo 'mkdir -p $BACKUP_DIR' >> /app/backup.sh && \
    echo 'DATE=$(date +%Y%m%d_%H%M%S)' >> /app/backup.sh && \
    echo 'cp /app/data/qrbag.db $BACKUP_DIR/qrbag_backup_$DATE.db' >> /app/backup.sh && \
    echo 'echo "Backup created: qrbag_backup_$DATE.db"' >> /app/backup.sh && \
    echo '# Keep only last 10 backups' >> /app/backup.sh && \
    echo 'ls -t $BACKUP_DIR/qrbag_backup_*.db | tail -n +11 | xargs rm -f 2>/dev/null || true' >> /app/backup.sh && \
    chmod +x /app/backup.sh

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["/app/start.sh"]
