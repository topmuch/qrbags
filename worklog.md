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
Task ID: 1
Agent: Main Agent (session clone+dev)
Task: Cloner github.com/topmuch/qrbags, installer les dépendances, lancer le dev

Work Log:
- Repo demandé "github.com/qrbags" introuvable ; recherche GitHub → topmuch/qrbags (production, TypeScript, push 2026-07-11) cloné
- Dépendances installées via bun (947 packages, bun.lock)
- .env créé depuis .env.example : DATABASE_URL=file:/home/z/my-project/prisma/qrbag.db, NEXTAUTH_SECRET + ENCRYPTION_KEY générés (openssl rand -base64 32)
- Client Prisma généré (bunx prisma generate) + schéma synchronisé (prisma db push, 19ms)
- Projet déplacé de /home/z/my-project/qrbags vers /home/z/my-project (exigence plateforme : bun run dev auto à la racine)
- .zscripts/dev.sh créé : superviseur (restart auto) next dev -p 3000 + mini-service tracking-ws (Socket.IO port 3005, bun --hot)
- Vérifié en un seul appel : / → HTTP 200 (title "QRBag - Protection intelligente des bagages"), /api/auth/session → 200, /login → 200
- NOTE SANDBOX : les processus utilisateur sont tués entre les appels outils (reaper) ; le serveur doit être géré par la plateforme (auto dev server, cf. logs session précédente EADDRINUSE dans dev-server.log)

Stage Summary:
- Application QRBag (Next.js 16.1.3 Turbopack + Prisma SQLite + Tailwind 4) opérationnelle en dev sur le port 3000
- Mini-service WebSocket tracking-ws (port 3005) prêt pour le suivi temps réel
- Base de données pré-remplie du repo (prisma/qrbag.db) synchronisée avec le schéma

---
Task ID: 2
Agent: Main Agent (session activation groupée)
Task: Comprendre la génération QR + implémenter l'activation groupée (1 activation → tous les QR du voyageur actifs)

Work Log:
- Parcours du code : modèle Baggage (reference HAJJ26-/VOL26- unique, setId = clé de groupement par voyageur, status pending_activation→active)
- Génération : individuel = QR déjà "active" avec setId ; agence = QR "pending_activation" avec setId (Hajj 3 QR/voyageur, Voyageur 1-2)
- Bug corrigé dans /api/activate : l'ancienne activation groupée Hajj matchait par préfixe de référence (HAJJ26 = TOUS les hajj de l'année !) + agencyId → risque d'activer les QR d'autres pèlerins de la même agence ; et le type voyageur n'était jamais groupé
- Nouvelle logique unifiée : groupement par setId (les QR liés en pending_activation reçoivent infos voyageur + transport + expiresAt + status active), réponse enrichie (activatedCount, activatedReferences)
- UI : /hajj/activate + /inscrire stockent activatedCount/activatedReferences ; /success affiche "N bagages activés" + liste des références du set
- Test runtime (scripts/test-group-activation.ts) : set voyageur 2 QR → activatedCount=2 ; set hajj 3 QR → activatedCount=3 ; tous actifs en base, infos copiées ; nettoyage OK
- Lint OK ; pages /success /hajj/activate /inscrire → 200

Stage Summary:
- Activation groupée fonctionnelle pour Hajj ET Voyageur, clé fiable = setId (plus de risque d'activation croisée inter-voyageurs)
- Fichiers modifiés : src/app/api/activate/route.ts, src/app/hajj/activate/page.tsx, src/app/inscrire/page.tsx, src/app/success/page.tsx
- Script de test réutilisable : scripts/test-group-activation.ts

---
Task ID: 3
Agent: Main Agent (session étiquette imprimable)
Task: Intégrer le design fourni (upload/ori2.png) en étiquette QR imprimable 7×10 cm générée à chaque génération de QR voyageur

Work Log:
- Design analysé : ori2.png 1049×1499 px = ratio 0.700 (7×10 cm exact) ≈ 381 DPI ; zone QR = carte blanche x[228,828] y[705,1225] avec équerres colorées aux coins
- Mesures par scripts Python (scripts/measure-label-zone.py) ; QR placé à 370×370 px centré (x 340, y 780) — s'insère ENTRE les équerres sans les toucher
- Asset copié : public/labels/qrbag-voyageur.png (fond design préservé)
- API src/app/api/labels/[reference]/route.ts : GET génère le PNG composé (sharp) = fond design + QR (qrcode, niveau H, bleu nuit #111a4d, rendu 2× puis nearest) + référence sous le QR (overlay SVG, DejaVu Sans bold) ; ?download=1 → pièce jointe ; 404 si référence inconnue ; prêt pour un fond hajj dédié (LABEL_BACKGROUNDS)
- UI : /admin/qrcodes → bouton "Étiquette 7×10 cm" par QR (modal détail) ; /admin/etiquettes → icône imprimante par set + bouton "Planche d'impression" (modal) ; /admin/etiquettes/planche → NOUVELLE page planche A4 (étiquettes 7×10 cm, @page A4, bouton Imprimer, compteur de chargement) ; /success → "Télécharger mon étiquette (7×10 cm)" côté voyageur
- globals.css : styles @media print (A4 portrait, .no-print, break-inside avoid)
- Tests : lint 0 erreur ; API → PNG 1049×1499 vérifié VISUELLEMENT (QR bien cadré par les équerres, référence lisible) ; QR décodé par OpenCV = http://localhost:3000/scan/VOL26-DEMO01 ✅ scannable ; headers attachment OK ; 404 OK ; 4 pages → 200 sans erreur Turbopack
- Baggage de démo créé : VOL26-DEMO01 (set VOL-2026-DEMO)

Stage Summary:
- Étiquette 7×10 cm prête à imprimer générée automatiquement pour chaque QR voyageur (design officiel + QR scannable + référence)
- Points d'accès : GET /api/labels/{reference}[?download=1] · planche A4 /admin/etiquettes/planche?setId=...
- Le design hajj pourra être ajouté sans changer l'API (mapping LABEL_BACKGROUNDS par type)

---
Task ID: 4
Agent: Main Agent (session page inscription)
Task: Page /inscrire — supprimer les 4 options transport (bateau/avion/bus/train), garder uniquement « Bienvenue ! Protégez vos bagages pour votre voyage » + « Continuer » ; couleurs : zone haute bleu nuit #16234e écriture blanche, fond de page (bas) or #be9a5e

Work Log:
- src/app/inscrire/page.tsx réécrit : step 1 = accueil (Bienvenue ! + subtitle) + bouton Continuer (clés i18n existantes common.welcome / inscrire.subtitle / inscrire.next_step) ; plus de TransportModeSelector ni d'onglets Remplir/Scanner
- Couleurs : NAVY=#16234e (bande haute arrondie rounded-b-[2rem], header + titre blancs) ; GOLD=#be9a5e (fond de page, carte formulaire blanche) ; boutons primaires navy/texte blanc ; lien help navy sur or ; fallback Suspense navy
- Formulaire épuré : champs vol/train/navire/bus retirés (formData + payload API) ; transportMode:'flight' envoyé en dur (défaut déjà côté API, cohérent avec refs VOL26-) ; handleModeSelect/?mode= supprimés (param ignoré, sans casse)
- Vérifié : eslint 0 erreur ; /inscrire?qr=... → 200, #16234e + #be9a5e présents, #0047d6 absent, aucun mot Avion/Bateau/Bus/Train, « Choisissez votre mode » absent ; clés brutes SSR = comportement i18n async existant (non régressif)
- Test E2E scripts/test-inscrire-payload.ts : set 2 QR pending_activation → POST payload minimal → activatedCount=2, les 2 actives, transportMode=flight, infos copiées ; nettoyage OK

Stage Summary:
- /inscrire : flux 2 étapes simplifié (Bienvenue+Continuer → formulaire), brand navy #16234e / or #be9a5e aligné sur l'étiquette 7×10 cm
- Activation groupée setId inchangée et re-validée ; API /api/activate non modifiée
- Reste à faire (proposé) : la page /scan/[reference] a encore son propre sélecteur de mode transport avant redirection vers /inscrire

---
Task ID: 5
Agent: Main Agent (session page scan)
Task: /scan/[reference] — supprimer le sélecteur de transport avant redirection vers /inscrire (validation utilisateur : « OUI »)

Work Log:
- src/app/scan/[reference]/page.tsx — composant ActivationRedirect : état selectedMode supprimé, TransportModeSelector retiré de la branche voyageur (badge Voyageur + bouton « Démarrer l'activation » directement, comme la branche Hajj) ; icône Luggage fixe (plus d'image transport conditionnelle) ; URL de redirection = /inscrire?qr=REF (param &mode= supprimé)
- Imports nettoyés : TransportModeSelector retiré, TRANSPORT_ICONS (déjà inutilisé) retiré ; safeTransportMode/getTransportImage/getTransportBlockHeader/Image conservés (bloc transport du suivi, lignes ~660+)
- Vérifié : eslint 0 erreur ; test E2E scripts/test-scan-redirect.ts (bagage VOL26 pending_activation → API status OK, page /scan 200 sans erreur compile, aucun selectedMode/&mode=/TransportModeSelector dans le source) ; nettoyage base OK

Stage Summary:
- Flux voyageur 100 % sans question transport : scan QR → /scan (badge + Démarrer) → /inscrire?qr=REF (Bienvenue + Continuer → formulaire) → activation groupée setId
- API /api/scan et /api/activate inchangées

---
Task ID: 6
Agent: Main Agent (session photo + récompense)
Task: Ajouter photo de la valise (téléchargement/caméra) + récompense en cas de perte à l'inscription, affichées sur la page trouveur /scan

Work Log:
- prisma/schema.prisma : Baggage.photoPath (String?) + Baggage.reward (String?) ; db push OK — ATTENTION : la vraie base runtime est db/custom.db (DATABASE_URL du process prime sur .env qui pointe prisma/qrbag.db) ; prisma generate refait
- Nouvelle API POST /api/baggage-photo/upload (multipart, rate-limit 15/h, JPG/PNG/WEBP/GIF, max 10 Mo, stockage uploads/baggage-photos/UUID.ext — pattern checklist)
- Nouvelle API GET /api/baggage-photo/[reference] (sert l'image inline, cache 1h, 404 si absente, neutralisation traversée de chemin)
- API /api/activate : zod +photoPath(+500)/+reward(+120), save sur le QR principal ET copie vers tout le set (activation groupée)
- API /api/scan/[reference] : réponse enrichie photoUrl=/api/baggage-photo/{ref} (si photoPath) + reward
- /inscrire : encart 📸 Photo de la valise (2 boutons : caméra capture=environment / téléchargement, compression client canvas max 1200px JPEG 80%, aperçu + suppression + changement) + encart 🎁 Récompense (chips 10k/25k/50k/100k FCFA + champ libre) ; payload + sessionStorage enrichis (reward)
- /scan (trouveur) : nouveau bloc entre titre et bloc propriétaire — photo du bagage (img bordée) + badge récompense or #fcd616 avec description ; n'affiche que si les données existent
- i18n : +14 clés photo/reward dans fr.json, en.json, ar.json (scripts/add-photo-reward-i18n.py)
- Tests : eslint 6 fichiers → 0 erreur ; E2E scripts/test-photo-reward.ts : upload PNG → activation (activatedCount=2, photoPath+reward copiés sur le set) → scan expose photoUrl+reward → image servie 200 image/png → 404 sans photo → nettoyage ; pages /inscrire + /scan → 200 sans erreur compile
- Piège corrigé : premier test E2E échoué car serveur actif avec ancien client Prisma en mémoire → pkill + restart avant test

Stage Summary:
- Le voyageur ajoute photo + récompense à l'activation ; le trouveur voit la photo du bagage (confirmation visuelle) et la récompense proposée (motivation) sur /scan
- Fichiers : schema.prisma, api/baggage-photo/{upload,[reference]}/route.ts, api/activate/route.ts, api/scan/[reference]/route.ts, inscrire/page.tsx, scan/[reference]/page.tsx, locales fr/en/ar

---
Task ID: 7
Agent: Main Agent (session photo/suivi + WhatsApp)
Task: Photo du bagage sur /suivi + WhatsApp propriétaire ; récompense dans le message WhatsApp du trouveur (validation utilisateur : 2× « OUI »)

Work Log:
- API /api/suivi/[reference]/route.ts : réponse enrichie photoUrl=/api/baggage-photo/{ref} (si photoPath) + reward
- src/lib/whatsapp-message.ts : +reward?: string sur baggage ; ligne « 🎁 Récompense promise : … » insérée après le lien de suivi du message pré-rempli propriétaire→trouveur (i18n REWARD_LABELS fr/en/ar, sanitize + cap 60 chars) ; smartTruncate : 🎁 protégée après 👤 (ordre de retrait signature → CTA → 📱 → 👤 → 🎁) pour « renforcer la motivation »
- /suivi/[reference]/page.tsx : interface BaggageInfo +photoUrl/+reward ; NOUVELLE carte « 📸 Photo du bagage » + badge récompense or #fcd616 affichée sous l'en-tête de statut (visible, non repliée, style cohérent avec /scan) ; handleWhatsApp passe reward au message pré-rempli
- API /api/scan/notify/route.ts : alerte WhatsApp propriétaire enrichie « 📸 Photo du bagage : {APP_URL}/api/baggage-photo/{ref} » (après infos trouveur, si photoPath) ; variable Wakit photo_url ajoutée (template-compatible, '' si pas de photo)
- i18n : +2 clés tracking.baggage_photo / tracking.reward_promise dans fr.json, en.json, ar.json (scripts/add-suivi-photo-i18n.py)
- Tests : eslint src → 0 erreur / 0 warning (nettoyage au passage de 3 directives eslint-disable devenues inutiles dans /inscrire, /scan, /suivi) ; E2E scripts/test-suivi-photo-reward.ts 17/17 ✅ — suivi API expose photoUrl+reward, image servie 200 image/png, notify renvoie messageContent avec 📸 lien photo + infos trouveur, generatePreFilledMessage avec ligne récompense 327 chars / sans reward 291 / troncature forcée 398 ≤ 400 (récompense conservée), page /suivi 200 sans erreur ; smoke / /suivi /inscrire /scan → 200
- Serveur relancé en un seul appel bash (setsid nohup .zscripts/dev.sh) conformément au piège reaper

Stage Summary:
- Le propriétaire voit la photo de sa valise + la récompense promise sur /suivi ; l'alerte WhatsApp qu'il reçoit contient le lien photo (confirmation visuelle) ; le message WhatsApp pré-rempli envoyé au trouveur mentionne désormais la récompense (motivation renforcée)
- Fichiers : api/suivi/[reference]/route.ts, lib/whatsapp-message.ts, suivi/[reference]/page.tsx, api/scan/notify/route.ts, locales fr/en/ar
- Scripts : scripts/test-suivi-photo-reward.ts (réutilisable), scripts/add-suivi-photo-i18n.py

---
Task ID: 8
Agent: Main Agent (session flux complet + étiquette)
Task: Tester le flux complet sur mobile avec une vraie photo + vérifier l'étiquette QR voyageur 7×10 cm (validation utilisateur : « OUI »)

Work Log:
- Vraie photo générée (z-ai image, 768×1344) → compression PIL max 1200px JPEG 80% (simule le canvas client /inscrire)
- INCIDENT INFRA corrigé : node_modules vidé + db/custom.db supprimés (nettoyage plateforme) → bun install (947 pkgs), restauration db/custom.db depuis prisma/qrbag.db + prisma db push + generate (schéma resynchronisé, colonnes photoPath/reward OK)
- Route /api/baggage-photo/upload restaurée depuis git (supprimée du working tree, HEAD intact) ; faux positif « ln/lns » = erreur d'affichage due au flag -r de ripgrep (jamais dans le code réel)
- BUG CORRIGÉ au passage : le VRAI flux trouveur = POST /api/scan/[reference] (page /scan) dont le whatsappText « 🎉 Bonne nouvelle » au propriétaire ne contenait pas la photo → ajout « 📸 Photo du bagage : {APP_URL}/api/baggage-photo/{ref} » si photoPath (let whatsappText)
- scripts/test-flux-complet-photo.ts : E2E 24/24 ✅ — upload multipart → activation groupée (2 QR, photo+reward copiés) → scan expose photoUrl+reward → POST scan trouveur → whatsappUrl wa.me avec 📸 photo → suivi expose photo+reward+trouveur (Moussa Fall) → étiquette PNG servie
- Étiquette 7×10 cm validée : 1049×1499 px (ratio 0.700), QR décodé cv2 = http://localhost:3000/scan/VOL26-FLUX01, design visuel parfait (logo, équerres, référence)
- Captures mobiles iPhone 14 (agent-browser) → download/ : 1-trouveur-scan.png (photo+récompense visibles), 2-proprietaire-suivi.png (carte photo+récompense promise+trouveur), 3a-bienvenue, 3b-formulaire (encarts photo caméra/télécharger + chips récompense)
- Démo conservée en base : VOL26-FLUX01 + VOL26-FLUX02 (set VOL-2026-FLUX), photo réelle + récompense « 50 000 FCFA »
- eslint scan/[reference]/route.ts : 0 erreur

Stage Summary:
- Flux complet VALIDÉ de bout en bout avec une vraie photo : /inscrire (upload+récompense) → activation groupée 2 QR → /scan trouveur (photo+récompense) → WhatsApp propriétaire (« Bonne nouvelle » avec 📸 lien photo) → /suivi (photo + récompense promise + trouveur) → étiquette 7×10 cm imprimable scannable
- Livrables download/ : valise-demo.png, etiquette-voyageur-VOL26-FLUX01.png, 4 captures mobiles
- Le correctif POST /api/scan/[reference] complète la Tâche 7 : le message WhatsApp réel du trouveur→propriétaire contient désormais aussi le lien photo

---
Task ID: 8
Agent: Super Z (main)
Task: /inscrire — déplacer photo+récompense sous les infos + récompense 100% libre/optionnelle

Work Log:
- Réordonnancement des blocs step 2 : Prénom/Nom → 📍 Destination → 📅 Date/Heure → 📱 WhatsApp → 📸 Photo → 🎁 Récompense → Submit (photo+récompense désormais EN DESSOUS des infos)
- Suppression de la constante REWARD_SUGGESTIONS et des 4 boutons de montants suggérés (10 000/25 000/50 000/100 000 FCFA)
- Ajout badge « OPTIONNEL » sur l'encart récompense (clé i18n reward_optional)
- Mise à jour locales fr/en/ar : reward_hint préfixé « Optionnel — », reward_placeholder neutre « Tapez le montant de votre choix » (aucun montant suggéré)
- ESLint : 0 erreur 0 warning ; JSON validés ; smoke tests /, /inscrire, /scan, /suivi tous 200
- Vérification navigateur headless (agent-browser) : ordre DOM confirmé, 0 montant suggéré restant, badge OPTIONNEL visible, screenshot download/inscrire-nouvel-ordre.png

Stage Summary:
- La récompense est désormais un champ libre optionnel (le backend acceptait déjà reward: undefined)
- Photo et récompense regroupées en fin de formulaire, juste avant le bouton « Activer mon bagage »
- Aucune modification backend nécessaire (API /api/activate accepte déjà champ optionnel)

---
Task ID: 9
Agent: Super Z (main)
Task: Réintégrer compagnie aérienne + numéro de vol dans le formulaire /inscrire

Work Log:
- Backend déjà prêt (schema.prisma airlineName/flightNumber + API /api/activate Zod) — aucune modif DB requise
- src/app/inscrire/page.tsx : formData +2 champs (airlineName, flightNumber), encart ✈️ Vol entre Destination et Date de départ (2 inputs côte à côte sm:grid-cols-2), vol auto-uppercase (.toUpperCase()), payload POST + sessionStorage enrichis
- src/app/success/page.tsx : interface ActivationData +airlineName
- i18n réutilisé : transport.airline / airline_placeholder / flight_number / flight_number_placeholder (fr/en/ar existants)
- Script persisté scripts/test-vol-form.ts (setup/check/cleanup, main() async — top-level await interdit en CJS)
- E2E navigateur : ?qr=VOL26-TESTVOL1 (param = qr, PAS ref) → formulaire rempli (Awa Ndiaye, Sénégal, Air Sénégal, sn209→SN209, WhatsApp) → submit → /success → DB 2/2 QR activés avec vol → /suivi accordéon « Informations du bagage » affiche Air Sénégal + SN209 + logo compagnie
- Cleanup données de test effectué ; lint 0 erreur

Stage Summary:
- Compagnie aérienne + numéro de vol (optionnels) intégrés au formulaire, sauvegardés et affichés sur /suivi
- Tests: scripts/test-vol-form.ts réutilisable (setup|check|cleanup)
- Screenshots preuve : download/suivi-avec-vol.png
- Idée Passeport QRBags reportée par l'utilisateur (à reprendre plus tard)

---
Task ID: 10
Agent: Super Z (main)
Task: Passeport QRBags Niveau 1 — carte numérique style boarding pass (navy/gold)

Work Log:
- Décisions utilisateur : Niveau 1 web OUI · réservé propriétaire OUI · design navy/gold OUI · petit QR pointant vers le document · regarder /success + /suivi AVANT de coder
- Nouvelle page src/app/passeport/[reference]/page.tsx (client) : carte boarding pass navy #16234e / gold #be9a5e, perforations billetterie, badge statut (PROTÉGÉ or / PERDU rouge / EXPIRÉ gris), grille Destination/Compagnie/Vol n°, Départ + Validité, photo + badge récompense #fcd616, bande basse gold avec QRCodeSVG → URL du document (/passeport/{ref}) + mention « Document personnel »
- Actions : export PNG (html-to-image toPng pixelRatio 3, import dynamique, couleurs hex inline pour compat canvas), Partager (Web Share API + fallback clipboard), Ajouter à l'écran d'accueil (hint iOS/Android selon userAgent), lien vers /suivi
- Données via API /api/suivi existante (aucune modif backend) ; erreurs not_found/pending gérées ; RTL dir supporté
- i18n : section "passport" (33 clés) ajoutée dans fr/en/ar
- /success : bouton « 🛂 Voir mon Passeport QRBags » (navy→jaune hover) inséré entre boutons d'action et étiquette imprimable
- /suivi : lien « 🛂 Passeport QRBags → » navy dans l'accordéon Informations du bagage (après Date de départ) ; import Link ajouté
- Dépendance : html-to-image ^1.11.13 (--legacy-peer-deps, conflit sinon)
- E2E navigateur : carte complète vérifiée (titre, voyageur, réf, compagnie, vol, statut, récompense, QR, 3 boutons), export PNG cliqué sans erreur console, bouton success visible (sessionStorage seedé), lien suivi présent
- Cleanup set de test effectué ; lint 0 erreur ; screenshots download/passeport-qrbags.png + suivi-lien-passeport.png

Stage Summary:
- Passeport QRBags Niveau 1 livré : /passeport/{ref} réservé propriétaire (accès par lien depuis /success et /suivi uniquement, jamais depuis /scan trouveur)
- QR de la carte = auto-vérification du document (boucle passeport ↔ lui-même)
- Prochaines étapes possibles : Niveau 2 Apple Wallet (.pkpass, compte dev 99$/an) + Niveau 3 Google Wallet
