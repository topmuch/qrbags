/* ─────────────────────────────────────────────────────────────────────────
 * 🔔 ONESIGNAL CLIENT — abonnement aux notifications web push (côté voyageur)
 *
 * Flow :
 *  1. À l'activation, le voyageur coche « m'alerter sur mon bagage »
 *  2. Sur la page succès, un bouton déclenche le prompt natif du navigateur
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

/* Déclenche le prompt de permission puis tague l'abonnement avec la référence.
 * À appeler depuis un geste utilisateur (clic bouton) — jamais au chargement. */
export async function optInNotifications(reference: string): Promise<OptInResult> {
  const OneSignal = await initOneSignal();
  if (!OneSignal) return 'unavailable';

  try {
    if (!OneSignal.Notifications.isPushSupported()) return 'unsupported';

    // Tague immédiatement : même si l'utilisateur tarde à cliquer « Autoriser »,
    // le tag reste attaché à son profil et le push partira dès l'abonnement.
    OneSignal.User.addTag(`qr_${reference}`, '1');

    if (OneSignal.Notifications.permission) return 'granted';

    await OneSignal.Slidedown.promptPush();

    // Redemande l'état après interaction (le slidedown se résout à la fermeture)
    return OneSignal.Notifications.permission ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
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
