'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Luggage,
  Search,
  Eye,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
  MapPin,
  QrCode,
  X,
  Plane,
  ShoppingCart,
  Send,
  XCircle,
  TrendingUp,
  ArrowUpRight,
  Users,
  Package,
  Moon,
  Sun
} from "lucide-react";
import { DEMO_AGENCY } from './layout';
import { useTheme } from '@/contexts/ThemeContext';

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

interface Stats {
  total: number;
  pending: number;
  active: number;
  scanned: number;
  lost: number;
  found: number;
}

// KPI Card Component - Colorful CoreUI Style
function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  colorVariant,
  trend
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  colorVariant: 'purple' | 'blue' | 'cyan' | 'teal' | 'green' | 'orange' | 'red' | 'pink' | 'indigo';
  trend?: { value: number; label: string };
}) {
  // Generate random mini chart bars
  const chartBars = Array.from({ length: 12 }, (_, i) => ({
    height: 20 + Math.random() * 80,
  }));

  return (
    <div className={`kpi-card kpi-card-${colorVariant} p-6 opacity-0 animate-slide-up`}>
      <div className="flex items-start justify-between relative z-10">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <span className="text-white">{icon}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.value >= 0 ? 'text-white/90' : 'text-white/70'}`}>
            {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="mt-4 relative z-10">
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-sm font-medium text-white/90 mt-1">{title}</p>
        <p className="text-xs text-white/70 mt-1">{subtitle}</p>
      </div>
      
      {/* Mini Chart Bars */}
      <div className="mini-chart-bars mt-4">
        {chartBars.map((bar, i) => (
          <div 
            key={i} 
            className="mini-chart-bar" 
            style={{ height: `${bar.height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Quick Action Card
function QuickActionCard({ 
  title, 
  description, 
  icon, 
  color, 
  href,
  onClick 
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-md hover:scale-[1.02] transition-all duration-300 group cursor-pointer">
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-slate-800 dark:text-white">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <ArrowUpRight className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return <div onClick={onClick}>{content}</div>;
}

export default function AgencyDashboardPage() {
  const [baggages, setBaggages] = useState<Baggage[]>([]);
  const [filteredBaggages, setFilteredBaggages] = useState<Baggage[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    active: 0,
    scanned: 0,
    lost: 0,
    found: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBaggage, setSelectedBaggage] = useState<Baggage | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [baggageToDelete, setBaggageToDelete] = useState<Baggage | null>(null);
  
  // Command Modal State
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [commandForm, setCommandForm] = useState({
    type: 'hajj',
    count: 10,
    notes: ''
  });
  const [commandSubmitting, setCommandSubmitting] = useState(false);
  const [commandSuccess, setCommandSuccess] = useState(false);

  useEffect(() => {
    fetchBaggages();
  }, []);

  useEffect(() => {
    filterBaggages();
  }, [baggages, search, statusFilter]);

  const fetchBaggages = async () => {
    try {
      const params = new URLSearchParams({
        agencyId: DEMO_AGENCY.id,
      });

      const response = await fetch(`/api/agency/baggages?${params}`);
      const data = await response.json();

      setBaggages(data.baggages);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching baggages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBaggages = () => {
    let filtered = [...baggages];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(b =>
        b.reference.toLowerCase().includes(searchLower) ||
        `${b.travelerFirstName || ''} ${b.travelerLastName || ''}`.toLowerCase().includes(searchLower)
      );
    }

    setFilteredBaggages(filtered);
  };

  const handleDeleteBaggage = async () => {
    if (!baggageToDelete) return;

    try {
      await fetch(`/api/baggage/${baggageToDelete.id}`, {
        method: 'DELETE',
      });

      setBaggages(baggages.filter(b => b.id !== baggageToDelete.id));
      setShowDeleteModal(false);
      setBaggageToDelete(null);
    } catch (error) {
      console.error('Error deleting baggage:', error);
    }
  };

  // Handle command submission
  const handleCommandSubmit = async () => {
    setCommandSubmitting(true);
    
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'commande_agence',
          agencyId: DEMO_AGENCY.id,
          senderName: DEMO_AGENCY.name,
          content: {
            type: commandForm.type,
            count: commandForm.count,
            notes: commandForm.notes,
          },
        }),
      });
      setCommandSuccess(true);
      setTimeout(() => {
        setShowCommandModal(false);
        setCommandSuccess(false);
        setCommandForm({ type: 'hajj', count: 10, notes: '' });
      }, 2000);
    } catch (error) {
      console.error('Error sending command:', error);
    } finally {
      setCommandSubmitting(false);
    }
  };

  // Format date for display
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

  // Get status badge
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

  // Filter buttons
  const filterButtons = [
    { id: 'all', label: 'Tous' },
    { id: 'scanned', label: 'Scannés' },
    { id: 'pending_activation', label: 'En attente' },
    { id: 'lost', label: 'Perdus' },
    { id: 'found', label: 'Retrouvés' },
  ];

  // KPI Cards data
  const kpiCards = [
    {
      title: 'Total bagages',
      value: stats.total,
      subtitle: 'Tous les bagages',
      icon: <Luggage className="w-6 h-6" />,
      colorVariant: 'purple' as const,
    },
    {
      title: 'Scannés',
      value: stats.scanned + stats.active,
      subtitle: 'Bagages actifs',
      icon: <CheckCircle className="w-6 h-6" />,
      colorVariant: 'cyan' as const,
    },
    {
      title: 'En attente',
      value: stats.pending,
      subtitle: 'À activer',
      icon: <Clock className="w-6 h-6" />,
      colorVariant: 'orange' as const,
    },
    {
      title: 'Perdus',
      value: stats.lost,
      subtitle: 'Signalés perdus',
      icon: <AlertTriangle className="w-6 h-6" />,
      colorVariant: 'red' as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Bienvenue, <span className="text-[#ff7f00]">{DEMO_AGENCY.name}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Suivi en temps réel de vos bagages Hajj 2026</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card, index) => (
          <div key={index} className={`stagger-${index + 1}`}>
            <KPICard {...card} />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickActionCard
          title="Commander des QR"
          description="Passez une nouvelle commande"
          icon={<ShoppingCart className="w-6 h-6" />}
          color="#000000"
          onClick={() => setShowCommandModal(true)}
        />
        <QuickActionCard
          title="Voir les perdus"
          description={`${stats.lost} bagage(s) signalé(s)`}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="#ef4444"
          href="/dashboard/agency/perdus"
        />
        <QuickActionCard
          title="Trouvailles"
          description={`${stats.found} bagage(s) retrouvé(s)`}
          icon={<CheckCircle className="w-6 h-6" />}
          color="#10b981"
          href="/dashboard/agency/trouvailles"
        />
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par nom ou référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ff7f00]/20 focus:border-[#ff7f00] transition-all"
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
                ? 'bg-black text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm">Référence</th>
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm">Pèlerin</th>
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm hidden md:table-cell">Dernier scan</th>
                <th className="text-left px-6 py-4 text-slate-600 font-medium text-sm hidden lg:table-cell">Date/Heure</th>
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
                        <Clock className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500">Aucun bagage trouvé</p>
                      <p className="text-sm text-slate-400 mt-2">
                        {search || statusFilter !== 'all'
                          ? 'Essayez de modifier vos filtres.'
                          : 'Vos bagages apparaîtront ici une fois générés par l\'administrateur.'
                        }
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
                      {baggage.lastScanDate ? (
                        <div>
                          <span className="text-slate-600">{formatDateTime(baggage.lastScanDate)}</span>
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
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-slate-500 text-sm">{formatDate(baggage.createdAt)}</span>
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
                            setShowDetailModal(true);
                          }}
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors group"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4 text-slate-400 group-hover:text-[#ff7f00]" />
                        </button>
                        <button
                          onClick={() => {
                            setBaggageToDelete(baggage);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors group"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
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

      {/* Command Modal */}
      {showCommandModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ff7f00]/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-[#ff7f00]" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Commander vos QR codes</h3>
              </div>
              <button
                onClick={() => {
                  setShowCommandModal(false);
                  setCommandSuccess(false);
                }}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {commandSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">Demande envoyée !</h4>
                <p className="text-slate-500">Notre équipe vous contactera sous 24h.</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Type de QR codes</label>
                  <select
                    value={commandForm.type}
                    onChange={(e) => setCommandForm({ ...commandForm, type: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ff7f00]/20 focus:border-[#ff7f00]"
                  >
                    <option value="hajj">Hajj 2026 (3 QR/pèlerin)</option>
                    <option value="voyageur">Voyageurs Standard (1 ou 3 QR)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">
                    Nombre de {commandForm.type === 'hajj' ? 'pèlerins' : 'voyageurs'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={commandForm.count}
                    onChange={(e) => setCommandForm({ ...commandForm, count: parseInt(e.target.value) || 1 })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ff7f00]/20 focus:border-[#ff7f00]"
                    placeholder="Ex: 50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Remarques (optionnel)</label>
                  <textarea
                    rows={3}
                    value={commandForm.notes}
                    onChange={(e) => setCommandForm({ ...commandForm, notes: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7f00]/20 focus:border-[#ff7f00] resize-none"
                    placeholder="Ex: livraison urgente, dates de départ..."
                  />
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-slate-600 text-sm">
                    <strong className="text-slate-800">Estimation :</strong> {' '}
                    {commandForm.type === 'hajj' 
                      ? `${commandForm.count * 3} QR codes (${commandForm.count} pèlerins × 3)`
                      : `${commandForm.count} QR codes voyageur`
                    }
                  </p>
                </div>
                
                <button
                  onClick={handleCommandSubmit}
                  disabled={commandSubmitting}
                  className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {commandSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer la demande
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBaggage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Détails du bagage</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
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
                  <p className="text-slate-500 text-sm">Pèlerin</p>
                  <p className="text-slate-800 font-medium">{selectedBaggage.travelerFirstName} {selectedBaggage.travelerLastName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Type</p>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && baggageToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold">Supprimer ce bagage ?</h3>
                  <p className="text-slate-500 text-sm">{baggageToDelete.reference}</p>
                </div>
              </div>
              <p className="text-slate-500 text-sm mb-6">
                Cette action est irréversible. Le bagage de <strong className="text-slate-700">{baggageToDelete.travelerFirstName} {baggageToDelete.travelerLastName}</strong> sera définitivement supprimé.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setBaggageToDelete(null);
                  }}
                  className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteBaggage}
                  className="flex-1 py-2 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
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
