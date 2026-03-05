'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Building,
  RefreshCw
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
  _count?: {
    baggages: number;
    users: number;
  };
}

export default function AgencesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [agencyCreating, setAgencyCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [agencyForm, setAgencyForm] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
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

  const handleCreateAgency = async () => {
    if (!agencyForm.email) {
      setErrorMessage("L'email est obligatoire");
      return;
    }
    if (!agencyForm.password || agencyForm.password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!/[A-Z]/.test(agencyForm.password)) {
      setErrorMessage('Le mot de passe doit contenir au moins une majuscule');
      return;
    }
    if (!/\d/.test(agencyForm.password)) {
      setErrorMessage('Le mot de passe doit contenir au moins un chiffre');
      return;
    }
    if (agencyForm.password !== agencyForm.confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas');
      return;
    }
    
    setAgencyCreating(true);
    setErrorMessage('');
    
    try {
      const agencyResponse = await fetch('/api/admin/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agencyForm.name,
          slug: agencyForm.slug,
          email: agencyForm.email,
          phone: agencyForm.phone,
        }),
      });
      
      if (agencyResponse.ok) {
        const agencyData = await agencyResponse.json();
        
        await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: agencyForm.email,
            name: agencyForm.name,
            password: agencyForm.password,
            role: 'agency',
            agencyId: agencyData.agency.id,
          }),
        });
        
        setSuccessMessage(`Agence "${agencyForm.name}" créée avec succès !`);
        fetchAgencies();
        setDialogOpen(false);
        setAgencyForm({ name: '', slug: '', email: '', phone: '', password: '', confirmPassword: '' });
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const error = await agencyResponse.json();
        setErrorMessage(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating agency:', error);
      setErrorMessage("Erreur lors de la création de l'agence");
    } finally {
      setAgencyCreating(false);
    }
  };

  const handleDeleteAgency = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette agence ?')) return;
    
    try {
      const response = await fetch(`/api/admin/agencies?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchAgencies();
      }
    } catch (error) {
      console.error('Error deleting agency:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Agences Partenaires</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les agences de voyage partenaires</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchAgencies}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle agence
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
              <DialogHeader>
                <DialogTitle>Créer une agence</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {errorMessage && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                    {errorMessage}
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Nom de l&apos;agence *</Label>
                  <Input 
                    placeholder="Ashraf Voyages"
                    value={agencyForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setAgencyForm({ 
                        ...agencyForm, 
                        name,
                        slug: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                      });
                    }}
                    className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">Slug *</Label>
                  <Input 
                    placeholder="ashraf_voyages"
                    value={agencyForm.slug}
                    onChange={(e) => setAgencyForm({ ...agencyForm, slug: e.target.value })}
                    className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Email *</Label>
                    <Input 
                      type="email"
                      placeholder="contact@agence.com"
                      value={agencyForm.email}
                      onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })}
                      className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Téléphone</Label>
                    <Input 
                      placeholder="+33 6 00 00 00 00"
                      value={agencyForm.phone}
                      onChange={(e) => setAgencyForm({ ...agencyForm, phone: e.target.value })}
                      className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Mot de passe *</Label>
                    <Input 
                      type="password"
                      placeholder="Min 8 car., 1 maj, 1 chiffre"
                      value={agencyForm.password}
                      onChange={(e) => setAgencyForm({ ...agencyForm, password: e.target.value })}
                      className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Confirmer *</Label>
                    <Input 
                      type="password"
                      placeholder="Confirmer le mot de passe"
                      value={agencyForm.confirmPassword}
                      onChange={(e) => setAgencyForm({ ...agencyForm, confirmPassword: e.target.value })}
                      className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white" 
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
                  onClick={handleCreateAgency}
                  disabled={agencyCreating}
                >
                  {agencyCreating ? 'Création en cours...' : "Créer l'agence"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Total agences</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{agencies.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#ff7f00]/10 dark:bg-[#ff7f00]/20 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-[#ff7f00]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Agences actives</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{agencies.filter(a => a.active).length}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agencies Table */}
      <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 dark:border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-500 dark:text-slate-400">Nom</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Slug</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Contact</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Bagages</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Statut</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 dark:text-slate-400 py-8">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-[#ff7f00]/30 border-t-[#ff7f00] rounded-full animate-spin" />
                      <span>Chargement...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : agencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 dark:text-slate-400 py-8">
                    Aucune agence
                  </TableCell>
                </TableRow>
              ) : (
                agencies.map((agency) => (
                  <TableRow key={agency.id} className="border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <TableCell className="text-slate-800 dark:text-white font-medium">{agency.name}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 font-mono text-sm">{agency.slug}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 text-sm">
                      <div>{agency.email || '-'}</div>
                      <div className="text-slate-400 dark:text-slate-500">{agency.phone || ''}</div>
                    </TableCell>
                    <TableCell className="text-slate-800 dark:text-white">
                      <Badge variant="outline" className="border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                        {agency._count?.baggages || 0} bagages
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={agency.active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}>
                        {agency.active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                          onClick={() => handleDeleteAgency(agency.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
