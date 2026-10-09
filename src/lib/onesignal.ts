/* ─────────────────────────────────────────────────────────────────────────
 * 🔔 ONESIGNAL WEB PUSH — notifications voyageur (canaux push)
 *
 * 3 types de notifications, toutes ciblées par TAG (qr_<REFERENCE>) :
 *   1. scan_alert      — un trouveur vient de scanner le bagage
 *   2. flight_arrival  — l'avion a atterri → « Bienvenue à destination ! »
 *                        (cron Amadeus, atterrissage réel/estimé + 15 min)
 *   3. pre_flight      — « Bon vol ! » (T-2h avant le décollage)
 *
 * Authentification serveur → serveur avec la clé REST APP-LEVEL (jamais
 * exposée au client). Non-bloquant par nature, graceful degradation,
 * journalisation NotificationLog pour la traçabilité support.
 * ───────────────────────────────────────────────────────────────────────── */

import { db } from '@/lib/db';

const ONESIGNAL_API = 'https://api.onesignal.com/notifications';

export type PushType = 'scan_alert' | 'flight_arrival' | 'pre_flight';

export interface BaggageScanPushData {
  reference: string;
  city?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  finderName?: string;
  finderPhone?: string;
  reward?: string | null;
  trackingUrl: string;
}

export interface FlightArrivalPushData {
  reference: string;
  destination?: string | null;
  trackingUrl: string;
}

export interface PreFlightPushData {
  reference: string;
  firstName?: string | null;
  airline?: string | null;
  flightNumber?: string | null;
  trackingUrl: string;
}

export interface PushSendResult {
  ok: boolean;
  status: 'sent' | 'failed' | 'skipped' | 'unavailable' | 'no_recipients';
  recipients?: number;
  onesignalId?: string;
  error?: string;
}

export function isOneSignalConfigured(): boolean {
  return Boolean(process.env.ONESIGNAL_API_KEY && process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID);
}

function siteUrl(): string {
  return (
    process.env.ONESIGNAL_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://qrbags.com'
  );
}

/* ─── Noyau d'envoi partagé — cible par tag qr_<reference>, log systématique ─── */
async function pushViaTag(
  reference: string,
  type: PushType,
  headings: { fr: string; en: string; ar: string },
  contents: { fr: string; en: string; ar: string },
  url?: string
): Promise<PushSendResult> {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;

  if (!appId || !apiKey) {
    await logPush(reference, type, 'skipped', undefined, undefined, 'onesignal_not_configured');
    return { ok: false, status: 'skipped', error: 'onesignal_not_configured' };
  }

  const payload = {
    app_id: appId,
    // Ciblage par tag — seuls les appareils du propriétaire de CE bagage sont touchés
    filters: [{ field: 'tag', key: `qr_${reference}`, relation: 'exists' }],
    headings,
    contents,
    url,
    chrome_web_icon: `${siteUrl()}/apple-touch-icon.png`,
    // Priorité haute pour ne pas finir dans la veille des notifs Android
    priority: 10,
  };

  try {
    const res = await fetch(ONESIGNAL_API, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });

    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      recipients?: number;
      errors?: unknown;
    };

    if (res.ok && json.id) {
      const recipients = json.recipients ?? 0;
      await logPush(reference, type, 'sent', recipients, json.id);
      console.log(
        `🔔 [OneSignal] Push ${type} envoyé pour ${reference} → ${recipients} appareil(s)`
      );
      return { ok: true, status: 'sent', recipients, onesignalId: json.id };
    }

    // HTTP 200 mais id vide = requête acceptée, aucun appareil abonné ne correspond au tag
    if (res.ok && !json.id) {
      const info = JSON.stringify(json.errors ?? { info: 'no_subscribed_recipients' }).slice(0, 400);
      await logPush(reference, type, 'no_recipients', 0, undefined, info);
      console.log(
        `🔔 [OneSignal] Push ${type} ${reference} accepté mais 0 appareil abonné (le voyageur ne s'est pas encore inscrit via qrbags.com)`
      );
      return { ok: true, status: 'no_recipients', recipients: 0, error: info };
    }

    const errStr = JSON.stringify(json.errors ?? json).slice(0, 400);
    await logPush(reference, type, 'failed', undefined, undefined, errStr);
    console.warn(`[OneSignal] Échec push ${type} ${reference}: ${errStr}`);
    return { ok: false, status: 'failed', error: errStr };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    await logPush(reference, type, 'failed', undefined, undefined, msg);
    console.warn(`[OneSignal] Erreur push ${type} ${reference} (non bloquant):`, msg);
    return { ok: false, status: 'failed', error: msg };
  }
}

/* ─── 1. Push « votre bagage a été scanné/retrouvé » (trouveur scanne le QR) ─── */
export async function sendBaggageScanPush(data: BaggageScanPushData): Promise<PushSendResult> {
  const lieu = data.city || data.location || 'lieu non précisé';
  const mapsUrl =
    data.latitude && data.longitude
      ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
      : null;
  const finder = data.finderName?.trim() || 'Une personne';
  const phone = data.finderPhone?.trim();
  const rewardLine = data.reward ? ` Récompense promise : ${data.reward}.` : '';

  const frBody =
    `📍 Lieu : ${lieu}${mapsUrl ? ' (position GPS disponible)' : ''}\n` +
    `👤 Trouvé par : ${finder}${phone ? ` — ${phone}` : ''}.${rewardLine} Touchez pour voir tous les détails.`;
  const enBody =
    `📍 Location: ${lieu}${mapsUrl ? ' (GPS position available)' : ''}\n` +
    `👤 Found by: ${finder}${phone ? ` — ${phone}` : ''}.${rewardLine} Tap to see all details.`;
  const arBody =
    `📍 الموقع: ${lieu}${mapsUrl ? ' (إحداثيات GPS متاحة)' : ''}\n` +
    `👤 وجده: ${finder}${phone ? ` — ${phone}` : ''}.${rewardLine} المس للتفاصيل الكاملة.`;

  return pushViaTag(
    data.reference,
    'scan_alert',
    {
      fr: `🧳 Votre bagage ${data.reference} a été retrouvé !`,
      en: `🧳 Your luggage ${data.reference} has been found!`,
      ar: `🧳 تم العثور على حقيبتك ${data.reference}!`,
    },
    { fr: frBody, en: enBody, ar: arBody },
    data.trackingUrl
  );
}

/* ─── 2. Push « Bienvenue à destination » (atterrissage réel + 15 min, cron Amadeus) ─── */

/** Préposition française correcte : « en France », « au Maroc », « aux États-Unis », « à Dubaï » */
function frPreposition(destination?: string | null): string {
  if (!destination?.trim()) return '';
  const d = destination
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const EN = [
    'france', 'tunisie', 'algerie', 'egypte', 'turquie', 'italie', 'espagne', 'belgique',
    'suisse', 'chine', 'jordanie', 'syrie', 'mauritanie', "cote d ivoire", 'pologne',
    'suede', 'norvege', 'grece', 'irak', 'iran', 'israel', 'russie', 'ukraine',
    'roumanie', 'bulgarie', 'hongrie', 'croatie', 'serbie', 'slovaquie', 'tchequie',
    'inde', 'malaisie', 'indonesie', 'australie', 'arabie saoudite', 'guinee', 'tanzanie',
    'zambie', 'coree', 'bosnie', 'guinee bissau', 'equateur',
  ];
  const AU = [
    'maroc', 'senegal', 'canada', 'japon', 'portugal', 'pakistan', 'bangladesh', 'mali',
    'niger', 'togo', 'benin', 'gabon', 'congo', 'cameroun', 'burkina', 'burkina faso',
    'tchad', 'kenya', 'nigeria', 'ghana', 'qatar', 'koweit', 'oman', 'yemen', 'soudan',
    'soudan du sud', 'nepal', 'cambodge', 'vietnam', 'laos', 'liban', 'danemark',
    'luxembourg', 'mexique', 'mozambique', 'zimbabwe', 'chili', 'sri lanka', 'bresil',
    'kazakhstan', 'ouzbekistan', 'afghanistan', 'cap vert', 'royaume uni',
  ];
  const AUX = [
    'emirats arabes unis', 'etats unis', 'etatsUnis', 'pays bas', 'philippines',
    'comores', 'seychelles', 'maldives', 'fidji', 'bahamas',
  ];

  if (AUX.some((x) => d.startsWith(x))) return 'aux';
  if (EN.some((x) => d === x || d.startsWith(`${x} `))) return 'en';
  if (AU.some((x) => d === x || d.startsWith(`${x} `))) return 'au';
  return 'à';
}

export async function sendFlightArrivalPush(data: FlightArrivalPushData): Promise<PushSendResult> {
  const dest = data.destination?.trim();
  const prep = frPreposition(dest);
  const place = dest ? `${prep} ${dest}` : 'à destination';

  return pushViaTag(
    data.reference,
    'flight_arrival',
    {
      fr: `🛬 Bienvenue ${place} !`,
      en: `🛬 Welcome to ${dest || 'your destination'}!`,
      ar: `🛬 مرحبًا بك في ${dest || 'وجهتك'}!`,
    },
    {
      fr:
        `Après le contrôle passeport, dirigez-vous vers les tapis bagages pour récupérer votre valise. ` +
        `🧳 Gardez votre QR QRBags à portée de main — nous continuons de veiller sur elle.`,
      en:
        `After passport control, head to the baggage carousels to pick up your luggage. ` +
        `🧳 Keep your QRBags QR handy — we're still watching over it.`,
      ar:
        `بعد مراقبة الجوازات، توجه إلى أحزمة الأمتعة لاستلام حقائبك. ` +
        `🧳 احتفظ ببطاقة QR الخاصة بك قريبة — نحن نواصل مراقبة حقائبك.`,
    },
    data.trackingUrl
  );
}

/* ─── 3. Push « Bon vol » (T-2h avant le décollage) ─── */
export async function sendPreFlightPush(data: PreFlightPushData): Promise<PushSendResult> {
  const prenom = data.firstName?.trim();
  const vol = [data.airline?.trim(), data.flightNumber?.trim()].filter(Boolean).join(' ');

  return pushViaTag(
    data.reference,
    'pre_flight',
    {
      fr: `✈️ Bon vol${prenom ? ` ${prenom}` : ''} !`,
      en: `✈️ Have a great flight${prenom ? `, ${prenom}` : ''}!`,
      ar: `✈️ رحلة سعيدة${prenom ? ` ${prenom}` : ''}!`,
    },
    {
      fr:
        `Votre vol${vol ? ` ${vol}` : ''} décolle bientôt. ` +
        `QRBags veille sur votre bagage pendant tout le voyage — gardez les notifications activées. 🧳`,
      en:
        `Your flight${vol ? ` ${vol}` : ''} departs soon. ` +
        `QRBags watches over your luggage for the whole journey — keep notifications on. 🧳`,
      ar:
        `رحلتك${vol ? ` ${vol}` : ''} ستقلع قريبًا. ` +
        `QRBags يراقب حقائبك طوال الرحلة — أبقِ الإشعارات مفعّلة. 🧳`,
    },
    data.trackingUrl
  );
}

/* ─── Journalisation — ne doit jamais casser le flux (DB indisponible etc.) ─── */
async function logPush(
  reference: string,
  type: PushType,
  status: 'sent' | 'failed' | 'skipped' | 'unavailable' | 'no_recipients',
  recipients?: number,
  onesignalId?: string,
  error?: string
): Promise<void> {
  try {
    await db.notificationLog.create({
      data: {
        reference,
        type,
        channel: 'onesignal_web',
        status,
        recipients: recipients ?? null,
        onesignalId: onesignalId ?? null,
        error: error?.slice(0, 400) ?? null,
      },
    });
  } catch (e) {
    console.warn('[OneSignal] NotificationLog non journalisé:', e instanceof Error ? e.message : e);
  }
}
