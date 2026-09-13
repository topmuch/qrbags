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
  Trash2,
  Loader2
} from "lucide-react";
import { useAgency } from '../layout';
import { isActive, isPending, isLost } from '@/lib/status';

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
  const { agencyId, agencyName } = useAgency();
  const [baggages, setBaggages] = useState<Baggage[]>([]);
  const [filteredBaggages, setFilteredBaggages] = useState<Baggage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBaggage, setSelectedBaggage] = useState<Baggage | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchBaggages();
  }, [agencyId]);

  useEffect(() => {
    filterBaggages();
  }, [baggages, search, statusFilter]);

  const fetchBaggages = async () => {
    try {
      const params = new URLSearchParams({
        agencyId: agencyId,
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

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(b =>
        b.reference.toLowerCase().includes(searchLower) ||
        `${b.travelerFirstName || ''} ${b.travelerLastName || ''}`.toLowerCase().includes(searchLower)
      );
    }

    setFilteredBaggages(filtered);
  };

  // AGENCY-FIX: Split filtered baggages into activated and pending sections
  const activatedBaggages = filteredBaggages.filter(b =>
    isActive(b.status) || b.travelerFirstName !== null || b.status === 'lost' || b.status === 'found' || b.status === 'blocked'
  );
  const pendingBaggages = filteredBaggages.filter(b =>
    isPending(b.status) && b.travelerFirstName === null && b.travelerLastName === null
  );

  // Bulk selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = (baggageList: Baggage[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = baggageList.every(b => next.has(b.id));
      if (allSelected) {
        // Deselect all in this list
        for (const b of baggageList) {
          next.delete(b.id);
        }
      } else {
        // Select all in this list
        for (const b of baggageList) {
          next.add(b.id);
        }
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch('/api/agency/baggages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          ids: Array.from(selectedIds),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Remove deleted items from local state
        const deletedSet = new Set(selectedIds);
        setBaggages(prev => prev.filter(b => !deletedSet.has(b.id)));
        setSelectedIds(new Set());
        setShowDeleteConfirm(false);
        alert(`${data.deleted} QR code(s) supprimé(s) avec succès`);
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAllPending = async () => {
    if (!confirm(`Supprimer TOUS les QR codes en attente d'activation de votre agence ?\n\nCette action est irréversible.`)) return;

    setDeleteLoading(true);
    try {
      const response = await fetch('/api/agency/baggages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          status: 'pending_activation',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBaggages(prev => prev.filter(b => !isPending(b.status)));
        setSelectedIds(new Set());
        alert(`${data.deleted} QR code(s) en attente supprimé(s)`);
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Delete all pending error:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeleteLoading(false);
    }
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

  // Handle Declare Lost
  const handleDeclareLost = async (baggageId: string) => {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir déclarer ce bagage comme perdu ?\n\nUne alerte sera envoyée au SuperAdmin.')) return;

    setActionLoading(baggageId);
    try {
      const response = await fetch(`/api/baggage/${baggageId}/declare-lost`, {
        method: 'PUT',
      });
      const data = await response.json();

      if (response.ok) {
        setBaggages(prev => prev.map(b => 
          b.id === baggageId ? { ...b, status: 'lost' } : b
        ));
        setShowDetailModal(false);
        setSelectedBaggage(null);
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
        setBaggages(prev => prev.map(b => 
          b.id === baggageId ? { ...b, status: 'found' } : b
        ));
        setShowDetailModal(false);
        setSelectedBaggage(null);
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending_activation: { label: 'En attente', className: 'bg-amber-100 dark:bg-blue-600/10 text-amber-700 dark:text-blue-500' },
      active: { label: 'Actif', className: 'bg-emerald-100 dark:bg-blue-600/10 text-emerald-700 dark:text-blue-500' },
      scanned: { label: 'Scanné', className: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' },
      lost: { label: 'Perdu', className: 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' },
      found: { label: 'Retrouvé', className: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400' },
      blocked: { label: 'Bloqué', className: 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400' };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const filterButtons = [
    { id: 'all', label: 'Tous' },
    { id: 'scanned', label: 'Scannés' },
    { id: 'pending_activation', label: 'En attente' },
    { id: 'lost', label: 'Perdus' },
    { id: 'found', label: 'Retrouvés' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des bagages</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Liste complète des bagages de votre agence</p>
        </div>
        {/* Delete All Pending Button */}
        {pendingBaggages.length > 0 && selectedIds.size === 0 && (
          <button
            onClick={handleDeleteAllPending}
            disabled={deleteLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50"
          >
            {deleteLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Supprimer tous les QR en attente ({pendingBaggages.length})
          </button>
        )}
      </div>

      {/* Bulk Action Bar - Shows when items are selected */}
      {selectedIds.size > 0 && (
        <div className="mb-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 rounded-xl px-5 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-rose-700 dark:text-rose-400 font-medium text-sm">
              {selectedIds.size} QR code(s) sélectionné(s)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={deleteLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Supprimer la sélection
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards - Multicolored */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="kpi-card kpi-card-green p-5">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Luggage className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{baggages.length}</p>
          <p className="text-sm text-white/80">Total bagages</p>
        </div>
        <div className="kpi-card kpi-card-blue p-5">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{baggages.filter(b => isActive(b.status)).length}</p>
          <p className="text-sm text-white/80">Actifs</p>
        </div>
        <div className="kpi-card kpi-card-orange p-5">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{baggages.filter(b => isPending(b.status)).length}</p>
          <p className="text-sm text-white/80">En attente</p>
        </div>
        <div className="kpi-card kpi-card-red p-5">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{baggages.filter(b => b.status === 'lost').length}</p>
          <p className="text-sm text-white/80">Perdus</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setStatusFilter(btn.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              statusFilter === btn.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="text-center py-12">
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-slate-500">Chargement...</span>
            </div>
          </div>
        </div>
      ) : filteredBaggages.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="text-center py-12">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Luggage className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">Aucun bagage trouvé</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Section 1 — Bagages activés */}
          {activatedBaggages.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-blue-600/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
                    Bagages activés ({activatedBaggages.length})
                  </h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <th className="text-left px-4 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={activatedBaggages.length > 0 && activatedBaggages.every(b => selectedIds.has(b.id))}
                          onChange={() => toggleSelectAll(activatedBaggages)}
                          className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                        />
                      </th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Référence</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Pèlerin</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm hidden md:table-cell">Dernier scan</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Statut</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activatedBaggages.map((baggage) => (
                      <tr
                        key={baggage.id}
                        className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          baggage.status === 'lost' ? 'bg-rose-50/50 dark:bg-rose-500/5' : ''
                        } ${selectedIds.has(baggage.id) ? 'bg-rose-50/30 dark:bg-rose-500/5' : ''}`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(baggage.id)}
                            onChange={() => toggleSelect(baggage.id)}
                            className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-blue-600/10 flex items-center justify-center">
                              <QrCode className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-slate-800 dark:text-white font-mono font-medium">
                              {baggage.reference}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {baggage.travelerFirstName || baggage.travelerLastName ? (
                            <span className="text-slate-800 dark:text-white font-medium">
                              {baggage.travelerFirstName} {baggage.travelerLastName}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-amber-100 dark:bg-blue-600/20 text-amber-600 dark:text-blue-500 rounded-full text-xs font-medium">
                              Non assigné
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          {baggage.lastScanDate ? (
                            <span className="text-slate-600 dark:text-slate-300">{formatDateTime(baggage.lastScanDate)}</span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">Jamais</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(baggage.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {isActive(baggage.status) && (
                              <button
                                onClick={() => handleDeclareLost(baggage.id)}
                                disabled={actionLoading === baggage.id}
                                className="p-2 rounded-lg bg-rose-100 dark:bg-rose-500/10 hover:bg-rose-200 dark:hover:bg-rose-500/20 transition-colors group"
                                title="Déclarer perdu"
                              >
                                {actionLoading === baggage.id ? (
                                  <div className="w-4 h-4 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                                ) : (
                                  <AlertOctagon className="w-4 h-4 text-rose-500" />
                                )}
                              </button>
                            )}
                            {baggage.status === 'lost' && (
                              <button
                                onClick={() => handleMarkFound(baggage.id)}
                                disabled={actionLoading === baggage.id}
                                className="p-2 rounded-lg bg-emerald-100 dark:bg-blue-600/10 hover:bg-emerald-200 dark:hover:bg-blue-600/20 transition-colors group"
                                title="Marquer retrouvé"
                              >
                                {actionLoading === baggage.id ? (
                                  <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 text-blue-600" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedBaggage(baggage);
                                setShowDetailModal(true);
                              }}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 text-sm">
                  {activatedBaggages.length} bagage(s) activé(s)
                </span>
              </div>
            </div>
          )}

          {/* Section 2 — QR en attente d'activation */}
          {pendingBaggages.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-blue-600/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
                      QR en attente d'activation ({pendingBaggages.length})
                    </h2>
                  </div>
                  <button
                    onClick={handleDeleteAllPending}
                    disabled={deleteLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 border border-rose-200 dark:border-rose-800"
                  >
                    {deleteLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    Supprimer tout
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <th className="text-left px-4 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={pendingBaggages.length > 0 && pendingBaggages.every(b => selectedIds.has(b.id))}
                          onChange={() => toggleSelectAll(pendingBaggages)}
                          className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                        />
                      </th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Référence</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Pèlerin</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm hidden md:table-cell">Type</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm hidden md:table-cell">Créé le</th>
                      <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingBaggages.map((baggage) => (
                      <tr
                        key={baggage.id}
                        className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          selectedIds.has(baggage.id) ? 'bg-rose-50/30 dark:bg-rose-500/5' : ''
                        }`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(baggage.id)}
                            onChange={() => toggleSelect(baggage.id)}
                            className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-blue-600/10 flex items-center justify-center">
                              <QrCode className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-slate-800 dark:text-white font-mono font-medium">
                              {baggage.reference}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-amber-100 dark:bg-blue-600/20 text-amber-600 dark:text-blue-500 rounded-full text-xs font-medium">
                            Non assigné
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="text-slate-600 dark:text-slate-300 text-sm capitalize">
                            {baggage.baggageType === 'cabine' ? 'Cabine' : 'Soute'}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="text-slate-400 dark:text-slate-500 text-sm">
                            {formatDate(baggage.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedBaggage(baggage);
                                setShowDetailModal(true);
                              }}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400 text-sm">
                  {pendingBaggages.length} QR en attente d'activation
                </span>
              </div>
            </div>
          )}

          {/* Footer global */}
          <div className="text-center">
            <span className="text-slate-400 dark:text-slate-500 text-xs">
              {filteredBaggages.length} bagage(s) affiché(s) sur {baggages.length}
            </span>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                Confirmer la suppression
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Vous allez supprimer <span className="font-bold text-rose-600">{selectedIds.size}</span> QR code(s). Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmBulkDelete}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl font-medium text-sm hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBaggage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Détails du bagage</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedBaggage(null);
                }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 dark:bg-blue-600/10 rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-white font-mono font-bold">{selectedBaggage.reference}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedBaggage.type === 'hajj' ? 'Hajj 2026' : 'Voyageur'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Pèlerin</p>
                  {selectedBaggage.travelerFirstName || selectedBaggage.travelerLastName ? (
                    <p className="text-slate-800 dark:text-white font-medium">{selectedBaggage.travelerFirstName} {selectedBaggage.travelerLastName}</p>
                  ) : (
                    <span className="px-2 py-1 bg-amber-100 dark:bg-blue-600/20 text-amber-600 dark:text-blue-500 rounded-full text-xs font-medium">
                      À attribuer
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Type</p>
                  <p className="text-slate-800 dark:text-white">{selectedBaggage.baggageType} #{selectedBaggage.baggageIndex}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Statut</p>
                  {getStatusBadge(selectedBaggage.status)}
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Créé le</p>
                  <p className="text-slate-800 dark:text-white">{formatDate(selectedBaggage.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Dernier scan</p>
                <p className="text-slate-800 dark:text-white">{formatDateTime(selectedBaggage.lastScanDate)}</p>
                {selectedBaggage.lastLocation && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {selectedBaggage.lastLocation}
                  </p>
                )}
              </div>

              {/* Attribuer edit form for unassigned baggages */}
              {(!selectedBaggage.travelerFirstName && !selectedBaggage.travelerLastName) && (
                <div className="p-4 bg-amber-50 dark:bg-blue-600/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <h4 className="text-amber-700 dark:text-blue-500 font-medium mb-3">Attribuer ce bagage</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Prénom"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                        onChange={(e) => setSelectedBaggage({ ...selectedBaggage, travelerFirstName: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Nom"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                        onChange={(e) => setSelectedBaggage({ ...selectedBaggage, travelerLastName: e.target.value })}
                      />
                    </div>
                    <input
                      type="tel"
                      placeholder="WhatsApp (ex: +33612345678)"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                      onChange={(e) => setSelectedBaggage({ ...selectedBaggage, whatsappOwner: e.target.value })}
                    />
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/baggage/${selectedBaggage.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              travelerFirstName: selectedBaggage.travelerFirstName,
                              travelerLastName: selectedBaggage.travelerLastName,
                              whatsappOwner: selectedBaggage.whatsappOwner,
                              status: 'active'
                            }),
                          });
                          if (res.ok) {
                            fetchBaggages();
                            setShowDetailModal(false);
                          }
                        } catch (error) {
                          console.error('Error updating baggage:', error);
                        }
                      }}
                      className="w-full py-2 bg-[#2563EB] hover:bg-[#ff9f00] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                {/* Action Buttons based on status */}
                {isActive(selectedBaggage.status) && (
                  <button
                    onClick={() => handleDeclareLost(selectedBaggage.id)}
                    disabled={actionLoading === selectedBaggage.id}
                    className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === selectedBaggage.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <AlertOctagon className="w-4 h-4" />
                        Déclarer comme perdu
                      </>
                    )}
                  </button>
                )}

                {isLost(selectedBaggage.status) && (
                  <button
                    onClick={() => handleMarkFound(selectedBaggage.id)}
                    disabled={actionLoading === selectedBaggage.id}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === selectedBaggage.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Marquer comme retrouvé
                      </>
                    )}
                  </button>
                )}

                <Link
                  href={`/scan/${selectedBaggage.reference}`}
                  className="block w-full text-center py-3 bg-blue-600 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium"
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
