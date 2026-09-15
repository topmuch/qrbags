'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Regex de validation stricte — alignée sur isValidReferenceFormat() de src/lib/qr.ts
 * Accepte : VOL26-VABJZS, HAJJ25-ZG46J2
 * Refuse : vol26-vabjzs (mais auto-uppercase le corrige), RANDOM, VOL26-ABC, etc.
 */
const REFERENCE_REGEX = /^(HAJJ|VOL)\d{2}-[A-Z0-9]{6}$/;

export default function TrackingWidget() {
  const router = useRouter();
  const { t, dir } = useTranslation();

  const [inputValue, setInputValue] = useState<string>('');
  const [error, setError] = useState<string>('');

  const inputId = 'tracking-reference-input';
  const errorId = 'tracking-reference-error';

  const handleSubmit = (): void => {
    const trimmed = inputValue.trim();

    // Empty check
    if (trimmed === '') {
      setError(t('home.tracking_empty'));
      return;
    }

    // Validation regex
    if (!REFERENCE_REGEX.test(trimmed)) {
      setError(t('home.tracking_error'));
      return;
    }

    // Navigate to tracking page
    router.push(`/suivi/${trimmed}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value.toUpperCase());
    // Clear error on typing
    if (error) setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section
      id="suivi"
      dir={dir}
      className="relative w-full bg-[#16234e] py-14 sm:py-20 px-5 overflow-hidden scroll-mt-20"
    >
      {/* Fond carte du monde en pointillés + halo signature */}
      <div className="absolute inset-0 dotted-map-light opacity-40 pointer-events-none" aria-hidden />
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-[#8b17c9]/20 rounded-full blur-[110px]" aria-hidden />
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-[#f8921f]/15 rounded-full blur-[110px]" aria-hidden />

      <div className="max-w-xl mx-auto relative z-10">
        <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-2xl shadow-[#0e1834]/40 border border-white/10">
          {/* Titre avec accent dégradé */}
          <label
            htmlFor={inputId}
            className="flex items-center gap-2.5 font-black text-xl sm:text-2xl mb-2 text-[#16234e]"
          >
            <span className="w-10 h-10 rounded-xl bg-gradient-qrbag flex items-center justify-center shrink-0 shadow-lg shadow-[#e6216e]/25">
              <Search className="w-5 h-5 text-white" />
            </span>
            {t('home.tracking_label')}
          </label>
          <p className="text-sm text-slate-500 mb-6 ml-12">
            Saisissez la référence inscrite sur votre étiquette QRBags.
          </p>

          {/* Input + Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id={inputId}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t('home.tracking_placeholder')}
              aria-label={t('home.tracking_label')}
              aria-describedby={error ? errorId : undefined}
              aria-invalid={error !== ''}
              autoComplete="off"
              spellCheck={false}
              maxLength={15}
              className={`
                flex-1 w-full sm:w-auto px-5 py-4 rounded-xl text-base font-mono tracking-wider
                bg-[#f6f9ff] border text-[#16234e] placeholder:text-slate-400 uppercase
                transition-all duration-200 outline-none
                focus:ring-2 focus:ring-[#2f9bff]/40 focus:bg-white
                ${error
                  ? 'border-red-300 focus:border-red-400'
                  : 'border-slate-200 focus:border-[#2f9bff]'
                }
              `}
            />
            <button
              type="button"
              onClick={handleSubmit}
              className="
                flex items-center justify-center gap-2 px-7 py-4 rounded-xl
                bg-gradient-qrbag text-white font-bold text-base
                shadow-lg shadow-[#e6216e]/30 hover:shadow-[#e6216e]/50
                transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                min-h-[52px]
              "
            >
              <Search className="w-4 h-4" />
              <span>{t('home.tracking_button')}</span>
            </button>
          </div>

          {/* Error message */}
          {error !== '' && (
            <p
              id={errorId}
              role="alert"
              aria-live="polite"
              className="text-[#e6216e] text-sm mt-3 flex items-center gap-1.5 font-medium"
            >
              <span className="inline-block w-1.5 h-1.5 bg-[#e6216e] rounded-full flex-shrink-0" />
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
