# QRBag - Optimized Dockerfile for Coolify
FROM node:20-alpine

# Install required packages in one layer
RUN apk add --no-cache git libc6-compat sqlite && \
    npm install -g bun

WORKDIR /app

# Clone the repository
RUN git clone --depth 1 https://github.com/topmuch/qrbags.git .

# Install dependencies and build in one step
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/qrbag.db

RUN bun install && \
    npx prisma generate && \
    bun run build && \
    mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrbag.db

CMD sh -c "mkdir -p /app/data && npx prisma db push --skip-generate 2>/dev/null || true && node .next/standalone/server.js"
