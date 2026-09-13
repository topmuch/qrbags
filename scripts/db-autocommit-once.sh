#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# QRBag — Auto-persistance DB (une passe, appelé par src/instrumentation.ts)
# La plateforme restore le workspace (git) entre sessions → toute écriture
# DB postérieure au dernier commit est PERDUE. Ce script committe + pousse
# db/custom.db si elle a changé → perte max = l'intervalle du timer.
# Verrou flock : jamais 2 passes concurrentes (restart serveur, etc.).
# ═══════════════════════════════════════════════════════════════════
cd /home/z/my-project || exit 0

DB="db/custom.db"
TOKEN_FILE=".zscripts/.gittoken"
LOCK="/tmp/qrbag-db-autocommit.lock"

exec 9>"$LOCK"
if ! flock -n 9; then
  echo "[db-autocommit] passe déjà en cours → skip"
  exit 0
fi

# 1. Ne pas snapshotter pendant une transaction SQLite active
if [ -f "$DB-journal" ] || [ -f "$DB-wal" ]; then
  echo "[db-autocommit] transaction SQLite en cours → skip"
  exit 0
fi

# 2. La DB a-t-elle changé depuis le dernier commit ?
if [ -z "$(git status --porcelain -- "$DB" 2>/dev/null)" ]; then
  exit 0  # silencieux : cas 99% des passes
fi

echo "[db-autocommit] $(date '+%F %T') changement DB détecté → commit"
if git add "$DB" 2>/dev/null && git commit -m "auto: snapshot DB $(date '+%F %T')" >/dev/null 2>&1; then
  echo "[db-autocommit] commit OK"
  # 3. Push (indispensable : le restore revient à origin/main)
  if [ -f "$TOKEN_FILE" ]; then
    TOKEN=$(tr -d '[:space:]' < "$TOKEN_FILE")
    if git push "https://${TOKEN}@github.com/topmuch/qrbags.git" HEAD:main >/dev/null 2>&1; then
      echo "[db-autocommit] push OK"
    else
      echo "[db-autocommit] push ÉCHOUÉ (le commit local reste, réessai au prochain cycle)"
    fi
    unset TOKEN
  else
    echo "[db-autocommit] pas de token → commit local uniquement"
  fi
else
  echo "[db-autocommit] commit échoué → réessai au prochain cycle"
fi
