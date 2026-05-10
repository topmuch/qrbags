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
 *   - departure_urgent → Urgence départ (🛫 aéroport / 🚆 gare / 🚢 port / 🚌 gare routière)
 *   - arrival_destination → Arrivée à destination
 *   - in_transit               → En transit
 *   - static_location          → Lieu fixe
 *
 * TRANSPORT-NOTIFY: Messages différenciés par mode de transport
 *   - flight: ✈️ aéroport / vol
 *   - train:  🚆 gare / train
 *   - boat:   🚢 port / traversée maritime
 *   - bus:    🚌 gare routière / bus
 *
 * Contraintes:
 *   - Max 400 caractères
 *   - Emojis pertinents par mode de transport
 *   - i18n FR/EN/AR
 */

import type { Language } from './i18n';
import type { ScanContext } from './scan-context';
import type { TransportMode } from './transport';

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
  /** Mode de transport — différencie le vocabulaire et les emojis */
  transportMode?: TransportMode | string;
}

// ═══════════════════════════════════════════════════════
//  TRANSPORT-SPECIFIC CONTEXT LABELS
// ═══════════════════════════════════════════════════════

/** Emojis de départ/arrivée par mode de transport */
const TRANSPORT_CONTEXT_EMOJI: Record<TransportMode, { departure: string; arrival: string }> = {
  flight: { departure: '🛫', arrival: '🛬' },
  train:  { departure: '🚆', arrival: '🚆' },
  boat:   { departure: '🚢', arrival: '⚓' },
  bus:    { departure: '🚌', arrival: '🚌' },
};

/** Lieux de départ/arrivée par mode × langue */
const TRANSPORT_PLACES: Record<TransportMode, Record<Language, { departure: string; arrival: string }>> = {
  flight: {
    fr: { departure: 'aéroport de départ', arrival: "aéroport d'arrivée" },
    en: { departure: 'departure airport', arrival: 'arrival airport' },
    ar: { departure: 'مطار المغادرة', arrival: 'مطار الوصول' },
  },
  train: {
    fr: { departure: 'gare', arrival: 'gare d\'arrivée' },
    en: { departure: 'train station', arrival: 'arrival station' },
    ar: { departure: 'محطة القطار', arrival: 'محطة الوصول' },
  },
  boat: {
    fr: { departure: 'port', arrival: 'port d\'arrivée' },
    en: { departure: 'port', arrival: 'arrival port' },
    ar: { departure: 'الميناء', arrival: 'ميناء الوصول' },
  },
  bus: {
    fr: { departure: 'gare routière', arrival: 'gare d\'arrivée' },
    en: { departure: 'bus station', arrival: 'arrival bus station' },
    ar: { departure: 'محطة الحافلات', arrival: 'محطة الوصول' },
  },
};

// ═══════════════════════════════════════════════════════
//  GENERIC CONTEXT TEMPLATES (transport-independant)
// ═══════════════════════════════════════════════════════

/** Templates pour in_transit et static_location (identiques pour tous les modes) */
const GENERIC_MESSAGES: Record<'in_transit' | 'static_location', Record<Language, string>> = {
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
 * Resout le mode de transport de manière sûre.
 */
function resolveTransportMode(mode?: string): TransportMode {
  if (mode === 'train' || mode === 'boat' || mode === 'bus') return mode;
  return 'flight';
}

/**
 * Génère un message WhatsApp pré-rempli pour le propriétaire contactant le trouveur.
 * TRANSPORT-NOTIFY: Le message est différencié selon le mode de transport.
 *
 * @param params - Données du message (référence, langue, contexte, nom propriétaire, transport)
 * @returns string — Message formaté (max 400 caractères), texte brut
 */
export function generatePreFilledMessage(params: PreFilledMessageParams): string {
  const { reference, language, context, ownerName, transportMode } = params;
  const mode = resolveTransportMode(transportMode);

  let message: string;

  // ─── Contextes génériques (in_transit, static_location) ───
  if (context === 'in_transit' || context === 'static_location') {
    message = GENERIC_MESSAGES[context]?.[language] ?? GENERIC_MESSAGES.static_location.fr;
  }
  // ─── TRANSPORT-NOTIFY: Contextes liés au transport (departure/arrival) ───
  else if (context === 'departure_airport_urgent') {
    const emoji = TRANSPORT_CONTEXT_EMOJI[mode].departure;
    const place = TRANSPORT_PLACES[mode][language].departure;
    const templates: Record<Language, string> = {
      fr: `${emoji} Bonjour ! Mon bagage ${reference} a été signalé avant mon départ de ${place}. Pourriez-vous me le remettre rapidement ? Merci ! — QRBag`,
      en: `${emoji} Hello! My bag ${reference} was reported before my departure from ${place}. Could you hand it to me quickly? Thanks! — QRBag`,
      ar: `${emoji} مرحباً! تم الإبلاغ عن أمتعتي ${reference} قبل مغادرتي من ${place}. هل يمكنك إعادتها لي بسرعة؟ شكراً! — QRBag`,
    };
    message = templates[language] ?? templates.fr;
  }
  else if (context === 'arrival_airport') {
    const emoji = TRANSPORT_CONTEXT_EMOJI[mode].arrival;
    const place = TRANSPORT_PLACES[mode][language].arrival;
    const templates: Record<Language, string> = {
      fr: `${emoji} Bonjour ! Mon bagage ${reference} a été trouvé à ${place}. Comment puis-je le récupérer ? Merci ! — QRBag`,
      en: `${emoji} Hello! My bag ${reference} was found at ${place}. How can I pick it up? Thanks! — QRBag`,
      ar: `${emoji} مرحباً! تم العثور على أمتعتي ${reference} في ${place}. كيف يمكنني استلامها؟ شكراً! — QRBag`,
    };
    message = templates[language] ?? templates.fr;
  }
  else {
    // Fallback
    message = GENERIC_MESSAGES.static_location[language] ?? GENERIC_MESSAGES.static_location.fr;
  }

  // Remplacer les variables
  message = message.replace(/{reference}/g, reference);

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
