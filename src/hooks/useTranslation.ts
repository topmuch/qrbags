'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Language,
  loadTranslations,
  detectLanguageFromBrowser,
  detectLanguageFromCountry,
  LANGUAGE_DIRECTION,
  LANGUAGE_NAMES,
  LANGUAGE_COOKIE_NAME
} from '@/lib/i18n';
import { detectCountryClientSide, isSupportedCountry } from '@/lib/phone';

interface UseTranslationReturn {
  t: (key: string, params?: Record<string, string>) => string;
  lang: Language;
  setLang: (lang: Language) => void;
  /** Applique la langue auto-détectée (serveur) sans créer de préférence persistante */
  applyAutoDetectedLang: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
  langName: string;
  isLoading: boolean;
  /** Detected ISO country code (e.g. 'FR', 'SN', 'SA'). Used for phone dial code pre-selection. */
  countryCode: string;
}

// Store module-level (compat : fonction t() autonome hors React)
let translations: Record<string, string> = {};
let currentLang: Language = 'fr';

/** 🔔 Flag module : la langue auto-détectée serveur (page scan, Accept-Language) a été
 *  appliquée → les heuristiques navigateur ne doivent PAS l'écraser. */
let serverLangApplied = false;

/** 🔔 Flag module : la langue dérivée du PAYS détecté (IP/locales/fuseau) a été appliquée.
 *  Hiérarchie QRBags : choix explicite utilisateur > PAYS IP > Accept-Language > navigateur > fr.
 *  Rationale métier : en Afrique de l'Ouest (marché cible), énormément de téléphones sont
 *  configurés en anglais alors que l'utilisateur parle français — le pays (ex. Sénégal → fr)
 *  est un signal BEAUCOUP plus fiable que la config du navigateur. Observé en prod : trouveur
 *  francophone avec navigateur en → bannière + guide vocal en anglais (bug #2025-11). */
let countryLangApplied = false;

const VALID_LANGS: Language[] = ['fr', 'en', 'ar'];

/** 🔔 Préférence EXPLICITE = choix fait via le sélecteur de langue (stamp qrbag_lang_explicit).
 *  ⚠️ Les anciennes valeurs qrbag_lang non estampillées étaient écrites automatiquement
 *  (sync du cookie Accept-Language) et ont POISONNÉ des utilisateurs francophones en
 *  navigateur anglais → elles sont désormais ignorées (traitées comme absent). */
function hasExplicitLangPreference(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return (
      localStorage.getItem('qrbag_lang_explicit') === '1' &&
      VALID_LANGS.includes(localStorage.getItem('qrbag_lang') as Language)
    );
  } catch {
    return false;
  }
}

/** Le pays détecté a tranché → synchronise le cookie serveur pour que la prochaine
 *  requête (detectedLang côté route scan) soit cohérente avec la langue affichée. */
function syncLocaleCookie(lang: Language): void {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${lang}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
  } catch {
    /* cookies bloqués → silencieux */
  }
}

export function useTranslation(): UseTranslationReturn {
  const [lang, setLangState] = useState<Language>('fr');
  const [isLoading, setIsLoading] = useState(true);
  const [countryCode, setCountryCode] = useState('FR');

  // ⚠️ Le dictionnaire est une VRAIE state React (et non un simple module var) :
  // garantit un re-render de tous les composants consommant t() à chaque
  // changement de langue — un module var seul est invisible pour React
  // (bug observé : retour EN→FR sans re-render, textes restés en anglais).
  const [dict, setDict] = useState<Record<string, string>>({});

  // Miroir de `lang` lisible depuis les callbacks à dépendances vides
  // (applyDetectedLangFromCountry) sans les recréer à chaque changement.
  const langRef = useRef<Language>('fr');
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  /**
   * 🔔 Langue ← PAYS détecté (IP / locales / fuseau) — priorité 2 de la hiérarchie.
   * L'EMPORTE sur Accept-Language / cookie / navigateur (seule une préférence
   * EXPLICITE la bloque) : c'est le fix du trouveur francophone en navigateur
   * anglais qui entendait le guide vocal en anglais.
   * Ex. : pays détecté 'SN' → 'fr' même si le navigateur dit 'en'.
   */
  const applyDetectedLangFromCountry = useCallback((country: string) => {
    if (countryLangApplied) return; // déjà tranché par le pays
    if (hasExplicitLangPreference()) return; // choix utilisateur → intangible
    const detected = detectLanguageFromCountry(country);
    if (!detected) return;
    countryLangApplied = true;
    serverLangApplied = true; // le pays prime aussi sur une application serveur ultérieure
    syncLocaleCookie(detected);
    if (detected !== langRef.current) {
      setLangState(detected);
    }
  }, []);

  // Detect language on mount — priorité 1 (explicite) puis valeur immédiate
  // (cookie/navigateur) ; le pays résoudra ensuite et ajustera si nécessaire.
  useEffect(() => {
    const detectLanguage = () => {
      // 1. Préférence EXPLICITE (sélecteur de langue, estampillée) — intangible
      if (hasExplicitLangPreference()) {
        setLangState(localStorage.getItem('qrbag_lang') as Language);
        return;
      }

      // 2. Cookie serveur (qrbag_locale) : valeur immédiate anti-flash — le pays
      //    détecté pourra la corriger ensuite (plus de synchro vers localStorage :
      //    c'est cette écriture auto qui verrouillait 'en' chez les utilisateurs
      //    francophones en navigateur anglais).
      if (typeof document !== 'undefined') {
        const cookieMatch = document.cookie.match(/qrbag_locale=(fr|en|ar)/);
        if (cookieMatch?.[1]) {
          setLangState(cookieMatch[1] as Language);
          return;
        }
      }

      // 3. Langue du navigateur (dernier repli avant la résolution pays)
      setLangState(detectLanguageFromBrowser());
    };

    detectLanguage();
  }, []);

  // 🔔 DÉTECTION PAYS (indicatif téléphonique + langue) — flux INDÉPENDANT :
  // s'exécute à CHAQUE montage, même quand une préférence court-circuite la
  // détection initiale. Sans cela, le drapeau restait bloqué sur 🇫🇷 +33.
  useEffect(() => {
    let cancelled = false;

    const detectCountry = async () => {
      // 1. Géoloc IP côté serveur (le plus fiable quand elle aboutit vraiment)
      try {
        const res = await fetch('/api/detect-country');
        if (res.ok) {
          const data = await res.json();
          const cc: string = typeof data?.countryCode === 'string' ? data.countryCode.toUpperCase() : '';
          // On ne fait confiance au serveur que si la géoloc a RÉELLEMENT abouti
          // (IP publique résolue) et que le pays est supporté par le sélecteur —
          // sinon (quota épuisé, IP privée/VPN datacenter) on garde les replis locaux.
          if (data?.detected && cc && isSupportedCountry(cc)) {
            if (cancelled) return;
            setCountryCode(cc);
            applyDetectedLangFromCountry(cc);
            return;
          }
        }
      } catch {
        // réseau indisponible → replis locaux ci-dessous
      }

      // 2. Repli 100 % local : région des locales navigateur → fuseau horaire
      if (cancelled) return;
      const localCountry = detectCountryClientSide();
      if (localCountry) {
        setCountryCode(localCountry);
        applyDetectedLangFromCountry(localCountry);
      }
      // sinon : 'FR' (état initial) — sélecteur à drapeau disponible de toute façon
    };

    detectCountry();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load translations when language changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      const loaded = await loadTranslations(lang);

      // Ignore les résultats obsolètes (course entre changements de langue rapides) :
      // sinon un chargement FR lent peut écraser les traductions EN déjà affichées.
      if (cancelled) return;

      translations = loaded;
      currentLang = lang;
      setDict(loaded); // ← state React : déclenche le re-render de t()

      // Set HTML lang attribute
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
        document.documentElement.dir = LANGUAGE_DIRECTION[lang];
      }

      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // Translation function — dépend de dict : recréée à chaque nouveau dictionnaire
  const t = useCallback((key: string, params?: Record<string, string>): string => {
    let text = dict[key] || key;

    // Replace parameters
    if (params) {
      Object.keys(params).forEach((paramKey) => {
        text = text.replace(new RegExp(`{${paramKey}}`, 'g'), params[paramKey]);
      });
    }

    return text;
  }, [dict]);

  // Set language — choix EXPLICITE via le sélecteur : estampillé pour être
  // traité comme intangible par toutes les détections automatiques.
  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('qrbag_lang', newLang);
        localStorage.setItem('qrbag_lang_explicit', '1');
      } catch {
        /* stockage plein/bloqué → silencieux */
      }
    }
  }, []);

  /**
   * 🔔 Détection auto serveur (Accept-Language du navigateur) — priorité 3.
   * Appliquée par la page scan dès la réponse /api/scan. N'écrase JAMAIS un
   * choix explicite, et CÈDE au pays détecté (applyDetectedLangFromCountry) :
   * c'est lui la nouvelle autorité par défaut (navigateur en + pays SN → fr).
   */
  const applyAutoDetectedLang = useCallback((newLang: Language) => {
    if (countryLangApplied) return; // le pays a déjà tranché
    if (hasExplicitLangPreference()) return; // choix explicite → intangible
    if (!VALID_LANGS.includes(newLang)) return;
    serverLangApplied = true; // 🔔 protège contre la race avec les heuristiques navigateur
    setLangState(newLang);
  }, []);

  return {
    t,
    lang,
    setLang,
    applyAutoDetectedLang,
    dir: LANGUAGE_DIRECTION[lang],
    langName: LANGUAGE_NAMES[lang],
    isLoading,
    countryCode
  };
}

// Simple translation function for non-hook usage
export function t(key: string, params?: Record<string, string>): string {
  let text = translations[key] || key;

  if (params) {
    Object.keys(params).forEach((paramKey) => {
      text = text.replace(new RegExp(`{${paramKey}}`, 'g'), params[paramKey]);
    });
  }

  return text;
}

export { LANGUAGE_NAMES, LANGUAGE_DIRECTION };
export type { Language };
