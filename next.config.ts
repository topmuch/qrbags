import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* 🔔 Petits VPS (build Docker Coolify ~2 Go RAM) : le déploiement 2026-09-17 19:27
     est mort SILENCIEUSEMENT pendant « Finalizing page optimization » (SIGKILL kernel,
     exit sans aucune sortie) alors que compile + 117 pages statiques avaient réussi.
     Deux plafonds sont nécessaires car --max-old-space-size (V8/JS) ne borne PAS la
     mémoire native Rust du moteur Turbopack ni les workers de génération :
     1. experimental.cpus: 2 → réduit les workers parallèles de collecte/génération
        (7 par défaut sur VPS multcœur = plusieurs heap Node simultanés)
     2. experimental.turbopackMemoryLimit: 1 Gio → le moteur Rust déclenche son GC
        bien plus tôt au lieu de monter en pic juste avant l'écriture du standalone */
  experimental: {
    cpus: 2,
    turbopackMemoryLimit: 1024 * 1024 * 1024,
  },
  serverExternalPackages: ['nodemailer', 'pdf-lib', 'qrcode', 'archiver', 'sharp'],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    formats: ['image/webp'],
    qualities: [75, 90],
  },
};

export default nextConfig;
