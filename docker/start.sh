#!/bin/sh
# QRBag — script de démarrage du conteneur (Coolify / Docker)
set -e

echo "==> QRBag — démarrage du conteneur (commit: ${QRBAGS_COMMIT:-local})"

# Répertoires persistants (à monter en volumes Coolify)
mkdir -p /app/data /app/uploads

# DATABASE_URL par défaut → SQLite dans le volume /app/data
: "${DATABASE_URL:=file:/app/data/custom.db}"
export DATABASE_URL
cd /app

# 1) Synchronisation du schéma Prisma :
#    - crée la base si absente (premier démarrage)
#    - ajoute les colonnes manquantes (photoPath, reward...) → anti-P2022
echo "==> Synchronisation du schéma Prisma (prisma db push)..."
tries=0
until npx prisma db push --skip-generate; do
  tries=$((tries + 1))
  if [ "$tries" -ge 3 ]; then
    echo "!! prisma db push a échoué après 3 essais — arrêt du conteneur."
    exit 1
  fi
  echo "   Échec (essai $tries/3), nouvelle tentative dans 2 s..."
  sleep 2
done

# 2) Seed optionnel : SEED_ON_EMPTY=true insère les données de démo
#    UNIQUEMENT si la base est encore vide (aucun bagage)
if [ "${SEED_ON_EMPTY:-false}" = "true" ]; then
  BAGGAGES=$(node -e '
    const { PrismaClient } = require("@prisma/client");
    const p = new PrismaClient();
    p.baggage.count()
      .then((c) => { console.log(c); return p.$disconnect(); })
      .catch(() => { console.log("ERR"); return p.$disconnect(); });
  ' | tail -n 1)
  if [ "$BAGGAGES" = "0" ]; then
    echo "==> Base vide — insertion des données de démonstration (seed)..."
    bun prisma/seed.ts || echo "!! Seed échoué (non bloquant — le serveur démarre quand même)."
  else
    echo "==> Base déjà initialisée ($BAGGAGES bagage(s)) — seed ignoré."
  fi
fi

# 3) Serveur Next.js (build standalone)
echo "==> Démarrage du serveur QRBag sur le port ${PORT:-3000}..."
exec node server.js
