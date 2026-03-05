'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  Search,
  Eye,
  Download,
  Share2,
  Trash2,
  Plane,
  Luggage,
  QrCode,
  Plus,
  X,
  AlertTriangle,
  RefreshCw,
  FileText
} from "lucide-react";

interface QRSet {
  id: string;
  setId: string;
  type: string;
  agencyId: string | null;
  agencyName: string | null;
  createdAt: Date;
  qrCount: number;
  references: string[];
  status: string;
  travelerName: string | null;
  activationStatus: 'new' | 'partial' | 'activated';
}

interface Stats {
  totalSets: number;
  totalQr: number;
  hajjSets: number;
  voyageurSets: number;
}

export default function EtiquettesPage() {
  const qrRef = useRef<HTMLDivElement>(null);

  const [sets, setSets] = useState<QRSet[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSets: 0,
    totalQr: 0,
    hajjSets: 0,
    voyageurSets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSet, setSelectedSet] = useState<QRSet | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchSets();
  }, [typeFilter, search]);

  const fetchSets = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/qrcodes?${params}`);
      const data = await response.json();

      // Calculate activation status for each set
      const setsWithStatus = data.sets.map((set: QRSet) => ({
        ...set,
        activationStatus: getActivationStatus(set.status)
      }));

      setSets(setsWithStatus);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching QR sets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivationStatus = (status: string): 'new' | 'partial' | 'activated' => {
    if (status === 'active' || status === 'scanned') return 'activated';
    if (status === 'partial') return 'partial';
    return 'new';
  };

  const handleDeleteSet = async () => {
    if (!selectedSet) return;

    try {
      const params = new URLSearchParams({ setId: selectedSet.setId });
      const response = await fetch(`/api/qrcodes?${params}`, { method: 'DELETE' });
      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh data from server instead of local state update
        fetchSets();
        setShowDeleteModal(false);
        setSelectedSet(null);
      } else {
        alert(`Erreur: ${data.error || 'Erreur lors de la suppression'}`);
      }
    } catch (error) {
      console.error('Error deleting set:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleDownloadPDF = async (set: QRSet) => {
    setIsDownloading(true);
    setSelectedSet(set);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      const qrSize = 300;
      const padding = 40;
      const headerHeight = 100;

      const cols = Math.min(set.qrCount, 3);
      const rows = Math.ceil(set.qrCount / 3);

      canvas.width = cols * qrSize + (cols + 1) * padding;
      canvas.height = headerHeight + rows * qrSize + (rows + 1) * padding + 60;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QRBag - Étiquettes', canvas.width / 2, 40);

      ctx.font = '16px Arial';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`${set.setId} | ${set.type === 'hajj' ? 'Hajj 2026' : 'Voyageur'} | ${set.qrCount} QR`, canvas.width / 2, 70);

      // Generate QR codes
      for (let i = 0; i < set.references.length; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = padding + col * (qrSize + padding);
        const y = headerHeight + padding + row * (qrSize + padding);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, qrSize, qrSize);

        const qrUrl = `${window.location.origin}/scan/${set.references[i]}`;

        // Use QRCodeSVG to generate
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const qrSvg = <QRCodeSVG value={qrUrl} size={qrSize - 40} level="H" fgColor={set.type === 'hajj' ? '#059669' : '#f59e0b'} />;

        // Simple text fallback
        ctx.fillStyle = set.type === 'hajj' ? '#059669' : '#f59e0b';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(set.references[i], x + qrSize / 2, y + qrSize / 2);

        // Reference text
        ctx.fillStyle = set.type === 'hajj' ? '#059669' : '#f59e0b';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(set.references[i], x + qrSize / 2, y + qrSize - 15);
      }

      // Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QRBag - Protégez vos bagages, en toute sérénité.', canvas.width / 2, canvas.height - 20);

      // Download
      const link = document.createElement('a');
      link.download = `QRBag-${set.setId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

    } catch (error) {
      console.error('Error downloading:', error);
      alert('Erreur lors du téléchargement');
    } finally {
      setIsDownloading(false);
      setSelectedSet(null);
    }
  };

  const handleShareSet = async (set: QRSet) => {
    const shareText = `QRBag - ${set.setId}\n${set.qrCount} QR codes générés\nType: ${set.type === 'hajj' ? 'Hajj 2026' : 'Voyageur'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `QRBag - ${set.setId}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Copié dans le presse-papiers !');
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: 'new' | 'partial' | 'activated') => {
    const config = {
      new: { label: 'Nouveau', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700' },
      partial: { label: 'Partiel', bgClass: 'bg-amber-100', textClass: 'text-amber-700' },
      activated: { label: 'Activé', bgClass: 'bg-indigo-100', textClass: 'text-indigo-700' },
    };
    return config[status];
  };

  const filterButtons = [
    { id: 'all', label: 'Tous' },
    { id: 'hajj', label: 'Hajj' },
    { id: 'voyageur', label: 'Voyageur' },
  ];

  const kpiCards = [
    { title: 'Total Sets', value: stats.totalSets, icon: QrCode, color: 'text-[#ff7f00]' },
    { title: 'Total QR', value: stats.totalQr, icon: Luggage, color: 'text-slate-800' },
    { title: 'Hajj', value: stats.hajjSets, icon: Plane, color: 'text-emerald-600' },
    { title: 'Voyageur', value: stats.voyageurSets, icon: Luggage, color: 'text-amber-600' },
  ];

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Les Étiquettes</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez vos lots de QR codes anti-fraude</p>
      </div>
      {/* Action Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => fetchSets()}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
        <Link
          href="/admin/generer"
          className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Générer nouveaux
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{card.value}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Rechercher par référence ou set..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#ff7f00]"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
        <div className="flex gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setTypeFilter(btn.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                typeFilter === btn.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* QR Sets List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-[#ff7f00]/30 border-t-[#ff7f00] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Chargement...</p>
          </div>
        ) : sets.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">Aucune étiquette générée</p>
            <p className="text-sm text-slate-400 mt-2">
              Générez vos premiers QR codes pour commencer.
            </p>
          </div>
        ) : (
          sets.map((set) => {
            const statusBadge = getStatusBadge(set.activationStatus);
            return (
              <div
                key={set.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm gap-4"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    set.type === 'hajj' ? 'bg-emerald-100' : 'bg-amber-100'
                  }`}>
                    {set.type === 'hajj' ? (
                      <Plane className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Luggage className="h-5 w-5 text-amber-600" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 dark:text-white">{set.setId}</h3>
                      <span className={`px-2 py-0.5 ${statusBadge.bgClass} ${statusBadge.textClass} text-xs rounded-full`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm flex flex-wrap gap-3">
                      <span>👤 {set.travelerName || '1 voyageur'}</span>
                      <span>🔢 {set.qrCount} QR</span>
                      <span>📅 {formatDate(set.createdAt)}</span>
                      {set.agencyName && <span>{set.agencyName}</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* View Button */}
                  <button
                    onClick={() => {
                      setSelectedSet(set);
                      setShowDetailModal(true);
                    }}
                    className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-all duration-200 hover:scale-105"
                    title="Voir détails"
                  >
                    <Eye className="h-5 w-5" />
                  </button>

                  {/* Download PDF Button */}
                  <button
                    onClick={() => handleDownloadPDF(set)}
                    disabled={isDownloading && selectedSet?.id === set.id}
                    className="w-11 h-11 rounded-xl bg-black/10 flex items-center justify-center text-black hover:bg-black/20 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                    title="Télécharger PDF"
                  >
                    {isDownloading && selectedSet?.id === set.id ? (
                      <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShareSet(set)}
                    className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 hover:bg-violet-200 transition-all duration-200 hover:scale-105"
                    title="Partager"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      setSelectedSet(set);
                      setShowDeleteModal(true);
                    }}
                    className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-all duration-200 hover:scale-105"
                    title="Supprimer"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex justify-between items-center">
        <span className="text-slate-500 dark:text-slate-400 text-sm">
          {sets.length} set(s) affiché(s)
        </span>
        <Link
          href="/admin/dashboard"
          className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline"
        >
          ← Retour au dashboard
        </Link>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{selectedSet.setId}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {selectedSet.type === 'hajj' ? 'Hajj 2026' : 'Voyageur'} • {selectedSet.qrCount} QR codes
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedSet(null);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              {/* QR Codes Grid */}
              <div
                ref={qrRef}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              >
                {selectedSet.references.map((ref, index) => (
                  <div
                    key={ref}
                    className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center"
                  >
                    <QRCodeSVG
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${ref}`}
                      size={140}
                      level="H"
                      includeMargin={true}
                      bgColor="#f8fafc"
                      fgColor={selectedSet.type === 'hajj' ? '#059669' : '#f59e0b'}
                    />
                    <p className="text-slate-800 dark:text-white font-mono font-bold mt-2 text-sm">
                      {ref}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      {index === 0 ? 'Cabine' : 'Soute'} #{index + 1}
                    </p>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Créé le</p>
                  <p className="text-slate-800 dark:text-white font-medium">{formatDate(selectedSet.createdAt)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Agence</p>
                  <p className="text-slate-800 dark:text-white font-medium">{selectedSet.agencyName || 'N/A'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleDownloadPDF(selectedSet)}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Télécharger PDF
                </button>
                <button
                  onClick={() => handleShareSet(selectedSet)}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Partager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-slate-800 dark:text-white font-bold">Supprimer ce set ?</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedSet.setId}</p>
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Cette action supprimera définitivement les {selectedSet.qrCount} QR codes de ce set.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedSet(null);
                  }}
                  className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteSet}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
