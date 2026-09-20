'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PublicLayout from '@/components/public/PublicLayout';
import {
  brandBadge,
  brandBtnGradient,
  brandInput,
  BrandCard,
} from '@/components/brand/BrandShell';
import {
  Star,
  StarHalf,
  MessageSquareQuote,
  CheckCircle,
  Loader2,
  PenLine,
  ShieldCheck,
  Quote,
  User,
  MapPin,
} from 'lucide-react';

/* ──────────────────────────────────────────────
   AVIS — Page publique « Avis voyageurs »
   • Onglet accessible depuis la navigation principale
   • Formulaire SANS COMPTE — publication IMMÉDIATE
   • Cible du bouton « Partagez votre avis » du mail 48h
     (lien /avis?ref=VOL26-XXXXXX — la référence bagage
      est pré-remplie automatiquement)
   ────────────────────────────────────────────── */

interface ReviewItem {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  title: string | null;
  content: string;
  baggageRef: string | null;
  isFeatured: boolean;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

function Stars({ value, className = 'w-4 h-4' }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} sur 5 étoiles`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${className} ${i <= value ? 'fill-[#f8921f] text-[#f8921f]' : 'text-slate-300'}`}
          aria-hidden
        />
      ))}
    </span>
  );
}

function formatDateFr(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function AvisContent() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get('ref') || '';

  // ─── Data state ───
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);

  // ─── Form state (SANS COMPTE — publication immédiate) ───
  const [form, setForm] = useState({
    name: '',
    location: '',
    rating: 0,
    hoverRating: 0,
    title: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [published, setPublished] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Pré-remplit la référence bagage depuis le lien du mail 48h (…/avis?ref=XXX)
  const [baggageRef, setBaggageRef] = useState(refParam);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews?limit=50', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
        setStats(data.stats || { averageRating: 0, totalReviews: 0 });
      }
    } catch (error) {
      console.error('Erreur chargement avis :', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation côté client (identique à l'API)
    if (!form.name.trim()) {
      setFormError('Veuillez indiquer votre nom.');
      return;
    }
    if (!form.rating || form.rating < 1) {
      setFormError('Veuillez choisir une note de 1 à 5 étoiles.');
      return;
    }
    if (form.content.trim().length < 10) {
      setFormError('Votre avis doit contenir au moins 10 caractères.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          location: form.location || undefined,
          rating: form.rating,
          title: form.title || undefined,
          content: form.content,
          baggageRef: baggageRef.trim() || undefined,
          language: 'fr',
          publish: true, // ← publication immédiate, sans compte
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Une erreur est survenue. Veuillez réessayer.");
        return;
      }

      // Publié immédiatement → feedback + rafraîchissement de la liste
      setPublished(true);
      setForm({ name: '', location: '', rating: 0, hoverRating: 0, title: '', content: '' });
      setBaggageRef('');
      await fetchReviews();
      window.setTimeout(() => setPublished(false), 8000);
    } catch (error) {
      console.error('Erreur envoi avis :', error);
      setFormError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      {/* ─── Hero — bandeau bleu de nuit QRBags ─── */}
      <section className="relative overflow-hidden bg-[#16234e] text-center">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-qrbag" aria-hidden />
        <div className="absolute inset-0 dotted-map-light opacity-60 pointer-events-none" aria-hidden />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#e6216e]/20 blur-[110px] pointer-events-none" aria-hidden />
        <div className="absolute -bottom-28 -left-24 w-80 h-80 rounded-full bg-[#2f9bff]/15 blur-[110px] pointer-events-none" aria-hidden />

        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-20">
          <span className={brandBadge}>
            <MessageSquareQuote className="w-3.5 h-3.5" aria-hidden />
            Avis voyageurs
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 mt-6">
            Ce que disent nos voyageurs
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-xl leading-relaxed">
            Bagages retrouvés, voyages sereins… Partagez à votre tour votre expérience —{' '}
            <strong className="text-white font-semibold">sans compte, publication immédiate</strong>.
          </p>

          {/* Stats globales */}
          {stats.totalReviews > 0 && (
            <div className="mt-8 inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-6 bg-white/[0.06] border border-white/15 rounded-2xl px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-white">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
                </span>
                <Stars value={Math.round(stats.averageRating)} className="w-5 h-5" />
              </div>
              <span className="hidden sm:block w-px h-8 bg-white/15" aria-hidden />
              <p className="text-white/70 text-sm font-medium">
                {stats.totalReviews} avis{stats.totalReviews > 1 ? ' vérifiés' : ' vérifié'}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="py-14 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-10">

          {/* ─── Colonne formulaire (publication immédiate) ─── */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-28">
              <BrandCard className="p-6 md:p-7">
                <h2 className="flex items-center gap-2.5 text-xl font-bold text-[#16234e] mb-1.5">
                  <span className="w-10 h-10 rounded-2xl bg-[#f8921f]/10 border border-[#f8921f]/30 flex items-center justify-center">
                    <PenLine className="w-5 h-5 text-[#f8921f]" aria-hidden />
                  </span>
                  Partagez votre avis
                </h2>
                <p className="text-sm text-slate-500 mb-6 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden />
                  Sans compte — votre avis est publié immédiatement.
                </p>

                {published && (
                  <div
                    role="status"
                    className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800"
                  >
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden />
                    <div>
                      <p className="font-bold text-sm">Merci pour votre avis ! 🙏</p>
                      <p className="text-sm">Il est déjà publié ci-dessous.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Note étoiles */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#16234e]/70 mb-2">
                      Votre note *
                    </label>
                    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Note de 1 à 5 étoiles">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button
                          key={i}
                          type="button"
                          role="radio"
                          aria-checked={form.rating === i}
                          aria-label={`${i} étoile${i > 1 ? 's' : ''}`}
                          onMouseEnter={() => setForm((f) => ({ ...f, hoverRating: i }))}
                          onMouseLeave={() => setForm((f) => ({ ...f, hoverRating: 0 }))}
                          onClick={() => setForm((f) => ({ ...f, rating: i }))}
                          className="p-1 rounded-md hover:scale-110 active:scale-95 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              i <= (form.hoverRating || form.rating)
                                ? 'fill-[#f8921f] text-[#f8921f]'
                                : 'text-slate-300'
                            }`}
                            aria-hidden
                          />
                        </button>
                      ))}
                      {form.rating > 0 && (
                        <span className="ml-2 text-sm font-bold text-[#16234e]">{form.rating}/5</span>
                      )}
                    </div>
                  </div>

                  {/* Nom */}
                  <div>
                    <label htmlFor="avis-name" className="block text-xs font-bold uppercase tracking-wider text-[#16234e]/70 mb-2">
                      Votre nom *
                    </label>
                    <input
                      id="avis-name"
                      type="text"
                      required
                      maxLength={60}
                      placeholder="Ex. Awa D."
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className={brandInput}
                    />
                  </div>

                  {/* Ville / pays */}
                  <div>
                    <label htmlFor="avis-location" className="block text-xs font-bold uppercase tracking-wider text-[#16234e]/70 mb-2">
                      Ville / pays <span className="font-medium normal-case text-slate-400">(optionnel)</span>
                    </label>
                    <input
                      id="avis-location"
                      type="text"
                      maxLength={60}
                      placeholder="Ex. Dakar, Sénégal"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      className={brandInput}
                    />
                  </div>

                  {/* Titre */}
                  <div>
                    <label htmlFor="avis-title" className="block text-xs font-bold uppercase tracking-wider text-[#16234e]/70 mb-2">
                      Titre <span className="font-medium normal-case text-slate-400">(optionnel)</span>
                    </label>
                    <input
                      id="avis-title"
                      type="text"
                      maxLength={80}
                      placeholder="Ex. Ma valise retrouvée en 2 heures !"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      className={brandInput}
                    />
                  </div>

                  {/* Contenu */}
                  <div>
                    <label htmlFor="avis-content" className="block text-xs font-bold uppercase tracking-wider text-[#16234e]/70 mb-2">
                      Votre avis *
                    </label>
                    <textarea
                      id="avis-content"
                      required
                      minLength={10}
                      maxLength={1000}
                      rows={5}
                      placeholder="Racontez votre expérience : tout s'est-il bien passé pendant votre voyage ?"
                      value={form.content}
                      onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                      className={`${brandInput} resize-y min-h-[120px]`}
                    />
                    <p className="mt-1 text-xs text-slate-400 text-right">
                      {form.content.length}/1000
                    </p>
                  </div>

                  {/* Référence bagage — pré-remplie depuis le mail 48h */}
                  <div>
                    <label htmlFor="avis-ref" className="block text-xs font-bold uppercase tracking-wider text-[#16234e]/70 mb-2">
                      Référence bagage <span className="font-medium normal-case text-slate-400">(optionnel)</span>
                    </label>
                    <input
                      id="avis-ref"
                      type="text"
                      maxLength={30}
                      placeholder="Ex. VOL26-ZUHRYQ"
                      value={baggageRef}
                      onChange={(e) => setBaggageRef(e.target.value)}
                      className={`${brandInput} font-mono tracking-wider uppercase`}
                    />
                    {refParam && (
                      <p className="mt-1 text-xs text-emerald-600 font-medium">
                        ✓ Référence reprise depuis votre e-mail de suivi
                      </p>
                    )}
                  </div>

                  {formError && (
                    <p role="alert" className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`${brandBtnGradient} w-full py-4 px-6 flex items-center justify-center gap-2 text-base min-h-[52px] cursor-pointer`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                        Publication en cours…
                      </>
                    ) : (
                      <>
                        <Star className="w-5 h-5 fill-current" aria-hidden />
                        Publier mon avis
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-400 text-center leading-relaxed">
                    En publiant, vous acceptez que votre avis soit affiché publiquement sur QRBags.
                  </p>
                </form>
              </BrandCard>
            </div>
          </div>

          {/* ─── Colonne liste des avis publiés ─── */}
          <div className="lg:col-span-3">
            <h2 className="flex items-center gap-2.5 text-2xl font-bold text-[#16234e] mb-6">
              <MessageSquareQuote className="w-6 h-6 text-[#16234e]" aria-hidden />
              Avis des voyageurs
              {stats.totalReviews > 0 && (
                <span className="text-sm font-bold text-slate-400">({stats.totalReviews})</span>
              )}
            </h2>

            {loading ? (
              <div className="space-y-4" aria-busy="true">
                {[1, 2, 3].map((i) => (
                  <BrandCard key={i} className="p-6 animate-pulse">
                    <div className="h-4 w-28 bg-slate-100 rounded mb-3" />
                    <div className="h-5 w-2/3 bg-slate-100 rounded mb-4" />
                    <div className="h-4 w-full bg-slate-100 rounded mb-2" />
                    <div className="h-4 w-5/6 bg-slate-100 rounded" />
                  </BrandCard>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <BrandCard className="p-10 text-center">
                <StarHalf className="w-12 h-12 text-slate-300 mx-auto mb-4" aria-hidden />
                <p className="text-lg font-bold text-[#16234e] mb-1">Aucun avis pour le moment</p>
                <p className="text-sm text-slate-500">
                  Soyez le premier à partager votre expérience avec QRBags !
                </p>
              </BrandCard>
            ) : (
              <ul className="space-y-4">
                {reviews.map((review) => (
                  <li key={review.id}>
                    <BrandCard className="p-5 md:p-6 hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-11 h-11 rounded-full bg-[#16234e]/5 border border-[#16234e]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <span className="text-base font-black text-[#16234e]">
                              {review.name.trim().charAt(0).toUpperCase()}
                            </span>
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-[#16234e] truncate flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" aria-hidden />
                              {review.name}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                              {review.location && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3" aria-hidden />
                                  {review.location}
                                </span>
                              )}
                              {review.baggageRef && (
                                <span className="font-mono font-semibold text-[#2f9bff]">{review.baggageRef}</span>
                              )}
                              <span>{formatDateFr(review.createdAt)}</span>
                            </p>
                          </div>
                        </div>
                        <Stars value={review.rating} />
                      </div>

                      {review.title && (
                        <p className="font-bold text-[#16234e] mb-1.5">{review.title}</p>
                      )}
                      <div className="relative pl-4">
                        <Quote className="absolute left-0 top-1 w-3.5 h-3.5 text-[#2f9bff]/40" aria-hidden />
                        <p className="text-slate-600 leading-relaxed text-[15px] whitespace-pre-line">
                          {review.content}
                        </p>
                      </div>
                    </BrandCard>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

export default function AvisPage() {
  // Suspense requis : useSearchParams() ne peut pas être rendu statiquement
  return (
    <Suspense
      fallback={
        <PublicLayout>
          <section className="py-24 px-4 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#16234e] mx-auto" aria-hidden />
          </section>
        </PublicLayout>
      }
    >
      <AvisContent />
    </Suspense>
  );
}
