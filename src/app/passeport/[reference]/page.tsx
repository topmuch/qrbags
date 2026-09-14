'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Download,
  Share2,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Check,
  Luggage,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// ─── Brand constants — Refonte « bleu foncé + beige or » ───
const NAVY = '#16234e';      // bleu foncé — en-tête de la carte, boutons, textes forts
const BEIGE = '#f3ecdc';     // beige or clair — fond de page + pastilles de perforation
const GOLD = '#b8975a';      // or — bande basse de la carte, badge protégé
const GOLD_SOFT = '#e9dcc0'; // beige or — encart récompense

// Couleurs hex inline sur la carte (compatibilité export PNG via html-to-image)
const WHITE = '#ffffff';
const RED = '#c0392b';
const GRAY = '#6b7280';

// ─── Types (mêmes formes que /api/suivi/[reference]) ───
interface PassportBaggage {
  reference: string;
  travelerName: string;
  baggageType: string;
  status: string;
  transportMode: string;
  airlineName: string | null;
  flightNumber: string | null;
  destination: string | null;
  departureDate: string | null;
  departureTime: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  photoUrl: string | null;
  reward: string | null;
}

interface SuiviResponse {
  status: string; // active | lost | expired | not_found | pending_activation | blocked
  message?: string;
  baggage?: PassportBaggage;
}

function PassportContent() {
  const params = useParams();
  const reference = ((params?.reference as string) || '').toUpperCase();
  const { t, lang, dir } = useTranslation();

  const [data, setData] = useState<SuiviResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [passportUrl, setPassportUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHomeHint, setShowHomeHint] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const cardRef = useRef<HTMLDivElement>(null);

  // URL du document + détection plateforme (client uniquement)
  useEffect(() => {
    setPassportUrl(`${window.location.origin}/passeport/${reference}`);
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) setPlatform('ios');
    else if (/Android/i.test(ua)) setPlatform('android');
  }, [reference]);

  // Chargement des données du bagage (même API que /suivi — réservé propriétaire)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/suivi/${reference}`);
        const json: SuiviResponse = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData({ status: 'not_found' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const locale = lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar' : 'fr-FR';
  const formatDate = (iso: string | null) => {
    if (!iso) return t('passport.not_specified');
    try {
      return new Date(iso).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return t('passport.not_specified');
    }
  };

  // ⬇️ Export PNG de la carte (html-to-image, ratio 3 pour une image nette)
  const handleSavePng = async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const { toPng } = await import('html-to-image');
      // NB : pas d'option backgroundColor ici — html-to-image l'applique au clone racine
      // et écraserait le fond blanc de la carte (comportement applyStyle).
      // La carte est auto-portante : navy + blanc + or, coins arrondis transparents.
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `passeport-qrbags-${reference}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('PNG export error:', e);
    } finally {
      setSaving(false);
    }
  };

  // 📤 Partage (Web Share API + fallback presse-papiers)
  const handleShare = async () => {
    if (!passportUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('passport.title'),
          text: t('passport.share_text'),
          url: passportUrl,
        });
      } catch {
        // Annulation utilisateur — silencieux
      }
    } else {
      try {
        await navigator.clipboard.writeText(passportUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        console.error('Clipboard error');
      }
    }
  };

  // ─── États de statut pour le badge de la carte ───
  const apiStatus = data?.status; // active | lost | expired
  const badge =
    apiStatus === 'lost'
      ? { label: t('passport.status_lost'), bg: RED, fg: WHITE }
      : apiStatus === 'expired'
        ? { label: t('passport.status_expired'), bg: GRAY, fg: WHITE }
        : { label: `🛡️ ${t('passport.status_protected')}`, bg: GOLD, fg: NAVY };

  return (
    <main
      className="min-h-[100dvh] min-h-screen flex flex-col"
      style={{ backgroundColor: BEIGE }}
      dir={dir}
    >
      {/* ═══ En-tête — bleu nuit, écriture blanche ═══ */}
      <div
        className="px-4 sm:px-5 md:px-8 pt-[env(safe-area-inset-top,0px)] pb-10 rounded-b-[2rem] shadow-lg"
        style={{ backgroundColor: NAVY }}
      >
        <header className="flex items-center justify-between py-2 sm:py-3">
          <Link
            href={data?.baggage ? `/suivi/${reference}` : '/'}
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm md:text-base font-medium">{t('passport.back')}</span>
          </Link>
          <img src="/logo.png" alt="QRBag" className="h-14 w-auto object-contain" />
          <span className="w-16" aria-hidden="true" />
        </header>

        <div className="mt-3 sm:mt-5 text-center max-w-md mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            🛂 {t('passport.title')}
          </h1>
          <p className="mt-2 text-white/90 text-sm md:text-base">{t('passport.subtitle')}</p>
        </div>
      </div>

      {/* ═══ Contenu ═══ */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-4 sm:px-5 -mt-6 pb-10">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-[#16234e]/20 border-t-[#16234e] rounded-full animate-spin" />
          </div>
        )}

        {/* ─── Erreurs : introuvable / non activé / bloqué ─── */}
        {!loading && data && !data.baggage && (
          <div className="bg-white rounded-2xl p-6 shadow-xl text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: RED }} />
            <h2 className="text-lg font-bold mb-1" style={{ color: NAVY }}>
              {data.status === 'pending_activation' ? t('passport.title') : t('passport.not_found')}
            </h2>
            <p className="text-sm mb-5" style={{ color: NAVY, opacity: 0.7 }}>
              {data.status === 'pending_activation'
                ? t('passport.pending')
                : t('passport.not_found_hint')}
            </p>
            <Link
              href={data.status === 'pending_activation' ? `/suivi/${reference}` : '/'}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold min-h-[48px] text-white"
              style={{ backgroundColor: NAVY }}
            >
              {data.status === 'pending_activation'
                ? t('passport.open_tracking')
                : t('passport.go_home')}
            </Link>
          </div>
        )}

        {/* ─── CARTE PASSEPORT (style carte d'embarquement) ─── */}
        {!loading && data?.baggage && (
          <>
            <div
              ref={cardRef}
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: WHITE }}
            >
              {/* ─── Bandeau haut NAVY ─── */}
              <div className="px-5 pt-5 pb-4" style={{ backgroundColor: NAVY }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src="/logo.png"
                      alt="QRBag"
                      className="h-8 w-auto object-contain rounded bg-white p-0.5"
                    />
                    <div>
                      <p className="text-sm font-extrabold tracking-wide text-white uppercase">
                        {t('passport.title')}
                      </p>
                      <p className="text-[10px] text-white/70">{t('passport.subtitle')}</p>
                    </div>
                  </div>
                  <Luggage className="w-6 h-6 text-white/80" />
                </div>
                <p
                  className="mt-3 inline-block px-3 py-1 rounded-full font-mono font-bold text-sm tracking-widest"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: WHITE }}
                >
                  {data.baggage.reference}
                </p>
              </div>

              {/* ─── Perforation (billetterie) ─── */}
              <div className="relative" style={{ borderTop: '2px dashed rgba(22,35,78,0.30)' }}>
                <span
                  className="absolute -left-3 -top-3 w-6 h-6 rounded-full"
                  style={{ backgroundColor: BEIGE }}
                  aria-hidden="true"
                />
                <span
                  className="absolute -right-3 -top-3 w-6 h-6 rounded-full"
                  style={{ backgroundColor: BEIGE }}
                  aria-hidden="true"
                />
              </div>

              {/* ─── Corps blanc : infos voyage ─── */}
              <div className="px-5 py-4">
                {/* Voyageur + statut */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-[10px] uppercase tracking-widest font-bold"
                      style={{ color: 'rgba(22,35,78,0.60)' }}
                    >
                      {t('passport.traveler')}
                    </p>
                    <p className="text-lg font-extrabold truncate" style={{ color: NAVY }}>
                      {data.baggage.travelerName || t('passport.not_specified')}
                    </p>
                  </div>
                  <span
                    className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide flex items-center gap-1"
                    style={{ backgroundColor: badge.bg, color: badge.fg }}
                  >
                    {apiStatus === 'active' && (
                      <ShieldCheck className="w-3.5 h-3.5" style={{ color: badge.fg }} />
                    )}
                    {badge.label}
                  </span>
                </div>

                {/* Grille infos vol */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="min-w-0">
                    <p
                      className="text-[10px] uppercase tracking-widest font-bold"
                      style={{ color: 'rgba(22,35,78,0.60)' }}
                    >
                      📍 {t('passport.destination')}
                    </p>
                    <p className="text-sm font-bold truncate" style={{ color: NAVY }}>
                      {data.baggage.destination || t('passport.not_specified')}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[10px] uppercase tracking-widest font-bold"
                      style={{ color: 'rgba(22,35,78,0.60)' }}
                    >
                      ✈️ {t('passport.airline')}
                    </p>
                    <p className="text-sm font-bold truncate" style={{ color: NAVY }}>
                      {data.baggage.airlineName || t('passport.not_specified')}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[10px] uppercase tracking-widest font-bold"
                      style={{ color: 'rgba(22,35,78,0.60)' }}
                    >
                      🎫 {t('passport.flight_number')}
                    </p>
                    <p className="text-sm font-bold font-mono truncate" style={{ color: NAVY }}>
                      {data.baggage.flightNumber || t('passport.not_specified')}
                    </p>
                  </div>
                </div>

                {/* Départ + validité */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-widest font-bold"
                      style={{ color: 'rgba(22,35,78,0.60)' }}
                    >
                      📅 {t('passport.departure')}
                    </p>
                    <p className="text-sm font-bold" style={{ color: NAVY }}>
                      {formatDate(data.baggage.departureDate)}
                      {data.baggage.departureTime ? ` · ${data.baggage.departureTime}` : ''}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-widest font-bold"
                      style={{ color: 'rgba(22,35,78,0.60)' }}
                    >
                      ⏳ {t('passport.valid_until')}
                    </p>
                    <p className="text-sm font-bold" style={{ color: NAVY }}>
                      {data.baggage.expiresAt
                        ? formatDate(data.baggage.expiresAt)
                        : t('passport.not_specified')}
                    </p>
                  </div>
                </div>

                {/* Photo + récompense (si renseignés) */}
                {(data.baggage.photoUrl || data.baggage.reward) && (
                  <div className="flex items-center gap-3 mt-4">
                    {data.baggage.photoUrl && (
                      <img
                        src={data.baggage.photoUrl}
                        alt={t('passport.photo_alt')}
                        className="w-16 h-16 object-cover rounded-lg border-2 flex-shrink-0"
                        style={{ borderColor: NAVY }}
                      />
                    )}
                    {data.baggage.reward && (
                      <div
                        className="flex-1 px-3 py-2 rounded-lg border-2 border-dashed"
                        style={{ borderColor: NAVY, backgroundColor: GOLD_SOFT }}
                      >
                        <p
                          className="text-[10px] font-bold uppercase tracking-wide"
                          style={{ color: NAVY }}
                        >
                          🎁 {t('passport.reward_promised')}
                        </p>
                        <p className="text-sm font-extrabold" style={{ color: NAVY }}>
                          {data.baggage.reward}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ─── Perforation 2 ─── */}
              <div className="relative" style={{ borderTop: '2px dashed rgba(22,35,78,0.30)' }}>
                <span
                  className="absolute -left-3 -top-3 w-6 h-6 rounded-full"
                  style={{ backgroundColor: BEIGE }}
                  aria-hidden="true"
                />
                <span
                  className="absolute -right-3 -top-3 w-6 h-6 rounded-full"
                  style={{ backgroundColor: BEIGE }}
                  aria-hidden="true"
                />
              </div>

              {/* ─── Bande basse OR : QR de vérification ─── */}
              <div className="px-5 py-4 flex items-center gap-4" style={{ backgroundColor: GOLD }}>
                <div className="bg-white rounded-lg p-1.5 flex-shrink-0">
                  {passportUrl && (
                    <QRCodeSVG
                      value={passportUrl}
                      size={72}
                      level="M"
                      marginSize={0}
                      bgColor={WHITE}
                      fgColor={NAVY}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold" style={{ color: NAVY }}>
                    {t('passport.verify_hint')}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: 'rgba(22,35,78,0.75)' }}>
                    {t('passport.personal_doc')}
                  </p>
                  <p className="text-[10px]" style={{ color: 'rgba(22,35,78,0.75)' }}>
                    {t('passport.issued_on')} {formatDate(data.baggage.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* ═══ Actions sous la carte ═══ */}
            <div className="flex flex-col gap-2.5 mt-5">
              <button
                onClick={handleSavePng}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold min-h-[52px] border-2 text-white disabled:opacity-60 transition-colors"
                style={{ backgroundColor: NAVY, borderColor: NAVY }}
              >
                <Download className="w-5 h-5" />
                {saving ? t('passport.saving_png') : t('passport.save_png')}
              </button>

              <div className="flex gap-2.5">
                <button
                  onClick={handleShare}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold min-h-[48px] border-2 bg-white transition-colors"
                  style={{ color: NAVY, borderColor: NAVY }}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" /> {t('passport.copied')}
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" /> {t('passport.share')}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowHomeHint(!showHomeHint)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold min-h-[48px] border-2 bg-white transition-colors"
                  style={{ color: NAVY, borderColor: NAVY }}
                >
                  <Smartphone className="w-4 h-4" /> {t('passport.add_home')}
                </button>
              </div>

              {showHomeHint && (
                <div
                  className="bg-white rounded-xl px-4 py-3 text-xs leading-relaxed border-2 border-dashed"
                  style={{ borderColor: NAVY, color: NAVY }}
                >
                  {platform === 'ios'
                    ? t('passport.add_home_ios')
                    : platform === 'android'
                      ? t('passport.add_home_android')
                      : `${t('passport.add_home_ios')} ${t('passport.add_home_android')}`}
                </div>
              )}

              <Link
                href={`/suivi/${reference}`}
                className="text-center text-sm font-semibold underline mt-1"
                style={{ color: NAVY }}
              >
                {t('passport.open_tracking')} →
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function PasseportPage() {
  return <PassportContent />;
}
