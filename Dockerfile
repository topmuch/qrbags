# QRBag - Simple Dockerfile for Coolify
# Build with: docker build -t qrbag .
# Run with: docker run -p 3000:3000 -v qrbag_data:/app/data qrbag

FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache libc6-compat sqlite
RUN npm install -g bun

WORKDIR /app

# Copy package files first for caching
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/qrbag.db
RUN bun run build

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start command
CMD sh -c "mkdir -p /app/data && npx prisma db push --skip-generate 2>/dev/null || true && node .next/standalone/server.js"
