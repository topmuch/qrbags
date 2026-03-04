'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/NewAdminLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode,
  RefreshCw,
  Download,
  CheckCircle
} from "lucide-react";

// Types
interface Agency {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
}

export default function GenererQRPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrGenerating, setQrGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [qrForm, setQrForm] = useState({
    type: 'hajj',
    agencyId: '',
    count: 3,
    travelerCount: 1,
  });

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/agencies');
      const data = await res.json();
      setAgencies(data.agencies || []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (qrForm.type === 'hajj' && !qrForm.agencyId) {
      setErrorMessage('Veuillez sélectionner une agence pour le type Hajj');
      return;
    }
    
    setQrGenerating(true);
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/admin/baggages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qrForm),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage(`✅ ${data.generated} codes QR générés avec succès !`);
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(data.error || 'Erreur lors de la génération');
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
      setErrorMessage('Erreur lors de la génération des QR codes');
    } finally {
      setQrGenerating(false);
    }
  };

  return (
    <AdminLayout 
      title="Génération de QR Codes"
      subtitle="Créez des lots de QR codes anti-fraude pour vos pèlerins et voyageurs"
    >
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#ff7f00]" />
                Nouvelle génération
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Type de voyage</Label>
                <Select 
                  value={qrForm.type} 
                  onValueChange={(v) => setQrForm({ ...qrForm, type: v })}
                >
                  <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="hajj">Hajj (Pèlerinage)</SelectItem>
                    <SelectItem value="voyageur">Voyageur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {qrForm.type === 'hajj' && (
                <div className="space-y-2">
                  <Label className="text-slate-700">Agence</Label>
                  <Select 
                    value={qrForm.agencyId} 
                    onValueChange={(v) => setQrForm({ ...qrForm, agencyId: v })}
                  >
                    <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                      <SelectValue placeholder="Sélectionner une agence" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Nombre de pèlerins/voyageurs</Label>
                  <Input 
                    type="number"
                    min={1}
                    max={1000}
                    value={qrForm.travelerCount}
                    onChange={(e) => setQrForm({ ...qrForm, travelerCount: parseInt(e.target.value) || 1 })}
                    className="bg-white border-slate-200 text-slate-800"
                  />
                </div>
                {qrForm.type === 'voyageur' && (
                  <div className="space-y-2">
                    <Label className="text-slate-700">Bagages par voyageur</Label>
                    <Select 
                      value={String(qrForm.count)} 
                      onValueChange={(v) => setQrForm({ ...qrForm, count: parseInt(v) })}
                    >
                      <SelectTrigger className="bg-white border-slate-200 text-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        <SelectItem value="1">1 bagage</SelectItem>
                        <SelectItem value="3">3 bagages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {errorMessage}
                </div>
              )}
              
              {qrForm.type === 'hajj' && (
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                  <p>ℹ️ Pour le Hajj, chaque pèlerin reçoit automatiquement 3 bagages (1 cabine + 2 soutes)</p>
                </div>
              )}

              <Button 
                className="w-full bg-black hover:bg-slate-800 text-white rounded-xl"
                onClick={handleGenerateQR}
                disabled={qrGenerating}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${qrGenerating ? 'animate-spin' : ''}`} />
                {qrGenerating ? 'Génération en cours...' : `Générer ${qrForm.type === 'hajj' ? qrForm.travelerCount * 3 : qrForm.travelerCount * qrForm.count} codes QR`}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Download className="w-5 h-5 text-black" />
                Export PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 text-sm">
                Après génération, vous pourrez télécharger un PDF prêt à imprimer avec tous les stickers QR.
              </p>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-800 mb-2">Format du PDF :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>QR code avec référence</li>
                  <li>Icône indicateur (Hajj/Voyageur)</li>
                  <li>Format sticker standard</li>
                  <li>Prêt pour impression</li>
                </ul>
              </div>
              <Button 
                className="w-full rounded-xl" 
                variant="outline"
                disabled
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger le PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4">
            <div className="text-2xl font-bold text-slate-800">{agencies.length}</div>
            <div className="text-slate-500 text-sm">Agences</div>
          </div>
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4">
            <div className="text-2xl font-bold text-[#ff7f00]">{qrForm.type === 'hajj' ? qrForm.travelerCount * 3 : qrForm.travelerCount * qrForm.count}</div>
            <div className="text-slate-500 text-sm">QR à générer</div>
          </div>
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4">
            <div className="text-2xl font-bold text-emerald-600">Hajj 2026</div>
            <div className="text-slate-500 text-sm">Saison active</div>
          </div>
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4">
            <div className="text-2xl font-bold text-violet-600">Anti-fraude</div>
            <div className="text-slate-500 text-sm">Sécurité</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
