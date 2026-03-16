# QRBag - Dockerfile for Coolify Deployment
FROM node:20-alpine

RUN apk add --no-cache git libc6-compat sqlite
RUN npm install -g bun

WORKDIR /app

RUN git clone https://github.com/topmuch/qrbags.git .

RUN bun install

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/qrbag.db
RUN bun run build

RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrbag.db

CMD sh -c "mkdir -p /app/data && npx prisma db push --skip-generate 2>/dev/null || true && node .next/standalone/server.js"
