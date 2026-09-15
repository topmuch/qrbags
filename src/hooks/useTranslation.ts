'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Language,
  loadTranslations,
  detectLanguageFromBrowser,
  detectLanguageFromCountry,
  LANGUAGE_DIRECTION,
  LANGUAGE_NAMES
} from '@/lib/i18n';

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

/** 🔔 Flag module : la langue auto-détectée serveur (page scan) a été appliquée →
 *  les heuristiques IP/navigateur de detectLanguage ne doivent PAS l'écraser
 *  (race observée : detect-country résout APRÈS le fetch du scan et réécrivait 'fr'). */
let serverLangApplied = false;

export function useTranslation(): UseTranslationReturn {
  const [lang, setLangState] = useState<Language>('fr');
  const [isLoading, setIsLoading] = useState(true);
  const [countryCode, setCountryCode] = useState('FR');

  // ⚠️ Le dictionnaire est une VRAIE state React (et non un simple module var) :
  // garantit un re-render de tous les composants consommant t() à chaque
  // changement de langue — un module var seul est invisible pour React
  // (bug observé : retour EN→FR sans re-render, textes restés en anglais).
  const [dict, setDict] = useState<Record<string, string>>({});

  // Detect language on mount
  useEffect(() => {
    const detectLanguage = async () => {
      // 1. Check localStorage first for explicit user preference
      if (typeof localStorage !== 'undefined') {
        const savedLang = localStorage.getItem('qrbag_lang') as Language | null;
        if (savedLang && ['fr', 'en', 'ar'].includes(savedLang)) {
          setLangState(savedLang);
          return;
        }
      }

      // 2. Check server-set cookie (qrbag_locale) — set by /api/scan GET route
      if (typeof document !== 'undefined') {
        const cookieMatch = document.cookie.match(/qrbag_locale=(fr|en|ar)/);
        if (cookieMatch?.[1]) {
          const cookieLang = cookieMatch[1] as Language;
          setLangState(cookieLang);
          // Sync to localStorage for persistence across sessions
          localStorage.setItem('qrbag_lang', cookieLang);
          return;
        }
      }

      // 3. Try IP-based country detection
      try {
        const response = await fetch('/api/detect-country');
        if (response.ok) {
          const data = await response.json();
          if (data.countryCode) {
            setCountryCode(data.countryCode.toUpperCase());
            // 🔔 Re-check après await : la langue serveur a pu être appliquée
            // pendant le fetch (page scan) → on ne l'écrase PAS
            if (serverLangApplied) return;
            const detectedLang = detectLanguageFromCountry(data.countryCode);
            setLangState(detectedLang);
            return;
          }
        }
      } catch (error) {
        console.log('IP detection failed, falling back to browser detection');
      }

      // 🔔 Ne pas écraser une langue serveur déjà appliquée
      if (serverLangApplied) return;

      // 4. Fallback to browser language
      const browserLang = detectLanguageFromBrowser();
      setLangState(browserLang);
    };

    detectLanguage();
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

  // Set language
  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('qrbag_lang', newLang);
    }
  }, []);

  /**
   * 🔔 Détection auto au premier scan : applique la langue détectée côté serveur
   * (Accept-Language du navigateur du trouveur) SANS créer de préférence
   * utilisateur persistante — n'écrase jamais un choix explicite (localStorage).
   */
  const applyAutoDetectedLang = useCallback((newLang: Language) => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('qrbag_lang')) {
      return; // préférence explicite → ne rien changer
    }
    if (!['fr', 'en', 'ar'].includes(newLang)) return;
    serverLangApplied = true; // 🔔 protège contre la race avec detect-country
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
