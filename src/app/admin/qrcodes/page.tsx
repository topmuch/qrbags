'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ArrowLeft,
  X,
  AlertTriangle,
  CheckCircle,
  Clock
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
}

interface Stats {
  totalSets: number;
  totalQr: number;
  hajjSets: number;
  voyageurSets: number;
}

export default function QRCodesPage() {
  const router = useRouter();
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

      setSets(data.sets);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching QR sets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSet = async () => {
    if (!selectedSet) return;

    try {
      const params = new URLSearchParams({ setId: selectedSet.setId });
      await fetch(`/api/qrcodes?${params}`, { method: 'DELETE' });

      setSets(sets.filter(s => s.setId !== selectedSet.setId));
      setShowDeleteModal(false);
      setSelectedSet(null);
    } catch (error) {
      console.error('Error deleting set:', error);
    }
  };

  const handleDownloadSet = async (set: QRSet) => {
    setIsDownloading(true);
    setSelectedSet(set);

    try {
      // Create a canvas with all QR codes
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      const qrSize = 300;
      const padding = 40;
      const headerHeight = 100;
      const footerHeight = 60;

      // Calculate dimensions
      const cols = Math.min(set.qrCount, 3);
      const rows = Math.ceil(set.qrCount / 3);

      canvas.width = cols * qrSize + (cols + 1) * padding;
      canvas.height = headerHeight + rows * qrSize + (rows + 1) * padding + footerHeight;

      // Background
      ctx.fillStyle = '#080c1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QRBag - QR Codes', canvas.width / 2, 40);

      ctx.font = '16px Arial';
      ctx.fillStyle = '#a0a8b8';
      ctx.fillText(`${set.setId} | ${set.type === 'hajj' ? 'Hajj 2026' : 'Voyageur'} | ${set.qrCount} QR`, canvas.width / 2, 70);

      // Generate QR codes as images
      for (let i = 0; i < set.references.length; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = padding + col * (qrSize + padding);
        const y = headerHeight + padding + row * (qrSize + padding);

        // Draw QR background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, qrSize, qrSize);

        // Draw QR code using SVG
        const qrUrl = `${window.location.origin}/scan/${set.references[i]}`;
        const svgString = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
            ${generateQRCodeSVG(qrUrl, set.type)}
          </svg>
        `;

        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        await new Promise<void>((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, x + 20, y + 20, qrSize - 40, qrSize - 40);
            
            // Draw reference text
            ctx.fillStyle = set.type === 'hajj' ? '#0d5e34' : '#d35400';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(set.references[i], x + qrSize / 2, y + qrSize - 15);
            
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          img.src = url;
        });
      }

      // Footer
      ctx.fillStyle = '#a0a8b8';
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

  // Simple QR code SVG generator (fallback)
  const generateQRCodeSVG = (url: string, type: string) => {
    const color = type === 'hajj' ? '#0d5e34' : '#d35400';
    return `<rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" fill="${color}" font-size="10">${url.slice(-20)}</text>`;
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

  // Filter buttons
  const filterButtons = [
    { id: 'all', label: 'Tous' },
    { id: 'hajj', label: 'Hajj' },
    { id: 'voyageur', label: 'Voyageur' },
  ];

  // KPI Cards
  const kpiCards = [
    { title: 'Total Sets', value: stats.totalSets, icon: QrCode, color: 'text-[#b8860b]' },
    { title: 'Total QR', value: stats.totalQr, icon: Luggage, color: 'text-white' },
    { title: 'Hajj', value: stats.hajjSets, icon: Plane, color: 'text-green-400' },
    { title: 'Voyageur', value: stats.voyageurSets, icon: Luggage, color: 'text-orange-400' },
  ];

  return (
    <div className="min-h-screen bg-[#080c1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-[#0d152a] hover:bg-[#1a2238] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#a0a8b8]" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">QR Codes Générés</h1>
              <p className="text-[#a0a8b8] text-sm">Gérez vos sets de QR codes</p>
            </div>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#b8860b] text-white rounded-lg hover:bg-[#d4af37] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Générer nouveau
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiCards.map((card, index) => (
            <div
              key={index}
              className="bg-[#0d152a] border border-[#1a2238] rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-[#a0a8b8] text-sm">{card.title}</p>
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
              className="w-full bg-[#0d152a] border border-[#1a2238] rounded-lg py-3 px-4 text-[#e0e6f0] placeholder-[#a0a8b8] focus:outline-none focus:border-[#b8860b]/50"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a8b8]" />
          </div>
          <div className="flex gap-2">
            {filterButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setTypeFilter(btn.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === btn.id
                    ? 'bg-[#b8860b] text-white'
                    : 'bg-[#0d152a] text-[#a0a8b8] hover:bg-[#1a2238]'
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
              <div className="w-12 h-12 border-2 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#a0a8b8]">Chargement...</p>
            </div>
          ) : sets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#0d152a] rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-[#a0a8b8]" />
              </div>
              <p className="text-[#a0a8b8]">Aucun QR code généré</p>
              <p className="text-sm text-[#a0a8b8]/60 mt-2">
                Générez vos premiers QR codes pour commencer.
              </p>
            </div>
          ) : (
            sets.map((set) => (
              <div
                key={set.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-[#0a0f2c] rounded-xl border border-[#1a1a3a] gap-4"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    set.type === 'hajj' ? 'bg-[#0d5e34]' : 'bg-[#7a3e00]'
                  }`}>
                    {set.type === 'hajj' ? (
                      <Plane className="h-5 w-5 text-white" />
                    ) : (
                      <Luggage className="h-5 w-5 text-white" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">{set.setId}</h3>
                      <span className="px-2 py-0.5 bg-[#0d5e34] text-[#e0e6f0] text-xs rounded">
                        Nouveau
                      </span>
                    </div>
                    <div className="text-[#a0a8b8] text-sm flex flex-wrap gap-3">
                      <span>👤 {set.travelerName || '1 voyageur'}</span>
                      <span>🔢 {set.qrCount} QR</span>
                      <span>📅 {formatDate(set.createdAt)}</span>
                      {set.agencyName && <span>{set.agencyName}</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="px-2 py-1 bg-[#0d152a] text-[#a0a8b8] text-xs rounded hidden sm:inline">
                    {set.status}
                  </span>
                  
                  {/* View Button */}
                  <button
                    onClick={() => {
                      setSelectedSet(set);
                      setShowDetailModal(true);
                    }}
                    className="w-10 h-10 rounded-lg bg-[#0d5e34] flex items-center justify-center text-white hover:bg-[#1e7e34] transition-colors"
                    title="Voir détails"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownloadSet(set)}
                    disabled={isDownloading && selectedSet?.id === set.id}
                    className="w-10 h-10 rounded-lg bg-[#b8860b] flex items-center justify-center text-white hover:bg-[#d4af37] transition-colors disabled:opacity-50"
                    title="Télécharger"
                  >
                    {isDownloading && selectedSet?.id === set.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShareSet(set)}
                    className="w-10 h-10 rounded-lg bg-[#1e7e34] flex items-center justify-center text-white hover:bg-[#228b22] transition-colors"
                    title="Partager"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      setSelectedSet(set);
                      setShowDeleteModal(true);
                    }}
                    className="w-10 h-10 rounded-lg bg-[#7a1e1e] flex items-center justify-center text-white hover:bg-[#9c2727] transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 px-6 py-4 bg-[#0d152a] border border-[#1a2238] rounded-xl flex justify-between items-center">
          <span className="text-[#a0a8b8] text-sm">
            {sets.length} set(s) affiché(s)
          </span>
          <Link
            href="/admin"
            className="text-[#b8860b] text-sm hover:underline"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSet && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d152a] border border-[#1a2238] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#1a2238]">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedSet.setId}</h2>
                <p className="text-[#a0a8b8] text-sm">
                  {selectedSet.type === 'hajj' ? 'Hajj 2026' : 'Voyageur'} • {selectedSet.qrCount} QR codes
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedSet(null);
                }}
                className="p-2 rounded-lg hover:bg-[#1a2238] transition-colors"
              >
                <X className="w-5 h-5 text-[#a0a8b8]" />
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
                    className="bg-white rounded-xl p-4 text-center"
                  >
                    <QRCodeSVG
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${ref}`}
                      size={140}
                      level="H"
                      includeMargin={true}
                      bgColor="#ffffff"
                      fgColor={selectedSet.type === 'hajj' ? '#0d5e34' : '#d35400'}
                    />
                    <p className="text-gray-800 font-mono font-bold mt-2 text-sm">
                      {ref}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {index === 0 ? 'Cabine' : 'Soute'} #{index + 1}
                    </p>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-[#0a0f2c] rounded-lg p-4">
                  <p className="text-[#a0a8b8] text-sm">Créé le</p>
                  <p className="text-white font-medium">{formatDate(selectedSet.createdAt)}</p>
                </div>
                <div className="bg-[#0a0f2c] rounded-lg p-4">
                  <p className="text-[#a0a8b8] text-sm">Agence</p>
                  <p className="text-white font-medium">{selectedSet.agencyName || 'N/A'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleDownloadSet(selectedSet)}
                  className="flex-1 py-3 bg-[#b8860b] text-white rounded-lg hover:bg-[#d4af37] transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger tout
                </button>
                <button
                  onClick={() => handleShareSet(selectedSet)}
                  className="flex-1 py-3 bg-[#0d5e34] text-white rounded-lg hover:bg-[#1e7e34] transition-colors flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d152a] border border-[#1a2238] rounded-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#7a1e1e]/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Supprimer ce set ?</h3>
                  <p className="text-[#a0a8b8] text-sm">{selectedSet.setId}</p>
                </div>
              </div>
              <p className="text-[#a0a8b8] text-sm mb-6">
                Cette action supprimera définitivement les {selectedSet.qrCount} QR codes de ce set.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedSet(null);
                  }}
                  className="flex-1 py-2 px-4 bg-[#1a2238] text-[#e0e6f0] rounded-lg hover:bg-[#2a2a3a] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteSet}
                  className="flex-1 py-2 px-4 bg-[#7a1e1e] text-white rounded-lg hover:bg-[#8a2e2e] transition-colors"
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
