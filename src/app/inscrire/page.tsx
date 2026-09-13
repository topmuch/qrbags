'use client'

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Globe,
  AlertCircle,
  Camera,
  Upload,
  X,
} from 'lucide-react';
import PhoneInput from '@/components/ui/PhoneInput';
import CountryRegionSelect from '@/components/inscrire/CountryRegionSelect';

import { useTranslation } from '@/hooks/useTranslation';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';

// ─── Brand constants (palette étiquette QRBag : bleu nuit #16234e + or #be9a5e) ───
const NAVY = '#16234e'; // fond de la zone haute (en-tête + accueil) — écriture blanche
const GOLD = '#be9a5e'; // fond de la page (zone basse / contenu)

// REWARD-FEATURE: suggestions de récompense (boutons rapides)
const REWARD_SUGGESTIONS = ['10 000', '25 000', '50 000', '100 000'];

// ─── Language Selector Component ───
function LanguageSelector({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-white border-2 border-black rounded-full text-black hover:bg-black/5 transition-colors text-xs sm:text-sm md:text-base font-medium shadow-sm min-h-[36px] sm:min-h-[40px] md:min-h-[44px]"
      >
        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>{LANGUAGE_NAMES[lang]}</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Language"
          className="absolute top-full right-0 mt-1 sm:mt-2 bg-white border-2 border-black rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px] sm:min-w-[160px]"
        >
          {(['fr', 'en', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              role="option"
              aria-selected={lang === l}
              onClick={() => {
                setLang(l);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 sm:px-5 sm:py-3 text-left text-xs sm:text-sm md:text-base font-medium transition-colors ${
                lang === l ? 'text-black' : 'text-black hover:bg-black/5'
              }`}
              style={lang === l ? { backgroundColor: GOLD } : undefined}
            >
              {LANGUAGE_NAMES[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dashed Encart Helper (bordure noire pointillée) ───
function DashedEncart({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-2 border-dashed border-black rounded-xl p-4 mb-3 last:mb-0 bg-white ${className}`}>
      {children}
    </div>
  );
}

function InscrireContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrFromUrl = searchParams.get('qr') || '';

  const { t, lang, setLang, dir, countryCode } = useTranslation();
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState(countryCode);
  const [formData, setFormData] = useState({
    reference: qrFromUrl.toUpperCase(), // caché UI, conservé pour l'API
    firstName: '',
    lastName: '',
    destination: '',
    departureDate: '',
    departureTime: '',
    whatsapp: '',
  });

  // PHOTO-FEATURE: photo de la valise (caméra ou téléchargement) + aperçu
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPath, setPhotoPath] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  // REWARD-FEATURE: récompense proposée en cas de perte
  const [reward, setReward] = useState('');

  // Sync phoneCountry when countryCode is detected
  useEffect(() => {
    if ((countryCode && countryCode !== 'FR') || !phoneCountry) {
      setPhoneCountry(countryCode);
    }
  }, [countryCode]);

  // 🔒 Référence absente → activation impossible
  const missingReference = !formData.reference;

  // PHOTO-FEATURE: compression client (max 1200px, JPEG 80%) puis upload vers /api/baggage-photo/upload
  const compressAndUpload = async (file: File) => {
    setPhotoError('');
    setPhotoUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('image'));
        img.src = dataUrl;
      });

      const maxDim = 1200;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.drawImage(img, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      const compressed = blob ?? file;

      const fd = new FormData();
      fd.append('file', compressed, 'photo-valise.jpg');
      const res = await fetch('/api/baggage-photo/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('upload');
      const data = await res.json();

      setPhotoPath(data.photoPath || '');
      setPhotoPreview(canvas.toDataURL('image/jpeg', 0.6));
    } catch {
      setPhotoError(t('inscrire.photo_error'));
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-sélectionner le même fichier
    if (file) compressAndUpload(file);
  };

  const doSubmit = async () => {
    if (missingReference) return;
    setLoading(true);

    try {
      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: formData.reference,
          travelerFirstName: formData.firstName,
          travelerLastName: formData.lastName,
          whatsappOwner: formData.whatsapp,
          // Plus de sélection de transport côté UI — l'API applique son défaut ('flight',
          // cohérent avec les références voyageur VOL26-)
          transportMode: 'flight',
          destination: formData.destination,
          departureDate: formData.departureDate || undefined,
          departureTime: formData.departureTime || undefined,
          // PHOTO + REWARD FEATURE
          photoPath: photoPath || undefined,
          reward: reward.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem(
          'activationData',
          JSON.stringify({
            reference: formData.reference,
            firstName: formData.firstName,
            lastName: formData.lastName,
            whatsapp: formData.whatsapp,
            destination: formData.destination,
            transportMode: 'flight',
            reward: reward.trim(),
            type: 'voyageur',
            activatedAt: new Date().toISOString(),
            expiresAt: data.baggage?.expiresAt,
            activatedCount: data.activatedCount || 1,
            activatedReferences: data.activatedReferences || [formData.reference],
          })
        );
        router.push('/success?type=voyageur');
      } else {
        const error = await response.json();
        alert(error.message || t('inscrire.error_activation'));
      }
    } catch (error) {
      console.error('Activation error:', error);
      alert(t('inscrire.error_activation'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-[100dvh] min-h-screen flex flex-col pb-[env(safe-area-inset-bottom,0px)]"
      style={{ backgroundColor: GOLD }}
      dir={dir}
    >
      {/* ═══ ZONE HAUTE — bleu nuit #16234e, écriture blanche ═══ */}
      <div
        className="px-4 sm:px-5 md:px-8 pt-[env(safe-area-inset-top,0px)] pb-14 rounded-b-[2rem] shadow-lg"
        style={{ backgroundColor: NAVY }}
      >
        {/* ─── Header ─── */}
        <header className="flex items-center justify-between py-2 sm:py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm md:text-base font-medium">{t('inscrire.back')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="QRBag" className="h-16 w-auto object-contain" />
          </div>
          <LanguageSelector lang={lang} setLang={setLang} />
        </header>

        {/* ─── Bienvenue ! + Protégez vos bagages pour votre voyage ─── */}
        <div className="mt-4 sm:mt-6 text-center max-w-md mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            {t('common.welcome')}
          </h1>
          <p className="mt-3 text-white/90 text-base md:text-lg leading-relaxed">
            {t('inscrire.subtitle')}
          </p>

          {/* Indicateur d'étape (uniquement à l'étape 2) */}
          {step === 2 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse bg-white" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                {t('inscrire.step_2_subtitle')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ ZONE BASSE — fond or #be9a5e, carte blanche ═══ */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-4 sm:px-5 -mt-8 pb-6">
        <div className="w-full rounded-2xl p-5 md:p-6 shadow-xl bg-white">
          {/* ─── Étape 1 : Bienvenue + Continuer ─── */}
          {step === 1 && (
            <div>
              {qrFromUrl && (
                <div
                  className="flex items-center justify-center gap-2 mb-4 text-sm font-semibold"
                  style={{ color: NAVY }}
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('inscrire.reference_detected')}
                </div>
              )}
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-4 px-6 text-white rounded-xl font-bold text-lg transition-all hover:opacity-90 flex items-center justify-center gap-2 min-h-[56px] shadow-lg"
                style={{ backgroundColor: NAVY }}
              >
                {t('inscrire.next_step')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ─── Étape 2 : Formulaire d'activation ─── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Back button */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-black/70 hover:text-black transition-colors text-sm mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('inscrire.back_step')}
              </button>

              <h2
                className="text-xs uppercase tracking-widest font-bold flex items-center gap-2"
                style={{ color: NAVY }}
              >
                <Sparkles className="w-4 h-4" />
                {t('transport.traveler_info')}
              </h2>

              {/* 🔒 Référence absente — warning */}
              {missingReference && (
                <div className="border-2 border-dashed border-black bg-white rounded-xl p-4 mb-3 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-black">
                    <p className="font-bold mb-1">⚠️ Aucun code QR détecté</p>
                    <p className="text-black/70">
                      Scannez le QR code collé sur votre bagage pour activer votre protection. Si vous
                      n&apos;avez pas encore de QR,{' '}
                      <Link href="/#pricing" className="underline font-bold text-black">
                        commandez un autocollant
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              )}

              {/* Name Fields — Dashed Encart */}
              <DashedEncart>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-black/80 font-medium mb-1.5">
                      {t('inscrire.first_name_label')}
                    </p>
                    <input
                      type="text"
                      placeholder={t('inscrire.first_name_placeholder')}
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-white border-2 border-black text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black focus:border-black rounded-lg px-3 py-2.5 text-base min-h-[48px]"
                      required
                    />
                  </div>
                  <div>
                    <p className="text-sm text-black/80 font-medium mb-1.5">
                      {t('inscrire.last_name_label')}
                    </p>
                    <input
                      type="text"
                      placeholder={t('inscrire.last_name_placeholder')}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-white border-2 border-black text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black focus:border-black rounded-lg px-3 py-2.5 text-base min-h-[48px]"
                      required
                    />
                  </div>
                </div>
              </DashedEncart>

              {/* PHOTO DE LA VALISE — caméra ou téléchargement */}
              <DashedEncart>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">📸</span>
                  <div className="flex-1">
                    <p className="text-sm text-black/80 font-medium">{t('inscrire.photo_label')}</p>
                    <p className="text-xs text-black/50">{t('inscrire.photo_hint')}</p>
                  </div>
                </div>

                {photoPreview ? (
                  <div>
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt={t('inscrire.photo_label')}
                        className="w-full max-h-56 object-cover rounded-lg border-2 border-black"
                      />
                      <button
                        type="button"
                        onClick={() => { setPhotoPreview(''); setPhotoPath(''); }}
                        aria-label={t('inscrire.photo_remove')}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={photoUploading}
                      className="mt-2 w-full py-2.5 bg-white border-2 border-black text-black rounded-lg font-semibold text-sm flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                      {t('inscrire.photo_change')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={photoUploading}
                      className="py-3 px-3 bg-black hover:bg-black/80 text-white rounded-lg font-semibold text-sm flex flex-col items-center justify-center gap-1.5 min-h-[64px] disabled:opacity-50 transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-xs">{t('inscrire.photo_camera')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoUploading}
                      className="py-3 px-3 bg-white border-2 border-black text-black rounded-lg font-semibold text-sm flex flex-col items-center justify-center gap-1.5 min-h-[64px] disabled:opacity-50 transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-xs">{t('inscrire.photo_upload')}</span>
                    </button>
                  </div>
                )}

                {photoUploading && (
                  <p className="text-xs text-black/60 mt-2 flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                    {t('inscrire.photo_uploading')}
                  </p>
                )}
                {photoError && <p className="text-xs text-red-600 mt-2 font-medium">{photoError}</p>}

                {/* Inputs cachés : caméra (capture) + galerie/téléchargement */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoFile}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoFile}
                />
              </DashedEncart>

              {/* RÉCOMPENSE EN CAS DE PERTE */}
              <DashedEncart>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">🎁</span>
                  <div className="flex-1">
                    <p className="text-sm text-black/80 font-medium">{t('inscrire.reward_label')}</p>
                    <p className="text-xs text-black/50">{t('inscrire.reward_hint')}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {REWARD_SUGGESTIONS.map((amount) => {
                    const value = `${amount} FCFA`;
                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setReward(value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-colors min-h-[32px] ${
                          reward === value
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-black hover:bg-black/5'
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder={t('inscrire.reward_placeholder')}
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  className="w-full bg-white border-2 border-black text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black focus:border-black rounded-lg px-3 py-2.5 text-base min-h-[48px]"
                />
              </DashedEncart>

              {/* Destination — Dashed Encart + dropdown pays par régions */}
              <DashedEncart>
                <div className="flex items-center gap-3">
                  <span className="text-xl">📍</span>
                  <div className="flex-1">
                    <p className="text-sm text-black/80 font-medium mb-1.5">
                      {t('inscrire.destination_label')}
                    </p>
                    <CountryRegionSelect
                      value={formData.destination}
                      onChange={(v) => setFormData({ ...formData, destination: v })}
                      placeholder="Sélectionnez votre destination"
                    />
                  </div>
                </div>
              </DashedEncart>

              {/* Departure Date & Time — Dashed Encart */}
              <DashedEncart>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">📅</span>
                  <p className="text-sm text-black/80 font-medium">{t('transport.common_departure_date')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full bg-white border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black rounded-lg px-3 py-2.5 text-base min-h-[48px]"
                  />
                  <input
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    className="w-full bg-white border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black rounded-lg px-3 py-2.5 text-base min-h-[48px]"
                  />
                </div>
              </DashedEncart>

              {/* WhatsApp — Dashed Encart */}
              <DashedEncart className="mb-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📱</span>
                  <div className="flex-1">
                    <PhoneInput
                      countryCode={phoneCountry}
                      onCountryChange={setPhoneCountry}
                      value={formData.whatsapp}
                      onChange={(fullNumber) => setFormData({ ...formData, whatsapp: fullNumber })}
                      placeholder="6 12 34 56 78"
                      required
                      label={t('inscrire.whatsapp_label')}
                      hint={t('inscrire.whatsapp_hint')}
                    />
                  </div>
                </div>
              </DashedEncart>

              {/* ═══ BOUTON SUBMIT ═══ */}
              <button
                onClick={doSubmit}
                disabled={loading || missingReference}
                className="w-full py-4 px-6 active:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 min-h-[56px] flex items-center justify-center gap-2"
                style={{ backgroundColor: NAVY }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('inscrire.submit_loading')}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    {t('inscrire.submit')}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ─── Help Section ─── */}
        <div className="text-center pt-5">
          <p className="text-sm" style={{ color: NAVY }}>
            {t('inscrire.no_qr')}{' '}
            <Link href="/#pricing" className="font-bold underline" style={{ color: NAVY }}>
              {t('inscrire.order_sticker')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function InscrirePage() {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: NAVY }}>
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4" />
            <p className="text-lg text-white">{t('common.loading')}</p>
          </div>
        </main>
      }
    >
      <InscrireContent />
    </Suspense>
  );
}
