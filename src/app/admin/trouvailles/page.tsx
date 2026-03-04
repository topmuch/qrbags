'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Eye,
  MapPin,
  X,
  Download,
  RefreshCw,
  Send,
  Copy,
  ExternalLink,
  FileText
} from "lucide-react";

interface ScanLog {
  id: string;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  country: string | null;
  city: string | null;
  message: string | null;
  baggage: {
    reference: string;
    type: string;
    status: string;
    travelerFirstName: string | null;
    travelerLastName: string | null;
    whatsappOwner: string | null;
  };
  finderName?: string;
  finderPhone?: string;
}

export default function TrouvaillesPage() {
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');

  // Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ScanLog | null>(null);

  // Countries list
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetchScanLogs();
  }, [dateFilter, statusFilter, countryFilter, search]);

  const fetchScanLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (countryFilter !== 'all') params.set('country', countryFilter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/logs?${params}&limit=200`);
      const data = await response.json();
      setScanLogs(data.logs || []);

      // Extract unique countries
      const uniqueCountries = Array.from(
        new Set(data.logs?.map((log: ScanLog) => log.country).filter(Boolean))
      ) as string[];
      setCountries(uniqueCountries);
    } catch (error) {
      console.error('Error fetching scan logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Référence', 'Voyageur', 'Trouveur', 'Lieu', 'GPS', 'Statut'];
    const rows = scanLogs.map(log => [
      formatDateTime(log.createdAt),
      log.baggage?.reference || '',
      `${log.baggage?.travelerFirstName || ''} ${log.baggage?.travelerLastName || ''}`.trim(),
      log.finderName || 'Anonyme',
      log.location || log.city || '',
      log.latitude && log.longitude ? `${log.latitude},${log.longitude}` : '',
      getStatusLabel(log.baggage?.status),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `trouvailles-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_activation: 'En attente',
      active: 'Actif',
      scanned: 'Scanné',
      lost: 'Perdu',
      found: 'Retrouvé',
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; bgClass: string; textClass: string; icon: string }> = {
      scanned: { label: 'Scanné', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700', icon: '✅' },
      lost: { label: 'Perdu', bgClass: 'bg-red-100', textClass: 'text-red-700', icon: '⚠️' },
      found: { label: 'Retrouvé', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700', icon: '🟢' },
      active: { label: 'Actif', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700', icon: '✅' },
    };
    return config[status] || config.active;
  };

  const getMapsUrl = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) return null;
    return `https://maps.app.goo.gl/?link=https://www.google.com/maps?q=${lat},${lng}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copié dans le presse-papiers !');
  };

  const dateButtons = [
    { id: 'all', label: 'Tout' },
    { id: 'today', label: "Aujourd'hui" },
    { id: 'week', label: 'Cette semaine' },
    { id: 'month', label: 'Ce mois' },
  ];

  const statusButtons = [
    { id: 'all', label: 'Tous' },
    { id: 'scanned', label: 'Scanné' },
    { id: 'lost', label: 'Perdu' },
    { id: 'found', label: 'Retrouvé' },
  ];

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Trouvailles</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Historique de tous les scans effectués</p>
      </div>
      {/* Action Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => fetchScanLogs()}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Rechercher par référence, voyageur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#ff7f00]"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>

          {/* Date Filter */}
          <div className="flex gap-2">
            {dateButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setDateFilter(btn.id)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  dateFilter === btn.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {statusButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  statusFilter === btn.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Country Filter */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-slate-800 focus:outline-none focus:border-[#ff7f00]"
          >
            <option value="all">Tous les pays</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scan Logs Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-[#ff7f00]/30 border-t-[#ff7f00] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Chargement...</p>
        </div>
      ) : scanLogs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500">Aucun scan enregistré</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-sm">Date</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-sm">Référence</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-sm hidden md:table-cell">Voyageur</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-sm hidden lg:table-cell">Trouveur</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-sm">Lieu</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-sm hidden md:table-cell">GPS</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-sm">Statut</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scanLogs.map((log) => {
                  const statusBadge = getStatusBadge(log.baggage?.status);
                  const mapsUrl = getMapsUrl(log.latitude, log.longitude);

                  return (
                    <tr
                      key={log.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-slate-500 text-sm">{formatDateTime(log.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-800 font-mono text-sm">{log.baggage?.reference}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-slate-600">
                          {log.baggage?.travelerFirstName} {log.baggage?.travelerLastName}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-slate-600">{log.finderName || 'Anonyme'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3 h-3" />
                          <span className="text-sm truncate max-w-[100px]">
                            {log.location || log.city || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {mapsUrl ? (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#ff7f00] text-sm hover:underline flex items-center gap-1"
                          >
                            {log.latitude?.toFixed(3)}, {log.longitude?.toFixed(3)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bgClass} ${statusBadge.textClass}`}>
                          {statusBadge.icon} {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailModal(true);
                          }}
                          className="w-10 h-10 rounded-xl hover:bg-slate-100 transition-all duration-200 group flex items-center justify-center"
                          title="Voir détails"
                        >
                          <Eye className="w-5 h-5 text-slate-400 group-hover:text-[#ff7f00] transition-colors" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-slate-500 text-sm">
              {scanLogs.length} scan(s) affiché(s)
            </span>
            <Link
              href="/admin/dashboard"
              className="text-[#ff7f00] text-sm hover:underline"
            >
              ← Retour au dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Détails du scan</h2>
                <p className="text-slate-500 text-sm">{formatDateTime(selectedLog.createdAt)}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedLog(null);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Baggage Info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-800 font-mono font-bold">{selectedLog.baggage?.reference}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedLog.baggage?.status).bgClass} ${getStatusBadge(selectedLog.baggage?.status).textClass}`}>
                    {getStatusBadge(selectedLog.baggage?.status).label}
                  </span>
                </div>
                <p className="text-slate-600 text-sm">
                  {selectedLog.baggage?.travelerFirstName} {selectedLog.baggage?.travelerLastName}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  WhatsApp: {selectedLog.baggage?.whatsappOwner || 'N/A'}
                </p>
              </div>

              {/* Finder Info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-slate-800 font-medium mb-2">Trouveur</h3>
                <p className="text-slate-600">{selectedLog.finderName || 'Anonyme'}</p>
                {selectedLog.finderPhone && (
                  <p className="text-slate-400 text-sm">{selectedLog.finderPhone}</p>
                )}
              </div>

              {/* Location */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-slate-800 font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Localisation
                </h3>
                <p className="text-slate-600">{selectedLog.location || selectedLog.city || 'Non précisé'}</p>
                {selectedLog.country && (
                  <p className="text-slate-400 text-sm">{selectedLog.country}</p>
                )}
                {selectedLog.latitude && selectedLog.longitude && (
                  <a
                    href={getMapsUrl(selectedLog.latitude, selectedLog.longitude) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#ff7f00] text-sm hover:underline mt-2"
                  >
                    Voir sur Google Maps
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Message */}
              {selectedLog.message && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="text-slate-800 font-medium mb-2">Message</h3>
                  <p className="text-slate-600 text-sm">{selectedLog.message}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const text = `Scan: ${selectedLog.baggage?.reference}\nVoyageur: ${selectedLog.baggage?.travelerFirstName} ${selectedLog.baggage?.travelerLastName}\nLieu: ${selectedLog.location || selectedLog.city}`;
                    copyToClipboard(text);
                  }}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copier
                </button>
                {selectedLog.baggage?.whatsappOwner && (
                  <a
                    href={`https://wa.me/${selectedLog.baggage.whatsappOwner.replace(/\D/g, '')}?text=${encodeURIComponent('Votre bagage a été scanné !')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Réessayer l'envoi
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
