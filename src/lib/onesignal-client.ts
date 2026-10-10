/* ─────────────────────────────────────────────────────────────────────────
 * 🔔 ONESIGNAL CLIENT — abonnement aux notifications web push (côté voyageur)
 *
 * Flow :
 *  1. À l'activation, le voyageur coche « m'alerter sur mon bagage »
 *     → le prompt natif est déclenché IMMÉDIATEMENT au cochage (geste utilisateur)
 *  2. Sur la page succès, un bouton permet de (re)déclencher le prompt
 *  3. Une fois l'autorisation donnée, l'abonnement est tagué `qr_<REFERENCE>`
 *     → le backend cible exactement les appareils de CE bagage (voir
 *     src/lib/onesignal.ts)
 *
 * Graceful degradation : le SDK est chargé à la demande, en try/catch —
 * un échec (origin non enregistré, réseau bloqué, iOS sans PWA…) ne casse
 * JAMAIS le parcours d'activation, il renvoie juste un état exploitable.
 * ───────────────────────────────────────────────────────────────────────── */

/* Type minimal du SDK OneSignal v16 — évite une dépendance npm */
interface OneSignalSDK {
  init(opts: {
    appId: string;
    allowLocalhostAsSecureOrigin?: boolean;
    serviceWorkerPath?: string;
    serviceWorkerUpdaterPath?: string;
  }): Promise<void>;
  Slidedown: { promptPush(options?: unknown): Promise<unknown[]> };
  Notifications: {
    permission: boolean;
    isPushSupported(): boolean;
    addEventListener(event: string, cb: (e: unknown) => void): void;
  };
  User: {
    addTag(key: string, value: string): void;
  };
}

declare global {
  interface Window {
    OneSignal?: OneSignalSDK;
  }
}

const SDK_URL = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';

let loadPromise: Promise<OneSignalSDK | null> | null = null;

/* Charge le SDK une seule fois (promise mémoïsée) puis init avec l'App ID */
export function initOneSignal(): Promise<OneSignalSDK | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId) return Promise.resolve(null);

  if (loadPromise) return loadPromise;

  loadPromise = new Promise<OneSignalSDK | null>((resolve) => {
    try {
      const existing = window.OneSignal;
      if (existing) {
        resolve(existing);
        return;
      }
      const script = document.createElement('script');
      script.src = SDK_URL;
      script.async = true;
      script.onload = () => {
        const OneSignal = window.OneSignal;
        if (!OneSignal) {
          resolve(null);
          return;
        }
        OneSignal.init({
          appId,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          serviceWorkerUpdaterPath: '/OneSignalSDKWorker.js',
        })
          .then(() => resolve(OneSignal))
          .catch(() => resolve(null));
      };
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    } catch {
      resolve(null);
    }
  });

  return loadPromise;
}

export type OptInResult = 'granted' | 'denied' | 'unsupported' | 'unavailable';

/* ─── 🔔 DIAGNOSTIC APPAREIL — pourquoi le push est indisponible ? ───
 * Le message générique « non disponible » frustrait les voyageurs : on distingue
 * désormais les causes réelles pour afficher une instruction ACTIONNABLE. */
export type OptInProblemReason =
  | 'ios-add-to-home'     /* iPhone/iPad Safari : le push exige la PWA installée (iOS ≥ 16.4) */
  | 'in-app-browser'      /* webview WhatsApp/Facebook/Instagram : pas de web push */
  | 'permission-denied'   /* refus par le passé → à débloquer dans les réglages du site */
  | 'no-push-manager'     /* navigateur sans PushManager (Huawei/HMS, navigateur exotique…) */
  | 'sdk-failed'          /* le SDK n'a pas pu être chargé/initialisé (réseau, blocage…) */
  | 'prompt-failed'       /* le prompt OneSignal a planté */
  | 'unknown';

export interface OptInOutcome {
  state: OptInResult;
  reason?: OptInProblemReason;
}

/* Détection iOS (iPhone/iPad/iPod, y compris iPadOS 13+ qui s'identifie en Mac) */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document);
}

/* La page tourne-t-elle comme PWA installée (plein écran, hors Safari) ? */
export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  try {
    return window.matchMedia?.('(display-mode: standalone)').matches === true || nav.standalone === true;
  } catch {
    return false;
  }
}

/* Navigateur intégré (webview) — WhatsApp, Facebook, Instagram, Messenger, etc.
 * Ces navigateurs internes ne supportent pas les web push : il faut ouvrir le
 * lien dans Chrome/Safari. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /FBAV|FBAN|FB_IAB|Instagram|WhatsApp|Messenger|Line\/|musical_ly|TikTok|Snapchat|Twitter|Telegram/i.test(ua);
}

/* Permission brute du navigateur (indépendante de OneSignal) */
function rawPermission(): 'default' | 'granted' | 'denied' | 'unsupported' {
  try {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  } catch {
    return 'unsupported';
  }
}

/* Raison fine quand isPushSupported() === false */
function diagnoseUnsupported(): OptInOutcome {
  if (rawPermission() === 'denied') return { state: 'denied', reason: 'permission-denied' };
  if (isInAppBrowser()) return { state: 'unsupported', reason: 'in-app-browser' };
  if (isIOSDevice() && !isStandaloneDisplay()) return { state: 'unsupported', reason: 'ios-add-to-home' };
  return { state: 'unsupported', reason: 'no-push-manager' };
}

/* Déclenche le prompt de permission puis tague l'abonnement avec la référence.
 * À appeler depuis un geste utilisateur (clic case/bouton) — jamais au chargement. */
export async function optInNotifications(reference: string): Promise<OptInOutcome> {
  const OneSignal = await initOneSignal();
  if (!OneSignal) return { state: 'unavailable', reason: 'sdk-failed' };

  try {
    if (!OneSignal.Notifications.isPushSupported()) return diagnoseUnsupported();

    // Tague immédiatement : même si l'utilisateur tarde à cliquer « Autoriser »,
    // le tag reste attaché à son profil et le push partira dès l'abonnement.
    OneSignal.User.addTag(`qr_${reference}`, '1');

    if (OneSignal.Notifications.permission) return { state: 'granted' };

    await OneSignal.Slidedown.promptPush();

    // Redemande l'état après interaction (le slidedown se résout à la fermeture)
    return OneSignal.Notifications.permission
      ? { state: 'granted' }
      : { state: 'denied', reason: 'permission-denied' };
  } catch (err) {
    // Diagnostic console pour le support (visible en remote debugging)
    console.warn('[OneSignal] opt-in failed:', err);
    return { state: 'unavailable', reason: 'prompt-failed' };
  }
}

/* Re-tague silencieusement si la permission est déjà accordée (retour sur /success,
 * nouveau bagage activé sur le même appareil…) */
export async function ensureSubscriptionTag(reference: string): Promise<boolean> {
  const OneSignal = await initOneSignal();
  if (!OneSignal) return false;
  try {
    if (!OneSignal.Notifications.isPushSupported() || !OneSignal.Notifications.permission) {
      return false;
    }
    OneSignal.User.addTag(`qr_${reference}`, '1');
    return true;
  } catch {
    return false;
  }
}
