#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# QRBag — Auto-persistance DB (une passe, appelé par src/instrumentation.ts)
# La plateforme restore le workspace via git entre sessions → toute écriture
# DB postérieure au dernier commit est PERDUE. Ce script :
#   1. committe db/custom.db si elle a changé
#   2. pousse vers origin si la DB a changé OU si des commits locaux ne sont
#      pas encore poussés (snapshots plateforme, correctifs…)
# Robuste aux environnements à PATH restreint (chemins absolus + export PATH).
# Verrou flock : jamais 2 passes concurrentes.
# ═══════════════════════════════════════════════════════════════════
cd /home/z/my-project || exit 0

DB="db/custom.db"
TOKEN_FILE="/home/z/my-project/.zscripts/.gittoken"
LOCK="/tmp/qrbag-db-autocommit.lock"

# Environnement garanti (spawn depuis next-server peut avoir un PATH restreint)
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH}"
export HOME="${HOME:-/home/z}"

exec 9>"$LOCK"
if ! flock -n 9; then
  echo "[db-autocommit] passe déjà en cours → skip"
  exit 0
fi

did_commit=0

# 1. Ne pas snapshotter pendant une transaction SQLite active
if [ ! -f "$DB-journal" ] && [ ! -f "$DB-wal" ]; then
  # 2. La DB a-t-elle changé depuis le dernier commit ?
  if [ -n "$(git status --porcelain -- "$DB" 2>/dev/null)" ]; then
    echo "[db-autocommit] $(date '+%F %T') changement DB détecté → commit"
    if git add "$DB" 2>/dev/null && git commit -m "auto: snapshot DB $(date '+%F %T')" >/dev/null 2>&1; then
      did_commit=1
      echo "[db-autocommit] commit OK"
    else
      echo "[db-autocommit] commit échoué → réessai au prochain cycle"
    fi
  fi
else
  echo "[db-autocommit] transaction SQLite en cours → snapshot reporté"
fi

# 3. Push si nécessaire : DB committée cette passe OU commits locaux non poussés
AHEAD=$(git rev-parse --count origin/main..HEAD 2>/dev/null || echo 0)
if [ "$did_commit" = "1" ] || [ "${AHEAD:-0}" -gt 0 ]; then
  if [ -f "$TOKEN_FILE" ]; then
    TOKEN=$(tr -d '[:space:]' < "$TOKEN_FILE")
    if git push "https://${TOKEN}@github.com/topmuch/qrbags.git" HEAD:main >/dev/null 2>&1; then
      echo "[db-autocommit] push OK (ahead ${AHEAD:-0})"
    else
      echo "[db-autocommit] push ÉCHOUÉ (le commit local reste, réessai au prochain cycle)"
    fi
    unset TOKEN
  elif [ "$did_commit" = "1" ]; then
    echo "[db-autocommit] pas de token → commit local uniquement"
  fi
fi
