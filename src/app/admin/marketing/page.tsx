'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Search,
  Filter,
  MessageCircle,
  Clock,
  Plane,
  Briefcase,
  ChevronDown,
  X
} from 'lucide-react';

interface Client {
  id: string;
  reference: string;
  fullName: string;
  firstName: string;
  lastName: string;
  whatsapp: string;
  type: string;
  activationDate: string;
  expirationDate: string | null;
  status: 'active' | 'expiring_soon' | 'expired';
  agency: { id: string; name: string } | null;
  // Marketing fields removed - not available in production DB
  marketingOptin?: boolean;
  lastContactedAt?: string | null;
}

interface Stats {
  total: number;
  hajj: number;
  voyageur: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

interface Agency {
  id: string;
  name: string;
  slug: string;
}

// WhatsApp templates
const WHATSAPP_TEMPLATES = {
  relance_j7: {
    name: 'Relance J-7',
    getMessage: (firstName: string, expirationDate: string) =>
      `Bonjour ${firstName},

Votre protection QRBag expire le ${expirationDate}.

Souhaitez-vous renouveler pour 5€ (1 an) ?
👉 Répondez OUI pour activer le renouvellement automatique.

Merci,
QRBag – Votre tranquillité, notre mission`
  },
  expiration_passe: {
    name: 'Expiration passé',
    getMessage: (firstName: string, expirationDate: string, code: string) =>
      `Bonjour ${firstName},

Votre QRBag a expiré. Vos bagages ne sont plus protégés.

Renouvelez maintenant pour 5€ et voyagez en toute sécurité :
👉 https://qrbags.com/renouveler?code=${code}

QRBag`
  },
  offre_hajj: {
    name: 'Offre spéciale Hajj 2027',
    getMessage: (firstName: string) =>
      `Salam alaykoum ${firstName},

Vous avez protégé vos bagages avec QRBag en 2026.

Pour le Hajj 2027, bénéficiez de -20% :
✅ 3 QR codes = 28€ (au lieu de 35€)
✅ Logo de votre agence inclus

Réservez avant le 30 avril :
👉 https://qrbags.com/hajj2027

QRBag – Dakar`
  }
};

export default function MarketingPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, hajj: 0, voyageur: 0, active: 0, expiringSoon: 0, expired: 0 });
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected template for each client
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, keyof typeof WHATSAPP_TEMPLATES>>({});

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (agencyFilter !== 'all') params.append('agencyId', agencyFilter);
      if (dateRange !== 'all') params.append('dateRange', dateRange);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/marketing?${params}`);
      const data = await response.json();

      if (response.ok) {
        setClients(data.clients);
        setStats(data.stats);
        setAgencies(data.agencies);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, agencyFilter, dateRange, searchQuery]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Format WhatsApp number
  const formatWhatsApp = (phone: string) => {
    if (!phone) return '-';
    // Remove spaces and format
    const cleaned = phone.replace(/\s/g, '');
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  };

  // Open WhatsApp with template
  const openWhatsApp = async (client: Client) => {
    const templateKey = selectedTemplates[client.id] || 'relance_j7';
    const template = WHATSAPP_TEMPLATES[templateKey];

    const message = template.getMessage(
      client.firstName || 'Client',
      formatDate(client.expirationDate),
      client.reference
    );

    const whatsappUrl = `https://wa.me/${formatWhatsApp(client.whatsapp).replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Update last contacted date
    try {
      await fetch('/api/admin/marketing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baggageId: client.id })
      });

      // Update local state
      setClients(prev => prev.map(c =>
        c.id === client.id ? { ...c, lastContactedAt: new Date().toISOString() } : c
      ));
    } catch (error) {
      console.error('Error updating contact date:', error);
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['Nom complet', 'WhatsApp', 'Type', 'Date activation', 'Date expiration', 'Statut', 'Agence', 'Dernier contact'];
    const rows = clients.map(c => [
      c.fullName,
      c.whatsapp,
      c.type === 'hajj' ? 'Hajj 2026' : 'Voyage Standard',
      formatDate(c.activationDate),
      formatDate(c.expirationDate),
      c.status === 'active' ? 'Actif' : c.status === 'expiring_soon' ? 'Expire sous 7j' : 'Expiré',
      c.agency?.name || '',
      formatDate(c.lastContactedAt)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `qrbag_clients_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Actif
        </span>
      );
    } else if (status === 'expiring_soon') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
          <AlertTriangle className="w-3 h-3" />
          Expire sous 7j
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded-full text-xs font-medium">
          <X className="w-3 h-3" />
          Expiré
        </span>
      );
    }
  };

  // Type badge
  const TypeBadge = ({ type }: { type: string }) => {
    if (type === 'hajj') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
          🕋 Hajj 2026
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
        ✈️ Standard
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          📊 Marketing – Clients Activés
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Gérez vos campagnes marketing et relancez vos clients via WhatsApp
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total activés</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Expire sous 7j</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.expiringSoon}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Expirés</p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{stats.expired}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Actifs</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <Plane className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hajj 2026</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.hajj}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Standard</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.voyageur}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher (nom, WhatsApp, QR...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="all">Tous types</option>
              <option value="hajj">Hajj 2026</option>
              <option value="voyageur">Voyage Standard</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 appearance-none cursor-pointer pr-10 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actif</option>
              <option value="expiring_soon">Expire sous 7j</option>
              <option value="expired">Expiré</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Agency Filter */}
          <div className="relative">
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 appearance-none cursor-pointer pr-10 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="all">Toutes agences</option>
              {agencies.map(agency => (
                <option key={agency.id} value={agency.id}>{agency.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="all">Tout</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={fetchClients}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Users className="w-12 h-12 mb-4 opacity-50" />
            <p>Aucun client trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nom complet</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">WhatsApp</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Activation</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expiration</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Agence</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{client.fullName}</p>
                        <p className="text-xs text-slate-400">{client.reference}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{formatWhatsApp(client.whatsapp)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={client.type} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{formatDate(client.activationDate)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{formatDate(client.expirationDate)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={client.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{client.agency?.name || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Template Selector */}
                        <select
                          value={selectedTemplates[client.id] || 'relance_j7'}
                          onChange={(e) => setSelectedTemplates(prev => ({ ...prev, [client.id]: e.target.value as keyof typeof WHATSAPP_TEMPLATES }))}
                          className="text-xs px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
                        >
                          {Object.entries(WHATSAPP_TEMPLATES).map(([key, template]) => (
                            <option key={key} value={key}>{template.name}</option>
                          ))}
                        </select>

                        {/* WhatsApp Button */}
                        <button
                          onClick={() => openWhatsApp(client)}
                          disabled={!client.whatsapp}
                          className="px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-xs font-medium hover:bg-[#20BA5A] transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </button>
                      </div>
                      {client.lastContactedAt && (
                        <p className="text-xs text-slate-400 mt-1">
                          Contacté: {formatDate(client.lastContactedAt)}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        {clients.length} client{clients.length > 1 ? 's' : ''} trouvé{clients.length > 1 ? 's' : ''}
      </div>
    </div>
  );
}
