#!/bin/bash
# Script de réinitialisation de la base de données QRBag

echo "⚠️  ATTENTION: Ce script va supprimer toutes les données !"
read -p "Êtes-vous sûr ? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
    echo "Annulé."
    exit 0
fi

echo "📦 Suppression de l'ancienne base de données..."
rm -f /home/z/my-project/db/custom.db

echo "📦 Création de la nouvelle base de données..."
npx prisma db push --skip-generate

echo "✅ Base de données réinitialisée avec succès !"
echo "📝 Vous pouvez maintenant recréer un compte superadmin via /api/setup/init"
