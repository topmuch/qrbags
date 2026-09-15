'use client';

/**
 * QRBags — Page publique de l'attestation /checklist/[code]
 *
 * Design premium (palette signature QRBags) :
 *  - État verrouillé : carte héro dégradé + clé de vérification + réassurance
 *  - État déverrouillé : héro « Attestation vérifiée » avec cachet CSS,
 *    carte Voyageur & Vol (nom, prénom, compagnie, N° vol, départ, destination),
 *    tableau facture (N° / Désignation / Catégorie / Qté + TOTAL), photo,
 *    empreinte SHA-256 + numéro de série infalsifiable, actions PDF / Imprimer.
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/hooks/use-toast';
import {
  Lock,
  Loader2,
  Download,
  Printer,
  ArrowLeft,
  Calendar,
  Plane,
  User,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Search,
  ExternalLink,
  Camera,
  ShieldCheck,
  KeyRound,
  QrCode,
  Hash,
  MapPin,
  Fingerprint,
  BadgeCheck,
} from 'lucide-react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { DEFAULT_CHECKLIST_CATEGORIES } from '@/lib/checklist-catalog';

/* ─── Palette QRBags ─── */
const CATEGORY_UI_COLORS: Record<string, string> = {
  women: '#e6216e',
  men: '#2f9bff',
  children: '#f8921f',
  electronics: '#8b17c9',
  shoes: '#ef4036',
  toiletries: '#2f9bff',
  health: '#8b17c9',
  accessories: '#16234e',
  misc: '#a16207', // jaune assombri pour rester lisible sur blanc
};
const catUiColor = (id: string) => CATEGORY_UI_COLORS[id] || '#5a6478';

/* Libellés de catégories localisés (fallback « Autres » pour les anciennes données) */
const CATEGORY_LABELS: Record<string, Record<string, string>> = Object.fromEntries(
  DEFAULT_CHECKLIST_CATEGORIES.map((c) => [c.id, c.label])
);
function catLabel(id: string, lang: string): string {
  const l = CATEGORY_LABELS[id];
  if (!l) return 'Autres';
  return (l as Record<string, string>)[lang] || l.fr;
}

interface ChecklistView {
  status: 'locked' | 'unlocked' | 'not_found' | 'loading' | 'error';
  code?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  departureDate?: string;
  destinationCountry?: string;
  airline?: string | null;
  flightNumber?: string | null;
  items?: Array<{ category: string; name: string; qty: number; checked: boolean; color?: string; brand?: string }>;
  itemsCount?: number;
  createdAt?: string;
  viewCount?: number;
  hasPhoto?: boolean;
  security?: { serial: string; fingerprint: string; fingerprintShort: string };
  error?: string;
}

interface HistoryItem {
  code: string;
  firstName: string;
  lastName: string;
  destinationCountry: string;
  departureDate: string;
  itemsCount: number;
  emailSent: boolean;
  viewCount: number;
  createdAt: string;
}

/* Cachet « certifié » CSS (double anneau, style cachet officiel) */
function SealBadge({ dateStr }: { dateStr: string }) {
  return (
    <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/10 backdrop-blur-md border-[2.5px] border-white/80 flex items-center justify-center shrink-0 shadow-xl">
      <div className="absolute inset-[5px] rounded-full border border-dashed border-white/60" aria-hidden />
      <div className="text-center leading-tight px-2">
        <div className="text-[10px] font-black text-white tracking-[0.18em]">CERTIFIÉ</div>
        <div className="text-[9px] font-bold text-[#ffd200]">QRBags</div>
        <div className="text-[7.5px] font-semibold text-white/80 mt-1">{dateStr}</div>
      </div>
    </div>
  );
}

export default function ChecklistViewPage() {
  return (
    <Suspense fallback={<ViewFallback />}>
      <ChecklistViewContent />
    </Suspense>
  );
}

function ViewFallback() {
  return (
    <main className="min-h-screen flex flex-col bg-[#f5f7fc]" dir="ltr">
      <div className="flex-1 flex items-center justify-center">
        <div className="inline-block w-10 h-10 border-4 border-[#16234e]/10 border-t-[#e6216e] rounded-full animate-spin" />
      </div>
    </main>
  );
}

function ChecklistViewContent() {
  const { t, lang, setLang, dir } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();
  const code = (params?.code as string || '').toUpperCase();
  const urlKey = searchParams.get('key')?.trim() || '';

  const [view, setView] = useState<ChecklistView>({ status: 'loading' });
  const [keyInput, setKeyInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  // History panel
  const [showHistory, setShowHistory] = useState(false);
  const [historyEmail, setHistoryEmail] = useState('');
  const [historyItems, setHistoryItems] = useState<HistoryItem[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ─── Fetch checklist (locked view) on mount ───
  const fetchChecklist = useCallback(async (key?: string) => {
    setView({ status: 'loading' });
    try {
      const url = key ? `/api/checklist/${code}?key=${encodeURIComponent(key)}` : `/api/checklist/${code}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.status === 404) {
        setView({ status: 'not_found' });
        return;
      }
      setView(data);
    } catch {
      setView({ status: 'error', error: t('checklist.error') });
    }
  }, [code, t]);

  useEffect(() => {
    if (!code) return;
    // Auto-déverrouillage si la clé est passée dans l'URL (?key=…)
    // ⚠️ la clé est sensible à la casse — ne PAS la normaliser
    if (urlKey) {
      setKeyInput(urlKey);
      fetchChecklist(urlKey);
    } else {
      fetchChecklist();
    }
  }, [code, urlKey, fetchChecklist]);

  // ─── Verify key ───
  const handleVerify = useCallback(async () => {
    if (!keyInput.trim()) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/checklist/${code}?key=${encodeURIComponent(keyInput.trim())}`);
      const data = await res.json();
      if (res.status === 403) {
        toast({ title: t('checklist.view_wrong_key'), variant: 'destructive' });
        setVerifying(false);
        return;
      }
      if (res.status === 404) {
        setView({ status: 'not_found' });
        return;
      }
      setView(data);
      if (data.status === 'unlocked') {
        toast({ title: t('checklist.success_title') });
      }
    } catch {
      toast({ title: t('checklist.error'), variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  }, [code, keyInput, t]);

  // ─── Download PDF ───
  const handleDownloadPdf = useCallback(() => {
    if (!keyInput.trim()) return;
    const url = `/api/checklist/${code}/pdf?key=${encodeURIComponent(keyInput.trim())}`;
    window.open(url, '_blank');
  }, [code, keyInput]);

  // ─── Download photo ───
  const handleDownloadPhoto = useCallback(() => {
    if (!keyInput.trim()) return;
    const url = `/api/checklist/${code}/photo?key=${encodeURIComponent(keyInput.trim())}`;
    window.open(url, '_blank');
  }, [code, keyInput]);

  // ─── Search history ───
  const handleHistorySearch = useCallback(async () => {
    if (!historyEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(historyEmail.trim())) {
      toast({ title: t('checklist.need_fields'), variant: 'destructive' });
      return;
    }
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/checklist?email=${encodeURIComponent(historyEmail.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'error');
      setHistoryItems(data.checklists || []);
    } catch {
      toast({ title: t('checklist.error'), variant: 'destructive' });
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyEmail, t]);

  // Format helpers
  const formatDate = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const locale = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR';
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };
  const formatDateOnly = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const locale = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR';
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return iso;
    }
  };
  const formatShortDate = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return iso || '';
    }
  };

  // Invoice stats
  const items = view.items || [];
  const totalUnits = items.reduce((s, it) => s + (it.qty || 1), 0);

  // ═══ RENDER ═══
  return (
    <main className="min-h-screen flex flex-col bg-[#f5f7fc]" dir={dir}>
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-[#16234e]/10 px-4 py-2.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.png" alt="QRBags" className="h-11 w-auto object-contain" />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <a href="/" className="px-3 py-2 text-[13px] font-medium text-[#16234e]/70 hover:text-[#16234e] transition-colors rounded-lg hover:bg-[#16234e]/5">Accueil</a>
            <a href="/checklist" className="px-3 py-2 text-[13px] font-medium text-[#16234e]/70 hover:text-[#16234e] transition-colors rounded-lg hover:bg-[#16234e]/5">Checklist</a>
            <a href="/#tarifs" className="px-3 py-2 text-[13px] font-medium text-[#16234e]/70 hover:text-[#16234e] transition-colors rounded-lg hover:bg-[#16234e]/5">Tarifs</a>
            <a href="/contact" className="px-3 py-2 text-[13px] font-medium text-[#16234e]/70 hover:text-[#16234e] transition-colors rounded-lg hover:bg-[#16234e]/5">Contactez-nous</a>
          </div>
          <LanguageSelector lang={lang} setLang={setLang} variant="blue" />
        </div>
      </header>

      <section className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <Link href="/checklist" className="inline-flex items-center gap-1.5 text-sm text-[#16234e]/60 hover:text-[#16234e] mb-4 font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t('checklist.view_back')}
        </Link>

        {/* ─── Loading ─── */}
        {view.status === 'loading' && (
          <div className="bg-white border border-[#16234e]/10 rounded-3xl p-10 text-center shadow-sm">
            <Loader2 className="w-9 h-9 animate-spin mx-auto text-[#e6216e] mb-3" />
            <p className="text-[#16234e]/60 text-sm font-medium">Chargement…</p>
          </div>
        )}

        {/* ─── Not found ─── */}
        {view.status === 'not_found' && (
          <div className="bg-white border border-[#16234e]/10 rounded-3xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#ef4036]/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-[#ef4036]" />
            </div>
            <h1 className="text-xl font-black text-[#16234e] mb-2">{t('checklist.view_not_found')}</h1>
            <p className="text-[#16234e]/60 text-sm">{t('checklist.view_not_found_desc')}</p>
          </div>
        )}

        {/* ═══════════ LOCKED ═══════════ */}
        {view.status === 'locked' && (
          <div className="rounded-3xl overflow-hidden shadow-xl shadow-[#16234e]/10 border border-[#16234e]/10 bg-white">
            {/* Héro dégradé */}
            <div className="relative bg-gradient-qrbag px-6 pt-9 pb-8 text-center overflow-hidden">
              <div className="absolute inset-0 opacity-[0.08]" aria-hidden>
                <div className="absolute top-6 left-8 w-24 h-24 rounded-full bg-white/40 blur-2xl" />
                <div className="absolute bottom-0 right-10 w-32 h-32 rounded-full bg-[#ffd200]/60 blur-3xl" />
              </div>
              <div className="relative mx-auto mb-4 w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center rotate-3">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="relative text-xl md:text-2xl font-black text-white mb-1.5">{t('checklist.view_locked')}</h1>
              <p className="relative text-white/85 text-sm max-w-md mx-auto">{t('checklist.view_locked_desc')}</p>
              {/* Liseré arc-en-ciel */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 flex" aria-hidden>
                <div className="flex-1 bg-[#ffd200]" />
                <div className="flex-1 bg-[#f8921f]" />
                <div className="flex-1 bg-[#ef4036]" />
                <div className="flex-1 bg-[#e6216e]" />
                <div className="flex-1 bg-[#8b17c9]" />
              </div>
            </div>

            <div className="p-5 md:p-7">
              {/* Identité de l'attestation */}
              {view.firstName && view.createdAt && (
                <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                  <span className="inline-flex items-center gap-1.5 bg-[#f5f7fc] border border-[#16234e]/10 rounded-full px-3.5 py-1.5 text-xs font-bold text-[#16234e]">
                    <User className="w-3.5 h-3.5 text-[#2f9bff]" />
                    {view.firstName}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-[#f5f7fc] border border-[#16234e]/10 rounded-full px-3.5 py-1.5 text-xs font-bold font-mono text-[#16234e]">
                    <Hash className="w-3.5 h-3.5 text-[#f8921f]" />
                    {view.code}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-[#f5f7fc] border border-[#16234e]/10 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#16234e]/70">
                    <Calendar className="w-3.5 h-3.5 text-[#8b17c9]" />
                    {formatDate(view.createdAt)}
                  </span>
                </div>
              )}

              {/* Clé */}
              <label className="text-xs font-black uppercase tracking-wider text-[#16234e]/50 mb-2 block">
                {t('checklist.view_key_input')}
              </label>
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="w-full px-4 py-3.5 bg-[#f5f7fc] border-2 border-[#16234e]/10 rounded-2xl text-[#16234e] text-base font-mono tracking-[0.3em] text-center uppercase focus:outline-none focus:ring-2 focus:ring-[#e6216e]/40 focus:border-[#e6216e] transition-all min-h-[52px]"
                placeholder={t('checklist.view_key_placeholder')}
                maxLength={8}
                autoFocus
              />

              <button
                onClick={handleVerify}
                disabled={verifying || !keyInput.trim()}
                className="w-full mt-3.5 py-4 px-4 bg-gradient-qrbag text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-[#e6216e]/25 hover:shadow-xl hover:shadow-[#e6216e]/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all min-h-[54px]"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> …
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5" />
                    {t('checklist.view_unlock')}
                  </>
                )}
              </button>

              {view.error && (
                <p className="text-xs text-[#ef4036] text-center mt-3 bg-[#ef4036]/5 border border-[#ef4036]/20 rounded-xl p-2.5">
                  {view.error}
                </p>
              )}

              {/* Réassurance */}
              <div className="grid grid-cols-3 gap-2.5 mt-7">
                {[
                  { icon: ShieldCheck, label: 'Horodaté infalsifiable', color: '#2f9bff' },
                  { icon: QrCode, label: 'Vérifiable en ligne', color: '#f8921f' },
                  { icon: KeyRound, label: 'Accès protégé', color: '#8b17c9' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}14` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <span className="text-[10px] font-bold text-[#16234e]/60 leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              {/* Historique */}
              <div className="mt-7 border-t border-[#16234e]/10 pt-5 text-center">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs text-[#16234e]/60 hover:text-[#16234e] underline underline-offset-2 font-bold transition-colors"
                >
                  {t('checklist.view_history')}
                </button>
                {showHistory && (
                  <div className="mt-4 bg-[#f5f7fc] border border-[#16234e]/10 rounded-2xl p-4 text-left">
                    <p className="text-xs text-[#16234e]/60 mb-2.5">{t('checklist.view_history_desc')}</p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={historyEmail}
                        onChange={(e) => setHistoryEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleHistorySearch()}
                        placeholder={t('checklist.view_history_email')}
                        className="flex-1 px-3.5 py-2.5 bg-white border border-[#16234e]/15 rounded-xl text-sm text-[#16234e] focus:outline-none focus:ring-2 focus:ring-[#2f9bff]/40 focus:border-[#2f9bff] min-h-[44px]"
                      />
                      <button
                        onClick={handleHistorySearch}
                        disabled={historyLoading}
                        className="px-4 py-2.5 bg-[#16234e] text-white rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-[#0f1838] transition-colors disabled:opacity-50 min-h-[44px]"
                      >
                        {historyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        {t('checklist.view_history_search')}
                      </button>
                    </div>
                    {historyItems && (
                      <div className="mt-3 space-y-2">
                        {historyItems.length === 0 ? (
                          <p className="text-xs text-[#16234e]/50 italic">{t('checklist.view_history_empty')}</p>
                        ) : (
                          <>
                            <p className="text-xs font-black text-[#16234e]">{t('checklist.view_history_count', { count: historyItems.length })}</p>
                            {historyItems.map((h) => (
                              <Link
                                key={h.code}
                                href={`/checklist/${h.code}`}
                                className="block bg-white border border-[#16234e]/10 rounded-xl p-3 hover:border-[#2f9bff]/50 hover:shadow-sm transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-mono text-xs font-black text-[#16234e]">{h.code}</div>
                                    <div className="text-[10px] text-[#16234e]/60 mt-0.5">
                                      {h.destinationCountry} · {h.itemsCount} articles
                                    </div>
                                    <div className="text-[10px] text-[#16234e]/40">{formatDate(h.createdAt)}</div>
                                  </div>
                                  <ExternalLink className="w-3.5 h-3.5 text-[#16234e]/40" />
                                </div>
                              </Link>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ UNLOCKED — PREMIUM ═══════════ */}
        {view.status === 'unlocked' && (
          <div className="space-y-5">
            {/* ─── Héro attestation vérifiée ─── */}
            <div className="rounded-3xl overflow-hidden shadow-xl shadow-[#16234e]/10 border border-[#16234e]/10">
              <div className="relative bg-gradient-qrbag px-5 md:px-7 py-6 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.07]" aria-hidden>
                  <div className="absolute -top-4 left-10 w-28 h-28 rounded-full bg-white/50 blur-2xl" />
                  <div className="absolute bottom-0 right-8 w-36 h-36 rounded-full bg-[#ffd200]/60 blur-3xl" />
                </div>
                <div className="relative flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full mb-2.5">
                      <BadgeCheck className="w-3.5 h-3.5 text-[#ffd200]" />
                      {t('checklist.view_verified')}
                    </span>
                    <h1 className="text-lg md:text-xl font-black text-white leading-snug">
                      {view.firstName} {view.lastName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-white/80 font-semibold">
                      <span className="inline-flex items-center gap-1 bg-white/10 rounded-md px-2 py-0.5 font-mono text-white">
                        <Hash className="w-3 h-3" /> {view.code}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {t('checklist.view_created_at')} {formatDate(view.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {t('checklist.view_view_count', { count: view.viewCount || 0 })}
                      </span>
                    </div>
                  </div>
                  <SealBadge dateStr={formatShortDate(view.createdAt)} />
                </div>
                {/* Liseré arc-en-ciel */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 flex" aria-hidden>
                  <div className="flex-1 bg-[#ffd200]" />
                  <div className="flex-1 bg-[#f8921f]" />
                  <div className="flex-1 bg-[#ef4036]" />
                  <div className="flex-1 bg-[#e6216e]" />
                  <div className="flex-1 bg-[#8b17c9]" />
                </div>
              </div>
            </div>

            {/* ─── Carte Voyageur & Vol ─── */}
            <div className="bg-white border border-[#16234e]/10 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-5 md:px-6 py-4 border-b border-[#16234e]/8 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-black text-[#16234e] uppercase tracking-wide">
                  <span className="w-8 h-8 rounded-xl bg-[#2f9bff]/10 flex items-center justify-center">
                    <Plane className="w-4 h-4 text-[#2f9bff]" />
                  </span>
                  {t('checklist.view_passenger_info')}
                </h2>
                <span className="text-[10px] font-mono font-bold text-[#16234e]/40">{view.code}</span>
              </div>
              <div className="p-5 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    { icon: User, label: t('checklist.last_name'), value: (view.lastName || '—').toUpperCase(), color: '#16234e' },
                    { icon: User, label: t('checklist.first_name'), value: view.firstName || '—', color: '#16234e' },
                    { icon: Plane, label: t('checklist.airline'), value: view.airline || '—', color: '#2f9bff' },
                    { icon: Hash, label: t('checklist.view_flight'), value: view.flightNumber || '—', color: '#f8921f' },
                    { icon: Calendar, label: t('checklist.departure_date'), value: formatDateOnly(view.departureDate), color: '#8b17c9' },
                    { icon: MapPin, label: t('checklist.destination_country'), value: view.destinationCountry || '—', color: '#e6216e' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}12` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-[#16234e]/45 font-bold">{label}</div>
                        <div className="text-sm font-bold text-[#16234e] truncate">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Email */}
                <div className="flex items-start gap-3 mt-4 pt-4 border-t border-[#16234e]/8">
                  <div className="w-9 h-9 rounded-xl bg-[#f8921f]/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-[#f8921f]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-[#16234e]/45 font-bold">Email</div>
                    <div className="text-sm font-bold text-[#16234e] truncate">{view.email || '—'}</div>
                  </div>
                </div>
                {/* Série + empreinte */}
                {view.security && (
                  <div className="mt-4 bg-[#f5f7fc] border border-dashed border-[#16234e]/20 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#16234e]/70">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2f9bff]" />
                      {view.security.serial}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#16234e]/70">
                      <Fingerprint className="w-3.5 h-3.5 text-[#e6216e]" />
                      {view.security.fingerprintShort}
                    </span>
                    <span className="text-[9px] text-[#16234e]/40 font-semibold">{t('checklist.view_fingerprint')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Tableau facture ─── */}
            <div className="bg-white border border-[#16234e]/10 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-5 md:px-6 py-4 flex items-center justify-between gap-3 border-b border-[#16234e]/8">
                <h2 className="flex items-center gap-2 text-sm font-black text-[#16234e] uppercase tracking-wide">
                  <span className="w-8 h-8 rounded-xl bg-[#f8921f]/10 flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-[#f8921f]" />
                  </span>
                  {t('checklist.view_items_list')}
                </h2>
                <span className="text-[10px] font-black text-white bg-[#f8921f] rounded-full px-2.5 py-1">
                  {items.length} article{items.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-left">
                  <thead>
                    <tr className="bg-[#16234e] text-white">
                      <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider w-11 text-center">{t('checklist.view_num')}</th>
                      <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider">{t('checklist.view_designation')}</th>
                      <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider w-40">{t('checklist.view_category')}</th>
                      <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-wider w-16 text-right">{t('checklist.qty')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={`${it.category}__${it.name}`} className={idx % 2 === 1 ? 'bg-[#f4f8fe]' : 'bg-white'}>
                        <td className="px-3 py-2.5 text-center font-mono text-xs text-[#16234e]/45 font-bold">{String(idx + 1).padStart(2, '0')}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-sm font-bold text-[#16234e]">{it.name}</span>
                          {(it.color || it.brand) && (
                            <span className="text-xs text-[#16234e]/45 ml-2">
                              {it.color ? `— ${it.color}` : ''}{it.brand ? ` · ${it.brand}` : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: catUiColor(it.category) }}>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catUiColor(it.category) }} />
                            {catLabel(it.category, lang)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-sm font-black text-[#16234e]">×{it.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="bg-[#16234e] px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-black text-[#ffd200] uppercase tracking-widest">{t('checklist.view_total')}</span>
                <span className="text-xs font-bold text-white">
                  {items.length} article{items.length > 1 ? 's' : ''} • {t('checklist.view_units', { count: totalUnits })}
                </span>
              </div>
            </div>

            {/* ─── Photo ─── */}
            {view.hasPhoto && (
              <div className="bg-white border border-[#16234e]/10 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between border-b border-[#16234e]/8">
                  <h2 className="flex items-center gap-2 text-sm font-black text-[#16234e] uppercase tracking-wide">
                    <span className="w-8 h-8 rounded-xl bg-[#8b17c9]/10 flex items-center justify-center">
                      <Camera className="w-4 h-4 text-[#8b17c9]" />
                    </span>
                    {t('checklist.view_photo_title')}
                  </h2>
                  <button
                    onClick={handleDownloadPhoto}
                    className="text-xs font-bold text-[#8b17c9] hover:text-[#e6216e] flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> {t('checklist.view_download_pdf').replace('le PDF', '')}
                  </button>
                </div>
                <div className="p-4">
                  <img
                    src={`/api/checklist/${code}/photo?key=${encodeURIComponent(keyInput.trim())}`}
                    alt={t('checklist.view_photo_title')}
                    className="w-full max-h-72 object-contain rounded-2xl border border-[#16234e]/8"
                  />
                </div>
              </div>
            )}

            {/* ─── Actions ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadPdf}
                className="py-4 px-5 bg-gradient-qrbag text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-[#e6216e]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all min-h-[54px]"
              >
                <Download className="w-5 h-5" />
                {t('checklist.view_download_pdf')}
              </button>
              <button
                onClick={() => window.print()}
                className="py-4 px-5 bg-white text-[#16234e] rounded-2xl font-black flex items-center justify-center gap-2 border-2 border-[#16234e]/10 hover:border-[#2f9bff]/50 hover:bg-[#2f9bff]/5 transition-all min-h-[54px]"
              >
                <Printer className="w-5 h-5 text-[#2f9bff]" />
                {t('checklist.view_print')}
              </button>
            </div>
          </div>
        )}

        {/* ─── Error ─── */}
        {view.status === 'error' && (
          <div className="bg-white border border-[#16234e]/10 rounded-3xl p-10 text-center shadow-sm">
            <AlertTriangle className="w-12 h-12 text-[#ef4036] mx-auto mb-3" />
            <p className="text-[#16234e] font-bold">{view.error || t('checklist.error')}</p>
            <button
              onClick={() => fetchChecklist()}
              className="mt-4 px-5 py-2.5 bg-[#16234e] text-white rounded-xl font-black hover:bg-[#0f1838] transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}
      </section>

      {/* ─── Footer premium ─── */}
      <footer className="mt-auto">
        <div className="h-1.5 flex" aria-hidden>
          <div className="flex-1 bg-[#ffd200]" />
          <div className="flex-1 bg-[#f8921f]" />
          <div className="flex-1 bg-[#ef4036]" />
          <div className="flex-1 bg-[#e6216e]" />
          <div className="flex-1 bg-[#8b17c9]" />
        </div>
        <div className="bg-[#16234e] text-center py-4">
          <p className="text-xs text-white/70 font-medium">
            <CheckCircle2 className="w-3 h-3 inline mr-1 text-[#ffd200]" />
            QRBags — Protection intelligente des bagages • qrbags.com
          </p>
        </div>
      </footer>
    </main>
  );
}
