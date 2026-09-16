'use client';

/* ══════════════════════════════════════════════════════════════
   /commander — Parcours de commande produit QRBags (page publique)
   La commande part dans l'onglet Messages du superadmin via
   POST /api/messages (type « commande »).
   Palette stricte : navy #16234e · azure #2f9bff · orange #f8921f ·
   magenta #e6216e · violet #8b17c9 (+ vert WhatsApp #25D366).
   ══════════════════════════════════════════════════════════════ */

import { Suspense, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Check,
  ChevronRight,
  Loader2,
  Sticker,
  Users,
  MoonStar,
  Truck,
  ShieldCheck,
  MessageCircle,
  Luggage,
  Clock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  BrandShell,
  BrandCard,
  BrandLogo,
  BrandIconRing,
  brandInput,
  brandLabel,
  brandBtnGradient,
  brandBtnNavy,
} from '@/components/brand/BrandShell';

/* ─── Offres produit ─── */

type OffreId = 'solo' | 'famille' | 'hajj';

interface Offre {
  id: OffreId;
  nom: string;
  prix: number;
  unite: string;
  bagages: string;
  desc: string;
  accent: string;
  Icon: LucideIcon;
  populaire?: boolean;
}

const OFFRES: Offre[] = [
  {
    id: 'solo',
    nom: 'Sticker Solo',
    prix: 5,
    unite: '/ an',
    bagages: '2 bagages protégés',
    desc: 'Idéal pour un voyageur ou un voyage ponctuel.',
    accent: '#2f9bff',
    Icon: Sticker,
  },
  {
    id: 'famille',
    nom: 'Pack Famille',
    prix: 12,
    unite: '/ an',
    bagages: '6 bagages protégés',
    desc: 'Pour toute la famille ou les voyageurs fréquents.',
    accent: '#f8921f',
    Icon: Users,
    populaire: true,
  },
  {
    id: 'hajj',
    nom: 'Hajj & Omra',
    prix: 5,
    unite: '/ pèlerin',
    bagages: '3 bagages par pèlerin',
    desc: 'Formule dédiée aux pèlerins, gérée avec votre agence.',
    accent: '#8b17c9',
    Icon: MoonStar,
  },
];

const DEFAULT_OFFRE: OffreId = 'solo';

/* ─── Formulaire ─── */

interface FormState {
  nom: string;
  whatsapp: string;
  email: string;
  quantite: string;
  adresse: string;
  ville: string;
  pays: string;
  message: string;
}

const INITIAL_FORM: FormState = {
  nom: '',
  whatsapp: '',
  email: '',
  quantite: '1',
  adresse: '',
  ville: '',
  pays: '',
  message: '',
};

type FieldKey = 'nom' | 'whatsapp' | 'email' | 'quantite' | 'adresse' | 'ville' | 'pays';
type FieldErrors = Partial<Record<FieldKey, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Confettis (config déterministe, sans random → SSR stable) ─── */

const CONFETTI_COLORS = ['#f8921f', '#e6216e', '#8b17c9', '#2f9bff', '#ffd200'];
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 5.5 + (i % 3) * 2) % 96}%`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: (i % 6) * 0.28,
  duration: 2.1 + (i % 4) * 0.35,
  size: 8 + (i % 3) * 3,
}));

/* ══════════════════════════════════════════════════════════════
   Page (Suspense requise : useSearchParams)
   ══════════════════════════════════════════════════════════════ */

export default function CommanderPage() {
  return (
    <Suspense
      fallback={
        <BrandShell>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-[#16234e]/10 border-t-[#e6216e] animate-spin" aria-label="Chargement" />
          </div>
        </BrandShell>
      }
    >
      <CommanderContent />
    </Suspense>
  );
}

function CommanderContent() {
  const searchParams = useSearchParams();
  const offreParam = searchParams.get('offre');
  const initialOffre: OffreId = OFFRES.some((o) => o.id === offreParam)
    ? (offreParam as OffreId)
    : DEFAULT_OFFRE;

  const [offreId, setOffreId] = useState<OffreId>(initialOffre);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const offre = OFFRES.find((o) => o.id === offreId) ?? OFFRES[0];
  const quantite = Math.min(99, Math.max(1, parseInt(form.quantite, 10) || 1));
  const total = offre.prix * quantite;

  const setField = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!form.nom.trim()) errs.nom = 'Votre nom complet est requis.';

    const digits = form.whatsapp.replace(/\D/g, '');
    if (!form.whatsapp.trim()) errs.whatsapp = 'Votre numéro WhatsApp est requis.';
    else if (digits.length < 8) errs.whatsapp = 'Numéro invalide — indiquez l\u2019indicatif international (min. 8 chiffres).';

    if (!form.email.trim()) errs.email = 'Votre email est requis.';
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Adresse email invalide.';

    const q = parseInt(form.quantite, 10);
    if (Number.isNaN(q) || q < 1 || q > 99) errs.quantite = 'Quantité entre 1 et 99.';

    if (!form.adresse.trim()) errs.adresse = 'Adresse de livraison requise.';
    if (!form.ville.trim()) errs.ville = 'Ville requise.';
    if (!form.pays.trim()) errs.pays = 'Pays requis.';
    return errs;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast({
        variant: 'destructive',
        title: 'Formulaire incomplet',
        description: 'Vérifiez les champs signalés en rouge puis réessayez.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'commande',
          senderName: form.nom.trim(),
          senderEmail: form.email.trim(),
          senderPhone: form.whatsapp.trim(),
          subject: `Commande ${offre.nom} ×${quantite} — ${total} €`,
          content: JSON.stringify({
            produit: offre.nom,
            prixUnitaire: offre.prix,
            quantite,
            total,
            adresse: form.adresse.trim(),
            ville: form.ville.trim(),
            pays: form.pays.trim(),
            message: form.message.trim(),
            dateCommande: new Date().toISOString(),
          }),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Erreur lors de l\u2019envoi de la commande.');
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue.';
      setSubmitError(msg);
      toast({
        variant: 'destructive',
        title: 'Oups, une erreur est survenue',
        description: 'Votre commande n\u2019a pas pu être envoyée. Réessayez dans un instant.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BrandShell>
      {/* ─── En-tête ─── */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#16234e]/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <BrandLogo className="h-9 w-auto" />
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#16234e]/60">
            <ShieldCheck className="w-4 h-4 text-[#2f9bff]" aria-hidden />
            Sans compte · Réponse sous 24h
          </span>
          <Link
            href="/"
            className="sm:hidden inline-flex items-center min-h-[44px] px-3 rounded-xl text-sm font-bold text-[#16234e]/70 hover:text-[#16234e] transition-colors"
          >
            Accueil
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {submitted ? (
          <SuccessScreen offre={offre} quantite={quantite} total={total} />
        ) : (
          <>
            {/* ═══ HERO — bandeau dégradé signature (effet wahoo) ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="mb-8 sm:mb-10"
            >
              <BrandCard corners className="w-full overflow-hidden">
                <div className="relative bg-gradient-qrbag px-5 pt-8 pb-7 text-center overflow-hidden">
                  <div className="absolute -top-12 -left-10 w-36 h-36 rounded-full bg-white/15 blur-2xl" aria-hidden />
                  <div className="absolute -bottom-14 -right-8 w-44 h-44 rounded-full bg-[#ffd200]/25 blur-2xl" aria-hidden />
                  <span className="absolute top-4 right-5 text-xl" aria-hidden>✈️</span>
                  <span className="absolute bottom-5 left-5 text-lg" aria-hidden>🧳</span>

                  <motion.div
                    animate={{ rotate: [0, -7, 7, 0], scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-white shadow-xl shadow-[#16234e]/25 flex items-center justify-center overflow-hidden"
                  >
                    <img src="/logo.png" alt="Logo QRBags" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" aria-hidden />
                  </motion.div>

                  <h1 className="relative text-2xl md:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
                    Commandez vos étiquettes QRBags
                  </h1>
                  <p className="relative mt-3 text-sm md:text-base text-white/90 leading-relaxed max-w-xl mx-auto font-medium">
                    Livraison suivie sous 3 à 5 jours, activation en 30 secondes.
                    Vos bagages restent joignables partout dans le monde — et vous restez serein.
                  </p>
                  <p className="relative mt-4 inline-flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-white font-bold text-[11px] sm:text-xs tracking-wide">
                    <span className="inline-flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" aria-hidden /> Livraison suivie</span>
                    <span className="w-1 h-1 rounded-full bg-white/50" aria-hidden />
                    <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" aria-hidden /> Activation en 30s</span>
                    <span className="w-1 h-1 rounded-full bg-white/50" aria-hidden />
                    <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" aria-hidden /> Paiement à la confirmation</span>
                  </p>
                </div>

                {/* Bandeau 3 étapes */}
                <div className="px-4 py-4 bg-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#16234e]/50 text-center mb-2.5">
                    Commandez en 3 étapes
                  </p>
                  <ol className="grid grid-cols-3 gap-2">
                    {[
                      { title: 'Choisissez', desc: 'votre offre', Icon: ShoppingBag, color: '#2f9bff' },
                      { title: 'Remplissez', desc: 'vos coordonnées', Icon: MessageCircle, color: '#f8921f' },
                      { title: 'Recevez', desc: 'vos étiquettes', Icon: Truck, color: '#8b17c9' },
                    ].map((s, i) => (
                      <li key={s.title} className="relative text-center px-1">
                        <div
                          className="w-10 h-10 mx-auto mb-1.5 rounded-2xl flex items-center justify-center shadow-md"
                          style={{ backgroundColor: `${s.color}1A`, border: `1.5px solid ${s.color}55` }}
                        >
                          <s.Icon className="w-5 h-5" style={{ color: s.color }} aria-hidden />
                        </div>
                        <p className="text-[11px] md:text-xs font-extrabold text-[#16234e] leading-tight">{s.title}</p>
                        <p className="hidden sm:block text-[10px] text-[#16234e]/55 leading-snug mt-0.5">{s.desc}</p>
                        {i < 2 && (
                          <ChevronRight className="hidden sm:block absolute top-4 -right-1.5 w-3.5 h-3.5 text-[#16234e]/20" aria-hidden />
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </BrandCard>
            </motion.div>

            {/* ═══ SÉLECTION DU PRODUIT ═══ */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-8 sm:mb-10"
              aria-labelledby="choix-offre"
            >
              <h2 id="choix-offre" className="text-lg sm:text-xl font-black text-[#16234e] mb-1.5">
                1. Choisissez votre offre
              </h2>
              <p className="text-sm text-[#16234e]/60 mb-5">Touchez une carte pour la sélectionner.</p>

              <div role="radiogroup" aria-label="Offres QRBags" className="grid sm:grid-cols-3 gap-4">
                {OFFRES.map((o) => {
                  const selected = o.id === offreId;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setOffreId(o.id)}
                      className={`relative text-left rounded-3xl border-2 p-5 transition-all duration-300 cursor-pointer min-h-[44px] ${
                        selected
                          ? 'shadow-xl -translate-y-1'
                          : 'border-[#16234e]/10 bg-white hover:border-[#16234e]/25 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                      style={
                        selected
                          ? {
                              borderColor: o.accent,
                              background: `${o.accent}0A`,
                              boxShadow: `0 20px 44px -18px ${o.accent}66`,
                            }
                          : undefined
                      }
                    >
                      {/* coche de sélection */}
                      <span
                        aria-hidden
                        className={`absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
                          selected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                        }`}
                        style={{ background: o.accent }}
                      >
                        <Check className="w-4 h-4 text-white" strokeWidth={3.5} />
                      </span>

                      {o.populaire && (
                        <span className="absolute -top-3 left-4 bg-gradient-qrbag text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md shadow-[#e6216e]/30 tracking-widest">
                          POPULAIRE
                        </span>
                      )}

                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: `${o.accent}1A`, border: `1.5px solid ${o.accent}55` }}
                      >
                        <o.Icon className="w-5.5 h-5.5" style={{ color: o.accent }} aria-hidden />
                      </div>

                      <h3 className="text-base font-black text-[#16234e] leading-tight">{o.nom}</h3>

                      <div className="flex items-baseline gap-1 mt-2 mb-1">
                        <span className="text-3xl font-black tracking-tight" style={{ color: o.accent }}>
                          {o.prix} €
                        </span>
                        <span className="text-xs font-bold text-[#16234e]/50">{o.unite}</span>
                      </div>

                      <p className="flex items-center gap-1.5 text-xs font-bold text-[#16234e]/75 mb-1">
                        <Luggage className="w-3.5 h-3.5 shrink-0" style={{ color: o.accent }} aria-hidden />
                        {o.bagages}
                      </p>
                      <p className="text-[11px] text-[#16234e]/50 leading-snug">{o.desc}</p>
                    </button>
                  );
                })}
              </div>
            </motion.section>

            {/* ═══ FORMULAIRE ═══ */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              aria-labelledby="vos-coordonnees"
            >
              <h2 id="vos-coordonnees" className="text-lg sm:text-xl font-black text-[#16234e] mb-1.5">
                2. Vos coordonnées de livraison
              </h2>
              <p className="text-sm text-[#16234e]/60 mb-5">
                Notre équipe vous contacte sur WhatsApp pour confirmer la livraison et le paiement.
              </p>

              <BrandCard corners className="p-5 sm:p-8">
                <form onSubmit={handleSubmit} noValidate>
                  <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                    {/* Nom */}
                    <div>
                      <label htmlFor="cmd-nom" className={brandLabel}>
                        Nom complet <span className="text-[#e6216e]" aria-hidden>*</span>
                      </label>
                      <input
                        id="cmd-nom"
                        type="text"
                        autoComplete="name"
                        className={`${brandInput} ${errors.nom ? 'border-[#ef4036] focus:ring-[#ef4036]/15 focus:border-[#ef4036]' : ''}`}
                        placeholder="Ex. Fatou Diallo"
                        value={form.nom}
                        onChange={(e) => setField('nom', e.target.value)}
                        aria-invalid={!!errors.nom}
                        aria-describedby={errors.nom ? 'cmd-nom-error' : undefined}
                      />
                      {errors.nom && (
                        <p id="cmd-nom-error" className="mt-1.5 text-xs font-semibold text-[#ef4036]">{errors.nom}</p>
                      )}
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label htmlFor="cmd-whatsapp" className={brandLabel}>
                        Numéro WhatsApp <span className="text-[#e6216e]" aria-hidden>*</span>
                      </label>
                      <input
                        id="cmd-whatsapp"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        className={`${brandInput} ${errors.whatsapp ? 'border-[#ef4036] focus:ring-[#ef4036]/15 focus:border-[#ef4036]' : ''}`}
                        placeholder="Indicatif + numéro, ex. +221 77 012 34 56"
                        value={form.whatsapp}
                        onChange={(e) => setField('whatsapp', e.target.value)}
                        aria-invalid={!!errors.whatsapp}
                        aria-describedby={errors.whatsapp ? 'cmd-whatsapp-error' : undefined}
                      />
                      {errors.whatsapp ? (
                        <p id="cmd-whatsapp-error" className="mt-1.5 text-xs font-semibold text-[#ef4036]">{errors.whatsapp}</p>
                      ) : (
                        <p className="mt-1.5 text-[11px] text-[#16234e]/45 flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-[#25D366]" aria-hidden />
                          C&apos;est sur ce numéro que nous vous contactons.
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="cmd-email" className={brandLabel}>
                        Email <span className="text-[#e6216e]" aria-hidden>*</span>
                      </label>
                      <input
                        id="cmd-email"
                        type="email"
                        autoComplete="email"
                        className={`${brandInput} ${errors.email ? 'border-[#ef4036] focus:ring-[#ef4036]/15 focus:border-[#ef4036]' : ''}`}
                        placeholder="vous@exemple.com"
                        value={form.email}
                        onChange={(e) => setField('email', e.target.value)}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'cmd-email-error' : undefined}
                      />
                      {errors.email && (
                        <p id="cmd-email-error" className="mt-1.5 text-xs font-semibold text-[#ef4036]">{errors.email}</p>
                      )}
                    </div>

                    {/* Quantité */}
                    <div>
                      <label htmlFor="cmd-quantite" className={brandLabel}>
                        Quantité <span className="text-[#e6216e]" aria-hidden>*</span>
                      </label>
                      <input
                        id="cmd-quantite"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={99}
                        step={1}
                        className={`${brandInput} ${errors.quantite ? 'border-[#ef4036] focus:ring-[#ef4036]/15 focus:border-[#ef4036]' : ''}`}
                        value={form.quantite}
                        onChange={(e) => setField('quantite', e.target.value)}
                        aria-invalid={!!errors.quantite}
                        aria-describedby={errors.quantite ? 'cmd-quantite-error' : undefined}
                      />
                      {errors.quantite ? (
                        <p id="cmd-quantite-error" className="mt-1.5 text-xs font-semibold text-[#ef4036]">{errors.quantite}</p>
                      ) : (
                        <p className="mt-1.5 text-[11px] text-[#16234e]/45">
                          {offre.id === 'hajj' ? 'Nombre de pèlerins' : 'Nombre de packs'} (1 à 99).
                        </p>
                      )}
                    </div>

                    {/* Adresse */}
                    <div className="sm:col-span-2">
                      <label htmlFor="cmd-adresse" className={brandLabel}>
                        Adresse de livraison complète <span className="text-[#e6216e]" aria-hidden>*</span>
                      </label>
                      <input
                        id="cmd-adresse"
                        type="text"
                        autoComplete="street-address"
                        className={`${brandInput} ${errors.adresse ? 'border-[#ef4036] focus:ring-[#ef4036]/15 focus:border-[#ef4036]' : ''}`}
                        placeholder="Bâtiment, rue, quartier, repère…"
                        value={form.adresse}
                        onChange={(e) => setField('adresse', e.target.value)}
                        aria-invalid={!!errors.adresse}
                        aria-describedby={errors.adresse ? 'cmd-adresse-error' : undefined}
                      />
                      {errors.adresse && (
                        <p id="cmd-adresse-error" className="mt-1.5 text-xs font-semibold text-[#ef4036]">{errors.adresse}</p>
                      )}
                    </div>

                    {/* Ville */}
                    <div>
                      <label htmlFor="cmd-ville" className={brandLabel}>
                        Ville <span className="text-[#e6216e]" aria-hidden>*</span>
                      </label>
                      <input
                        id="cmd-ville"
                        type="text"
                        autoComplete="address-level2"
                        className={`${brandInput} ${errors.ville ? 'border-[#ef4036] focus:ring-[#ef4036]/15 focus:border-[#ef4036]' : ''}`}
                        placeholder="Ex. Dakar"
                        value={form.ville}
                        onChange={(e) => setField('ville', e.target.value)}
                        aria-invalid={!!errors.ville}
                        aria-describedby={errors.ville ? 'cmd-ville-error' : undefined}
                      />
                      {errors.ville && (
                        <p id="cmd-ville-error" className="mt-1.5 text-xs font-semibold text-[#ef4036]">{errors.ville}</p>
                      )}
                    </div>

                    {/* Pays */}
                    <div>
                      <label htmlFor="cmd-pays" className={brandLabel}>
                        Pays <span className="text-[#e6216e]" aria-hidden>*</span>
                      </label>
                      <input
                        id="cmd-pays"
                        type="text"
                        autoComplete="country-name"
                        className={`${brandInput} ${errors.pays ? 'border-[#ef4036] focus:ring-[#ef4036]/15 focus:border-[#ef4036]' : ''}`}
                        placeholder="Ex. Sénégal"
                        value={form.pays}
                        onChange={(e) => setField('pays', e.target.value)}
                        aria-invalid={!!errors.pays}
                        aria-describedby={errors.pays ? 'cmd-pays-error' : undefined}
                      />
                      {errors.pays && (
                        <p id="cmd-pays-error" className="mt-1.5 text-xs font-semibold text-[#ef4036]">{errors.pays}</p>
                      )}
                    </div>

                    {/* Message libre */}
                    <div className="sm:col-span-2">
                      <label htmlFor="cmd-message" className={brandLabel}>
                        Message <span className="font-medium normal-case tracking-normal text-[#16234e]/40">(optionnel)</span>
                      </label>
                      <textarea
                        id="cmd-message"
                        rows={3}
                        className={`${brandInput} resize-y`}
                        placeholder="Une précision pour notre équipe ? Date de départ, hôtel de livraison, question…"
                        value={form.message}
                        onChange={(e) => setField('message', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Récapitulatif + total */}
                  <div className="mt-6 rounded-2xl bg-[#16234e]/[0.04] border border-[#16234e]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#16234e]/55 mb-1">Récapitulatif</p>
                      <p className="text-sm font-bold text-[#16234e]">
                        {offre.nom} <span className="text-[#16234e]/50 font-semibold">×{quantite}</span>
                        <span className="text-[#16234e]/50 font-semibold"> · {offre.prix} € {offre.unite}</span>
                      </p>
                      <p className="mt-1 text-[11px] text-[#16234e]/50 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#2f9bff]" aria-hidden />
                        Rien à payer en ligne — le paiement se confirme avec notre équipe sur WhatsApp.
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#16234e]/55 mb-0.5">Total</p>
                      <p className="text-4xl sm:text-5xl font-black leading-none tracking-tight">
                        <span className="text-gradient-qrbag">{total} €</span>
                      </p>
                    </div>
                  </div>

                  {/* Erreur globale */}
                  {submitError && (
                    <div
                      role="alert"
                      className="mt-4 rounded-xl border border-[#ef4036]/30 bg-[#ef4036]/5 px-4 py-3 text-sm font-semibold text-[#ef4036]"
                    >
                      {submitError} — vous pouvez aussi nous écrire directement depuis la page{' '}
                      <Link href="/contact" className="underline hover:no-underline">Contact</Link>.
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`${brandBtnGradient} mt-6 w-full inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base min-h-[52px]`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                        Envoi en cours…
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" aria-hidden />
                        Confirmer ma commande — {total} €
                      </>
                    )}
                  </button>
                  <p className="mt-3 text-center text-[11px] text-[#16234e]/45">
                    En commandant, vous acceptez nos{' '}
                    <Link href="/cgu" className="underline hover:text-[#2f9bff]">CGU</Link> et notre{' '}
                    <Link href="/confidentialite" className="underline hover:text-[#2f9bff]">politique de confidentialité</Link>.
                  </p>
                </form>
              </BrandCard>
            </motion.section>
          </>
        )}
      </main>

      {/* ─── Pied de page ─── */}
      <footer className="mt-auto relative bg-white border-t border-[#16234e]/10">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-qrbag" aria-hidden />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#16234e]/55">
          <p>© {new Date().getFullYear()} QRBags — Vos bagages, toujours joignables.</p>
          <Link href="/contact" className="inline-flex items-center min-h-[44px] font-bold text-[#2f9bff] hover:underline">
            Une question ? Contactez-nous
          </Link>
        </div>
      </footer>
    </BrandShell>
  );
}

/* ══════════════════════════════════════════════════════════════
   Écran de succès — carte célébration + confettis
   ══════════════════════════════════════════════════════════════ */

function SuccessScreen({ offre, quantite, total }: { offre: Offre; quantite: number; total: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', bounce: 0.35 }}
      className="relative max-w-2xl mx-auto"
    >
      {/* Confettis */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-28 h-72 overflow-hidden">
        {CONFETTI.map((c, i) => (
          <motion.span
            key={i}
            className="absolute top-0 rounded-[3px]"
            style={{ left: c.left, background: c.color, width: c.size * 0.7, height: c.size }}
            initial={{ y: -30, opacity: 0, rotate: 0 }}
            animate={{ y: 300, opacity: [0, 1, 1, 0], rotate: 320 }}
            transition={{ duration: c.duration, delay: c.delay, repeat: Infinity, repeatDelay: 2.2, ease: 'easeIn' }}
          />
        ))}
      </div>

      <BrandCard corners className="p-8 sm:p-12 text-center overflow-hidden">
        <BrandIconRing size="w-24 h-24" glow="#f8921f">
          <img src="/logo.png" alt="Logo QRBags" className="w-16 h-16 object-contain rounded-2xl" aria-hidden />
        </BrandIconRing>

        <h2 className="mt-7 text-3xl sm:text-4xl font-black text-[#16234e] tracking-tight">
          Commande reçue&nbsp;! 🎉
        </h2>
        <p className="mt-4 text-[15px] sm:text-base text-[#16234e]/70 leading-relaxed max-w-md mx-auto">
          Notre équipe vous contacte sur <strong className="font-bold text-[#16234e]">WhatsApp dans les 24h</strong>{' '}
          pour confirmer la livraison et le paiement.
        </p>

        {/* Récap de la commande */}
        <div className="mt-7 rounded-2xl bg-[#16234e]/[0.04] border border-[#16234e]/10 px-5 py-4 inline-flex flex-col sm:flex-row items-center gap-x-6 gap-y-2">
          <p className="text-sm font-bold text-[#16234e] flex items-center gap-2">
            <offre.Icon className="w-4.5 h-4.5" style={{ color: offre.accent }} aria-hidden />
            {offre.nom} ×{quantite}
          </p>
          <span className="hidden sm:block w-px h-6 bg-[#16234e]/15" aria-hidden />
          <p className="text-sm font-black text-gradient-qrbag">Total : {total} €</p>
        </div>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className={`${brandBtnNavy} inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm min-h-[48px] w-full sm:w-auto`}
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/#comment"
            className={`${brandBtnGradient} inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm min-h-[48px] w-full sm:w-auto`}
          >
            Découvrir comment ça marche
          </Link>
        </div>

        <p className="mt-6 text-[11px] text-[#16234e]/45 flex items-center justify-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" aria-hidden />
          Gardez votre téléphone à portée de main — on vous écrit très vite&nbsp;!
        </p>
      </BrandCard>
    </motion.div>
  );
}
