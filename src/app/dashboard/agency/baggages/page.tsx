'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Luggage,
  Search,
  Eye,
  QrCode,
  MapPin,
  Clock,
  ChevronRight,
  Filter,
  X,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { DEMO_AGENCY } from '../layout';

interface Baggage {
  id: string;
  reference: string;
  type: string;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  baggageIndex: number;
  baggageType: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  lastScanDate: string | null;
  lastLocation: string | null;
}

export default function BaggagesPage() {
  const [baggages, setBaggages] = useState<Baggage[]>([]);
  const [filteredBaggages, setFilteredBaggages] = useState<Baggage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedBaggage, setSelectedBaggage] = useState<Baggage | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchBaggages();
  }, []);

  useEffect(() => {
    filterBaggages();
  }, [baggages, search, statusFilter, typeFilter]);

  const fetchBaggages = async () => {
    try {
      const params = new URLSearchParams({
        agencyId: DEMO_AGENCY.id,
      });

      const response = await fetch(`/api/agency/baggages?${params}`);
      const data = await response.json();

      setBaggages(data.baggages || []);
    } catch (error) {
      console.error('Error fetching baggages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBaggages = () => {
    let filtered = [...baggages];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(b => b.type === typeFilter);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(b =>
        b.reference.toLowerCase().includes(searchLower) ||
        `${b.travelerFirstName || ''} ${b.travelerLastName || ''}`.toLowerCase().includes(searchLower)
      );
    }

    setFilteredBaggages(filtered);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' à ' + date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending_activation: { label: 'En attente', className: 'bg-amber-100 text-amber-700' },
      active: { label: 'Actif', className: 'bg-emerald-100 text-emerald-700' },
      scanned: { label: 'Scanné', className: 'bg-blue-100 text-blue-700' },
      lost: { label: 'Perdu', className: 'bg-red-100 text-red-700' },
      found: { label: 'Retrouvé', className: 'bg-green-100 text-green-700' },
      blocked: { label: 'Bloqué', className: 'bg-slate-100 text-slate-600' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-slate-100 text-slate-600' };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const statusFilters = [
    { id: 'all', label: 'Tous les statuts' },
    { id: 'pending_activation', label: 'En attente' },
    { id: 'active', label: 'Actifs' },
    { id: 'scanned', label: 'Scannés' },
    { id: 'lost', label: 'Perdus' },
    { id: 'found', label: 'Retrouvés' },
  ];

  const typeFilters = [
    { id: 'all', label: 'Tous les types' },
    { id: 'hajj', label: 'Hajj' },
    { id: 'voyageur', label: 'Voyageur' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mes Bagages</h1>
          <p className="text-slate-500 mt-1">Liste complète de tous vos bagages</p>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Luggage className="w-5 h-5 text-[#ff7f00]" />
          <span className="font-medium">{baggages.length} bagage(s)</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7f00]/20 focus:border-[#ff7f00] transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-8 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ff7f00]/20 focus:border-[#ff7f00] appearance-none cursor-pointer min-w-[160px]"
            >
              {statusFilters.map((filter) => (
                <option key={filter.id} value={filter.id}>{filter.label}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ff7f00]/20 focus:border-[#ff7f00] appearance-none cursor-pointer min-w-[140px]"
          >
            {typeFilters.map((filter) => (
              <option key={filter.id} value={filter.id}>{filter.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm">Référence</th>
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm">Voyageur</th>
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm hidden md:table-cell">Type</th>
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm hidden lg:table-cell">Dernier scan</th>
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm">Statut</th>
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-[#ff7f00]/30 border-t-[#ff7f00] rounded-full animate-spin" />
                      <span className="text-slate-500">Chargement...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBaggages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Luggage className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500">Aucun bagage trouvé</p>
                      <p className="text-sm text-slate-400 mt-2">
                        Modifiez vos filtres pour voir plus de résultats
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBaggages.map((baggage) => (
                  <tr
                    key={baggage.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      baggage.status === 'lost' ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#ff7f00]/10 flex items-center justify-center">
                          <QrCode className="w-4 h-4 text-[#ff7f00]" />
                        </div>
                        <span className="text-slate-800 font-mono font-medium">
                          {baggage.reference}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-slate-800 font-medium">
                          {baggage.travelerFirstName} {baggage.travelerLastName}
                        </span>
                        {baggage.whatsappOwner && (
                          <p className="text-slate-500 text-sm">{baggage.whatsappOwner}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        baggage.type === 'hajj' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {baggage.type === 'hajj' ? 'Hajj' : 'Voyageur'}
                      </span>
                      <span className="text-slate-400 text-xs ml-2">#{baggage.baggageIndex}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {baggage.lastScanDate ? (
                        <div>
                          <span className="text-slate-600 text-sm">{formatDateTime(baggage.lastScanDate)}</span>
                          {baggage.lastLocation && (
                            <p className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {baggage.lastLocation}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Jamais</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(baggage.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {(baggage.status === 'active' || baggage.status === 'scanned') && (
                          <button
                            onClick={async () => {
                              if (confirm('Déclarer ce bagage comme perdu ?')) {
                                try {
                                  const res = await fetch(`/api/baggage/${baggage.id}/declare-lost`, { method: 'PUT' });
                                  if (res.ok) {
                                    fetchBaggages();
                                  }
                                } catch (error) {
                                  console.error('Error declaring lost:', error);
                                }
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors group"
                            title="Déclarer perdu"
                          >
                            <AlertTriangle className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                          </button>
                        )}
                        {baggage.status === 'lost' && (
                          <button
                            onClick={async () => {
                              if (confirm('Marquer ce bagage comme retrouvé ?')) {
                                try {
                                  const res = await fetch(`/api/baggage/${baggage.id}/mark-found`, { method: 'PUT' });
                                  if (res.ok) {
                                    fetchBaggages();
                                  }
                                } catch (error) {
                                  console.error('Error marking found:', error);
                                }
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-green-50 transition-colors group"
                            title="Marquer comme retrouvé"
                          >
                            <CheckCircle className="w-4 h-4 text-slate-400 group-hover:text-green-500" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedBaggage(baggage);
                            setShowDetail(true);
                          }}
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors group"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4 text-slate-400 group-hover:text-[#ff7f00]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          <span className="text-slate-500 text-sm">
            {filteredBaggages.length} bagage(s) affiché(s) sur {baggages.length}
          </span>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedBaggage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Détails du bagage</h2>
              <button
                onClick={() => {
                  setShowDetail(false);
                  setSelectedBaggage(null);
                }}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#ff7f00]/10 rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-[#ff7f00]" />
                </div>
                <div>
                  <p className="text-slate-800 font-mono font-bold">{selectedBaggage.reference}</p>
                  <p className="text-slate-500 text-sm">{selectedBaggage.type === 'hajj' ? 'Hajj 2026' : 'Voyageur'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-sm">Voyageur</p>
                  <p className="text-slate-800 font-medium">{selectedBaggage.travelerFirstName} {selectedBaggage.travelerLastName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Type de bagage</p>
                  <p className="text-slate-800">{selectedBaggage.baggageType} #{selectedBaggage.baggageIndex}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-sm">WhatsApp</p>
                <p className="text-slate-800">{selectedBaggage.whatsappOwner || 'Non renseigné'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-sm">Statut</p>
                  {getStatusBadge(selectedBaggage.status)}
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Créé le</p>
                  <p className="text-slate-800">{formatDate(selectedBaggage.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-sm">Dernier scan</p>
                <p className="text-slate-800">{formatDateTime(selectedBaggage.lastScanDate)}</p>
                {selectedBaggage.lastLocation && (
                  <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {selectedBaggage.lastLocation}
                  </p>
                )}
              </div>

              <div>
                <p className="text-slate-500 text-sm">Expire le</p>
                <p className="text-slate-800">{formatDate(selectedBaggage.expiresAt)}</p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link
                  href={`/scan/${selectedBaggage.reference}`}
                  className="block w-full text-center py-3 bg-black text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
                >
                  Tester le scan
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
