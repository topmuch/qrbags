/**
 * WhatsApp Pre-Filled Message Generator — Page Suivi
 *
 * Génère un message WhatsApp pré-rempli pour le bouton de contact
 * sur la page /suivi/[reference].
 *
 * Ce message est envoyé par le PROPRIÉTAIRE au TROUVEUR.
 * (Inverse de generateWhatsAppMessage() dans groq.ts qui est
 *  l'alerte automatique au propriétaire).
 *
 * Contextes supportés:
 *   - departure_airport_urgent → Urgence départ
 *   - arrival_airport          → Arrivée à destination
 *   - in_transit               → En transit
 *   - static_location          → Lieu fixe
 *
 * Contraintes:
 *   - Max 400 caractères
 *   - Emojis pertinents
 *   - i18n FR/EN/AR
 */

import type { Language } from './i18n';
import type { ScanContext } from './scan-context';

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

interface PreFilledMessageParams {
  /** Référence du bagage */
  reference: string;
  /** Langue du message */
  language: Language;
  /** Contexte du scan (départ, arrivée, transit, statique) */
  context: ScanContext;
  /** Nom du propriétaire (optionnel) */
  ownerName?: string;
}

// ═══════════════════════════════════════════════════════
//  TEMPLATES BY CONTEXT × LANGUAGE
// ═══════════════════════════════════════════════════════

const MESSAGES: Record<ScanContext, Record<Language, string>> = {
  departure_airport_urgent: {
    fr: '🛫 Bonjour ! Mon bagage {reference} a été signalé avant mon départ. Pourriez-vous me le remettre rapidement ? Merci ! — QRBag',
    en: '🛫 Hello! My bag {reference} was reported before my departure. Could you hand it to me quickly? Thanks! — QRBag',
    ar: '🛫 مرحباً! تم الإبلاغ عن أمتعتي {reference} قبل مغادرتي. هل يمكنك إعادتها لي بسرعة؟ شكراً! — QRBag',
  },
  arrival_airport: {
    fr: '🛬 Bonjour ! Mon bagage {reference} a été trouvé à l\'aéroport d\'arrivée. Comment puis-je le récupérer ? Merci ! — QRBag',
    en: '🛬 Hello! My bag {reference} was found at the arrival airport. How can I pick it up? Thanks! — QRBag',
    ar: '🛬 مرحباً! تم العثور على أمتعتي {reference} في مطار الوصول. كيف يمكنني استلامها؟ شكراً! — QRBag',
  },
  in_transit: {
    fr: '🚕 Bonjour ! Mon bagage {reference} est signalé en transit. Comment pouvons-nous nous coordonner pour la récupération ? Merci ! — QRBag',
    en: '🚕 Hello! My bag {reference} is reported in transit. How can we coordinate the pickup? Thanks! — QRBag',
    ar: '🚕 مرحباً! تم الإبلاغ عن أمتعتي {reference} في الطريق. كيف يمكننا التنسيق لاستلامها؟ شكراً! — QRBag',
  },
  static_location: {
    fr: '📍 Bonjour ! Mon bagage {reference} a été trouvé. Merci de me contacter pour organiser la récupération. — QRBag',
    en: '📍 Hello! My bag {reference} was found. Please contact me to arrange the pickup. — QRBag',
    ar: '📍 مرحباً! تم العثور على أمتعتي {reference}. يرجى التواصل معي لترتيب الاستلام. — QRBag',
  },
};

// ═══════════════════════════════════════════════════════
//  MAIN FUNCTION
// ═══════════════════════════════════════════════════════

/**
 * Génère un message WhatsApp pré-rempli pour le propriétaire contactant le trouveur.
 *
 * @param params - Données du message (référence, langue, contexte, nom propriétaire)
 * @returns string — Message formaté (max 400 caractères), encodé en URI
 *
 * @example
 * ```ts
 * const msg = generatePreFilledMessage({
 *   reference: 'VOL26-ZG46J2',
 *   language: 'fr',
 *   context: 'arrival_airport',
 *   ownerName: 'Ahmed',
 * });
 * // msg = "🛬 Bonjour ! Mon bagage VOL26-ZG46J2 a été trouvé..."
 * ```
 */
export function generatePreFilledMessage(params: PreFilledMessageParams): string {
  const { reference, language, context, ownerName } = params;

  // Sélectionner le template selon contexte × langue
  const template = MESSAGES[context]?.[language] ?? MESSAGES.static_location.fr;

  // Remplacer les variables
  let message = template.replace(/{reference}/g, reference);

  // Ajouter le nom du propriétaire si fourni
  if (ownerName && ownerName.trim()) {
    const intro: Record<Language, string> = {
      fr: `Cordialement, ${ownerName.trim()}.`,
      en: `Best regards, ${ownerName.trim()}.`,
      ar: `مع التحية، ${ownerName.trim()}.`,
    };
    message = `${message}\n${intro[language]}`;
  }

  // Limiter à 400 caractères (WhatsApp friendly)
  if (message.length > 400) {
    message = message.substring(0, 397) + '...';
  }

  return message;
}

/**
 * Génère l'URL WhatsApp complète pour contacter le trouveur.
 *
 * @param finderPhone - Numéro du trouveur (format international, chiffres uniquement)
 * @param message - Message pré-rempli (texte brut)
 * @returns string - URL WhatsApp complète (wa.me/...)
 *
 * @example
 * ```ts
 * const url = buildWhatsAppUrl('33612345678', 'Bonjour ! Mon bagage...');
 * // url = "https://wa.me/33612345678?text=Bonjour%20!%20Mon%20bagage..."
 * ```
 */
export function buildWhatsAppUrl(finderPhone: string, message: string): string {
  const cleanPhone = finderPhone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
