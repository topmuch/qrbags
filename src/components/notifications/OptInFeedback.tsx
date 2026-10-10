'use client'

/* ─────────────────────────────────────────────────────────────────────────
 * 🔔 OptInFeedback — message ACTIONNABLE selon la raison de l'échec du push
 *
 * Remplace le générique « Notifications non disponibles sur cet appareil » :
 * chaque cause a désormais son instruction précise (iPhone → écran d'accueil,
 * webview → ouvrir dans Chrome/Safari, refus → réglages du site, etc.).
 * Partagé par /inscrire (case cochée) et /success (bouton).
 * ───────────────────────────────────────────────────────────────────────── */

import { BellOff, BellRing } from 'lucide-react';
import type { OptInOutcome } from '@/lib/onesignal-client';
import { useTranslation } from '@/hooks/useTranslation';

export type OptInFeedbackTone = 'amber' | 'neutral';

const TONES: Record<OptInFeedbackTone, string> = {
  amber: 'text-amber-800 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900',
  neutral:
    'text-[#16234e]/70 bg-[#16234e]/5 border border-[#16234e]/10 dark:text-gray-400 dark:bg-gray-800/60 dark:border-gray-700',
};

/** Clé i18n + tonalité par raison. Retourne null si aucune raison connue. */
function messageFor(reason: OptInOutcome['reason'], t: (k: string) => string): { text: string; tone: OptInFeedbackTone } | null {
  switch (reason) {
    case 'permission-denied':
      return { text: t('success.notify_denied'), tone: 'amber' };
    case 'ios-add-to-home':
      return { text: t('notify.problem_ios_add_home'), tone: 'neutral' };
    case 'in-app-browser':
      return { text: t('notify.problem_in_app'), tone: 'amber' };
    case 'no-push-manager':
      return { text: t('notify.problem_no_push_manager'), tone: 'neutral' };
    case 'sdk-failed':
    case 'prompt-failed':
      return { text: t('notify.problem_sdk_failed'), tone: 'neutral' };
    default:
      return null;
  }
}

/** Hook partagé : texte actionnable pour une raison donnée (utilisable aussi
 *  par les pages qui gèrent leur propre carte d'état, ex. /success).
 *  ⚠️ À appeler inconditionnellement au niveau du composant (Rules of Hooks). */
export function useOptInProblemMessage(
  reason?: OptInOutcome['reason']
): { text: string; tone: OptInFeedbackTone } {
  const { t } = useTranslation();
  return messageFor(reason, t) ?? { text: t('success.notify_unavailable'), tone: 'neutral' };
}

export default function OptInFeedback({
  outcome,
  loading = false,
  className = '',
}: {
  outcome: OptInOutcome | null;
  loading?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  // Hooks appelés inconditionnellement (Rules of Hooks) — les rendus conditionnels
  // se font uniquement au niveau du JSX / des retours anticipés APRÈS les hooks.
  const problem = outcome && outcome.state !== 'granted' ? outcome : null;
  const msg = useOptInProblemMessage(problem?.reason);

  if (loading) {
    return (
      <p className={`mt-2 flex items-center gap-2 text-xs font-medium text-[#16234e]/60 dark:text-gray-400 px-1 ${className}`} role="status">
        <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" aria-hidden />
        {t('success.notify_loading')}
      </p>
    );
  }

  if (!problem) return null;

  return (
    <p
      className={`mt-2 flex items-start gap-2 text-xs font-bold rounded-xl px-3 py-2 border ${TONES[msg.tone]} ${className}`}
      role="status"
    >
      <BellOff className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
      <span className="min-w-0 leading-snug">{msg.text}</span>
    </p>
  );
}

/* Petit badge vert « activé » réutilisable (case cochée + autorisée) */
export function OptInGrantedBadge({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <p
      className={`mt-2 flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900 ${className}`}
      role="status"
    >
      <BellRing className="w-4 h-4 shrink-0" aria-hidden />
      {t('success.notify_granted')}
    </p>
  );
}
