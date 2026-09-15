'use client';

/**
 * QRBag — Checklist d'inventaire ONBOARDING (refonte ludique)
 *
 * Parcours en 3 étapes guidées + écran de succès « wahoo » :
 *   1. Qui voyage ?        — identité + voyage (form)
 *   2. Composez la valise  — sélection d'articles par catégories (tap ludique)
 *   3. Personnalisez       — quantités / couleurs / marques + photo (optionnel)
 *   ✓ Attestation générée  — confettis, code, clé, téléchargement PDF
 *
 * Palette signature QRBag (navy/azure/orange/magenta/violet) via BrandShell.
 * API inchangée : POST /api/checklist + /api/checklist/upload-photo.
 */

import { useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/hooks/use-toast';
import {
  DEFAULT_CHECKLIST_CATEGORIES,
  ITEM_COLORS,
  ITEM_BRANDS,
  getItemImageUrl,
  type ChecklistItem,
} from '@/lib/checklist-catalog';
import {
  Plane,
  Calendar,
  Globe,
  User,
  Mail,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Lock,
  ExternalLink,
  Sparkles,
  Camera,
  Tag,
  FileText,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  X,
  Check,
  Luggage,
  SlidersHorizontal,
  Download,
  PartyPopper,
  QrCode,
  ShoppingBag,
} from 'lucide-react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import {
  BrandShell,
  BrandCard,
  brandInput,
  brandLabel,
  brandBtnGradient,
  brandBtnOutline,
} from '@/components/brand/BrandShell';

/* ─── Palette QRBag ─── */
const NAVY = '#16234e';
const AZURE = '#2f9bff';
const ORANGE = '#f8921f';
const RED = '#ef4036';
const MAGENTA = '#e6216e';
const VIOLET = '#8b17c9';
const YELLOW = '#ffd200';

/* Couleur signature par catégorie (cycle de la palette QRBag) */
const CATEGORY_COLORS: Record<string, { main: string; darkText: boolean }> = {
  women: { main: MAGENTA, darkText: false },
  men: { main: AZURE, darkText: false },
  children: { main: ORANGE, darkText: false },
  electronics: { main: VIOLET, darkText: false },
  shoes: { main: RED, darkText: false },
  toiletries: { main: AZURE, darkText: false },
  health: { main: VIOLET, darkText: false },
  accessories: { main: NAVY, darkText: false },
  misc: { main: YELLOW, darkText: true },
};

const catColor = (id: string) => CATEGORY_COLORS[id] ?? { main: NAVY, darkText: false };

/* ─── ConfettiBurst — pluie de confettis signature (palette QRBag, zéro dépendance) ───
   Valeurs pseudo-aléatoires déterministes (seed par index) : rendu identique
   serveur/client, donc aucune erreur d'hydratation. */
const CONFETTI_COLORS = [ORANGE, MAGENTA, VIOLET, AZURE, YELLOW];

function seededRand(seed: number): number {
  const x = Math.sin(seed * 999.7 + 12.3) * 10000;
  return x - Math.floor(x);
}

function ConfettiBurst({ count = 28 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: seededRand(i + 1) * 100,
    delay: seededRand(i + 31) * 1.6,
    duration: 3 + seededRand(i + 61) * 2.6,
    size: 5 + seededRand(i + 91) * 6,
    drift: (seededRand(i + 121) - 0.5) * 70,
    spin: 180 + seededRand(i + 151) * 540,
    fall: 280 + seededRand(i + 181) * 180,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    round: seededRand(i + 211) > 0.5,
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute block top-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            backgroundColor: p.color,
            borderRadius: p.round ? '9999px' : '2px',
          }}
          initial={{ y: -24, x: 0, opacity: 0, rotate: 0 }}
          animate={{ y: p.fall, x: p.drift, opacity: [0, 1, 1, 0], rotate: p.spin }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: 1.8,
            ease: 'easeIn',
            opacity: { times: [0, 0.08, 0.75, 1] },
          }}
        />
      ))}
    </div>
  );
}

/* ─── Nav header — mêmes liens que l'accueil ─── */
const NAV_LINKS = [
  { label: 'Accueil', href: '/' },
  { label: 'Checklist', href: '/checklist' },
  { label: 'À propos', href: '/#comment' },
  { label: 'Tarifs', href: '/#tarifs' },
  { label: 'Contactez-nous', href: '/contact' },
];

interface SelectedItem {
  category: string;
  name: string;
  qty: number;
  color?: string;
  brand?: string;
}

/* ─── Étapes du wizard ─── */
const STEPS = [
  { id: 1, icon: User, labelKey: 'checklist.step_passenger' },
  { id: 2, icon: Luggage, labelKey: 'checklist.step_items' },
  { id: 3, icon: SlidersHorizontal, labelKey: 'checklist.step_selection' },
] as const;

export default function ChecklistPage() {
  return (
    <Suspense fallback={<ChecklistFallback />}>
      <ChecklistPageContent />
    </Suspense>
  );
}

function ChecklistFallback() {
  return (
    <main className="min-h-screen flex flex-col bg-white" dir="ltr">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#16234e]/10 border-t-[#e6216e] rounded-full animate-spin" />
          <p className="mt-4 text-[#16234e]/60 text-sm">Chargement…</p>
        </div>
      </div>
    </main>
  );
}

function ChecklistPageContent() {
  const { t, lang, setLang, dir } = useTranslation();
  const searchParams = useSearchParams();
  const refParam = searchParams.get('ref');
  const sourceParam = searchParams.get('source');

  // ─── Wizard state ───
  const [step, setStep] = useState(1);

  // ─── Form state ───
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({});
  const [activeCategory, setActiveCategory] = useState<string>(DEFAULT_CHECKLIST_CATEGORIES[0].id);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    code: string;
    publicUrl: string;
    verificationKey: string;
    emailSent: boolean;
  } | null>(null);

  const selectedList = useMemo(() => Object.values(selectedItems), [selectedItems]);
  const selectedCount = selectedList.length;

  /* ─── Toggle / qty / color / brand ─── */
  const toggleItem = useCallback((category: string, name: string) => {
    const key = `${category}__${name}`;
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = { category, name, qty: 1 };
      }
      return next;
    });
  }, []);

  const changeQty = useCallback((category: string, name: string, delta: number) => {
    const key = `${category}__${name}`;
    setSelectedItems((prev) => {
      const item = prev[key];
      if (!item) return prev;
      const newQty = Math.max(1, Math.min(99, item.qty + delta));
      return { ...prev, [key]: { ...item, qty: newQty } };
    });
  }, []);

  const changeColor = useCallback((category: string, name: string, color: string) => {
    const key = `${category}__${name}`;
    setSelectedItems((prev) => {
      const item = prev[key];
      if (!item) return prev;
      return { ...prev, [key]: { ...item, color } };
    });
  }, []);

  const changeBrand = useCallback((category: string, name: string, brand: string) => {
    const key = `${category}__${name}`;
    setSelectedItems((prev) => {
      const item = prev[key];
      if (!item) return prev;
      return { ...prev, [key]: { ...item, brand } };
    });
  }, []);

  const toggleCategoryAll = useCallback((categoryId: string) => {
    const cat = DEFAULT_CHECKLIST_CATEGORIES.find((c) => c.id === categoryId);
    if (!cat) return;
    const allSelected = cat.items.every((name) => selectedItems[`${categoryId}__${name}`]);
    setSelectedItems((prev) => {
      const next = { ...prev };
      for (const name of cat.items) {
        const key = `${categoryId}__${name}`;
        if (allSelected) {
          delete next[key];
        } else {
          next[key] = { category: categoryId, name, qty: 1 };
        }
      }
      return next;
    });
  }, [selectedItems]);

  /* ─── Navigation inter-étapes ─── */
  const goNext = useCallback(() => {
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !departureDate || !destinationCountry.trim()) {
        toast({ title: t('checklist.need_fields'), variant: 'destructive' });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast({ title: t('checklist.need_fields'), variant: 'destructive' });
        return;
      }
    }
    if (step === 2 && selectedCount === 0) {
      toast({ title: t('checklist.need_items'), variant: 'destructive' });
      return;
    }
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, firstName, lastName, email, departureDate, destinationCountry, selectedCount, t]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /* ─── Submit final (étape 3) ─── */
  const handleSubmit = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !departureDate || !destinationCountry.trim()) {
      toast({ title: t('checklist.need_fields'), variant: 'destructive' });
      setStep(1);
      return;
    }
    if (selectedCount === 0) {
      toast({ title: t('checklist.need_items'), variant: 'destructive' });
      setStep(2);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: t('checklist.need_fields'), variant: 'destructive' });
      setStep(1);
      return;
    }

    setSubmitting(true);

    // Upload photo d'abord (optionnel)
    let photoPath: string | null = null;
    let photoSizeBytes = 0;
    if (photoFile) {
      setPhotoUploading(true);
      try {
        const photoForm = new FormData();
        photoForm.append('file', photoFile);
        const photoRes = await fetch('/api/checklist/upload-photo', {
          method: 'POST',
          body: photoForm,
        });
        const photoData = await photoRes.json();
        if (photoRes.ok && photoData.success) {
          photoPath = photoData.photoPath;
          photoSizeBytes = photoData.photoSizeBytes;
        } else {
          toast({ title: photoData.error || 'Erreur upload photo', variant: 'destructive' });
          setPhotoUploading(false);
          setSubmitting(false);
          return;
        }
      } catch {
        toast({ title: 'Erreur lors du téléchargement de la photo', variant: 'destructive' });
        setPhotoUploading(false);
        setSubmitting(false);
        return;
      }
      setPhotoUploading(false);
    }

    try {
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          departureDate,
          destinationCountry: destinationCountry.trim(),
          airline: airline.trim() || null,
          flightNumber: flightNumber.trim() || null,
          items: selectedList.map((it) => ({ ...it, checked: true } as ChecklistItem)),
          photoPath,
          photoSizeBytes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('checklist.error'));
      }
      setSuccess({
        code: data.code,
        publicUrl: data.publicUrl,
        verificationKey: data.verificationKey,
        emailSent: data.emailSent !== false,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('checklist.error');
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [firstName, lastName, email, departureDate, destinationCountry, airline, flightNumber, selectedList, selectedCount, photoFile, t]);

  /* ═══════════════ ÉCRAN SUCCÈS WAHOO ═══════════════ */
  if (success) {
    return (
      <BrandShell>
        <main className="flex flex-col min-h-screen" dir={dir}>
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-[#16234e]/10 px-4 py-2.5">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
              <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                <img src="/logo.png" alt="QRBag" className="h-11 w-auto object-contain" />
              </Link>
              <LanguageSelector lang={lang} setLang={setLang} variant="blue" />
            </div>
          </header>

          <section className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
            {/* Hero célébration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 16 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl shadow-[#e6216e]/20 mb-6"
            >
              <div className="relative bg-gradient-qrbag px-5 pt-8 pb-7 text-center">
                <ConfettiBurst count={34} />
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }}
                  className="mx-auto mb-4 w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl"
                >
                  <PartyPopper className="w-10 h-10 text-[#e6216e]" strokeWidth={2.2} />
                </motion.div>
                <h1 className="relative text-2xl md:text-3xl font-black text-white mb-1.5">
                  {t('checklist.success_title')}
                </h1>
                <p className="relative text-white/90 text-sm md:text-base">
                  {t('checklist.success_desc')}
                </p>
              </div>
              {/* Liseré arc-en-ciel bas */}
              <div className="h-2 flex" aria-hidden>
                <div className="flex-1 bg-[#ffd200]" />
                <div className="flex-1 bg-[#f8921f]" />
                <div className="flex-1 bg-[#ef4036]" />
                <div className="flex-1 bg-[#e6216e]" />
                <div className="flex-1 bg-[#8b17c9]" />
              </div>
            </motion.div>

            {/* Code + clé */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3 mb-6"
            >
              <div className="bg-white border-2 border-[#2f9bff]/25 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#16234e]/50 mb-0.5">
                    {t('checklist.success_code')}
                  </div>
                  <div className="font-mono font-black text-xl text-[#16234e]">{success.code}</div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(success.code);
                    toast({ title: 'Code copié ✓' });
                  }}
                  className="px-3 py-2 rounded-xl bg-[#2f9bff]/10 text-[#2f9bff] text-xs font-bold hover:bg-[#2f9bff]/20 transition-colors min-h-[44px]"
                >
                  Copier
                </button>
              </div>

              <div className="bg-white border-2 border-[#e6216e]/25 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#e6216e]/70 mb-0.5 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {t('checklist.success_key')}
                  </div>
                  <div className="font-mono font-black text-xl text-[#e6216e] tracking-widest">{success.verificationKey}</div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(success.verificationKey);
                    toast({ title: 'Clé copiée ✓' });
                  }}
                  className="px-3 py-2 rounded-xl bg-[#e6216e]/10 text-[#e6216e] text-xs font-bold hover:bg-[#e6216e]/20 transition-colors min-h-[44px]"
                >
                  Copier
                </button>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2.5"
            >
              <a
                href={`/api/checklist/${success.code}/pdf?key=${encodeURIComponent(success.verificationKey)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${brandBtnGradient} w-full py-4 px-4 flex items-center justify-center gap-2 text-base min-h-[56px]`}
              >
                <Download className="w-5 h-5" />
                {t('checklist.success_download')}
              </a>
              <Link
                href={`/checklist/${success.code}`}
                className="w-full py-3.5 px-4 bg-[#16234e] hover:bg-[#0f1838] text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors min-h-[52px] shadow-lg shadow-[#16234e]/20"
              >
                <ExternalLink className="w-4 h-4" />
                {t('checklist.view_public_page')}
              </Link>
              <button
                onClick={() => {
                  setSuccess(null);
                  setStep(1);
                  setFirstName('');
                  setLastName('');
                  setEmail('');
                  setDepartureDate('');
                  setDestinationCountry('');
                  setAirline('');
                  setFlightNumber('');
                  setSelectedItems({});
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
                className={`${brandBtnOutline} w-full py-3.5 px-4 min-h-[52px]`}
              >
                {t('checklist.create_another')}
              </button>
            </motion.div>

            {/* 🔔 UPSELL post-checklist : l'attestation protège l'inventaire,
                le QR actif rend la valise retrouvable — monétisation naturelle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16234e] via-[#1d3168] to-[#0f1838] p-5 text-white"
            >
              <div className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full bg-[#f8921f]/20 blur-2xl" aria-hidden />
              <div className="pointer-events-none absolute -bottom-12 -left-8 w-28 h-28 rounded-full bg-[#e6216e]/15 blur-2xl" aria-hidden />
              <div className="relative flex items-start gap-3">
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-[#f8921f]/20 border border-[#f8921f]/40 flex items-center justify-center" aria-hidden>
                  <QrCode className="w-6 h-6 text-[#fbbf24]" />
                </div>
                <div>
                  <h3 className="font-black text-base leading-snug">{t('checklist.upsell_title')}</h3>
                  <p className="text-white/70 text-sm mt-1 leading-relaxed">{t('checklist.upsell_desc')}</p>
                </div>
              </div>
              <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                <Link
                  href="/inscrire"
                  className="py-3 px-4 bg-[#f8921f] hover:bg-[#e0820f] text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors min-h-[48px] text-sm shadow-lg shadow-[#f8921f]/25"
                >
                  <QrCode className="w-4 h-4" />
                  {t('checklist.upsell_cta_activate')}
                </Link>
                <Link
                  href="/commander"
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/25 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors min-h-[48px] text-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {t('checklist.upsell_cta_order')}
                </Link>
              </div>
            </motion.div>

            {!success.emailSent && (
              <p className="text-xs text-[#b45309] text-center mt-4 bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3">
                ⚠️ L&apos;email n&apos;a pas pu être envoyé automatiquement. Notez votre clé de vérification et téléchargez le PDF ci-dessus.
              </p>
            )}
          </section>

          <footer className="bg-[#16234e] text-white/70 text-center py-4 mt-auto">
            <p className="text-xs">QRBag — Protection intelligente des bagages • qrbags.com</p>
          </footer>
        </main>
      </BrandShell>
    );
  }

  /* ═══════════════ WIZARD (étapes 1→3) ═══════════════ */
  const activeCat = DEFAULT_CHECKLIST_CATEGORIES.find((c) => c.id === activeCategory) || DEFAULT_CHECKLIST_CATEGORIES[0];
  const allCatSelected = activeCat.items.every((name) => selectedItems[`${activeCat.id}__${name}`]);
  const activeColor = catColor(activeCat.id);

  // Localized label helper
  const catLabel = (cat: typeof activeCat) => cat.label[lang as keyof typeof cat.label] || cat.label.fr;

  const stepTitles = ['', t('checklist.step1_title'), t('checklist.step2_title'), t('checklist.step3_title')];
  const stepHints = ['', t('checklist.step1_hint'), t('checklist.step2_hint'), t('checklist.step3_hint')];

  return (
    <BrandShell>
      <main className="flex flex-col min-h-screen" dir={dir}>
        {/* ─── Header ─── */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-[#16234e]/10 px-4 py-2.5">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <img src="/logo.png" alt="QRBag" className="h-11 w-auto object-contain" />
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="px-3 py-2 text-[13px] font-medium text-[#16234e]/70 hover:text-[#16234e] transition-colors rounded-lg hover:bg-[#16234e]/5">
                  {link.label}
                </a>
              ))}
            </div>
            <LanguageSelector lang={lang} setLang={setLang} variant="blue" />
          </div>
        </header>

        <section className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
          {/* ─── Hero compact ─── */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-qrbag text-white text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-3 shadow-md shadow-[#e6216e]/25">
              <Sparkles className="w-3.5 h-3.5" />
              {refParam && sourceParam === 'tracking_page' ? 'Checklist gratuite' : 'Service gratuit QRBag'}
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-[#16234e] mb-2">
              {t('checklist.title')}
            </h1>
            <p className="text-[#16234e]/60 text-sm md:text-base max-w-xl mx-auto">{t('checklist.subtitle')}</p>
          </div>

          {/* ─── Stepper animé ─── */}
          <nav aria-label="Progression" className="max-w-2xl mx-auto mb-6">
            <div className="flex items-center">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isDone = step > s.id || !!success;
                const isActive = step === s.id;
                const color = [AZURE, ORANGE, MAGENTA][i];
                return (
                  <div key={s.id} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                    <div className="flex flex-col items-center gap-1">
                      <motion.div
                        animate={{
                          scale: isActive ? 1.12 : 1,
                          backgroundColor: isDone || isActive ? color : '#ffffff',
                          borderColor: isDone || isActive ? color : `${NAVY}26`,
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className={`w-11 h-11 rounded-full border-2 flex items-center justify-center shadow-md ${
                          isDone || isActive ? 'shadow-lg' : 'shadow-sm'
                        }`}
                        style={{ boxShadow: isActive ? `0 8px 20px -6px ${color}66` : undefined }}
                      >
                        {isDone ? (
                          <Check className="w-5 h-5 text-white" strokeWidth={3} />
                        ) : (
                          <Icon className="w-5 h-5" style={{ color: isActive ? '#fff' : `${NAVY}59` }} strokeWidth={2.4} />
                        )}
                      </motion.div>
                      <span
                        className={`hidden sm:block text-[10px] font-bold uppercase tracking-wide ${
                          isActive ? 'text-[#16234e]' : 'text-[#16234e]/40'
                        }`}
                      >
                        {t(s.labelKey)}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="relative flex-1 h-1 mx-2 mb-0 sm:mb-6 rounded-full bg-[#16234e]/10 overflow-hidden">
                        <motion.div
                          className="absolute inset-0 rounded-full origin-left"
                          style={{ backgroundColor: [AZURE, ORANGE][i] }}
                          initial={false}
                          animate={{ scaleX: step > s.id ? 1 : 0 }}
                          transition={{ duration: 0.45, ease: 'easeInOut' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Progression textuelle */}
            <p className="text-center text-xs font-bold text-[#16234e]/50 mt-3 sm:mt-1">
              {t('checklist.wizard_step', { current: String(step), total: '3' })}
            </p>
          </nav>

          {/* ─── Contenu de l'étape (transition animée) ─── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: dir === 'rtl' ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir === 'rtl' ? 40 : -40 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {/* Titre de l'étape */}
              <div className="text-center mb-5">
                <h2 className="text-xl md:text-2xl font-black text-[#16234e]">{stepTitles[step]}</h2>
                <p className="text-[#16234e]/55 text-sm mt-1">{stepHints[step]}</p>
              </div>

              {/* ═══ ÉTAPE 1 — Qui voyage ? ═══ */}
              {step === 1 && (
                <BrandCard className="p-5 md:p-7" corners>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={brandLabel}>
                        <User className="w-3 h-3 inline mr-1 -mt-0.5" /> {t('checklist.first_name')} *
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={brandInput}
                        placeholder="Aïssatou"
                        autoComplete="given-name"
                      />
                    </div>
                    <div>
                      <label className={brandLabel}>
                        <User className="w-3 h-3 inline mr-1 -mt-0.5" /> {t('checklist.last_name')} *
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={brandInput}
                        placeholder="Diallo"
                        autoComplete="family-name"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={brandLabel}>
                        <Mail className="w-3 h-3 inline mr-1 -mt-0.5" /> {t('checklist.email')} *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={brandInput}
                        placeholder="aissatou@email.com"
                        autoComplete="email"
                        inputMode="email"
                      />
                      <p className="text-[11px] text-[#16234e]/45 mt-1.5 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {t('checklist.email_hint')}
                      </p>
                    </div>
                    <div>
                      <label className={brandLabel}>
                        <Calendar className="w-3 h-3 inline mr-1 -mt-0.5" /> {t('checklist.departure_date')} *
                      </label>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className={brandInput}
                      />
                    </div>
                    <div>
                      <label className={brandLabel}>
                        <Globe className="w-3 h-3 inline mr-1 -mt-0.5" /> {t('checklist.destination_country')} *
                      </label>
                      <input
                        type="text"
                        value={destinationCountry}
                        onChange={(e) => setDestinationCountry(e.target.value)}
                        className={brandInput}
                        placeholder="Ex: Paris, Tokyo..."
                      />
                    </div>
                    <div>
                      <label className={brandLabel}>
                        <Plane className="w-3 h-3 inline mr-1 -mt-0.5" /> {t('checklist.airline')}
                      </label>
                      <input
                        type="text"
                        value={airline}
                        onChange={(e) => setAirline(e.target.value)}
                        className={brandInput}
                        placeholder={t('checklist.airline_placeholder')}
                      />
                    </div>
                    <div>
                      <label className={brandLabel}>
                        <Plane className="w-3 h-3 inline mr-1 -mt-0.5" /> {t('checklist.flight_number')}
                      </label>
                      <input
                        type="text"
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                        className={`${brandInput} uppercase`}
                        placeholder="AF 0723"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#16234e]/45 mt-3 flex items-center gap-1">
                    <Plane className="w-3 h-3" /> {t('checklist.flight_hint')}
                  </p>
                </BrandCard>
              )}

              {/* ═══ ÉTAPE 2 — Composez la valise ═══ */}
              {step === 2 && (
                <div>
                  <BrandCard className="p-4 md:p-6">
                    {/* Chips catégories colorées */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
                      {DEFAULT_CHECKLIST_CATEGORIES.map((cat) => {
                        const isActive = cat.id === activeCategory;
                        const cc = catColor(cat.id);
                        const catSelectedCount = cat.items.filter((name) => selectedItems[`${cat.id}__${name}`]).length;
                        return (
                          <motion.button
                            key={cat.id}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setActiveCategory(cat.id)}
                            className="flex-shrink-0 px-3.5 py-2.5 rounded-2xl text-xs font-black border-2 transition-all min-h-[44px] flex items-center gap-1.5"
                            style={{
                              backgroundColor: isActive ? cc.main : '#ffffff',
                              borderColor: isActive ? cc.main : `${NAVY}1f`,
                              color: isActive ? (cc.darkText ? NAVY : '#ffffff') : `${NAVY}b3`,
                              boxShadow: isActive ? `0 6px 16px -6px ${cc.main}80` : 'none',
                            }}
                            aria-pressed={isActive}
                          >
                            <span>{cat.emoji}</span>
                            {catLabel(cat)}
                            {catSelectedCount > 0 && (
                              <span
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black"
                                style={{
                                  backgroundColor: isActive ? (cc.darkText ? `${NAVY}1a` : '#ffffff33') : cc.main,
                                  color: isActive ? (cc.darkText ? NAVY : '#fff') : (catColor(cat.id).darkText ? NAVY : '#fff'),
                                }}
                              >
                                {catSelectedCount}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Ligne : compteur + tout sélectionner */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <span
                        className="text-xs font-black px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: `${activeColor.main}1a`, color: activeColor.darkText ? NAVY : activeColor.main }}
                      >
                        {t('checklist.items_count', { count: String(selectedCount) })}
                      </span>
                      <button
                        onClick={() => toggleCategoryAll(activeCat.id)}
                        className="text-xs font-black underline underline-offset-2 min-h-[44px] px-2 flex items-center transition-colors"
                        style={{ color: activeColor.darkText ? NAVY : activeColor.main }}
                      >
                        {allCatSelected ? t('checklist.unselect_all') : t('checklist.select_all')}
                      </button>
                    </div>

                    {/* Grille d'articles (tap ludique) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {activeCat.items.map((name) => {
                        const key = `${activeCat.id}__${name}`;
                        const isSelected = !!selectedItems[key];
                        const imageUrl = getItemImageUrl(activeCat.id, name);
                        return (
                          <motion.button
                            key={key}
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ y: -2 }}
                            onClick={() => toggleItem(activeCat.id, name)}
                            className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-colors text-left bg-white"
                            style={{
                              borderColor: isSelected ? activeColor.main : `${NAVY}17`,
                              backgroundColor: isSelected ? `${activeColor.main}12` : '#ffffff',
                              boxShadow: isSelected ? `0 8px 18px -8px ${activeColor.main}80` : 'none',
                            }}
                            aria-pressed={isSelected}
                          >
                            {/* Badge check animé */}
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -90 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center z-10 shadow-md"
                                  style={{ backgroundColor: activeColor.main }}
                                >
                                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Image / Emoji tile */}
                            <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#16234e]/5 flex items-center justify-center relative">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={name}
                                  fill
                                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                  className={`object-contain p-2 transition-transform ${isSelected ? 'scale-110' : ''}`}
                                  unoptimized
                                />
                              ) : (
                                <span className="text-4xl">{activeCat.emoji}</span>
                              )}
                            </div>

                            {/* Nom */}
                            <div className="w-full text-center">
                              <div className="text-xs font-bold text-[#16234e] leading-tight line-clamp-2">{name}</div>
                              {isSelected && selectedItems[key].qty > 1 && (
                                <div
                                  className="mt-1 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[10px] font-black text-white"
                                  style={{ backgroundColor: activeColor.main }}
                                >
                                  ×{selectedItems[key].qty}
                                </div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </BrandCard>
                </div>
              )}

              {/* ═══ ÉTAPE 3 — Personnalisez ═══ */}
              {step === 3 && (
                <div className="space-y-4">
                  {/* Photo (optionnel) */}
                  <BrandCard className="p-4 md:p-6">
                    <h3 className="flex items-center gap-2 text-[#16234e] font-black text-sm mb-3">
                      <Camera className="w-4 h-4 text-[#f8921f]" />
                      {t('checklist.photo_upload_title')}
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#16234e]/40">({t('checklist.photo_upload_optional')})</span>
                    </h3>
                    {photoPreview ? (
                      <div className="relative inline-block">
                        <img src={photoPreview} alt="Aperçu photo" className="max-h-44 rounded-2xl border-2 border-[#16234e]/15 object-contain" />
                        <button
                          type="button"
                          onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                          className="absolute top-2 right-2 w-8 h-8 bg-[#ef4036] text-white rounded-full flex items-center justify-center hover:bg-[#d63025] transition-colors shadow-lg"
                          aria-label="Supprimer la photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="block cursor-pointer">
                        <div className="border-2 border-dashed border-[#16234e]/20 rounded-2xl py-6 px-4 text-center hover:border-[#f8921f] hover:bg-[#f8921f]/5 transition-colors">
                          <Camera className="w-9 h-9 text-[#16234e]/30 mx-auto mb-2" />
                          <p className="text-sm font-bold text-[#16234e]">{t('checklist.photo_upload_hint')}</p>
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setPhotoFile(file);
                            const reader = new FileReader();
                            reader.onload = () => setPhotoPreview(reader.result as string);
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    )}
                  </BrandCard>

                  {/* Liste de sélection avec qty/couleur/marque */}
                  <BrandCard className="p-4 md:p-6">
                    <h3 className="flex items-center gap-2 text-[#16234e] font-black text-sm mb-4">
                      <Tag className="w-4 h-4 text-[#e6216e]" />
                      {t('checklist.step_selection')} ({selectedCount})
                    </h3>

                    <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 checklist-scroll">
                      {DEFAULT_CHECKLIST_CATEGORIES.map((cat) => {
                        const catItems = selectedList.filter((it) => it.category === cat.id);
                        if (catItems.length === 0) return null;
                        const cc = catColor(cat.id);
                        return (
                          <div key={cat.id}>
                            <div
                              className="text-[10px] uppercase tracking-wider font-black mt-1 mb-1.5 px-2 py-1 rounded-lg inline-flex items-center gap-1"
                              style={{ backgroundColor: `${cc.main}14`, color: cc.darkText ? NAVY : cc.main }}
                            >
                              <span>{cat.emoji}</span>
                              <span>{catLabel(cat)}</span>
                            </div>
                            {catItems.map((it) => {
                              const key = `${it.category}__${it.name}`;
                              const imageUrl = getItemImageUrl(it.category, it.name);
                              return (
                                <div
                                  key={key}
                                  className="flex flex-wrap items-center gap-2 py-2 px-2.5 bg-white border border-[#16234e]/10 rounded-2xl mb-2 hover:border-[#2f9bff]/40 transition-colors"
                                >
                                  {/* Image */}
                                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#16234e]/5 border border-[#16234e]/10 flex items-center justify-center flex-shrink-0">
                                    {imageUrl ? (
                                      <Image
                                        src={imageUrl}
                                        alt={it.name}
                                        width={44}
                                        height={44}
                                        className="object-contain p-1"
                                        unoptimized
                                      />
                                    ) : (
                                      <span className="text-xl">{cat.emoji}</span>
                                    )}
                                  </div>

                                  {/* Nom */}
                                  <div className="flex-1 min-w-[110px]">
                                    <div className="text-sm font-bold text-[#16234e] truncate">{it.name}</div>
                                  </div>

                                  {/* Qté */}
                                  <div className="flex items-center gap-1 bg-white border-2 border-[#16234e]/12 rounded-xl">
                                    <button
                                      onClick={() => changeQty(it.category, it.name, -1)}
                                      className="w-8 h-8 flex items-center justify-center text-[#16234e]/70 hover:text-[#e6216e] hover:bg-[#e6216e]/10 rounded-l-lg transition-colors"
                                      aria-label="Diminuer la quantité"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-xs font-black w-6 text-center text-[#16234e]">{it.qty}</span>
                                    <button
                                      onClick={() => changeQty(it.category, it.name, 1)}
                                      className="w-8 h-8 flex items-center justify-center text-[#16234e]/70 hover:text-[#2f9bff] hover:bg-[#2f9bff]/10 rounded-r-lg transition-colors"
                                      aria-label="Augmenter la quantité"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Couleur */}
                                  <div className="relative">
                                    <select
                                      value={it.color || ''}
                                      onChange={(e) => changeColor(it.category, it.name, e.target.value)}
                                      className="appearance-none pl-2.5 pr-7 py-2 bg-white border-2 border-[#16234e]/12 rounded-xl text-xs font-bold text-[#16234e] focus:outline-none focus:ring-2 focus:ring-[#2f9bff]/30 focus:border-[#2f9bff] cursor-pointer min-h-[36px]"
                                      aria-label={t('checklist.item_color')}
                                    >
                                      <option value="">{t('checklist.item_color')}</option>
                                      {ITEM_COLORS.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                      ))}
                                    </select>
                                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-[#16234e]/40 pointer-events-none" />
                                  </div>

                                  {/* Marque */}
                                  <div className="relative">
                                    <select
                                      value={it.brand || ''}
                                      onChange={(e) => changeBrand(it.category, it.name, e.target.value)}
                                      className="appearance-none pl-2.5 pr-7 py-2 bg-white border-2 border-[#16234e]/12 rounded-xl text-xs font-bold text-[#16234e] focus:outline-none focus:ring-2 focus:ring-[#2f9bff]/30 focus:border-[#2f9bff] cursor-pointer min-h-[36px]"
                                      aria-label={t('checklist.item_brand')}
                                    >
                                      <option value="">{t('checklist.item_brand')}</option>
                                      {ITEM_BRANDS.map((b) => (
                                        <option key={b} value={b}>{b}</option>
                                      ))}
                                    </select>
                                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-[#16234e]/40 pointer-events-none" />
                                  </div>

                                  {/* Retirer */}
                                  <button
                                    onClick={() => toggleItem(it.category, it.name)}
                                    className="w-8 h-8 flex items-center justify-center text-[#ef4036] hover:bg-[#ef4036]/10 rounded-xl transition-colors"
                                    aria-label={t('checklist.remove')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </BrandCard>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ─── Barre de navigation sticky (Retour / Continuer | Générer) ─── */}
          <div className="sticky bottom-3 z-20 mt-6">
            <div className="flex gap-2.5 max-w-2xl mx-auto">
              {step > 1 && (
                <button
                  onClick={goBack}
                  disabled={submitting || photoUploading}
                  className={`${brandBtnOutline} flex-1 sm:flex-none sm:px-8 py-4 flex items-center justify-center gap-2 min-h-[56px] bg-white/95 backdrop-blur`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('checklist.back')}
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={goNext}
                  className={`${brandBtnGradient} flex-1 py-4 px-6 flex items-center justify-center gap-2 text-base min-h-[56px]`}
                >
                  {t('checklist.next')}
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || photoUploading}
                  className={`${brandBtnGradient} flex-1 py-4 px-6 flex items-center justify-center gap-2 text-base min-h-[56px]`}
                >
                  {submitting || photoUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {photoUploading ? 'Envoi de la photo…' : t('checklist.submitting')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {t('checklist.submit')}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Réassurance */}
          <div className="mt-6 mb-2 text-center text-xs text-[#16234e]/50">
            <p>🔒 Vos données restent confidentielles • 📧 PDF envoyé par email • ✅ Attestation horodatée</p>
          </div>
        </section>

        {/* Footer sticky */}
        <footer className="bg-[#16234e] text-white/70 text-center py-4 mt-auto">
          <p className="text-xs">QRBag — Protection intelligente des bagages • qrbags.com</p>
        </footer>
      </main>
    </BrandShell>
  );
}
