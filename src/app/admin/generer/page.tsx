'use client';

import { useState, useEffect } from 'react';
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
  CheckCircle,
  User,
  Building2,
  Package,
  AlertCircle,
  Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

type GenerationContext = 'individual' | 'agency';

export default function GenererQRPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrGenerating, setQrGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Context selection
  const [context, setContext] = useState<GenerationContext>('agency');
  
  // Individual form
  const [individualForm, setIndividualForm] = useState({
    firstName: '',
    lastName: '',
    whatsapp: '',
    duration: '7d' as '7d' | '1y',
    baggageCount: 1 as 1 | 3,
  });
  
  // Agency form
  const [agencyForm, setAgencyForm] = useState({
    type: 'hajj' as 'hajj' | 'voyageur',
    agencyId: '',
    travelerCount: 1,
    baggagePerTraveler: 3 as 1 | 3,
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

  // Calculate QR count for display
  const getQrCount = () => {
    if (context === 'individual') {
      return individualForm.baggageCount;
    }
    return agencyForm.type === 'hajj' 
      ? agencyForm.travelerCount * 3 
      : agencyForm.travelerCount * agencyForm.baggagePerTraveler;
  };

  // Validate individual form
  const validateIndividualForm = (): boolean => {
    if (!individualForm.firstName.trim()) {
      setErrorMessage('Le prénom est requis');
      return false;
    }
    if (!individualForm.lastName.trim()) {
      setErrorMessage('Le nom est requis');
      return false;
    }
    if (!individualForm.whatsapp.trim()) {
      setErrorMessage('Le numéro WhatsApp est requis');
      return false;
    }
    // Basic WhatsApp format validation
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    if (!phoneRegex.test(individualForm.whatsapp.replace(/\s/g, ''))) {
      setErrorMessage('Format WhatsApp invalide (ex: +33612345678)');
      return false;
    }
    return true;
  };

  // Validate agency form
  const validateAgencyForm = (): boolean => {
    if (!agencyForm.agencyId) {
      setErrorMessage('Veuillez sélectionner une agence');
      return false;
    }
    return true;
  };

  const handleGenerateQR = async () => {
    setErrorMessage('');
    
    // Validate based on context
    if (context === 'individual' && !validateIndividualForm()) {
      return;
    }
    if (context === 'agency' && !validateAgencyForm()) {
      return;
    }
    
    setQrGenerating(true);
    
    try {
      const payload = context === 'individual' 
        ? {
            context: 'individual',
            type: 'voyageur' as const,
            firstName: individualForm.firstName.trim(),
            lastName: individualForm.lastName.trim(),
            whatsapp: individualForm.whatsapp.trim(),
            duration: individualForm.duration,
            baggageCount: individualForm.baggageCount,
          }
        : {
            context: 'agency',
            type: agencyForm.type,
            agencyId: agencyForm.agencyId,
            travelerCount: agencyForm.travelerCount,
            count: agencyForm.type === 'hajj' ? 3 : agencyForm.baggagePerTraveler,
          };
      
      const response = await fetch('/api/admin/baggages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage(`✅ ${data.generated} codes QR générés avec succès !`);
        // Reset individual form
        if (context === 'individual') {
          setIndividualForm({
            firstName: '',
            lastName: '',
            whatsapp: '',
            duration: '7d',
            baggageCount: 1,
          });
        }
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
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Génération de QR Codes</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Créez des QR codes anti-fraude pour vos voyageurs</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Context Selector */}
      <div className="mb-6">
        <Label className="text-slate-700 dark:text-slate-300 mb-3">Mode de génération</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            onClick={() => setContext('individual')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border transition-all",
              context === 'individual' 
                ? "bg-[#ff7f00] border-[#ff7f00] text-white" 
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
            )}
          >
            <User className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Voyageur individuel</p>
              <p className="text-xs opacity-80">1 voyageur, sans agence</p>
            </div>
          </button>
          <button
            onClick={() => setContext('agency')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border transition-all",
              context === 'agency' 
                ? "bg-[#ff7f00] border-[#ff7f00] text-white" 
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
            )}
          >
            <Building2 className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Agence partenaire</p>
              <p className="text-xs opacity-80">Génération en masse pour agence</p>
            </div>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Main Form Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-500" />
              {context === 'individual' ? 'Voyageur individuel' : 'Génération agence'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Individual Form */}
            {context === 'individual' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Prénom *</Label>
                    <Input 
                      value={individualForm.firstName}
                      onChange={(e) => setIndividualForm({ ...individualForm, firstName: e.target.value })}
                      placeholder="Ahmed"
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Nom *</Label>
                    <Input 
                      value={individualForm.lastName}
                      onChange={(e) => setIndividualForm({ ...individualForm, lastName: e.target.value })}
                      placeholder="Diop"
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">WhatsApp *</Label>
                  <Input 
                    value={individualForm.whatsapp}
                    onChange={(e) => setIndividualForm({ ...individualForm, whatsapp: e.target.value })}
                    placeholder="+33612345678"
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Durée</Label>
                    <Select 
                      value={individualForm.duration} 
                      onValueChange={(v) => setIndividualForm({ ...individualForm, duration: v as '7d' | '1y' })}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <SelectItem value="7d">7 jours</SelectItem>
                        <SelectItem value="1y">1 an</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Bagages</Label>
                    <Select 
                      value={String(individualForm.baggageCount)} 
                      onValueChange={(v) => setIndividualForm({ ...individualForm, baggageCount: parseInt(v) as 1 | 3 })}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <SelectItem value="1">1 bagage</SelectItem>
                        <SelectItem value="3">3 bagages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
                  <p className="font-medium">ℹ️ Le QR sera actif immédiatement avec les informations du voyageur.</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-300">
                  <p><strong>Statut :</strong> Actif immédiatement • les infos voyageur sont pré-remplies.</p>
                  <p><strong>Expiration :</strong> {individualForm.duration === '7d' ? '7 jours' : '1 an'} à partir de la génération</p>
                </div>
              </>
            ) : (
              /* Agency Form */
              <>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Type de voyage</Label>
                  <Select 
                    value={agencyForm.type} 
                    onValueChange={(v) => setAgencyForm({ ...agencyForm, type: v as 'hajj' | 'voyageur' })}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectItem value="hajj">Hajj (Pèlerinage)</SelectItem>
                      <SelectItem value="voyageur">Voyageur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Agence partenaire *</Label>
                  <Select 
                    value={agencyForm.agencyId} 
                    onValueChange={(v) => setAgencyForm({ ...agencyForm, agencyId: v })}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
                      <SelectValue placeholder="Sélectionner une agence" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      {agencies.filter(a => a.active).map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">
                      {agencyForm.type === 'hajj' ? 'Nombre de pèlerins' : 'Nombre de voyageurs'}
                    </Label>
                    <Input 
                      type="number"
                      min={1}
                      max={1000}
                      value={agencyForm.travelerCount}
                      onChange={(e) => setAgencyForm({ ...agencyForm, travelerCount: parseInt(e.target.value) || 1 })}
                      className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                    />
                  </div>
                  {agencyForm.type === 'voyageur' && (
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300">Bagages par voyageur</Label>
                      <Select 
                        value={String(agencyForm.baggagePerTraveler)} 
                        onValueChange={(v) => setAgencyForm({ ...agencyForm, baggagePerTraveler: parseInt(v) as 1 | 3 })}
                      >
                        <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          <SelectItem value="1">1 bagage</SelectItem>
                          <SelectItem value="3">3 bagages</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {agencyForm.type === 'hajj' && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-300">
                    <p>ℹ️ Pour le Hajj, chaque pèlerin reçoit automatiquement 3 bagages (1 cabine + 2 soutes)</p>
                  </div>
                )}
              </>
            )}

            {errorMessage && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </div>
            )}
            
            <Button 
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
              onClick={handleGenerateQR}
              disabled={qrGenerating}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", qrGenerating ? 'animate-spin' : '')} />
              {qrGenerating ? 'Génération en cours...' : `Générer ${getQrCount()} codes QR`}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-600" />
              Récapitulatif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-600 dark:text-slate-300 text-sm">QR à générer</span>
                <Badge variant="secondary" className="text-lg font-bold">
                  {getQrCount()}
                </Badge>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {context === 'individual' 
                  ? `${individualForm.duration === '7d' ? '7 jours' : '1 an'} de validité • Activation immédiate`
                  : `${agencyForm.type === 'hajj' ? agencyForm.travelerCount * 3 : agencyForm.travelerCount * agencyForm.baggagePerTraveler} QR • En attente d'attribution`
                }
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Détails</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Type</p>
                  <p className="text-slate-800 dark:text-white font-medium">
                    {context === 'individual' ? 'Individuel' : agencyForm.type === 'hajj' ? 'Hajj' : 'Voyageur'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Statut</p>
                  <p className="text-slate-800 dark:text-white font-medium">
                    {context === 'individual' ? 'Actif' : 'En attente'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Agence</p>
                  <p className="text-slate-800 dark:text-white font-medium">
                    {context === 'individual' 
                      ? 'Aucune' 
                      : agencies.find(a => a.id === agencyForm.agencyId)?.name || 'Non sélectionnée'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Expiration</p>
                  <p className="text-slate-800 dark:text-white font-medium">
                    {context === 'individual' 
                      ? individualForm.duration === '7d' ? '7 jours' : '1 an'
                      : agencyForm.type === 'hajj' 
                        ? '60 jours'
                        : '5 jours'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <QrCode className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{getQrCount()}</p>
              <p className="text-sm text-white/80">QR à générer</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            <div>
              <p className="text-2xl font-bold">{agencies.filter(a => a.active).length}</p>
              <p className="text-sm text-white/80">Agences actives</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <p className="text-lg font-bold">Anti-fraude</p>
              <p className="text-sm text-white/80">Codes uniques</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
