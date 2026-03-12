'use client'

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Luggage, 
  QrCode, 
  ArrowLeft, 
  CheckCircle,
  Plane,
  Camera,
  FileText,
  Sparkles
} from "lucide-react";

function InscrireContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrFromUrl = searchParams.get('qr') || '';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reference: '',
    firstName: '',
    lastName: '',
    flightNumber: '',
    destination: '',
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
          flightNumber: formData.flightNumber,
          destination: formData.destination,
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
          flightNumber: formData.flightNumber,
          destination: formData.destination,
          type: 'voyageur',
          activatedAt: new Date().toISOString(),
          expiresAt: data.baggage?.expiresAt,
        }));
        router.push('/success?type=voyageur');
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#d35400] to-[#b34700]">
      {/* Navigation */}
      <nav className="bg-[#d35400]/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white">
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">QRBag</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Welcome Banner if QR from URL */}
        {qrFromUrl && (
          <div className="mb-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#fbbf24]/20 rounded-full mb-4">
              <Sparkles className="w-7 h-7 text-[#fbbf24]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Bienvenue ! ✨
            </h2>
            <p className="text-white/70">
              Activez ce bagage pour protéger vos effets personnels
            </p>
            <Badge className="mt-3 bg-[#f59e0b]/20 text-[#fbbf24]">
              🧳 Voyageur
            </Badge>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
            <Luggage className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Activation Bagage Voyageur
          </h1>
          <p className="text-white/70 text-lg">
            Protégez vos bagages pour votre voyage
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={qrFromUrl ? "manual" : "manual"} className="mb-8">
          <TabsList className="grid w-full grid-cols-2 bg-white/10">
            <TabsTrigger value="manual" className="data-[state=active]:bg-white data-[state=active]:text-[#d35400]">
              <FileText className="w-4 h-4 mr-2" />
              Remplir manuellement
            </TabsTrigger>
            <TabsTrigger value="scan" className="data-[state=active]:bg-white data-[state=active]:text-[#d35400]">
              <Camera className="w-4 h-4 mr-2" />
              Scanner billet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6 text-center">
                <div className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-12 h-12 text-white/60" />
                </div>
                <h3 className="text-white font-semibold mb-2">
                  Scanner votre billet
                </h3>
                <p className="text-white/60 text-sm mb-6">
                  Si votre billet contient un QR code, scannez-le pour remplir automatiquement les informations
                </p>
                <Button className="bg-white text-[#d35400] hover:bg-white/90">
                  <Camera className="w-4 h-4 mr-2" />
                  Ouvrir la caméra
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            {/* Form Card */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plane className="w-5 h-5" />
                  Informations du voyageur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* QR Reference */}
                  <div className="space-y-2">
                    <Label htmlFor="reference" className="text-white">
                      Code de référence QR *
                    </Label>
                    <Input
                      id="reference"
                      placeholder="VOL26-XXXXXX"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value.toUpperCase() })}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white font-mono text-lg ${qrFromUrl ? 'border-[#fbbf24]/50 bg-[#fbbf24]/5' : ''}`}
                      required
                      readOnly={!!qrFromUrl}
                    />
                    <p className="text-white/50 text-sm">
                      {qrFromUrl 
                        ? '✓ Code QR détecté automatiquement' 
                        : 'Entrez le code inscrit sur votre autocollant QR'}
                    </p>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-white">
                        Prénom *
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="Marie"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-white">
                        Nom *
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Dupont"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        required
                      />
                    </div>
                  </div>

                  {/* Flight Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="flightNumber" className="text-white">
                        Numéro de vol
                      </Label>
                      <Input
                        id="flightNumber"
                        placeholder="AF1234"
                        value={formData.flightNumber}
                        onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value.toUpperCase() })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destination" className="text-white">
                        Destination
                      </Label>
                      <Input
                        id="destination"
                        placeholder="Tokyo"
                        value={formData.destination}
                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      />
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-white">
                      Numéro WhatsApp *
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="+33 6 12 34 56 78"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      required
                    />
                    <p className="text-white/50 text-sm">
                      Ce numéro recevra les notifications si vos bagages sont trouvés
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="bg-white/10 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-white">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Protection activée</span>
                    </div>
                    <p className="text-white/60 text-sm">
                      Sticker : 5 jours | Étiquette : 1 an
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-[#d35400] hover:bg-white/90 h-12 text-lg font-semibold"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-[#d35400]/30 border-t-[#d35400] rounded-full animate-spin" />
                        Activation en cours...
                      </span>
                    ) : (
                      'Activer mon bagage'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            Pas encore de code QR ?{' '}
            <Link href="/#pricing" className="text-white underline">
              Commander un autocollant
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function InscrirePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-[#d35400] to-[#b34700] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </main>
    }>
      <InscrireContent />
    </Suspense>
  );
}
