'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/public/PublicLayout';
import { QRCodeSVG } from 'qrcode.react';
import {
  brandBadge,
  brandBtnGradient,
  brandInput,
  brandLabel,
} from '@/components/brand/BrandShell';
import { toast } from '@/hooks/use-toast';
import {
  QrCode,
  MapPin,
  MessageCircle,
  CheckCircle2,
  Smartphone,
  Plane,
  RefreshCw,
  Send,
  ScanLine,
  Clock,
  ShieldCheck,
  Loader2,
  ExternalLink,
  BellRing,
  History,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

// ─── Types ───
interface DemoScan {
  id: string;
  location: string | null;
  city: string | null;
  country: string | null;
  message: string | null;
  finderName: string | null;
  finderPhone: string | null;
  whatsappStatus: string | null;
  createdAt: string;
}

interface DemoBag {
  reference: string;
  status: string;
  travelerName: string;
  airlineName: string | null;
  flightNumber: string | null;
  destination: string | null;
  baggageType: string | null;
  lastScanDate: string | null;
  lastLocation: string | null;
}

const DEMO_REFERENCE = 'DEMO-QRBAG';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Page Démo réelle ───
export default function DemoPage() {
  const [bag, setBag] = useState<DemoBag | null>(null);
  const [scans, setScans] = useState<DemoScan[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [whatsappMessage, setWhatsappMessage] = useState<string | null>(null);
  const [scanUrl, setScanUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Formulaire de simulation
  const [location, setLocation] = useState('');
  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [scanMessage, setScanMessage] = useState('');

  /** Charge l'état réel du bagage démo depuis l'API */
  const loadDemo = useCallback(async () => {
    try {
      const res = await fetch('/api/demo', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setBag(data.bag);
        setScans(data.scans || []);
        setLocations(data.locations || []);
        setLocation((prev) => prev || data.locations?.[0] || '');
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger la démo.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setScanUrl(`${window.location.origin}/scan/${DEMO_REFERENCE}`);
    loadDemo();
  }, [loadDemo]);

  /** Réinitialise la démo (supprime scans + remet le bagage à neuf) */
  const resetDemo = useCallback(async (announce = true) => {
    setResetting(true);
    try {
      const res = await fetch('/api/demo', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setScans([]);
        setWhatsappMessage(null);
        setFinderName('');
        setFinderPhone('');
        setScanMessage('');
        setBag((prev) => (prev ? { ...prev, status: 'active', lastLocation: null, lastScanDate: null } : prev));
        if (announce) {
          toast({ title: 'Démo réinitialisée ✨', description: 'Le bagage démo est redevenu comme neuf.' });
        }
      } else {
        throw new Error(data.error);
      }
    } catch {
      toast({ title: 'Erreur', description: 'La réinitialisation a échoué.', variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  }, []);

  /** Démarrer la démo = remise à zéro garantie puis rechargement */
  const startDemo = async () => {
    await resetDemo(false);
    await loadDemo();
    toast({ title: 'Démo prête !', description: 'Un vrai bagage QRBag vous attend.' });
  };

  /** Simule un scan trouveur → crée un VRAI ScanLog en base */
  const simulateScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: location || locations[0],
          finderName: finderName || undefined,
          finderPhone: finderPhone || undefined,
          message: scanMessage || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScans(data.scans || []);
        setWhatsappMessage(data.whatsappMessage || null);
        setBag((prev) =>
          prev
            ? { ...prev, status: 'scanned', lastLocation: location || locations[0], lastScanDate: new Date().toISOString() }
            : prev
        );
        toast({ title: 'Scan enregistré !', description: 'Le propriétaire a été « notifié » (démo).' });
      } else {
        throw new Error(data.error);
      }
    } catch {
      toast({ title: 'Erreur', description: 'La simulation du scan a échoué.', variant: 'destructive' });
    } finally {
      setScanning(false);
    }
  };

  const statusLabel =
    bag?.status === 'scanned' ? 'Scanné' : bag?.status === 'active' ? 'Actif' : bag?.status || '—';

  return (
    <PublicLayout paddingTop="pt-20">
      {/* Panneau principal — bandeau navy étiquette QRBag */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0e1734] to-[#16234e]">
        {/* Liseré dégradé signature + texture pointillée + halos */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-qrbag" aria-hidden />
        <div className="absolute inset-0 dotted-map-light opacity-60 pointer-events-none" aria-hidden />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#e6216e]/15 rounded-full blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#2f9bff]/15 rounded-full blur-3xl pointer-events-none" aria-hidden />

        <div className="max-w-6xl mx-auto px-4 py-10 relative z-10">
          {/* ─── HERO ─── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-5">
              <span className={brandBadge}>
                <Sparkles className="w-3.5 h-3.5" aria-hidden />
                Démonstration réelle — rien de simulé
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5">
              <span className="text-gradient-qrbag">Essayez QRBag</span>
              <br />
              <span className="text-white">en conditions réelles</span>
            </h1>

            <p className="text-white/70 max-w-2xl mx-auto mb-8 text-lg">
              Un vrai bagage est enregistré dans notre système : <strong className="text-white font-mono">{DEMO_REFERENCE}</strong>.
              Scannez son QR avec votre téléphone, jouez le rôle d&apos;un trouveur,
              et voyez ce que reçoit le propriétaire. La démo se réinitialise à tout moment.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={startDemo}
                disabled={resetting}
                className={`${brandBtnGradient} px-8 py-4 text-lg min-h-[52px] inline-flex items-center gap-2`}
              >
                {resetting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                    Préparation…
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-5 h-5" aria-hidden />
                    Démarrer / Réinitialiser la démo
                  </>
                )}
              </button>
              <Link
                href={`/scan/${DEMO_REFERENCE}`}
                className="inline-flex items-center gap-2 px-6 py-4 min-h-[52px] rounded-2xl border-2 border-white/25 text-white font-semibold hover:bg-white/10 transition-all"
              >
                <ExternalLink className="w-5 h-5" aria-hidden />
                Ouvrir la page trouveur
              </Link>
            </div>

            <p className="mt-5 text-white/50 text-sm flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2f9bff]" aria-hidden />
              Aucun SMS ni WhatsApp réel n&apos;est envoyé pendant la démo.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-white/70">
              <Loader2 className="w-8 h-8 animate-spin mr-3" aria-hidden />
              Chargement du bagage démo…
            </div>
          ) : (
            <>
              {/* ─── 3 CARTES ─── */}
              <div className="grid md:grid-cols-3 gap-5 mb-8">
                {/* Carte 1 — Le bagage + QR réel */}
                <div className="bg-white rounded-3xl p-6 border border-[#16234e]/10 shadow-2xl shadow-[#16234e]/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-qrbag flex items-center justify-center shrink-0">
                      <Plane className="w-5 h-5 text-white" aria-hidden />
                    </div>
                    <div>
                      <h2 className="text-[#16234e] font-bold leading-tight">Le bagage du voyageur</h2>
                      <p className="text-[#16234e]/50 text-xs">Enregistré réellement dans QRBag</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-5">
                    <div className="flex items-center gap-2 text-[#16234e]/80">
                      <QrCode className="w-4 h-4 text-[#8b17c9]" aria-hidden />
                      <span className="font-mono font-bold">{bag?.reference}</span>
                      <span
                        className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${
                          bag?.status === 'scanned'
                            ? 'bg-[#f8921f]/15 text-[#e07c0a]'
                            : 'bg-emerald-500/15 text-emerald-600'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-[#16234e]/70 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2f9bff]" aria-hidden />
                      {bag?.travelerName}
                    </p>
                    <p className="text-[#16234e]/70 flex items-center gap-2">
                      <Plane className="w-4 h-4 text-[#e6216e]" aria-hidden />
                      {bag?.airlineName} {bag?.flightNumber} → {bag?.destination}
                    </p>
                    <p className="text-[#16234e]/70 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#f8921f]" aria-hidden />
                      Bagage {bag?.baggageType === 'soute' ? 'en soute' : 'cabine'}
                    </p>
                  </div>

                  {/* QR réel scannable */}
                  <div className="bg-white border-2 border-[#16234e]/10 rounded-2xl p-4 flex flex-col items-center">
                    {scanUrl && (
                      <QRCodeSVG
                        value={scanUrl}
                        size={140}
                        bgColor="#ffffff"
                        fgColor="#16234e"
                        level="M"
                        aria-label={`QR code du bagage démo ${DEMO_REFERENCE}`}
                      />
                    )}
                    <p className="text-[#16234e]/60 text-xs mt-3 text-center">
                      Scannez ce QR avec votre téléphone pour ouvrir la <strong>vraie</strong> page trouveur
                    </p>
                  </div>
                </div>

                {/* Carte 2 — Simuler un scan */}
                <div className="bg-white rounded-3xl p-6 border border-[#16234e]/10 shadow-2xl shadow-[#16234e]/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-qrbag flex items-center justify-center shrink-0">
                      <ScanLine className="w-5 h-5 text-white" aria-hidden />
                    </div>
                    <div>
                      <h2 className="text-[#16234e] font-bold leading-tight">Jouer le trouveur</h2>
                      <p className="text-[#16234e]/50 text-xs">Simulez la personne qui trouve le bagage</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor="demo-location" className={brandLabel}>
                        Où le bagage a été trouvé ?
                      </label>
                      <select
                        id="demo-location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className={brandInput}
                      >
                        {locations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="demo-finder-name" className={brandLabel}>
                        Votre nom (optionnel)
                      </label>
                      <input
                        id="demo-finder-name"
                        type="text"
                        value={finderName}
                        onChange={(e) => setFinderName(e.target.value)}
                        className={brandInput}
                        placeholder="Ex : Fatou Ndiaye"
                        maxLength={60}
                      />
                    </div>
                    <div>
                      <label htmlFor="demo-finder-phone" className={brandLabel}>
                        Votre WhatsApp (optionnel)
                      </label>
                      <input
                        id="demo-finder-phone"
                        type="tel"
                        value={finderPhone}
                        onChange={(e) => setFinderPhone(e.target.value)}
                        className={brandInput}
                        placeholder="+221 77 000 00 00"
                        maxLength={30}
                      />
                    </div>
                    <div>
                      <label htmlFor="demo-message" className={brandLabel}>
                        Message au propriétaire (optionnel)
                      </label>
                      <input
                        id="demo-message"
                        type="text"
                        value={scanMessage}
                        onChange={(e) => setScanMessage(e.target.value)}
                        className={brandInput}
                        placeholder="Je garde votre bagage en sécurité"
                        maxLength={300}
                      />
                    </div>

                    <button
                      onClick={simulateScan}
                      disabled={scanning}
                      className={`${brandBtnGradient} w-full min-h-[52px] inline-flex items-center justify-center gap-2`}
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                          Enregistrement…
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" aria-hidden />
                          Simuler le scan du trouveur
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Carte 3 — Notification propriétaire */}
                <div className="bg-white rounded-3xl p-6 border border-[#16234e]/10 shadow-2xl shadow-[#16234e]/10 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-qrbag flex items-center justify-center shrink-0">
                      <BellRing className="w-5 h-5 text-white" aria-hidden />
                    </div>
                    <div>
                      <h2 className="text-[#16234e] font-bold leading-tight">Côté propriétaire</h2>
                      <p className="text-[#16234e]/50 text-xs">Ce qu&apos;Ahmed reçoit instantanément</p>
                    </div>
                  </div>

                  {whatsappMessage ? (
                    <div className="flex-1 flex flex-col">
                      {/* Bulle style WhatsApp */}
                      <div className="flex-1 bg-[#e7ffdb] rounded-2xl p-4 border border-[#25d366]/30 relative">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#25d366]/20">
                          <MessageCircle className="w-4 h-4 text-[#128c4b]" aria-hidden />
                          <span className="text-[#128c4b] text-xs font-semibold">QRBag • maintenant</span>
                        </div>
                        <p className="text-[#16234e] text-sm whitespace-pre-line leading-relaxed">
                          {whatsappMessage}
                        </p>
                      </div>
                      <p className="text-[#16234e]/40 text-xs mt-3 text-center">
                        En version réelle, ce message part sur WhatsApp en quelques secondes.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-[#16234e]/5 flex items-center justify-center mb-4">
                        <Smartphone className="w-8 h-8 text-[#16234e]/30" aria-hidden />
                      </div>
                      <p className="text-[#16234e]/50 text-sm max-w-[220px]">
                        Simulez un scan ci-contre pour voir la notification du propriétaire apparaître ici.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── JOURNAL DES SCANS RÉELS ─── */}
              <div className="bg-white/5 backdrop-blur rounded-3xl p-6 border border-white/10 mb-8">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    <History className="w-5 h-5 text-[#f8921f]" aria-hidden />
                    Journal des scans — données réelles
                    <span className="text-white/40 text-sm font-normal">
                      ({scans.length} scan{scans.length > 1 ? 's' : ''})
                    </span>
                  </h2>
                  <button
                    onClick={() => resetDemo()}
                    disabled={resetting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-white/80 text-sm hover:bg-white/10 hover:text-white transition-all min-h-[44px] disabled:opacity-50"
                  >
                    {resetting ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw className="w-4 h-4" aria-hidden />
                    )}
                    Réinitialiser la démo
                  </button>
                </div>

                {scans.length === 0 ? (
                  <div className="text-center py-10">
                    <ScanLine className="w-10 h-10 text-white/20 mx-auto mb-3" aria-hidden />
                    <p className="text-white/50 text-sm">
                      Aucun scan pour le moment. Simulez un scan ou scannez le QR avec votre téléphone.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {scans.map((scan) => (
                      <li
                        key={scan.id}
                        className="flex items-start gap-3 bg-white/5 rounded-2xl p-4 border border-white/10"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-qrbag flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-white" aria-hidden />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white font-semibold text-sm">{scan.location || scan.city}</p>
                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#2f9bff]/20 text-[#2f9bff] font-bold">
                              {scan.whatsappStatus === 'demo' ? 'démo' : scan.whatsappStatus || 'scan'}
                            </span>
                          </div>
                          <p className="text-white/50 text-xs mt-1">
                            {formatDateTime(scan.createdAt)}
                            {scan.finderName ? ` • Trouvé par ${scan.finderName}` : ''}
                            {scan.finderPhone ? ` • ${scan.finderPhone}` : ''}
                          </p>
                          {scan.message && (
                            <p className="text-white/70 text-xs mt-1 italic">« {scan.message} »</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* ─── RÉCAP ─── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  { icon: Smartphone, label: 'Sans application', color: '#2f9bff' },
                  { icon: ScanLine, label: 'Scan = notification', color: '#f8921f' },
                  { icon: MapPin, label: 'Position du trouveur', color: '#8b17c9' },
                  { icon: ShieldCheck, label: 'Données protégées', color: '#e6216e' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-4 border border-[#16234e]/10 shadow-lg shadow-[#16234e]/5 text-center"
                  >
                    <item.icon className="w-6 h-6 mx-auto mb-2" style={{ color: item.color }} aria-hidden />
                    <span className="text-[#16234e]/70 text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
