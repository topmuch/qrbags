# QRBag 🎒

**Protection intelligente des bagages avec QR codes**

QRBag est une application web moderne permettant de protéger vos bagages grâce à des étiquettes QR intelligentes. Sans application, sans batterie, sans GPS - un simple scan suffit pour retrouver vos effets.

## ✨ Fonctionnalités

- 🏠 **Dashboard Admin** - Gestion complète des utilisateurs, agences et commandes
- 📦 **Génération de QR codes** - Création instantanée d'étiquettes uniques
- 📱 **Scan sans application** - Fonctionne avec n'importe quel smartphone
- 📍 **Géolocalisation** - Localisation instantanée du scanner
- 💳 **Paiement PayPal** - Intégration complète PayPal (sandbox/production)
- 📧 **Emails automatiques** - Envoi de confirmations et QR codes par email
- 🌍 **Multi-langues** - Support Français, Anglais, Arabe
- 🕌 **Mode Hajj** - Gestion spéciale pour les pèlerinages

## 🚀 Déploiement sur Coolify

### Prérequis

- Un serveur avec [Coolify](https://coolify.io/) installé
- Un compte GitHub

### Étapes de déploiement

#### 1. Fork ou cloner ce repository

```bash
git clone https://github.com/VOTRE-USERNAME/qrbag.git
cd qrbag
```

#### 2. Sur Coolify

1. Créer une nouvelle ressource **"Docker"**
2. Sélectionner **"Git Repository"**
3. Entrer l'URL de votre repository GitHub
4. Configurer les variables d'environnement :

```env
DATABASE_URL=file:/app/data/custom.db
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=votre-client-id
PAYPAL_CLIENT_SECRET=votre-client-secret
ENCRYPTION_KEY=votre-cle-encryption-32chars
```

5. Définir le port : `3000`
6. Déployer !

### Variables d'environnement requises

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `DATABASE_URL` | Chemin vers la base SQLite | ✅ |
| `NEXT_PUBLIC_BASE_URL` | URL publique de l'application | ✅ |
| `PAYPAL_CLIENT_ID` | ID client PayPal | ✅ |
| `PAYPAL_CLIENT_SECRET` | Secret PayPal | ✅ |
| `PAYPAL_MODE` | `sandbox` ou `live` | ✅ |
| `ENCRYPTION_KEY` | Clé de chiffrement (32+ caractères) | ✅ |

## 🛠️ Développement local

### Prérequis

- Node.js 20+ ou Bun
- npm, yarn ou bun

### Installation

```bash
# Cloner le repository
git clone https://github.com/VOTRE-USERNAME/qrbag.git
cd qrbag

# Installer les dépendances
bun install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Initialiser la base de données
bun run db:push
bun run db:generate

# Lancer en développement
bun run dev
```

### Identifiants de démonstration

- **Admin:** `admin@qrbag.com` / `admin123`
- **Agence:** `agency@qrbag.com` / `agency123`

## 📁 Structure du projet

```
qrbag/
├── prisma/           # Schéma et seed de la base de données
├── public/           # Assets statiques
├── src/
│   ├── app/          # Pages Next.js (App Router)
│   │   ├── api/      # Routes API
│   │   ├── admin/    # Dashboard admin
│   │   └── ...
│   ├── components/   # Composants React
│   └── lib/          # Utilitaires et configurations
├── Dockerfile        # Image Docker pour production
├── docker-compose.yml
└── package.json
```

## 🔧 Stack technique

- **Framework:** Next.js 16 (App Router)
- **Base de données:** SQLite (Prisma ORM)
- **UI:** Tailwind CSS + shadcn/ui
- **Paiements:** PayPal SDK
- **Emails:** Nodemailer (SMTP)
- **Déploiement:** Docker

## 📝 Licence

Ce projet est sous licence privée. Tous droits réservés.

## 👥 Auteurs

Développé par l'équipe QRBag

---

**Besoin d'aide ?** Ouvrez une issue sur GitHub ou contactez-nous à contact@qrbag.com
