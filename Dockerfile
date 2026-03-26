# QRBag - Dockerfile for Coolify
FROM node:20-alpine

# Install required packages
RUN apk add --no-cache git libc6-compat sqlite
RUN npm install -g bun

WORKDIR /app

# Clone the repository
RUN git clone https://github.com/topmuch/qrbags.git .

# Install dependencies
RUN bun install

# Generate Prisma Client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/qrbag.db
RUN bun run build

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrbag.db

# Create startup script inline
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'mkdir -p /app/data' >> /app/start.sh && \
    echo 'export DATABASE_URL=file:/app/data/qrbag.db' >> /app/start.sh && \
    echo 'npx prisma db push --skip-generate 2>/dev/null || true' >> /app/start.sh && \
    echo 'sqlite3 /app/data/qrbag.db "INSERT OR IGNORE INTO User (id, email, name, password, role, createdAt, updatedAt) VALUES ('\''admin-001'\'', '\''admin@qrbag.com'\'', '\''SuperAdmin'\'', '\''\$2a\$10\$EqKcp1WFKVQISheBxmXNGexPR.i7QYXOJC.OFfQDT8iSaHuuPdlrW'\'', '\''superadmin'\'', datetime('\''now'\''), datetime('\''now'\''));" 2>/dev/null || true' >> /app/start.sh && \
    echo 'exec node .next/standalone/server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]
