import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession, SessionUser } from '@/lib/session';

/**
 * QRBags — Scoping agence côté API (défense en profondeur, complément du middleware).
 *
 * Règle absolue : un utilisateur de rôle `agency` ne peut JAMAIS accéder aux
 * données d'une autre agence — le `agencyId` passé en query/body est ignoré et
 * remplacé par celui de sa session. Les rôles staff peuvent passer n'importe
 * quel agencyId (vue globale).
 *
 * Usage :
 *   const scope = await resolveAgencyScope(request);
 *   if (!scope.ok) return scope.response;
 *   const agencyId = scope.agencyId; // null possible pour un staff sans filtre
 */
export type AgencyScope =
  | { ok: true; agencyId: string | null; user: SessionUser }
  | { ok: false; response: NextResponse };

export async function resolveAgencyScope(request: NextRequest): Promise<AgencyScope> {
  const user = await getSession();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Non autorisé - Connexion requise', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }

  // Agence : forcer son propre agencyId (ignore query/body)
  if (user.role === 'agency') {
    if (!user.agencyId) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Aucune agence associée à ce compte', code: 'FORBIDDEN' },
          { status: 403 }
        ),
      };
    }
    return { ok: true, agencyId: user.agencyId, user };
  }

  // Staff : lire l'agencyId demandé (peut être null = vue globale)
  const requested = new URL(request.url).searchParams.get('agencyId');
  return { ok: true, agencyId: requested, user };
}

/**
 * Variante pour les routes POST/PUT où l'agencyId vient du body.
 * Force l'agencyId de session pour le rôle agence.
 */
export function applyAgencyScopeToBody(
  user: SessionUser,
  bodyAgencyId: string | undefined | null
): string | null {
  if (user.role === 'agency') return user.agencyId;
  return bodyAgencyId ?? null;
}
