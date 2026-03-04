'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/NewAdminLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plane,
  Luggage,
  Users,
  Clock,
  AlertTriangle,
  Eye,
  Trash2,
  MapPin,
  Building2,
  RefreshCw,
  Download,
  Search,
  Phone
} from "lucide-react";

// Types
interface Traveler {
  id: string;
  firstName: string | null;
  lastName: string | null;
  whatsapp: string | null;
  agencyId: string | null;
  agency: { name: string } | null;
  baggageCount: number;
  baggages: {
    id: string;
    reference: string;
    baggageIndex: number;
    baggageType: string;
    status: string;
    lastScanDate: string | null;
    lastLocation: string | null;
    createdAt: string;
  }[];
  createdAt: string;
}

interface TravelerStats {
  total: number;
  activeBaggages: number;
  pending: number;
  lost: number;
}

export default function VoyageursAdminPage() {
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState<TravelerStats>({ total: 0, activeBaggages: 0, pending: 0, lost: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [baggageCountFilter, setBaggageCountFilter] = useState('all');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Modal
  const [selectedTraveler, setSelectedTraveler] = useState<Traveler | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/voyageurs');
      const data = await response.json();
      setTravelers(data.travelers || []);
      setAgencies(data.agencies || []);
      calculateStats(data.travelers || []);
    } catch (error) {
      console.error('Error fetching voyageurs data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (travelerList: Traveler[]) => {
    let activeBaggages = 0;
    let pending = 0;
    let lost = 0;

    travelerList.forEach(traveler => {
      traveler.baggages.forEach(bag => {
        if (bag.status === 'active') activeBaggages++;
        if (bag.status === 'pending_activation') pending++;
        if (bag.status === 'lost') lost++;
      });
    });

    setStats({
      total: travelerList.length,
      activeBaggages,
      pending,
      lost
    });
  };

  // Get status for display
  const getStatus = (baggages: Traveler['baggages']): { status: string; label: string; color: string } => {
    const statuses = baggages.map(b => b.status);

    if (statuses.some(s => s === 'lost')) {
      return { status: 'lost', label: '⚠️ Perdu', color: 'bg-red-100 text-red-700' };
    }
    if (statuses.some(s => s === 'pending_activation')) {
      return { status: 'pending', label: '⚪ En attente', color: 'bg-amber-100 text-amber-700' };
    }
    if (statuses.some(s => s === 'scanned')) {
      return { status: 'scanned', label: '🔍 Scanné', color: 'bg-blue-100 text-blue-700' };
    }
    if (statuses.every(s => s === 'active')) {
      return { status: 'active', label: '✅ Actif', color: 'bg-emerald-100 text-emerald-700' };
    }

    return { status: 'mixed', label: 'Mixte', color: 'bg-slate-100 text-slate-600' };
  };

  // Get last scan date
  const getLastScan = (baggages: Traveler['baggages']): string => {
    const scanDates = baggages
      .filter(b => b.lastScanDate)
      .map(b => new Date(b.lastScanDate!))
      .sort((a, b) => b.getTime() - a.getTime());

    if (scanDates.length === 0) return 'Jamais';

    const lastDate = scanDates[0];
    return `${lastDate.getDate().toString().padStart(2, '0')}/${(lastDate.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  // Filter travelers
  const filteredTravelers = travelers.filter(traveler => {
    // Search filter
    if (searchFilter) {
      const fullName = `${traveler.firstName || ''} ${traveler.lastName || ''}`.toLowerCase();
      if (!fullName.includes(searchFilter.toLowerCase())) return false;
    }

    // Baggage count filter
    if (baggageCountFilter !== 'all') {
      const count = parseInt(baggageCountFilter);
      if (traveler.baggageCount !== count) return false;
    }

    // Agency filter
    if (agencyFilter !== 'all') {
      if (agencyFilter === 'none' && traveler.agencyId) return false;
      if (agencyFilter !== 'none' && traveler.agencyId !== agencyFilter) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      const status = getStatus(traveler.baggages);
      if (statusFilter !== status.status) return false;
    }

    // Date filter
    if (dateFilter) {
      const createdDate = new Date(traveler.createdAt).toISOString().split('T')[0];
      if (createdDate !== dateFilter) return false;
    }

    return true;
  });

  const handleDeleteTraveler = async (travelerId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce voyageur et tous ses bagages ?\n\nCette action est irréversible.')) return;

    try {
      const response = await fetch(`/api/admin/voyageurs?id=${encodeURIComponent(travelerId)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success message
        alert(`Voyageur supprimé avec succès (${data.deletedCount} bagage(s) supprimé(s))`);
        // Refresh data
        fetchData();
      } else {
        alert(`Erreur: ${data.error || 'Erreur lors de la suppression'}`);
      }
    } catch (error) {
      console.error('Error deleting traveler:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Nom', 'Prénom', 'Bagages', 'Agence', 'WhatsApp', 'Statut', 'Dernier scan'];
    const rows = filteredTravelers.map(t => [
      t.lastName || '-',
      t.firstName || '-',
      `${t.baggageCount} bagage${t.baggageCount > 1 ? 's' : ''}`,
      t.agency?.name || '-',
      t.whatsapp || '-',
      getStatus(t.baggages).label,
      getLastScan(t.baggages)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voyageurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout 
      title="Voyageurs Standard"
      subtitle="Gérez les voyageurs individuels (1 ou 3 bagages)"
    >
      {/* Action Buttons */}
      <div className="flex gap-2 mb-6">
        <Button
          variant="outline"
          className="border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl"
          onClick={handleExportCSV}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          className="border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl"
          onClick={fetchData}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total voyageurs</p>
                <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Bagages actifs</p>
                <p className="text-3xl font-bold text-slate-800">{stats.activeBaggages}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Luggage className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">En attente</p>
                <p className="text-3xl font-bold text-slate-800">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Perdus</p>
                <p className="text-3xl font-bold text-slate-800">{stats.lost}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Rechercher un voyageur..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-white border-slate-200 text-slate-800 pl-9"
            />
          </div>
          <Select value={baggageCountFilter} onValueChange={setBaggageCountFilter}>
            <SelectTrigger className="bg-white border-slate-200 text-slate-800">
              <SelectValue placeholder="Bagages" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="1">🧳 1 bagage</SelectItem>
              <SelectItem value="3">🧳 3 bagages</SelectItem>
            </SelectContent>
          </Select>
          <Select value={agencyFilter} onValueChange={setAgencyFilter}>
            <SelectTrigger className="bg-white border-slate-200 text-slate-800">
              <SelectValue placeholder="Agence" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="all">Toutes les agences</SelectItem>
              <SelectItem value="none">Sans agence</SelectItem>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white border-slate-200 text-slate-800">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">✅ Actif</SelectItem>
              <SelectItem value="pending">⚪ En attente</SelectItem>
              <SelectItem value="lost">⚠️ Perdu</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white border-slate-200 text-slate-800"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-slate-500">Nom</TableHead>
              <TableHead className="text-slate-500">Type</TableHead>
              <TableHead className="text-slate-500">Agence</TableHead>
              <TableHead className="text-slate-500">Bagages</TableHead>
              <TableHead className="text-slate-500">WhatsApp</TableHead>
              <TableHead className="text-slate-500">Statut</TableHead>
              <TableHead className="text-slate-500">Dernier scan</TableHead>
              <TableHead className="text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredTravelers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                  Aucun voyageur trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredTravelers.map((traveler) => {
                const status = getStatus(traveler.baggages);
                return (
                  <TableRow
                    key={traveler.id}
                    className="border-slate-200 cursor-pointer hover:bg-slate-50"
                    onClick={() => {
                      setSelectedTraveler(traveler);
                      setModalOpen(true);
                    }}
                  >
                    <TableCell className="text-slate-800">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-amber-600" />
                        <span className="font-medium">
                          {traveler.firstName || '-'} {traveler.lastName || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      ✈️ Voyageur
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {traveler.agency?.name || '—'}
                    </TableCell>
                    <TableCell className="text-slate-800">
                      <span className="flex items-center gap-1">
                        🧳×{traveler.baggageCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {traveler.whatsapp ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {traveler.whatsapp}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {getLastScan(traveler.baggages)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-10 h-10 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                          onClick={() => {
                            setSelectedTraveler(traveler);
                            setModalOpen(true);
                          }}
                        >
                          <Eye className="w-5 h-5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-10 h-10 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteTraveler(traveler.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Traveler Details Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-amber-600" />
              {selectedTraveler?.firstName || '-'} {selectedTraveler?.lastName || '-'}
            </DialogTitle>
          </DialogHeader>

          {selectedTraveler && (
            <div className="space-y-6 pt-4">
              {/* Traveler Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-slate-500 text-sm mb-1">Agence</p>
                  <p className="text-slate-800 font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {selectedTraveler.agency?.name || 'Sans agence'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-slate-500 text-sm mb-1">WhatsApp</p>
                  <p className="text-slate-800 font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {selectedTraveler.whatsapp || 'Non renseigné'}
                  </p>
                </div>
              </div>

              {/* Baggages */}
              <div>
                <h3 className="text-slate-800 font-medium mb-3 flex items-center gap-2">
                  <Luggage className="w-5 h-5" />
                  Bagages ({selectedTraveler.baggageCount})
                </h3>
                <div className="space-y-2">
                  {selectedTraveler.baggages.map((baggage) => (
                    <div
                      key={baggage.id}
                      className="bg-slate-50 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          baggage.baggageType === 'cabine'
                            ? 'bg-blue-100'
                            : 'bg-amber-100'
                        }`}>
                          <Luggage className={`w-5 h-5 ${
                            baggage.baggageType === 'cabine'
                              ? 'text-blue-600'
                              : 'text-amber-600'
                          }`} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-medium capitalize">
                            {baggage.baggageType}
                          </p>
                          <p className="text-slate-500 text-sm font-mono">
                            {baggage.reference}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {baggage.lastLocation && (
                          <span className="text-slate-500 text-sm flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {baggage.lastLocation}
                          </span>
                        )}
                        <Badge className={
                          baggage.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : baggage.status === 'pending_activation'
                              ? 'bg-amber-100 text-amber-700'
                              : baggage.status === 'lost'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                        }>
                          {baggage.status === 'active' && '✅ Actif'}
                          {baggage.status === 'pending_activation' && '⚪ En attente'}
                          {baggage.status === 'lost' && '⚠️ Perdu'}
                          {baggage.status === 'scanned' && '🔍 Scanné'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
