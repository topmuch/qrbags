# Dockerfile
FROM oven/bun:1.1.24 AS builder

WORKDIR /app
COPY package.json bun.lock .
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.1.24

WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./

RUN mkdir -p /app/data
RUN bun install --production

EXPOSE 3000

CMD ["bun", "run", "start"]
