#!/bin/bash
# QRBag - Dev server launcher (Next.js + tracking-ws mini-service)
# Lance le serveur de dev Next.js sur le port 3000 et le mini-service
# Socket.IO tracking-ws sur le port 3005, avec supervision (restart auto).

cd /home/z/my-project || exit 1

echo "[dev.sh] $(date '+%F %T') — démarrage du superviseur QRBag dev"
# NB: l'auto-persistance DB (commit+push anti-restore) vit désormais dans
# src/instrumentation.ts (timer du process next-server, supervisé par la plateforme).

# ── Mini-service tracking-ws (Socket.IO, port 3005) ──
start_mini() {
    cd /home/z/my-project/mini-services/tracking-ws || return
    if [ ! -d node_modules ]; then
        echo "[dev.sh] installation des dépendances tracking-ws..."
        bun install >/dev/null 2>&1
    fi
    bun --hot index.ts &
    echo "[dev.sh] tracking-ws lancé (PID $!, port 3005)"
    cd /home/z/my-project
}

# ── Next.js dev (port 3000) ──
while true; do
    # (re)démarrage du mini-service s'il est absent
    if ! ss -tlnp 2>/dev/null | grep -q ':3005'; then
        start_mini
    fi

    echo "[dev.sh] $(date '+%F %T') — lancement de next dev -p 3000"
    bunx next dev -p 3000
    code=$?
    echo "[dev.sh] $(date '+%F %T') — next dev terminé (code $code), redémarrage dans 3s"
    sleep 3
done
