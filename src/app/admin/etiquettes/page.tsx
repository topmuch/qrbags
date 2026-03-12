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
  X,
  AlertTriangle,
  RefreshCw,
  FileText,
  Building2,
  ChevronDown,
  ChevronRight
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
  baggageIds: string[];
}

interface AgencyGroup {
  agencyId: string | null;
  agencyName: string;
  sets: QRSet[];
  totalQr: number;
  isExpanded: boolean;
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
  const [agencyGroups, setAgencyGroups] = useState<AgencyGroup[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSets: 0,
    totalQr: 0,
    hajjSets: 0,
    voyageurSets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'voyageur' | 'hajj'>('voyageur');

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSet, setSelectedSet] = useState<QRSet | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchSets();
  }, [activeTab, search]);

  const fetchSets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('type', activeTab);
      if (search) params.set('search', search);

      const response = await fetch(`/api/qrcodes?${params}`);
      const data = await response.json();

      // Calculate activation status for each set
      const setsWithStatus = data.sets.map((set: QRSet) => ({
        ...set,
        activationStatus: getActivationStatus(set.status)
      }));

      // Filter to only show sets matching the active tab type
      const filteredSets = setsWithStatus.filter((set: QRSet) => set.type === activeTab);
      
      setSets(filteredSets);
      setStats(data.stats);

      // Group by agency
      const groupedByAgency = groupByAgency(filteredSets);
      setAgencyGroups(groupedByAgency);
    } catch (error) {
      console.error('Error fetching QR sets:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByAgency = (sets: QRSet[]): AgencyGroup[] => {
    const groups = new Map<string | null, AgencyGroup>();

    sets.forEach(set => {
      const key = set.agencyId || 'no-agency';
      const agencyName = set.agencyName || 'Sans agence';

      if (!groups.has(key)) {
        groups.set(key, {
          agencyId: set.agencyId,
          agencyName,
          sets: [],
          totalQr: 0,
          isExpanded: true, // Expanded by default
        });
      }

      const group = groups.get(key)!;
      group.sets.push(set);
      group.totalQr += set.qrCount;
    });

    // Sort: agencies with name first, then "Sans agence"
    return Array.from(groups.values()).sort((a, b) => {
      if (a.agencyId === null) return 1;
      if (b.agencyId === null) return -1;
      return a.agencyName.localeCompare(b.agencyName);
    });
  };

  const getActivationStatus = (status: string): 'new' | 'partial' | 'activated' => {
    if (status === 'active' || status === 'scanned') return 'activated';
    if (status === 'partial') return 'partial';
    return 'new';
  };

  const toggleAgencyGroup = (agencyId: string | null) => {
    setAgencyGroups(prev => 
      prev.map(group => 
        group.agencyId === agencyId 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };

  const handleDeleteSet = async () => {
    if (!selectedSet) return;

    try {
      const params = new URLSearchParams({ setId: selectedSet.setId });
      const response = await fetch(`/api/qrcodes?${params}`, { method: 'DELETE' });
      const data = await response.json();

      if (response.ok && data.success) {
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
      ctx.fillStyle = set.type === 'hajj' ? '#059669' : '#f59e0b';
      ctx.fillRect(0, 0, canvas.width, headerHeight);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QRBag - Étiquettes', canvas.width / 2, 35);

      ctx.font = '16px Arial';
      ctx.fillText(`${set.setId} | ${set.type === 'hajj' ? 'Hajj 2026' : 'Voyageur'} | ${set.qrCount} QR`, canvas.width / 2, 65);
      if (set.agencyName) {
        ctx.font = '14px Arial';
        ctx.fillText(`Agence: ${set.agencyName}`, canvas.width / 2, 85);
      }

      // Generate QR codes
      for (let i = 0; i < set.references.length; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = padding + col * (qrSize + padding);
        const y = headerHeight + padding + row * (qrSize + padding);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, qrSize, qrSize);

        const qrUrl = `${window.location.origin}/scan/${set.references[i]}`;
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const qrSvg = <QRCodeSVG value={qrUrl} size={qrSize - 40} level="H" fgColor={set.type === 'hajj' ? '#059669' : '#f59e0b'} />;

        // Use a promise-based approach to render SVG to canvas
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${qrSize - 40}" height="${qrSize - 40}">
          <rect width="100%" height="100%" fill="white"/>
          ${generateQRPath(qrUrl, qrSize - 40, set.type === 'hajj' ? '#059669' : '#f59e0b')}
        </svg>`;

        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        await new Promise<void>((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, x + 20, y + 20, qrSize - 40, qrSize - 40);
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          img.src = url;
        });

        // Reference label
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(set.references[i], x + qrSize / 2, y + qrSize - 15);
      }

      // Footer
      ctx.fillStyle = '#64748b';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Généré le ${new Date().toLocaleDateString('fr-FR')} | QRBag.com`, canvas.width / 2, canvas.height - 20);

      // Download
      const link = document.createElement('a');
      link.download = `QRBag-${set.setId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setIsDownloading(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsDownloading(false);
      alert('Erreur lors de la génération');
    }
  };

  // Simple QR path generator fallback
  const generateQRPath = (url: string, size: number, color: string): string => {
    return `<text x="50%" y="50%" text-anchor="middle" fill="${color}" font-size="10">${url}</text>`;
  };

  const handleShareSet = async (set: QRSet) => {
    const shareUrl = `${window.location.origin}/scan/${set.references[0]}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QRBag - ${set.setId}`,
          text: `${set.qrCount} QR codes pour ${set.agencyName || 'agence'}`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Lien copié !');
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Étiquettes QR</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {stats.totalSets} sets • {stats.totalQr} QR codes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            onClick={() => fetchSets()}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/admin/generer"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
          >
            <QrCode className="w-4 h-4" />
            Générer QR
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('voyageur')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'voyageur'
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Plane className="w-5 h-5" />
          Voyageurs
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'voyageur' 
              ? 'bg-white/20 text-white' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
          }`}>
            {stats.voyageurSets}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('hajj')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'hajj'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Luggage className="w-5 h-5" />
          Hajj
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'hajj' 
              ? 'bg-white/20 text-white' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
          }`}>
            {stats.hajjSets}
          </span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-green-500 rounded-full" />
        </div>
      ) : agencyGroups.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            activeTab === 'hajj' ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-amber-100 dark:bg-amber-500/20'
          }`}>
            {activeTab === 'hajj' ? (
              <Luggage className="w-8 h-8 text-emerald-600" />
            ) : (
              <Plane className="w-8 h-8 text-amber-600" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
            Aucun QR code {activeTab === 'hajj' ? 'Hajj' : 'Voyageur'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {search ? 'Aucun résultat pour votre recherche' : 'Commencez par générer des QR codes'}
          </p>
          {!search && (
            <Link
              href="/admin/generer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
            >
              <QrCode className="w-4 h-4" />
              Générer des QR codes
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {agencyGroups.map((group) => (
            <div
              key={group.agencyId || 'no-agency'}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              {/* Agency Header */}
              <button
                onClick={() => toggleAgencyGroup(group.agencyId)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activeTab === 'hajj' 
                      ? 'bg-emerald-100 dark:bg-emerald-500/20' 
                      : 'bg-amber-100 dark:bg-amber-500/20'
                  }`}>
                    <Building2 className={`w-5 h-5 ${
                      activeTab === 'hajj' ? 'text-emerald-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-800 dark:text-white">
                      {group.agencyName}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {group.sets.length} set{group.sets.length > 1 ? 's' : ''} • {group.totalQr} QR codes
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${
                  group.isExpanded ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Sets in this agency */}
              {group.isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-700">
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {group.sets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {/* QR Icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            activeTab === 'hajj'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20'
                              : 'bg-amber-100 dark:bg-amber-500/20'
                          }`}>
                            <QrCode className={`w-6 h-6 ${
                              activeTab === 'hajj' ? 'text-emerald-600' : 'text-amber-600'
                            }`} />
                          </div>

                          {/* Info */}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-slate-800 dark:text-white">
                                {set.setId}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                set.activationStatus === 'activated'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                                  : set.activationStatus === 'partial'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}>
                                {set.activationStatus === 'activated' ? 'Activé' : set.activationStatus === 'partial' ? 'Partiel' : 'Nouveau'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
                              <span>{set.qrCount} QR</span>
                              {set.travelerName && (
                                <span>• {set.travelerName}</span>
                              )}
                              <span>• {formatDate(set.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedSet(set);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Voir les QR codes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(set)}
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleShareSet(set)}
                            className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors"
                            title="Partager"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSet(set);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{selectedSet.setId}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {selectedSet.type === 'hajj' ? 'Hajj 2026' : 'Voyageur'} • {selectedSet.qrCount} QR codes
                  {selectedSet.agencyName && ` • ${selectedSet.agencyName}`}
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
                      size={120}
                      level="H"
                      includeMargin={true}
                      bgColor="#f8fafc"
                      fgColor={selectedSet.type === 'hajj' ? '#059669' : '#f59e0b'}
                    />
                    <p className="text-slate-800 dark:text-white font-mono font-bold mt-2 text-sm">
                      {ref}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      {selectedSet.type === 'hajj' 
                        ? (index === 0 ? 'Cabine' : `Soute #${index}`)
                        : `Bagage #${index + 1}`
                      }
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
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Statut</p>
                  <p className="text-slate-800 dark:text-white font-medium capitalize">
                    {selectedSet.activationStatus === 'activated' ? 'Activé' : 
                     selectedSet.activationStatus === 'partial' ? 'Partiel' : 'Nouveau'}
                  </p>
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
    </div>
  );
}
