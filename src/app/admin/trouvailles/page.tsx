'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  QrCode,
  Users,
  CheckCircle,
  AlertTriangle
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
      `${log.baggage?.travelerFirstName || ''} ${log.baggage?.travelerLastName || ''}`.trim() || 'Non renseigné',
      log.finderName || 'Anonyme',
      log.location || log.city || 'Non renseigné',
      log.latitude && log.longitude ? `${log.latitude},${log.longitude}` : '—',
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
    const config: Record<string, { label: string; className: string; icon: string }> = {
      scanned: { label: 'Scanné', className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-violet-500', icon: '✅' },
      lost: { label: 'Perdu', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', icon: '⚠️' },
      found: { label: 'Retrouvé', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: '🟢' },
      active: { label: 'Actif', className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-violet-500', icon: '✅' },
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

  // Calculate stats
  const stats = {
    total: scanLogs.length,
    scanned: scanLogs.filter(l => l.baggage?.status === 'scanned' || l.baggage?.status === 'active').length,
    lost: scanLogs.filter(l => l.baggage?.status === 'lost').length,
    found: scanLogs.filter(l => l.baggage?.status === 'found').length,
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
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Trouvailles</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Historique de tous les scans effectués</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchScanLogs}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={exportCSV}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
          >
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Total scans</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total === 0 ? '—' : stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-[#8b17c9]/10 dark:bg-[#8b17c9]/20 rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-[#8b17c9]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Scannés</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.scanned === 0 ? '—' : stats.scanned}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-violet-700 dark:text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Perdus</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.lost === 0 ? '—' : stats.lost}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Retrouvés</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.found === 0 ? '—' : stats.found}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Rechercher par référence, voyageur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 px-4 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#8b17c9]"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            </div>

            {/* Date Filter */}
            <div className="flex gap-2">
              {dateButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setDateFilter(btn.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    dateFilter === btn.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
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
                      ? 'bg-violet-600 text-white'
                      : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
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
              className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:border-[#8b17c9]"
            >
              <option value="all">Tous les pays</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Scan Logs Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-[#8b17c9]/30 border-t-[#8b17c9] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Chargement...</p>
        </div>
      ) : scanLogs.length === 0 ? (
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">Aucun scan enregistré</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {scanLogs.map((log) => {
              const statusBadge = getStatusBadge(log.baggage?.status);
              const mapsUrl = getMapsUrl(log.latitude, log.longitude);

              return (
                <div
                  key={log.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-800 dark:text-white font-mono font-semibold text-sm">{log.baggage?.reference || '—'}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                      {statusBadge.icon} {statusBadge.label}
                    </span>
                  </div>

                  {/* Date */}
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">{formatDateTime(log.createdAt)}</p>

                  {/* Info Grid */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0 text-xs">Voyageur</span>
                      <span className="truncate">
                        {log.baggage?.travelerFirstName || log.baggage?.travelerLastName
                          ? `${log.baggage?.travelerFirstName || ''} ${log.baggage?.travelerLastName || ''}`.trim()
                          : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0 text-xs">Trouveur</span>
                      <span className="truncate">{log.finderName || 'Anonyme'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                      <span className="truncate">{log.location || log.city || '—'}</span>
                    </div>
                    {mapsUrl && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0 text-xs">GPS</span>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#8b17c9] text-xs hover:underline flex items-center gap-1"
                        >
                          {log.latitude?.toFixed(3)}, {log.longitude?.toFixed(3)}
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetailModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all group"
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4 group-hover:text-[#8b17c9] transition-colors" aria-hidden="true" />
                      Détails
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 px-2 text-center">
            <span className="text-slate-500 dark:text-slate-400 text-sm">
              {scanLogs.length} scan(s) affiché(s)
            </span>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Détails du scan</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{formatDateTime(selectedLog.createdAt)}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedLog(null);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" aria-hidden="true" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Baggage Info */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-800 dark:text-white font-mono font-bold">{selectedLog.baggage?.reference || '—'}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedLog.baggage?.status).className}`}>
                    {getStatusBadge(selectedLog.baggage?.status).label}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  {selectedLog.baggage?.travelerFirstName || selectedLog.baggage?.travelerLastName 
                    ? `${selectedLog.baggage?.travelerFirstName || ''} ${selectedLog.baggage?.travelerLastName || ''}`.trim()
                    : 'Non renseigné'}
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                  WhatsApp: {selectedLog.baggage?.whatsappOwner || 'Non renseigné'}
                </p>
              </div>

              {/* Finder Info */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-slate-800 dark:text-white font-medium mb-2">Trouveur</h3>
                <p className="text-slate-600 dark:text-slate-300">{selectedLog.finderName || 'Anonyme'}</p>
                {selectedLog.finderPhone && (
                  <p className="text-slate-400 dark:text-slate-500 text-sm">{selectedLog.finderPhone}</p>
                )}
              </div>

              {/* Location */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-slate-800 dark:text-white font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  Localisation
                </h3>
                <p className="text-slate-600 dark:text-slate-300">{selectedLog.location || selectedLog.city || 'Non précisé'}</p>
                {selectedLog.country && (
                  <p className="text-slate-400 dark:text-slate-500 text-sm">{selectedLog.country}</p>
                )}
                {selectedLog.latitude && selectedLog.longitude && (
                  <a
                    href={getMapsUrl(selectedLog.latitude, selectedLog.longitude) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#8b17c9] text-sm hover:underline mt-2"
                  >
                    Voir sur Google Maps
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                )}
              </div>

              {/* Message */}
              {selectedLog.message && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <h3 className="text-slate-800 dark:text-white font-medium mb-2">Message</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">{selectedLog.message}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const text = `Scan: ${selectedLog.baggage?.reference}\nVoyageur: ${selectedLog.baggage?.travelerFirstName || ''} ${selectedLog.baggage?.travelerLastName || ''}\nLieu: ${selectedLog.location || selectedLog.city || 'Non précisé'}`;
                    copyToClipboard(text);
                  }}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  Copier
                </button>
                {selectedLog.baggage?.whatsappOwner && (
                  <a
                    href={`https://wa.me/${selectedLog.baggage.whatsappOwner.replace(/\D/g, '')}?text=${encodeURIComponent('Votre bagage a été scanné !')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-violet-700 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                    Contacter
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
