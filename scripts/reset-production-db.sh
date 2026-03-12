#!/bin/bash
# Script de réinitialisation complète de la base de données pour production

echo "=========================================="
echo "🔄 Réinitialisation de la base de données"
echo "=========================================="

# 1. Supprimer l'ancienne base
echo "📦 Suppression de l'ancienne base de données..."
rm -f ./db/custom.db
rm -f ./prisma/dev.db

# 2. Recréer la base avec le schéma actuel
echo "📦 Création de la nouvelle base de données..."
npx prisma db push --skip-generate

# 3. Initialiser les FeatureFlags par défaut
echo "⚙️  Initialisation des fonctionnalités..."
npx ts-node << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function init() {
  const features = [
    { key: 'ai_fraud_detection', label: 'Détection de fraude IA', description: 'Analyse les patterns de scan suspects', category: 'security', enabled: false },
    { key: 'ai_translation', label: 'Traduction automatique', description: 'Traduit les messages dans la langue du pays', category: 'communication', enabled: true },
    { key: 'ai_message_summary', label: 'Résumé de messages', description: 'Résume automatiquement les longs messages', category: 'communication', enabled: false },
    { key: 'ai_qr_suggestions', label: 'Suggestions QR', description: 'Suggère le volume de QR à générer', category: 'analytics', enabled: true },
    { key: 'whatsapp_automated', label: 'WhatsApp automatisé', description: 'Envoi automatique de messages WhatsApp', category: 'communication', enabled: false },
    { key: 'geolocation_enabled', label: 'Géolocalisation', description: 'Active la géolocalisation lors des scans', category: 'geolocation', enabled: true },
    { key: 'export_enabled', label: 'Export de données', description: 'Permet l\'export CSV/Excel des données', category: 'export', enabled: true },
    { key: 'blog_enabled', label: 'Blog interne', description: 'Active le blog pour les agences', category: 'general', enabled: true },
    { key: 'public_agency_pages', label: 'Pages publiques agences', description: 'Affiche les pages publiques des agences', category: 'general', enabled: true },
  ];

  for (const feature of features) {
    await prisma.featureFlag.upsert({
      where: { key: feature.key },
      update: {},
      create: feature
    });
  }

  console.log('✅ FeatureFlags initialisés');
  await prisma.$disconnect();
}

init().catch(console.error);
EOF

echo ""
echo "✅ Base de données réinitialisée avec succès !"
echo "📝 Créez un compte superadmin via: POST /api/setup/init"
echo "   Body: { email: 'admin@example.com', password: 'votre_mdp' }"
