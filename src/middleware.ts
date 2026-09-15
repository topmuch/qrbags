import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';

/**
 * QRBags — Middleware de sécurité global (runtime Node.js)
 *
 * SÉCURITÉ OBLIGATOIRE : toute API admin/agence exige une session serveur valide
 * (cookie httpOnly `qrbag_session` → ligne `Session` en base + utilisateur actif).
 * Aucune route admin/agence ne peut être atteinte sans session — le middleware
 * est le point de contrôle unique (choke point), indépendant du code des routes.
 *
 * Règles API :
 *   /api/admin/**                  → session + rôle staff (superadmin/admin/agent)
 *   /api/agency/**                 → session + rôle agence (ou superadmin en inspection)
 *   /api/qrcodes                   → session + rôle staff
 *   /api/notifications/**          → session + rôle staff
 *   /api/messages (GET/PUT/PATCH/DELETE) → session + rôle staff (POST public : formulaires contact)
 *   /api/messages/unread-count     → session + rôle staff
 *   /api/reports                   → session requise (agence scoping forcé côté route)
 *   /api/baggage/**                → session requise (staff ou agence)
 *
 * Règles pages :
 *   /admin/**  (sauf /admin/connexion)  → session staff, sinon redirection
 *   /agence/** (sauf /agence/connexion) → session agence, sinon redirection
 *
 * Public par design : /api/scan, /api/activate, /api/checklist, /api/auth/*,
 * /api/baggage-status (urgence, rate-limité), /api/loss-alerts, /api/cron,
 * /api/baggage-photo (upload /inscrire + affichage scan), /api/ai, /api/demo…
 */

export const runtime = 'nodejs';

const SESSION_COOKIE_NAME = 'qrbag_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000;

const STAFF_ROLES = ['superadmin', 'admin', 'agent'];
const AGENCY_ROLES = ['agency', 'superadmin'];

interface ApiRule {
  prefix: string;
  roles: string[] | null; // null = n'importe quel utilisateur authentifié
  methods?: string[]; // si défini, la règle ne s'applique qu'à ces méthodes
}

const API_RULES: ApiRule[] = [
  { prefix: '/api/admin', roles: STAFF_ROLES },
  { prefix: '/api/agency', roles: AGENCY_ROLES },
  { prefix: '/api/qrcodes', roles: STAFF_ROLES },
  { prefix: '/api/notifications', roles: STAFF_ROLES },
  { prefix: '/api/messages/unread-count', roles: STAFF_ROLES },
  { prefix: '/api/messages', roles: STAFF_ROLES, methods: ['GET', 'PUT', 'PATCH', 'DELETE'] },
  { prefix: '/api/reports', roles: null },
  { prefix: '/api/baggage/', roles: null },
];

interface SessionContext {
  userId: string;
  sessionId: string;
  role: string;
  agencyId: string | null;
  email: string;
}

/**
 * Valide la session serveur depuis le cookie (sans next/headers — compatible middleware).
 * - Vérifie l'existence en base + expiration (durée + inactivité 24h)
 * - Met à jour lastActivity (débouncé 5 min)
 */
async function getSessionContext(req: NextRequest): Promise<SessionContext | null> {
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  try {
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: { user: { select: { id: true, email: true, role: true, agencyId: true } } },
    });

    if (!session || !session.user) return null;

    const now = new Date();

    // Expirée par durée
    if (session.expiresAt < now) {
      await db.session.delete({ where: { id: sessionId } }).catch(() => {});
      return null;
    }

    // Expirée par inactivité (24h sans requête)
    if (session.lastActivity < new Date(now.getTime() - INACTIVITY_TIMEOUT_MS)) {
      await db.session.delete({ where: { id: sessionId } }).catch(() => {});
      return null;
    }

    // Rafraîchit lastActivity (débouncé 5 min) — non bloquant
    if (session.lastActivity < new Date(now.getTime() - 5 * 60 * 1000)) {
      db.session
        .update({ where: { id: sessionId }, data: { lastActivity: now } })
        .catch(() => {});
    }

    return {
      userId: session.user.id,
      sessionId,
      role: session.user.role,
      agencyId: session.user.agencyId,
      email: session.user.email,
    };
  } catch {
    return null;
  }
}

/**
 * Prolonge la session (sliding expiration) et renvoie le cookie à poser.
 * Utilisé après validation réussie pour garder l'utilisateur connecté 7 jours glissants.
 */
async function buildRefreshedCookie(ctx: SessionContext): Promise<{ name: string; value: string; expires: Date } | null> {
  try {
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await db.session.update({
      where: { id: ctx.sessionId },
      data: { expiresAt: newExpiresAt },
    });
    return { name: SESSION_COOKIE_NAME, value: ctx.sessionId, expires: newExpiresAt };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');

  // ── Pages publiques (connexions) ────────────────────────────────────────────
  if (
    pathname === '/admin/connexion' ||
    pathname === '/agence/connexion' ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // ── Détermine la règle applicable ──────────────────────────────────────────
  let rule: ApiRule | null = null;
  let requiredRoles: string[] | null = null;
  let loginPath = '/admin/connexion';

  if (isApi) {
    for (const r of API_RULES) {
      if (pathname === r.prefix || pathname.startsWith(r.prefix)) {
        if (r.methods && !r.methods.includes(req.method)) {
          continue; // ex: POST /api/messages reste public
        }
        rule = r;
        requiredRoles = r.roles;
        loginPath = '/admin/connexion';
        break;
      }
    }
  } else if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    requiredRoles = STAFF_ROLES;
    loginPath = '/admin/connexion';
  } else if (pathname === '/agence' || pathname.startsWith('/agence/')) {
    requiredRoles = AGENCY_ROLES;
    loginPath = '/agence/connexion';
  }

  // Aucune règle → public
  if (!requiredRoles) {
    return NextResponse.next();
  }

  // ── Session serveur OBLIGATOIRE ─────────────────────────────────────────────
  const ctx = await getSessionContext(req);

  if (!ctx) {
    if (isApi) {
      return NextResponse.json(
        { error: 'Non autorisé - Connexion requise', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    const loginUrl = new URL(loginPath, req.url);
    loginUrl.searchParams.set('next', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  }

  // ── Vérification du rôle ────────────────────────────────────────────────────
  if (!requiredRoles.includes(ctx.role)) {
    if (isApi) {
      return NextResponse.json(
        { error: 'Accès interdit - Permissions insuffisantes', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }
    // Redirige vers l'espace correspondant à son rôle
    const fallback =
      ctx.role === 'agency' ? '/agence/tableau-de-bord' : '/admin/tableau-de-bord';
    return NextResponse.redirect(new URL(fallback, req.url));
  }

  // ── Succès : sliding expiration du cookie (7 jours glissants) ───────────────
  const res = NextResponse.next();
  const refreshed = await buildRefreshedCookie(ctx);
  if (refreshed) {
    res.cookies.set(refreshed.name, refreshed.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: refreshed.expires,
      path: '/',
    });
  }
  return res;
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    // APIs admin/agence + données sensibles
    '/api/admin/:path*',
    '/api/agency/:path*',
    '/api/qrcodes',
    '/api/notifications/:path*',
    '/api/messages/:path*',
    '/api/messages',
    '/api/reports/:path*',
    '/api/reports',
    '/api/baggage/:path*',
    // Pages protégées
    '/admin/:path*',
    '/agence/:path*',
  ],
};
