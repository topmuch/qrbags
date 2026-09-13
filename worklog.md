# QRBag Feature Implementation Worklog

---
Task ID: 0
Agent: Main Orchestrator
Task: Install dependencies, update schema, modify suivi API

Work Log:
- Installed leaflet, @types/leaflet, socket.io, socket.io-client
- Added Review and LossAlert models to prisma/schema.prisma
- Ran db:push to sync DB
- Modified /api/suivi/[reference]/route.ts to include latitude/longitude in scan entries for map trajectory

Stage Summary:
- DB schema updated with Review (social proof) and LossAlert (proactive loss detection) models
- Suivi API now returns lat/lng per scan for interactive map
- Dependencies ready for all 6 features

---
Task ID: 3
Agent: tracking-ws
Task: Create Socket.IO WebSocket mini-service for real-time scan event broadcasting

Work Log:
- Created `mini-services/tracking-ws/package.json` with socket.io dependency and `bun --hot` dev script
- Created `mini-services/tracking-ws/index.ts` — Socket.IO server on port 3005
  - Uses Caddy-compatible path `/` and wildcard CORS
  - Rooms named `bag:<reference>` (e.g. `bag:Hajj26-MLQGY7`)
  - Listens for `join` events with `{ reference }` payload; client joins corresponding room
  - Exposes `broadcast` event for demo/testing: accepts `{ reference, data }`, emits `scan-event` to the room
  - Graceful shutdown on SIGTERM/SIGINT
- Created `src/hooks/useTrackingSocket.ts` — React hook
  - Connects via `io("/?XTransformPort=3005")` (Caddy gateway pattern, no direct port in URL)
  - On connect, emits `join` with the reference string
  - Returns `{ isConnected, lastEvent }` (latest scan-event payload)
  - Auto-reconnects with exponential backoff (Infinity attempts)
  - Properly disconnects and cleans up on unmount / reference change

Stage Summary:
- Tracking WebSocket mini-service ready at port 3005
- `useTrackingSocket(reference)` hook ready for consumption by the tracking page
- Demo broadcast endpoint allows simulating scan events without backend integration

---
Task ID: 2
Agent: pwa-enhance
Task: Enhance PWA setup — manifest, service worker, registration component, layout meta tags

Work Log:
- **manifest.json** — Updated `categories` from `["travel", "utilities", "lifestyle"]` to `["travel", "utilities"]`; replaced single broken screenshot (`/screenshots/home.png`) with two entries pointing to existing landing-v2 images (`hero.jpg` and `step-activate.jpg`); all other required fields (name, short_name, start_url, display, background_color, theme_color, orientation, scope, icons, lang) were already correct and left as-is.
- **sw.js** — Rewrote service worker with cache name `qrbag-v1`; pre-cache list set to `/`, `/manifest.json`, `/logo.png`, `/favicon.png`; implemented three-route strategy: (1) API calls → network-first with cache fallback, (2) images/icons/items → cache-first with network fallback, (3) navigation/other → network-first; install and activate handlers with `skipWaiting` and `clients.claim`; non-GET and cross-origin requests skipped; old caches cleaned on activate.
- **PWARegister.tsx** — Created new `'use client'` component at `src/components/PWARegister.tsx` that registers `/sw.js` on mount via `navigator.serviceWorker.register`; errors handled silently; renders `null`.
- **layout.tsx** — Added explicit `<link rel="manifest" href="/manifest.json" />` and `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` inside the `<head>` section; all other PWA meta tags (theme-color, apple-mobile-web-app-capable, application-name, msapplication-TileColor) were already present.

Stage Summary:
- PWA manifest fully compliant with requirements (8 icon sizes, 2 screenshots, correct categories)
- Service worker uses `qrbag-v1` cache with appropriate strategies per resource type
- `PWARegister` component ready for import
- Layout head includes all necessary PWA link and meta tags
- ESLint passes cleanly

---
Task ID: 5-api
Agent: api-routes
Task: Create API routes for Reviews and LossAlerts

Work Log:
- **POST /api/reviews** (`src/app/api/reviews/route.ts`)
  - Validates name (required), rating (1-5 integer), content (min 10 chars), optional title/location/baggageRef/language
  - Rate-limited to 5 submissions per hour per IP via in-memory `rateLimit()`
  - Creates review with `isApproved: false`; response omits approval status
  - Returns 201 on success

- **GET /api/reviews** (same file)
  - Query params: `featured=true`, `limit` (default 20, max 50), `lang` (fr/en/ar)
  - Only returns `isApproved: true` reviews, ordered by `createdAt desc`
  - Parallel query for aggregate stats (`_avg.rating`, `_count.id`)
  - Returns `{ reviews: [...], stats: { averageRating, totalReviews } }`

- **GET /api/loss-alerts/[reference]** (`src/app/api/loss-alerts/[reference]/route.ts`)
  - Returns non-dismissed alerts for the given reference
  - Uses `await params` pattern for Next.js 16 App Router
  - Ordered by `createdAt desc`

- **POST /api/loss-alerts/[reference]/dismiss** (`src/app/api/loss-alerts/[reference]/dismiss/route.ts`)
  - Body: `{ alertId }` — verifies alert belongs to the reference and is not already dismissed
  - Sets `dismissed: true` and `dismissedAt: now()`
  - Returns 404 if alert not found or already dismissed

- **GET /api/loss-detection/check** (`src/app/api/loss-detection/check/route.ts`)
  - Cron-callable; protected by `CRON_SECRET` Bearer token (if set) + rate limit (1 per 5 min)
  - Finds active/scanned baggages with `departureDate` set
  - For each: checks if departure + 3h has passed, no scans after arrival window, no existing non-dismissed alert
  - Creates `LossAlert` records with descriptive message including hours since arrival
  - Returns `{ alertsCreated, candidatesChecked, timestamp }`

Stage Summary:
- 5 API routes created across 4 files
- All routes use `import { db } from '@/lib/db'`
- Lint passes cleanly
- Routes follow existing project patterns (NextRequest/NextResponse, rate-limit.ts, CRON_SECRET auth)
---
Task ID: 15
Agent: Super Z (main)
Task: Décision utilisateur "ça marche pas" → reset main sur V.6 + ré-application des mods une par une

Work Log:
- Sauvegarde : branche backup-post-V6-fixes + tag backup-main-ca88f86 (ca88f86) poussés GitHub — RIEN perdu
- Backup local .zscripts/backup-avant-V6/ : custom.db (8 bagages) + 3 photos + dev.sh
- Reset : git read-tree -u --reset V.6 → commit d25d6a4 (arbre EXACTEMENT égal à V.6 : f35061b) poussé sur main
- ERREUR ÉVITÉE : 1er commit via git add -A contenait .zscripts/.gittoken → push rejeté (protection GitHub) → recommencé avec read-tree propre + exclusions locales .git/info/exclude (.zscripts/, uploads/, db/*.db, tool-results/, logs, download/, worklog.md)
- Install : bun install (prune html-to-image), prisma generate (client V.6 sans photoPath/reward), serveur redémarré par le superviseur dev.sh (PIDs 24805/24818)
- Vérif : GET / 200, /suivi/VOL26-FLUX01 200, /admin/connexion 200, Prisma V.6 lit les 8 bagages (extra-columns ignorées), aucun P2022, aucun timer autocommit (V.6 sans instrumentation)
- Découverte : V.6 N'A PAS le Passeport QRBags, ni photo/récompense, ni étiquettes/planche (ajoutés après le 11 juillet) → à ré-appliquer depuis la backup si voulus
- Persistance worklog : commité sur branche backup-post-V6-fixes (worklog non tracké sur main sous V.6)

Stage Summary:
- main = V.6 exact (d25d6a4), serveur V.6 fonctionnel, DB intègre (8 bagages démo)
- Mods ré-applicables depuis backup-post-V6-fixes : (1) persistance DB autocommit+selfheal, (2) export ZIP robuste + fix isLost, (3) Passeport QRBags, (4) photo+récompense, (5) étiquettes+planche, (6) restyle homepage/login
- Prochaine étape : utilisateur choisit l'ordre, on applique UNE mod à la fois avec validation

---
Task ID: 16
Agent: Super Z (main)
Task: Mod 1 — intégration design pages inscription + passeport (depuis backup)

Work Log:
- Analyse dépendances : passeport = page 508 lignes + html-to-image (dep absente V.6) + /api/suivi (déjà présent) ; inscription = redesign 591 lignes avec PHOTO-FEATURE imbriquée (upload + payload photoPath) → intégration complète de la chaîne pour éviter un bouton photo cassé
- Restauré depuis backup-post-V6-fixes : src/app/passeport/[reference]/page.tsx, src/app/inscrire/page.tsx, src/app/api/baggage-photo/{upload,[reference]}/route.ts, src/app/api/activate/route.ts, prisma/schema.prisma, public/locales/{fr,en,ar}.json (clés passport + photo, +58 lignes ×3)
- bun add html-to-image@^1.11.13 ; prisma db push (colonnes photoPath/reward additives, client regénéré, 8 bagages intacts)
- Redémarrage serveur : 1er kill insuffisant (port 3000 resté fermé pendant recompile) → kill -9 chaîne next dev → superviseur relancé proprement
- Vérifié navigateur : /inscrire 200 + formulaire étape 2/2 avec sections « Photo de la valise » (Prendre une photo/Télécharger) + « Récompense en cas de perte » ; /passeport/VOL26-FLUX01 200 carte complète (Fatou Ndiaye, Dakar, Air Sénégal SN209, QR, PROTÉGÉ) ; API upload photo = validation OK ; GET photo 200 ; export PNG cliqué sans erreur
- Screenshots : download/mod1-inscription-formulaire.png, mod1-passeport-integre.png
- Commit plateforme UUID eb4128c (worklog uniquement, rien de sensible) remarqué entre d25d6a4 et mod 1 — normal

Stage Summary:
- Mod 1 LIVRÉE : main = a036ebd poussé GitHub — inscription + passeport au design récent, entièrement fonctionnels
- Prochaines mods disponibles : (2) export ZIP robuste + fix isLost, (3) persistance DB auto, (4) étiquettes/planche, (5) restyle homepage/login

---
Task ID: 17
Agent: Super Z (main)
Task: Utilisateur : "déployé mais ancienne version / y a rien" — diagnostic deploy

Work Log:
- Vérifié : workspace + GitHub main (71eed66) contiennent la mod 1 ; /api + pages 200 en dev
- Reproduit le pipeline deploy (build.sh = bun install + bun run build dans le workspace) : bun run build RÉUSSIT avec le nouveau design (route /passeport/[reference] listée)
- Lancé le standalone produit (.next/standalone/server.js :3100, DATABASE_URL pointé sur db/custom.db) : /inscrire 200 + écran Bienvenue nouveau design ; /passeport/VOL26-FLUX01 200 carte complète — screenshots download/prod-3100-inscrire.png + prod-3100-passeport.png
- Conclusion : le bundle production du workspace est CORRECT — si le deploy montre l'ancienne version, c'est que le deploy ne build pas depuis ce workspace/main (source périmée : tag/release V.6, autre branche, ou snapshot antérieur) ou cache navigateur
- 1er test 3100 : EADDRINUSE passager (instance timeout 60 encore vivante) — relance nohup OK

Stage Summary:
- Production build prouvé conforme (2 screenshots) → l'utilisateur doit redéployer MAINTENANT + vider le cache navigateur (Ctrl+Shift+R) ; si toujours ancien, le bouton deploy pointe sur une autre source que le workspace/main
