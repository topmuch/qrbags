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
  User,
  Plane,
  Gift,
  Bell,
  BellRing,
  BellOff,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import PhoneInput from '@/components/ui/PhoneInput';
import CountryRegionSelect from '@/components/inscrire/CountryRegionSelect';

import { useTranslation } from '@/hooks/useTranslation';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';
import { optInNotifications, type OptInResult } from '@/lib/onesignal-client';
import {
  brandInput,
  brandLabel,
  brandBtnGradient,
  brandBtnNavy,
  brandBtnOutline,
  BrandShell,
  BrandCard,
} from '@/components/brand/BrandShell';

// ─── Language Selector Component ───
function LanguageSelector({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-white border-2 border-[#16234e]/15 rounded-full text-[#16234e] hover:border-[#2f9bff] transition-colors text-xs sm:text-sm md:text-base font-medium shadow-sm min-h-[36px] sm:min-h-[40px] md:min-h-[44px]"
      >
        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>{LANGUAGE_NAMES[lang]}</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Language"
          className="absolute top-full right-0 mt-1 sm:mt-2 bg-white border-2 border-[#16234e]/15 rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px] sm:min-w-[160px]"
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
                lang === l ? 'text-[#16234e] font-bold bg-[#2f9bff]/10' : 'text-[#16234e] hover:bg-[#2f9bff]/5'
              }`}
            >
              {LANGUAGE_NAMES[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Section de formulaire visuellement distincte (pastille icon + carte douce) ─── */
const SECTION_ICONS = { User, Plane, Camera } as const;

function FormSection({
  icon,
  iconColor,
  title,
  children,
  className = '',
}: {
  icon: keyof typeof SECTION_ICONS;
  iconColor: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = SECTION_ICONS[icon];
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`rounded-2xl border border-[#16234e]/10 bg-[#f6f9ff]/70 p-4 ${className}`}
    >
      <div className="flex items-center gap-2.5 mb-3.5">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
          style={{ backgroundColor: `${iconColor}1A`, border: `1.5px solid ${iconColor}55` }}
          aria-hidden
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: iconColor }} />
        </span>
        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[#16234e]">{title}</h3>
      </div>
      {children}
    </motion.section>
  );
}

function InscrireContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrFromUrl = searchParams.get('qr') || '';

  const { t, lang, setLang, dir, countryCode } = useTranslation();
  // FLOW-SIMPLIFIED : l'étape intermédiaire « Continuer » a été supprimée —
  // après la page de bienvenue du scan, le formulaire s'affiche directement.
  const step = 2;

  const [loading, setLoading] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState(countryCode);
  const [formData, setFormData] = useState({
    reference: qrFromUrl.toUpperCase(), // caché UI, conservé pour l'API
    firstName: '',
    lastName: '',
    travelerEmail: '',
    destination: '',
    airlineName: '',
    flightNumber: '',
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
  // REWARD-CURRENCY : 3 devises proposées (FCFA par défaut — zone produit principale, USD, EUR)
  const [rewardCurrency, setRewardCurrency] = useState<'FCFA' | 'USD' | 'EUR'>('FCFA');
  // 🔔 ONESIGNAL : consentement aux notifications push « bagage retrouvé » (opt-in, décoché par défaut)
  const [notifyConsent, setNotifyConsent] = useState(false);
  // 🔔 ONESIGNAL : résultat du prompt natif déclenché AU COCHAGE de la case (feedback inline).
  // Le clic sur la case = geste utilisateur → le navigateur autorise le prompt à cet instant.
  const [notifyPrompt, setNotifyPrompt] = useState<OptInResult | 'idle'>('idle');
  const [notifyPromptLoading, setNotifyPromptLoading] = useState(false);

  /* Déclenche le popup natif OneSignal dès que la case est cochée — la demande de
   * permission n'attend plus la page de confirmation (la surcouche audio-guide de
   * /success ne peut alors plus la bloquer ni la masquer). Idempotent : re-cocher
   * après décochement ne re-prompt que si nécessaire, et ne casse jamais le parcours. */
  const handleNotifyConsentChange = (checked: boolean) => {
    setNotifyConsent(checked);
    if (!checked) return;
    const reference = formData.reference.trim();
    if (!reference) return; // pas de référence → le bouton /success restera le repli
    setNotifyPromptLoading(true);
    optInNotifications(reference)
      .then((result) => setNotifyPrompt(result))
      .catch(() => setNotifyPrompt('unavailable'))
      .finally(() => setNotifyPromptLoading(false));
  };
  const REWARD_CURRENCY_SUFFIX: Record<'FCFA' | 'USD' | 'EUR', string> = {
    FCFA: 'FCFA',
    USD: '$',
    EUR: '€',
  };

  // 🔔 Sync phoneCountry when countryCode is detected (IP / locales / fuseau).
  // Garde-fous : l'utilisateur n'a ni saisi de numéro WhatsApp, ni choisi
  // manuellement un autre pays — sinon on n'écrase JAMAIS son choix.
  useEffect(() => {
    if (countryCode && countryCode !== 'FR' && !formData.whatsapp) {
      setPhoneCountry(prev => (prev === 'FR' ? countryCode : prev));
    }
  }, [countryCode, formData.whatsapp]);

  // 🔒 Référence absente → activation impossible
  const missingReference = !formData.reference;

  // PHOTO-FEATURE: compression client (max 1200px, JPEG 80%) puis upload vers /api/baggage-photo/upload
  // Robustesse mobile (photo prise au téléphone) :
  //  - chaque étape asynchrone est sous timeout (FileReader, décodage <img>, canvas.toBlob, fetch) :
  //    sur certains téléphones le décodage d'une photo (HEIC iPhone, capteur 48 MP) ne déclenche
  //    NI onload NI onerror → l'ancien code restait bloqué sur « Envoi en cours... » indéfiniment ;
  //  - si la compression échoue, on envoie le fichier original tel quel (≤ 30 Mo, format image) ;
  //  - un watchdog global garantit la fin de l'état « envoi en cours » quoi qu'il arrive.
  const photoMaxBytes = 30 * 1024 * 1024; // 30 Mo (aligné sur PHOTO_MAX_BYTES côté serveur)
  const photoAllowedRaw = /\.(jpe?g|png|webp|gif|heic|heif)$/i;

  const uploadPhotoFile = async (blob: Blob, filename: string): Promise<string> => {
    const fd = new FormData();
    fd.append('file', blob, filename);
    const controller = new AbortController();
    const abortTimer = window.setTimeout(() => controller.abort(), 45000);
    try {
      const res = await fetch('/api/baggage-photo/upload', { method: 'POST', body: fd, signal: controller.signal });
      if (!res.ok) {
        // Message serveur explicite (type non supporté / trop volumineux) si disponible
        let serverError = '';
        try {
          const errData = await res.json();
          serverError = typeof errData?.error === 'string' ? errData.error : '';
        } catch {
          /* corps non JSON (page d'erreur) */
        }
        throw new Error(serverError || `HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.photoPath || '';
    } finally {
      window.clearTimeout(abortTimer);
    }
  };

  const compressAndUpload = async (file: File) => {
    setPhotoError('');
    setPhotoUploading(true);
    // Watchdog global : quelle que soit l'étape qui se bloque, on termine l'état « envoi en cours »
    const watchdog = window.setTimeout(() => {
      setPhotoUploading(false);
      setPhotoError((prev) => prev || t('inscrire.photo_error'));
    }, 75000);

    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('timeout')), ms)),
      ]);

    try {
      // HEIC/HEIF (format natif caméra iPhone) trop volumineux → erreur immédiate,
      // inutile de tenter le décodage. Sinon on PROCEDE au flux standard :
      //  - Safari iOS sait décoder le HEIC → compression JPEG locale → le trouveur
      //    reçoit un JPEG affichable partout ✓
      //  - Chrome/Firefox échouent au décodage → fallback « envoi du fichier original »
      //    ci-dessous → le serveur convertit le HEIC en JPEG (sharp) pour le trouveur ✓
      const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
      if (isHeic && file.size > photoMaxBytes) {
        setPhotoError(t('inscrire.photo_error_size'));
        return;
      }

      // 1) Lecture du fichier en data URL
      const dataUrl = await withTimeout(
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('read'));
          reader.readAsDataURL(file);
        }),
        15000
      );

      // 2) Décodage de l'image (⚠️ peut ne jamais rappeler onload/onerror sur mobile → timeout)
      const img = new window.Image();
      await withTimeout(
        new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('image'));
          img.src = dataUrl;
        }),
        10000
      );

      // 3) Redimensionnement + compression JPEG
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

      const blob = await withTimeout(
        new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8)),
        15000
      );

      // 4) Upload de la version compressée
      if (!blob) throw new Error('compress');
      const photoPath = await withTimeout(uploadPhotoFile(blob, 'photo-valise.jpg'), 60000);
      setPhotoPath(photoPath);
      setPhotoPreview(canvas.toDataURL('image/jpeg', 0.6));
      setPhotoError('');
    } catch {
      // Fallback : la compression a échoué mais le fichier original est exploitable → envoi tel quel
      const isReadableImage =
        photoAllowedRaw.test(file.name) && file.size > 0 && file.size <= photoMaxBytes;
      if (isReadableImage) {
        try {
          const photoPath = await withTimeout(uploadPhotoFile(file, file.name || 'photo-valise.jpg'), 60000);
          setPhotoPath(photoPath);
          setPhotoPreview(''); // pas d'aperçu (image non décodable localement)
          setPhotoError('');
          return;
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : '';
          setPhotoError(
            /volumineux|too large/i.test(msg) ? t('inscrire.photo_error_size') : t('inscrire.photo_error')
          );
          return;
        }
      }
      setPhotoError(t('inscrire.photo_error'));
    } finally {
      window.clearTimeout(watchdog);
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
      // REWARD-CURRENCY : on concatène le montant saisi avec la devise choisie
      // (ex: « 1000 FCFA », « 1000 $ », « 1000 € ») — champ libre max 120 chars côté API
      const rewardWithCurrency = reward.trim()
        ? `${reward.trim()} ${REWARD_CURRENCY_SUFFIX[rewardCurrency]}`.slice(0, 120)
        : '';
      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: formData.reference,
          travelerFirstName: formData.firstName,
          travelerLastName: formData.lastName,
          whatsappOwner: formData.whatsapp,
          travelerEmail: formData.travelerEmail.trim() || undefined,
          // Plus de sélection de transport côté UI — l'API applique son défaut ('flight',
          // cohérent avec les références voyageur VOL26-)
          transportMode: 'flight',
          destination: formData.destination,
          airlineName: formData.airlineName.trim() || undefined,
          flightNumber: formData.flightNumber.trim() || undefined,
          departureDate: formData.departureDate || undefined,
          departureTime: formData.departureTime || undefined,
          // PHOTO + REWARD FEATURE
          photoPath: photoPath || undefined,
          reward: rewardWithCurrency || undefined,
          // 🔔 ONESIGNAL : consentement notifications push
          notifyConsent,
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
            travelerEmail: formData.travelerEmail.trim(),
            destination: formData.destination,
            airlineName: formData.airlineName.trim(),
            flightNumber: formData.flightNumber.trim(),
            transportMode: 'flight',
            reward: rewardWithCurrency,
            notifyConsent,
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
    <BrandShell>
      <main
        className="min-h-[100dvh] min-h-screen flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
        dir={dir}
      >
        {/* ─── Header ─── */}
        <header className="max-w-5xl mx-auto w-full px-4 sm:px-6 flex items-center justify-between py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#16234e] font-semibold hover:text-[#2f9bff] transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm md:text-base">{t('inscrire.back')}</span>
          </Link>
          <span className="inline-flex items-center rounded-2xl bg-white px-2.5 py-1 border border-[#16234e]/10 shadow-sm"><img src="/logo.png" alt="QRBags" className="h-14 sm:h-16 w-auto object-contain" /></span>
          <LanguageSelector lang={lang} setLang={setLang} />
        </header>

        {/* ─── Container ─── */}
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-4 sm:px-5 pt-4 pb-10">

          {/* ═══ 🎒 HERO — bandeau dégradé signature + icône animée (wahoo effect) ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="mb-5"
          >
            <BrandCard corners className="w-full">
              {/* Bandeau dégradé signature (orange → rouge → magenta → violet) */}
              <div className="relative bg-gradient-qrbag rounded-t-[23px] overflow-hidden px-5 pt-7 pb-6 text-center">
                <div className="absolute inset-0 dotted-map-light opacity-60 pointer-events-none" aria-hidden />
                <div className="absolute -top-12 -left-10 w-36 h-36 rounded-full bg-white/15 blur-2xl" aria-hidden />
                <div className="absolute -bottom-14 -right-8 w-44 h-44 rounded-full bg-[#ffd200]/25 blur-2xl" aria-hidden />
                <span className="absolute top-3 right-4 text-xl" aria-hidden>✨</span>
                <span className="absolute bottom-4 left-4 text-lg" aria-hidden>🧳</span>

                {/* Icône animée — flottement + légère rotation */}
                <motion.div
                  animate={{ y: [0, -6, 0], rotate: [0, -3, 3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 rounded-full bg-white shadow-xl shadow-[#16234e]/25 flex items-center justify-center overflow-hidden"
                >
                  <img src="/logo.png" alt="Logo QRBags" className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-2xl" aria-hidden />
                </motion.div>

                {/* Badge pilule — activation gratuite */}
                <span className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.15em]">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden />
                  {t('inscrire.hero_badge')}
                </span>

                <h1 className="relative mt-3 text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
                  {t('inscrire.hero_title')}
                </h1>
                <p className="relative mt-2 text-sm md:text-base text-white/90 leading-relaxed max-w-md mx-auto font-medium">
                  {t('inscrire.hero_subtitle')}
                </p>

                {qrFromUrl && (
                  <p className="relative mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white font-mono font-bold text-xs tracking-widest">
                    <CheckCircle className="w-3.5 h-3.5" aria-hidden />
                    {formData.reference}
                  </p>
                )}
              </div>

              {/* Bandeau confiance — réassurance (gratuit / sans app / protégé) */}
              <div className="px-4 py-3 bg-white flex items-center justify-center gap-2 flex-wrap">
                {[
                  { emoji: '🆓', key: 'inscrire.trust_free' },
                  { emoji: '📱', key: 'inscrire.trust_noapp' },
                  { emoji: '🔒', key: 'inscrire.trust_secure' },
                ].map((item) => (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2f9bff]/5 border border-[#2f9bff]/15 text-[10px] sm:text-xs font-bold text-[#16234e]/70"
                  >
                    <span aria-hidden>{item.emoji}</span>
                    {t(item.key)}
                  </span>
                ))}
              </div>
            </BrandCard>
          </motion.div>

          {/* ─── Carte formulaire (coins viewfinder QR via BrandCard corners) ─── */}
          <BrandCard corners className="w-full p-5 md:p-7">
            {/* ─── Formulaire d'activation (affiché directement — étape « Continuer » supprimée) ─── */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="space-y-4"
              >
                {/* 🔒 Référence absente — warning */}
                {missingReference && (
                  <div className="bg-[#2f9bff]/5 border-2 border-dashed border-[#2f9bff]/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#2f9bff] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-[#16234e]/80">
                      <p className="font-bold mb-1 text-[#16234e]">⚠️ Aucun code QR détecté</p>
                      <p>
                        Scannez le QR code collé sur votre bagage pour activer votre protection. Si vous
                        n&apos;avez pas encore de QR,{' '}
                        <Link href="/#pricing" className="underline font-bold text-[#2f9bff]">
                          commandez un autocollant
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                )}

                {/* ═══ 1. IDENTITÉ DU VOYAGEUR ═══ */}
                <FormSection icon="User" iconColor="#2f9bff" title={t('inscrire.section_identity')}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="inscrire-first-name" className={brandLabel}>
                        {t('inscrire.first_name_label')}
                      </label>
                      <input
                        id="inscrire-first-name"
                        type="text"
                        placeholder={t('inscrire.first_name_placeholder')}
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className={brandInput}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="inscrire-last-name" className={brandLabel}>
                        {t('inscrire.last_name_label')}
                      </label>
                      <input
                        id="inscrire-last-name"
                        type="text"
                        placeholder={t('inscrire.last_name_placeholder')}
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className={brandInput}
                        required
                      />
                    </div>
                  </div>

                  {/* WhatsApp */}
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

                  {/* 🔔 Email — alerte « bagage scanné » (optionnel) */}
                  <div className="mt-4">
                    <label htmlFor="inscrire-email" className={brandLabel}>
                      {t('inscrire.email_label')}
                    </label>
                    <input
                      id="inscrire-email"
                      type="email"
                      autoComplete="email"
                      placeholder="vous@exemple.com"
                      value={formData.travelerEmail}
                      onChange={(e) => setFormData({ ...formData, travelerEmail: e.target.value })}
                      className={brandInput}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      {t('inscrire.email_hint')}
                    </p>
                  </div>

                  {/* 🔔 ONESIGNAL — Consentement notifications push (opt-in RGPD) */}
                  <label
                    htmlFor="notify-consent"
                    className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all select-none ${
                      notifyConsent
                        ? 'border-[#8b17c9]/40 bg-[#8b17c9]/[0.06]'
                        : 'border-[#16234e]/15 bg-white hover:border-[#16234e]/30 dark:bg-transparent'
                    }`}
                  >
                    <input
                      id="notify-consent"
                      type="checkbox"
                      checked={notifyConsent}
                      onChange={(e) => handleNotifyConsentChange(e.target.checked)}
                      className="mt-0.5 h-5 w-5 shrink-0 rounded accent-[#8b17c9] cursor-pointer"
                    />
                    <span className="flex items-start gap-2.5 min-w-0">
                      <span
                        className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: 'rgba(232, 33, 110, 0.10)',
                          border: '1.5px solid rgba(232, 33, 110, 0.30)',
                        }}
                        aria-hidden
                      >
                        <Bell className="w-[18px] h-[18px] text-[#e6216e]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-[#16234e] dark:text-white">
                          {t('inscrire.notify_consent_label')}
                        </span>
                        <span className="block text-xs text-[#16234e]/60 dark:text-gray-400 leading-snug mt-0.5">
                          {t('inscrire.notify_consent_desc')}
                        </span>
                      </span>
                    </span>
                  </label>

                  {/* 🔔 Feedback immédiat du prompt natif déclenché au cochage */}
                  {notifyPromptLoading && (
                    <p className="mt-2 flex items-center gap-2 text-xs font-medium text-[#16234e]/60 dark:text-gray-400 px-1" role="status">
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden />
                      {t('success.notify_loading')}
                    </p>
                  )}
                  {!notifyPromptLoading && notifyPrompt === 'granted' && (
                    <p className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2" role="status">
                      <BellRing className="w-4 h-4 shrink-0" aria-hidden />
                      {t('success.notify_granted')}
                    </p>
                  )}
                  {!notifyPromptLoading && notifyPrompt === 'denied' && (
                    <p className="mt-2 flex items-start gap-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2" role="status">
                      <BellOff className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                      {t('success.notify_denied')}
                    </p>
                  )}
                  {!notifyPromptLoading && (notifyPrompt === 'unsupported' || notifyPrompt === 'unavailable') && (
                    <p className="mt-2 flex items-start gap-2 text-xs font-medium text-[#16234e]/70 bg-[#16234e]/5 border border-[#16234e]/10 rounded-xl px-3 py-2" role="status">
                      <BellOff className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                      {t('success.notify_unavailable')}
                    </p>
                  )}
                </FormSection>

                {/* ═══ 2. VOTRE TRAJET ═══ */}
                <FormSection icon="Plane" iconColor="#f8921f" title={t('inscrire.section_trip')}>
                  {/* Destination — dropdown pays par régions */}
                  <div className="mb-4">
                    <p className={brandLabel}>{t('inscrire.destination_label')}</p>
                    <CountryRegionSelect
                      value={formData.destination}
                      onChange={(v) => setFormData({ ...formData, destination: v })}
                      placeholder="Sélectionnez votre destination"
                    />
                  </div>

                  {/* Vol — compagnie aérienne + numéro de vol (optionnel) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className={brandLabel}>{t('transport.airline')}</p>
                      <input
                        type="text"
                        placeholder={t('transport.airline_placeholder')}
                        value={formData.airlineName}
                        onChange={(e) => setFormData({ ...formData, airlineName: e.target.value })}
                        className={brandInput}
                      />
                    </div>
                    <div>
                      <p className={brandLabel}>{t('transport.flight_number')}</p>
                      <input
                        type="text"
                        placeholder={t('transport.flight_number_placeholder')}
                        value={formData.flightNumber}
                        onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value.toUpperCase() })}
                        className={brandInput}
                      />
                    </div>
                  </div>

                  {/* Departure Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="date"
                      aria-label={t('inscrire.departure_date_label')}
                      value={formData.departureDate}
                      onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                      className={`${brandInput} min-w-0`}
                    />
                    {/* 🔧 FIX « cadran heure mobile » : les <input type="time"> natifs
                        affichent un cadran 12h AM/PM sur les téléphones configurés en
                        anglais (impossible à forcer en 24h en HTML). On remplace par
                        deux <select> déterministes 24h → « 14:30 » partout, tous
                        appareils, sans clavier ni ambiguïté AM/PM. */}
                    <div className="grid grid-cols-2 gap-2" role="group" aria-label={t('inscrire.departure_time_label')}>
                      <select
                        aria-label={`${t('inscrire.departure_time_label')} — heures`}
                        value={formData.departureTime ? formData.departureTime.split(':')[0] : ''}
                        onChange={(e) => {
                          const h = e.target.value;
                          const m = formData.departureTime.split(':')[1] || '00';
                          setFormData({ ...formData, departureTime: h ? `${h}:${m}` : '' });
                        }}
                        className={`${brandInput} min-w-0 cursor-pointer`}
                      >
                        <option value="">-- h --</option>
                        {Array.from({ length: 24 }, (_, h) => {
                          const v = String(h).padStart(2, '0');
                          return <option key={v} value={v}>{v} h</option>;
                        })}
                      </select>
                      <select
                        aria-label={`${t('inscrire.departure_time_label')} — minutes`}
                        value={formData.departureTime ? formData.departureTime.split(':')[1] : ''}
                        onChange={(e) => {
                          const m = e.target.value;
                          const h = formData.departureTime.split(':')[0] || '';
                          if (h && m) setFormData({ ...formData, departureTime: `${h}:${m}` });
                        }}
                        className={`${brandInput} min-w-0 cursor-pointer`}
                      >
                        <option value="">-- min --</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const v = String(i * 5).padStart(2, '0');
                          return <option key={v} value={v}>{v} min</option>;
                        })}
                      </select>
                    </div>
                  </div>
                </FormSection>

                {/* ═══ 3. PHOTO DE LA VALISE — zone d'upload violette pointillée ═══ */}
                <FormSection icon="Camera" iconColor="#e6216e" title={t('inscrire.photo_label')}>
                  <p className="text-xs text-[#16234e]/60 mb-3">{t('inscrire.photo_hint')}</p>

                  {(photoPath || photoPreview) ? (
                    <div>
                      <div className="relative">
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt={t('inscrire.photo_label')}
                            className="w-full max-h-56 object-cover rounded-2xl border-2 border-[#8b17c9]/25"
                          />
                        ) : (
                          /* Photo enregistrée mais non décodable localement (HEIC) → placeholder */
                          <div className="w-full max-h-56 min-h-[140px] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-[#8b17c9]/25 bg-[#8b17c9]/[0.06] py-8">
                            <ImageIcon className="w-8 h-8 text-[#8b17c9]" aria-hidden />
                            <p className="text-xs font-bold text-[#16234e]/70">{t('inscrire.photo_saved')}</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => { setPhotoPreview(''); setPhotoPath(''); }}
                          aria-label={t('inscrire.photo_remove')}
                          className="absolute top-2 right-2 w-8 h-8 bg-[#e6216e] hover:bg-[#c11a5d] text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                        >
                          <X className="w-4 h-4" aria-hidden />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={photoUploading}
                        className={`mt-2.5 w-full py-2.5 text-sm flex items-center justify-center gap-2 min-h-[44px] ${brandBtnOutline}`}
                      >
                        <Camera className="w-4 h-4" aria-hidden />
                        {t('inscrire.photo_change')}
                      </button>
                    </div>
                  ) : (
                    /* Zone d'upload attrayante — dashed border violette */
                    <div className="border-2 border-dashed border-[#8b17c9]/35 bg-[#8b17c9]/[0.04] rounded-2xl p-4 sm:p-5 text-center">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-[#8b17c9]/10 border border-[#8b17c9]/25 flex items-center justify-center"
                        aria-hidden
                      >
                        <Camera className="w-6 h-6 text-[#8b17c9]" />
                      </motion.div>
                      <p className="text-xs font-bold text-[#16234e]/60 mb-3.5">{t('inscrire.photo_hint')}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          disabled={photoUploading}
                          className={`py-3 px-3 text-sm flex flex-col items-center justify-center gap-1.5 min-h-[64px] ${brandBtnNavy}`}
                        >
                          <Camera className="w-5 h-5" aria-hidden />
                          <span className="text-xs">{t('inscrire.photo_camera')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={photoUploading}
                          className={`py-3 px-3 text-sm flex flex-col items-center justify-center gap-1.5 min-h-[64px] ${brandBtnOutline}`}
                        >
                          <Upload className="w-5 h-5" aria-hidden />
                          <span className="text-xs">{t('inscrire.photo_upload')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {photoUploading && (
                    <p className="text-xs text-[#16234e]/60 mt-2.5 flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-[#16234e]/30 border-t-[#16234e] rounded-full animate-spin inline-block" />
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
                </FormSection>

                {/* ═══ 4. RÉCOMPENSE TROUVEUR — spotlight navy (🎁 wahoo) ═══ */}
                <motion.section
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  aria-label={t('inscrire.reward_label')}
                >
                  {/* Halo pulsant + cadre dégradé */}
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-qrbag rounded-[1.4rem] opacity-40 blur-lg animate-pulse" aria-hidden />
                    <div className="relative rounded-2xl p-[2.5px] bg-gradient-qrbag shadow-lg shadow-[#8b17c9]/25">
                      <div className="relative bg-[#16234e] rounded-[13px] px-4 py-4 overflow-hidden">
                        <div className="absolute inset-0 dotted-map-light opacity-50 pointer-events-none" aria-hidden />
                        <Sparkles className="absolute top-3 right-3.5 w-4 h-4 text-[#ffd200]/70" aria-hidden />

                        <div className="relative flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xl" aria-hidden>🎁</span>
                          <p className="text-white font-extrabold text-sm">{t('inscrire.reward_label')}</p>
                          <span className="px-2 py-0.5 rounded-full bg-[#ffd200] text-[#16234e] text-[10px] font-black uppercase tracking-wide">
                            {t('inscrire.reward_optional')}
                          </span>
                        </div>
                        <p className="relative text-xs text-white/75 mb-3 flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-[#ffd200] flex-shrink-0" aria-hidden />
                          {t('inscrire.reward_spotlight')}
                        </p>

                        <label htmlFor="inscrire-reward" className="sr-only">
                          {t('inscrire.reward_label')}
                        </label>
                        {/* REWARD-CURRENCY : montant + sélecteur de devise (FCFA / $ / €) */}
                        <div className="relative flex gap-2">
                          <input
                            id="inscrire-reward"
                            type="text"
                            inputMode="numeric"
                            placeholder={t('inscrire.reward_placeholder')}
                            value={reward}
                            onChange={(e) => setReward(e.target.value)}
                            className={`${brandInput} relative bg-white/95 flex-1 min-w-0`}
                          />
                          <div
                            role="group"
                            aria-label={t('inscrire.reward_currency')}
                            className="flex flex-shrink-0 rounded-xl overflow-hidden border border-[#16234e]/15 bg-white/95"
                          >
                            {(
                              [
                                { code: 'FCFA', symbol: 'FCFA', label: 'FCFA' },
                                { code: 'USD', symbol: '$', label: 'Dollar' },
                                { code: 'EUR', symbol: '€', label: 'Euro' },
                              ] as const
                            ).map((cur) => (
                              <button
                                key={cur.code}
                                type="button"
                                onClick={() => setRewardCurrency(cur.code)}
                                aria-pressed={rewardCurrency === cur.code}
                                title={cur.label}
                                className={`px-3 min-h-[44px] text-xs font-black tracking-wide transition-colors ${
                                  rewardCurrency === cur.code
                                    ? 'bg-gradient-qrbag text-white'
                                    : 'bg-white text-[#16234e]/60 hover:bg-[#16234e]/5'
                                }`}
                              >
                                {cur.symbol}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* ═══ BOUTON SUBMIT — dégradé signature XL + flèche glissante ═══ */}
                <motion.button
                  onClick={doSubmit}
                  disabled={loading || missingReference}
                  whileTap={{ scale: 0.98 }}
                  className={`group ${brandBtnGradient} w-full py-4 px-6 text-lg min-h-[56px] flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden />
                      {t('inscrire.submit_loading')}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5" aria-hidden />
                      {t('inscrire.submit')}
                      <ArrowRight
                        className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5 rtl:rotate-180"
                        aria-hidden
                      />
                    </span>
                  )}
                </motion.button>
              </motion.div>
            )}
          </BrandCard>

          {/* ─── Help Section ─── */}
          <div className="text-center pt-5">
            <p className="text-sm text-[#16234e]/70">
              {t('inscrire.no_qr')}{' '}
              <Link href="/#pricing" className="font-bold underline text-[#2f9bff]">
                {t('inscrire.order_sticker')}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </BrandShell>
  );
}

export default function InscrirePage() {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-2 border-[#16234e]/15 border-t-[#e6216e] rounded-full mx-auto mb-4" />
            <p className="text-lg text-[#16234e]/60">{t('common.loading')}</p>
          </div>
        </main>
      }
    >
      <InscrireContent />
    </Suspense>
  );
}
