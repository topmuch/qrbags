# QRBag — Dockerfile pour Coolify
# Build Pack : "Dockerfile" — Coolify clone le repo puis build CE fichier.
# COPY . . = toujours le DERNIER commit de la branche (pas de cache git clone périmé).
# Volumes Coolify à monter : /app/data (SQLite) + /app/uploads (photos des valises)

# ─── Base ───
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ─── Étape 1 : dépendances ───
FROM base AS deps
WORKDIR /app
RUN npm install -g bun
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ─── Étape 2 : build Next.js ───
FROM base AS builder
WORKDIR /app
RUN npm install -g bun
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Coolify injecte SOURCE_COMMIT automatiquement (traçabilité de la version déployée)
ARG SOURCE_COMMIT=""
ENV QRBAGS_COMMIT=${SOURCE_COMMIT}

# Optionnel : URL publique (build arg Coolify si besoin)
ARG NEXT_PUBLIC_BASE_URL=""
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 🔔 Petits VPS : plafonne le heap V8 pour que next build tienne dans ~2 Go de RAM.
# Sans plafond, le kernel peut SIGKILLer le build SILENCIEusement (exit 137, zéro
# sortie dans les logs Coolify — panne du 2026-09-17). Avec plafond, un dépassement
# produit une erreur V8 explicite « JavaScript heap out of memory » au lieu d'un kill muet.
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Diagnostic instantané dans le log de déploiement (RAM / disque / versions)
RUN echo "─── Build env ───" && free -h || true && (df -h / || true) && node -v && bun --version

RUN npx prisma generate
RUN bun run build

# ─── Étape 3 : image finale ───
FROM base AS runner
WORKDIR /app
# bun sert uniquement au seed optionnel (prisma/seed.ts en TypeScript)
RUN npm install -g bun

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/app/data/custom.db

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Application buildée (next.config.ts → output: standalone)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma runtime + CLI (db push au démarrage) + bcryptjs (seed)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Script de démarrage (db push + seed optionnel + serveur)
COPY docker/start.sh /app/start.sh

# Répertoires persistants
RUN mkdir -p /app/data /app/uploads \
 && chmod +x /app/start.sh \
 && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
CMD ["/app/start.sh"]
