'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Luggage,
  Search,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  MapPin,
  QrCode,
  X,
  Plus,
  Filter,
  AlertOctagon,
  RefreshCw,
  ChevronRight,
  User,
  Package
} from "lucide-react";
import { useAgency } from '../layout';

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
  setId: string | null;
}

interface BaggageGroup {
  setId: string | null;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  type: string;
  createdAt: Date;
  baggages: Baggage[];
}

export default function BaggagesPage() {
  const { agencyId, agencyName } = useAgency();
  const [groupedBaggages, setGroupedBaggages] = useState<BaggageGroup[]>([]);
  const [allBaggages, setAllBaggages] = useState<Baggage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState<BaggageGroup | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (agencyId) {
      fetchBaggages();
    }
  }, [agencyId]);

  const fetchBaggages = async () => {
    if (!agencyId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        agencyId: agencyId,
        grouped: 'true'
      });

      const response = await fetch(`/api/agency/baggages?${params}`);
      const data = await response.json();
      setGroupedBaggages(data.groupedBaggages || []);
      setAllBaggages(data.baggages || []);
    } catch (error) {
      console.error('Error fetching baggages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
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

  // Filter groups
  const filteredGroups = groupedBaggages.filter(group => {
    const travelerName = `${group.travelerFirstName || ''} ${group.travelerLastName || ''}`.toLowerCase();
    const setId = group.setId?.toLowerCase() || '';
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      if (!travelerName.includes(searchLower) && !setId.includes(searchLower)) {
        return false;
      }
    }

    if (statusFilter !== 'all') {
      const hasStatus = group.baggages.some(b => b.status === statusFilter);
      if (!hasStatus) return false;
    }

    return true;
  });

  // Handle Declare Lost
  const handleDeclareLost = async (baggageId: string) => {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir déclarer ce bagage comme perdu ?')) return;

    setActionLoading(baggageId);
    try {
      const response = await fetch(`/api/baggage/${baggageId}/declare-lost`, {
        method: 'PUT',
      });
      const data = await response.json();

      if (response.ok) {
        fetchBaggages();
      } else {
        alert(data.error || 'Erreur lors de la déclaration');
      }
    } catch (error) {
      console.error('Declare lost error:', error);
      alert('Erreur lors de la déclaration');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Mark Found
  const handleMarkFound = async (baggageId: string) => {
    if (!confirm('✅ Marquer ce bagage comme retrouvé ?')) return;

    setActionLoading(baggageId);
    try {
      const response = await fetch(`/api/baggage/${baggageId}/mark-found`, {
        method: 'PUT',
      });
      const data = await response.json();

      if (response.ok) {
        fetchBaggages();
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Mark found error:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setActionLoading(null);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending_activation: { label: 'En attente', className: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' },
      active: { label: 'Actif', className: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
      scanned: { label: 'Scanné', className: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' },
      lost: { label: 'Perdu', className: 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' },
      found: { label: 'Retrouvé', className: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400' },
      blocked: { label: 'Bloqué', className: 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400' };

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // Get overall status for a group
  const getGroupStatus = (baggages: Baggage[]) => {
    if (baggages.some(b => b.status === 'lost')) return 'lost';
    if (baggages.some(b => b.status === 'pending_activation')) return 'pending';
    if (baggages.every(b => b.status === 'active')) return 'active';
    return 'mixed';
  };

  const filterButtons = [
    { id: 'all', label: 'Tous' },
    { id: 'scanned', label: 'Scannés' },
    { id: 'pending_activation', label: 'En attente' },
    { id: 'lost', label: 'Perdus' },
    { id: 'found', label: 'Retrouvés' },
  ];

  // Stats
  const stats = {
    total: allBaggages.length,
    active: allBaggages.filter(b => b.status === 'active' || b.status === 'scanned').length,
    pending: allBaggages.filter(b => b.status === 'pending_activation').length,
    lost: allBaggages.filter(b => b.status === 'lost').length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des bagages</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Liste des voyageurs et leurs QR codes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-sm text-white/80">Total bagages</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.active}</p>
          <p className="text-sm text-white/80">Actifs</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-5 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.pending}</p>
          <p className="text-sm text-white/80">En attente</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-5 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.lost}</p>
          <p className="text-sm text-white/80">Perdus</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou code set..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setStatusFilter(btn.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === btn.id
                  ? 'bg-amber-500 text-white shadow-lg'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Travelers List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Luggage className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">Aucun voyageur trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredGroups.map((group, index) => {
              const groupStatus = getGroupStatus(group.baggages);
              const hasLost = group.baggages.some(b => b.status === 'lost');
              const mainReference = group.baggages[0]?.reference || '';
              const displayRef = mainReference.includes('-') 
                ? mainReference.substring(0, mainReference.lastIndexOf('-') + 1)
                : mainReference;
              
              return (
                <div 
                  key={group.setId || index}
                  onClick={() => { setSelectedGroup(group); setShowModal(true); }}
                  className={`px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                    hasLost ? 'bg-rose-50/50 dark:bg-rose-500/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-500/20 dark:to-amber-500/10 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {group.travelerFirstName} {group.travelerLastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {displayRef && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              {displayRef}...
                            </span>
                          )}
                          {group.setId && (
                            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">
                              Set: {group.setId}
                            </span>
                          )}
                          <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-500/10 rounded-full text-amber-600 dark:text-amber-400">
                            {group.type === 'hajj' ? '🕋 Hajj' : '✈️ Voyage'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* QR Codes count */}
                      <div className="flex items-center gap-1">
                        {group.baggages.slice(0, 3).map((b, i) => (
                          <div 
                            key={b.id}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                              b.status === 'lost' 
                                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600' 
                                : b.status === 'pending_activation'
                                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600'
                                : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600'
                            }`}
                          >
                            {b.baggageIndex}
                          </div>
                        ))}
                        {group.baggages.length > 3 && (
                          <span className="text-xs text-slate-400 ml-1">
                            +{group.baggages.length - 3}
                          </span>
                        )}
                      </div>
                      
                      {/* Status indicator */}
                      {groupStatus === 'lost' && (
                        <span className="px-3 py-1 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-xs font-medium">
                          Perdu
                        </span>
                      )}
                      {groupStatus === 'pending' && (
                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-medium">
                          En attente
                        </span>
                      )}
                      {groupStatus === 'active' && (
                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-medium">
                          Actif
                        </span>
                      )}
                      
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        {filteredGroups.length} voyageur{filteredGroups.length > 1 ? 's' : ''} • {allBaggages.length} bagage{allBaggages.length > 1 ? 's' : ''}
      </div>

      {/* Modal - QR Codes Details */}
      {showModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-500/20 dark:to-amber-500/10 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    {selectedGroup.travelerFirstName} {selectedGroup.travelerLastName}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {selectedGroup.baggages.length} bagage{selectedGroup.baggages.length > 1 ? 's' : ''} • {selectedGroup.type === 'hajj' ? 'Hajj 2026' : 'Voyage'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowModal(false); setSelectedGroup(null); }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* QR Codes Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {selectedGroup.baggages.map((baggage) => (
                  <div 
                    key={baggage.id}
                    className={`p-4 rounded-xl border-2 ${
                      baggage.status === 'lost' 
                        ? 'border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-500/5' 
                        : baggage.status === 'pending_activation'
                        ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-500/5'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                    }`}
                  >
                    {/* QR Icon */}
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-3 ${
                        baggage.baggageType === 'cabine' 
                          ? 'bg-blue-100 dark:bg-blue-500/20' 
                          : 'bg-purple-100 dark:bg-purple-500/20'
                      }`}>
                        <QrCode className={`w-8 h-8 ${
                          baggage.baggageType === 'cabine' ? 'text-blue-500' : 'text-purple-500'
                        }`} />
                      </div>
                      
                      <p className="font-mono font-bold text-slate-800 dark:text-white text-sm">
                        {baggage.reference}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {baggage.baggageType === 'cabine' ? '🧳 Cabine' : '📦 Soute'} #{baggage.baggageIndex}
                      </p>
                      
                      <div className="mt-2">
                        {getStatusBadge(baggage.status)}
                      </div>
                      
                      {/* Last scan info */}
                      {baggage.lastScanDate && (
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {baggage.lastLocation || 'Scanné'}
                        </p>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="mt-4 flex flex-col gap-2">
                      {(baggage.status === 'active' || baggage.status === 'scanned') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeclareLost(baggage.id); }}
                          disabled={actionLoading === baggage.id}
                          className="w-full py-2 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-medium hover:bg-rose-200 dark:hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {actionLoading === baggage.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <AlertOctagon className="w-3 h-3" />
                          )}
                          Déclarer perdu
                        </button>
                      )}
                      
                      {baggage.status === 'lost' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkFound(baggage.id); }}
                          disabled={actionLoading === baggage.id}
                          className="w-full py-2 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {actionLoading === baggage.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          Marquer retrouvé
                        </button>
                      )}
                      
                      <Link
                        href={`/scan/${baggage.reference}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-colors text-center"
                      >
                        Tester le scan
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* WhatsApp contact */}
              {selectedGroup.whatsappOwner && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    📱 WhatsApp: {selectedGroup.whatsappOwner}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
