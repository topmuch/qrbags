'use client'

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, ArrowLeft, CheckCircle, Luggage, Sparkles } from "lucide-react";
import {
  BrandShell,
  BrandCard,
  BrandLogo,
  BrandIconRing,
  brandBadge,
  brandBtnGradient,
  brandBtnOutline,
  brandInput,
  brandLabel,
} from '@/components/brand/BrandShell';

function HajjActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrFromUrl = searchParams.get('qr') || '';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reference: '',
    firstName: '',
    lastName: '',
    airlineName: '',
    flightNumber: '',
    destination: '',
    departureDate: '',
    departureTime: '',
    whatsapp: '',
  });

  // Pre-fill reference from URL
  useEffect(() => {
    if (qrFromUrl) {
      setFormData(prev => ({ ...prev, reference: qrFromUrl.toUpperCase() }));
    }
  }, [qrFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: formData.reference.toUpperCase(),
          travelerFirstName: formData.firstName,
          travelerLastName: formData.lastName,
          whatsappOwner: formData.whatsapp,
          airlineName: formData.airlineName,
          flightNumber: formData.flightNumber,
          destination: formData.destination,
          departureDate: formData.departureDate || undefined,
          departureTime: formData.departureTime || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store activation data for success page
        sessionStorage.setItem('activationData', JSON.stringify({
          reference: formData.reference.toUpperCase(),
          firstName: formData.firstName,
          lastName: formData.lastName,
          whatsapp: formData.whatsapp,
          airlineName: formData.airlineName,
          flightNumber: formData.flightNumber,
          destination: formData.destination,
          type: 'hajj',
          activatedAt: new Date().toISOString(),
          expiresAt: data.baggage?.expiresAt,
        }));
        router.push('/success?type=hajj');
      } else {
        const error = await response.json();
        alert(error.message || 'Erreur lors de l\'activation');
      }
    } catch (error) {
      console.error('Activation error:', error);
      alert('Erreur lors de l\'activation');
    } finally {
      setLoading(false);
    }
  };

  // Variante « Hajj » du champ référence : code QR détecté → touche émeraude (identité Hajj)
  const referenceInputClass = qrFromUrl
    ? 'w-full bg-emerald-50 border-2 border-emerald-400 text-[#16234e] placeholder:text-[#16234e]/35 ' +
      'focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 ' +
      'rounded-xl px-4 py-3 text-lg font-mono min-h-[48px] transition-all duration-200'
    : `${brandInput} font-mono text-lg`;

  return (
    <BrandShell>
      {/* En-tête */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#16234e]/10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link
            href="/"
            aria-label="Retour à l'accueil"
            className={`${brandBtnOutline} inline-flex items-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] text-sm`}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">Retour</span>
          </Link>
          <BrandLogo href="/" className="h-10 sm:h-11 w-auto" />
          <span className={brandBadge}>🕋 Hajj &amp; Omra</span>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
          {/* Bandeau de bienvenue si QR dans l'URL */}
          {qrFromUrl && (
            <BrandCard corners className="mb-10 p-6 sm:p-8 text-center animate-fade-in">
              <div className="flex justify-center mb-4">
                <BrandIconRing size="w-14 h-14" glow="#f8921f">
                  <Sparkles className="w-7 h-7 text-[#f8921f]" />
                </BrandIconRing>
              </div>
              <h2 className="text-xl font-extrabold text-[#16234e] mb-2">
                Bienvenue ! 👋
              </h2>
              <p className="text-[#16234e]/70">
                Activez ce bagage en 30 secondes pour protéger vos effets personnels
              </p>
              <span className="inline-block mt-4 px-4 py-1.5 rounded-full bg-[#16234e] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#16234e]/20">
                ✈️ Hajj 2025
              </span>
            </BrandCard>
          )}

          {/* En-tête principal */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-5">
              <BrandIconRing size="w-16 h-16" glow="#2f9bff">
                <Plane className="w-8 h-8 text-[#16234e]" />
              </BrandIconRing>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#16234e] mb-3">
              Activation Bagage <span className="text-gradient-qrbag">Hajj</span>
            </h1>
            <p className="text-[#16234e]/70 text-lg">
              Activez vos bagages en 30 secondes
            </p>
          </div>

          {/* Carte formulaire — coins viewfinder QR */}
          <BrandCard corners className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6 text-[#16234e]">
              <Luggage className="w-5 h-5 text-[#2f9bff]" aria-hidden />
              <h2 className="text-lg font-bold">Informations du pèlerin</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* QR Reference */}
              <div>
                <label htmlFor="reference" className={brandLabel}>
                  Code de référence QR *
                </label>
                <input
                  id="reference"
                  placeholder="HAJJ26-XXXXXX"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value.toUpperCase() })}
                  className={referenceInputClass}
                  aria-describedby="reference-help"
                  required
                  readOnly={!!qrFromUrl}
                />
                <p id="reference-help" className={`mt-2 text-sm ${qrFromUrl ? 'text-emerald-600 font-semibold' : 'text-[#16234e]/50'}`}>
                  {qrFromUrl 
                    ? '✓ Code QR détecté automatiquement' 
                    : 'Entrez le code inscrit sur votre autocollant QR'}
                </p>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className={brandLabel}>
                    Prénom *
                  </label>
                  <input
                    id="firstName"
                    placeholder="Ahmed"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={brandInput}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className={brandLabel}>
                    Nom *
                  </label>
                  <input
                    id="lastName"
                    placeholder="Diop"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={brandInput}
                    required
                  />
                </div>
              </div>

              {/* Airline Name */}
              <div>
                <label htmlFor="airlineName" className={brandLabel}>
                  Compagnie aérienne
                </label>
                <input
                  id="airlineName"
                  placeholder="Ex: Saudi Airlines, Royal Air Maroc"
                  value={formData.airlineName}
                  onChange={(e) => setFormData({ ...formData, airlineName: e.target.value })}
                  className={brandInput}
                />
              </div>

              {/* Flight, Destination, Departure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="flightNumber" className={brandLabel}>
                    Numéro de vol
                  </label>
                  <input
                    id="flightNumber"
                    placeholder="SV1234"
                    value={formData.flightNumber}
                    onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value.toUpperCase() })}
                    className={brandInput}
                  />
                </div>
                <div>
                  <label htmlFor="destination" className={brandLabel}>
                    Destination
                  </label>
                  <input
                    id="destination"
                    placeholder="Djeddah"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className={brandInput}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="departureDate" className={brandLabel}>
                    Date de départ
                  </label>
                  <input
                    id="departureDate"
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className={brandInput}
                  />
                </div>
                <div>
                  <label htmlFor="departureTime" className={brandLabel}>
                    Heure de départ
                  </label>
                  <input
                    id="departureTime"
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    className={brandInput}
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label htmlFor="whatsapp" className={brandLabel}>
                  Numéro WhatsApp (chef de groupe) *
                </label>
                <input
                  id="whatsapp"
                  type="tel"
                  placeholder="+221 78 485 82 26"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className={brandInput}
                  required
                />
                <p className="mt-2 text-[#16234e]/50 text-sm">
                  Ce numéro recevra les notifications si vos bagages sont trouvés
                </p>
              </div>

              {/* Encart info */}
              <div className="bg-[#16234e]/[0.04] border border-[#16234e]/10 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-[#16234e]">
                  <CheckCircle className="w-4 h-4 text-emerald-600" aria-hidden />
                  <span className="text-sm font-bold">3 bagages seront activés</span>
                </div>
                <p className="text-[#16234e]/60 text-sm">
                  1 bagage cabine + 2 bagages soute - Protection de 60 jours
                </p>
              </div>

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={loading}
                className={`${brandBtnGradient} w-full inline-flex items-center justify-center px-6 py-3.5 min-h-[52px] text-lg cursor-pointer`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden />
                    Activation en cours...
                  </span>
                ) : (
                  'Activer mes bagages'
                )}
              </button>
            </form>
          </BrandCard>

          {/* Aide */}
          <div className="mt-8 text-center">
            <p className="text-[#16234e]/60 text-sm">
              Besoin d&apos;aide ? Contactez votre agence ou{' '}
              <a href="mailto:contact@qrbag.com" className="text-[#2f9bff] font-semibold hover:underline">
                contact@qrbag.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </BrandShell>
  );
}

export default function HajjActivatePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#16234e] relative flex items-center justify-center">
        <div className="absolute inset-0 dotted-map-light pointer-events-none" aria-hidden />
        <div className="text-center text-white relative">
          <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4" aria-hidden />
          <p>Chargement...</p>
        </div>
      </main>
    }>
      <HajjActivateContent />
    </Suspense>
  );
}
