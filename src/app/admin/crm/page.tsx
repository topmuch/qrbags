'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus,
  Trash2,
  UserPlus,
  Phone,
  Mail,
  Building,
  Search,
  Download,
  RefreshCw
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/lib/permissions';

// Types
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: 'Nouveau', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  contacted: { label: 'Contacté', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300' },
  qualified: { label: 'Qualifié', className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' },
  converted: { label: 'Converti', className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' },
  lost: { label: 'Perdu', className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' },
};

export default function CRMPage() {
  const { can } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'new' as Lead['status'],
    source: '',
    notes: '',
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/leads');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async () => {
    try {
      const response = await fetch('/api/admin/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadForm),
      });

      if (response.ok) {
        fetchLeads();
        setDialogOpen(false);
        setLeadForm({ name: '', email: '', phone: '', company: '', status: 'new', source: '', notes: '' });
      }
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: Lead['status']) => {
    try {
      const response = await fetch('/api/admin/crm/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lead ?')) return;

    try {
      const response = await fetch(`/api/admin/crm/leads?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Nom', 'Email', 'Téléphone', 'Entreprise', 'Statut', 'Source', 'Notes', 'Date'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email,
      lead.phone,
      lead.company,
      STATUS_CONFIG[lead.status]?.label || lead.status,
      lead.source,
      lead.notes,
      new Date(lead.createdAt).toLocaleDateString('fr-FR'),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `crm-leads-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canManage = can(PERMISSIONS.MANAGE_CRM);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">CRM</h1>
            <p className="text-slate-500 dark:text-slate-400">Gestion des prospects et leads</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Leads</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{leads.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Nouveaux</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {leads.filter(l => l.status === 'new').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Qualifiés</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {leads.filter(l => l.status === 'qualified').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Convertis</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {leads.filter(l => l.status === 'converted').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="new">Nouveaux</SelectItem>
            <SelectItem value="contacted">Contactés</SelectItem>
            <SelectItem value="qualified">Qualifiés</SelectItem>
            <SelectItem value="converted">Convertis</SelectItem>
            <SelectItem value="lost">Perdus</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={fetchLeads}
          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>

        <Button
          variant="outline"
          onClick={handleExportCSV}
          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>

        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-500 hover:bg-green-600 text-white rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau lead
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un lead</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input
                    placeholder="Jean Dupont"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="email@exemple.com"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    placeholder="+33 6 12 34 56 78"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Entreprise</Label>
                  <Input
                    placeholder="Nom de l'entreprise"
                    value={leadForm.company}
                    onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={leadForm.source}
                    onValueChange={(v) => setLeadForm({ ...leadForm, source: v })}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectItem value="website">Site web</SelectItem>
                      <SelectItem value="referral">Recommandation</SelectItem>
                      <SelectItem value="social">Réseaux sociaux</SelectItem>
                      <SelectItem value="event">Événement</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    placeholder="Notes additionnelles..."
                    value={leadForm.notes}
                    onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl"
                  onClick={handleCreateLead}
                  disabled={!leadForm.name || !leadForm.email}
                >
                  Ajouter le lead
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Leads Table */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-500 dark:text-slate-400">Nom</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Contact</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Entreprise</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Statut</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Source</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Date</TableHead>
                {canManage && <TableHead className="text-slate-500 dark:text-slate-400">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 dark:text-slate-400 py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 dark:text-slate-400 py-8">
                    Aucun lead trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="text-slate-800 dark:text-white font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-300">{lead.company || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <Select
                          value={lead.status}
                          onValueChange={(v) => handleUpdateStatus(lead.id, v as Lead['status'])}
                        >
                          <SelectTrigger className="w-[130px] h-8 bg-transparent border-0 p-0">
                            <Badge className={STATUS_CONFIG[lead.status]?.className}>
                              {STATUS_CONFIG[lead.status]?.label || lead.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <SelectItem value="new">Nouveau</SelectItem>
                            <SelectItem value="contacted">Contacté</SelectItem>
                            <SelectItem value="qualified">Qualifié</SelectItem>
                            <SelectItem value="converted">Converti</SelectItem>
                            <SelectItem value="lost">Perdu</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={STATUS_CONFIG[lead.status]?.className}>
                          {STATUS_CONFIG[lead.status]?.label || lead.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 capitalize">{lead.source || '-'}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 text-sm">
                      {new Date(lead.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl"
                          onClick={() => handleDeleteLead(lead.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
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
