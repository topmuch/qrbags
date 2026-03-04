'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  QrCode,
  LogOut,
  Menu,
  X,
  Bell,
  Luggage,
  Search,
  Eye,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Users,
  Package,
  Moon,
  Sun,
  LayoutDashboard,
  Layers,
  ShoppingCart,
  FileText,
  HelpCircle,
  Globe,
  ChevronDown,
  ChevronRight,
  Building,
  Plane,
  Download,
  RefreshCw,
  Filter
} from "lucide-react";
import { useTheme } from '@/contexts/ThemeContext';

// Types
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

interface AgencyWithBaggages {
  id: string;
  name: string;
  baggages: Baggage[];
  travelerCount: number;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: number;
  isCategory?: boolean;
}

// Modern color palette
const COLORS = {
  primary: '#000000',
  secondary: '#ff7f00',
  sidebar: '#ff7f00',
};

// Sidebar Component
function Sidebar({ isOpen, setIsOpen, unreadMessages }: { isOpen: boolean; setIsOpen: (open: boolean) => void; unreadMessages?: number }) {
  const pathname = usePathname();
  
  const menuItems: MenuItem[] = [
    { label: "Tableau de bord", icon: <LayoutDashboard className="w-5 h-5" />, href: "/admin/dashboard" },
    { label: "GESTION", icon: null, isCategory: true },
    { label: "Utilisateurs", icon: <Users className="w-5 h-5" />, href: "/admin/utilisateurs" },
    { label: "Agences", icon: <Building className="w-5 h-5" />, href: "/admin/agences", badge: 3 },
    { label: "PRODUITS", icon: null, isCategory: true },
    { label: "Générer QR", icon: <QrCode className="w-5 h-5" />, href: "/admin/generer" },
    { label: "Étiquettes", icon: <Layers className="w-5 h-5" />, href: "/admin/etiquettes" },
    { label: "VOYAGEURS", icon: null, isCategory: true },
    { label: "Pèlerins Hajj", icon: <Users className="w-5 h-5" />, href: "/admin/hajj" },
    { label: "Voyageurs", icon: <Package className="w-5 h-5" />, href: "/admin/voyageurs" },
    { label: "MESSAGES", icon: null, isCategory: true },
    { label: "Messages", icon: <FileText className="w-5 h-5" />, href: "/admin/messages", badge: unreadMessages },
    { label: "Trouvailles", icon: <Search className="w-5 h-5" />, href: "/admin/trouvailles" },
    { label: "CONFIGURATION", icon: null, isCategory: true },
    { label: "Paramètres", icon: <Globe className="w-5 h-5" />, href: "/admin/parametres" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[280px] bg-[#ff7f00]
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col shadow-2xl
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">QRBag</span>
              <span className="block text-xs text-white/60">Administration</span>
            </div>
          </Link>
          <button
            className="lg:hidden absolute top-6 right-4 text-white/60 hover:text-white transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              if (item.isCategory) {
                return (
                  <li key={index} className="pt-4 first:pt-0">
                    <span className="px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </li>
                );
              }
              
              const isActive = pathname === item.href;
              
              return (
                <li key={index}>
                  <Link
                    href={item.href!}
                    className={`
                      relative flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200 group
                      ${isActive 
                        ? 'bg-black text-white shadow-lg' 
                        : 'text-white hover:bg-white/20 hover:text-white'
                      }
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                      {item.icon}
                    </span>
                    <span className="font-medium text-sm flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-[#ef4444] text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          <Link
            href="/login?role=admin"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Déconnexion</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

// Header Component
function Header({ unreadMessages, onMenuClick }: { unreadMessages?: number; onMenuClick: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 sticky top-0 z-30 transition-colors duration-300">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-2.5 w-80">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 w-full"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
          
          {/* Notifications */}
          <button className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            {unreadMessages && unreadMessages > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full"></span>
            )}
          </button>
          
          {/* User */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-600">
            <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center">
              <span className="text-white font-semibold text-sm">SA</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Super Admin</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Administrateur</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending_activation: { label: 'En attente', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    active: { label: 'Actif', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    scanned: { label: 'Scanné', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    lost: { label: 'Perdu', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    found: { label: 'Retrouvé', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    blocked: { label: 'Bloqué', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
  };

  const { label, className } = config[status] || { label: status, className: 'bg-slate-100 text-slate-600' };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// Agency Card Component
function AgencyCard({ 
  agency, 
  isExpanded, 
  onToggle 
}: { 
  agency: AgencyWithBaggages; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  const activeCount = agency.baggages.filter(b => b.status === 'active' || b.status === 'scanned').length;
  const lostCount = agency.baggages.filter(b => b.status === 'lost').length;
  const pendingCount = agency.baggages.filter(b => b.status === 'pending_activation').length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
      {/* Agency Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#ff7f00]/10 flex items-center justify-center">
            <Building className="w-6 h-6 text-[#ff7f00]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{agency.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {agency.travelerCount} voyageur{agency.travelerCount > 1 ? 's' : ''} • {agency.baggages.length} bagage{agency.baggages.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Quick Stats */}
          <div className="hidden sm:flex items-center gap-2">
            {activeCount > 0 && (
              <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                {activeCount} actif{activeCount > 1 ? 's' : ''}
              </span>
            )}
            {lostCount > 0 && (
              <span className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                {lostCount} perdu{lostCount > 1 ? 's' : ''}
              </span>
            )}
            {pendingCount > 0 && (
              <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                {pendingCount} en attente
              </span>
            )}
          </div>
          
          {/* Expand Icon */}
          <div className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </div>
        </div>
      </button>

      {/* Expanded Content - Baggages List */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50">
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium text-sm">Référence</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium text-sm">Voyageur</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium text-sm hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium text-sm hidden lg:table-cell">WhatsApp</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium text-sm">Statut</th>
                  <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-medium text-sm hidden xl:table-cell">Dernier scan</th>
                </tr>
              </thead>
              <tbody>
                {agency.baggages.map((baggage) => (
                  <tr
                    key={baggage.id}
                    className={`border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                      baggage.status === 'lost' ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#ff7f00]/10 flex items-center justify-center">
                          <QrCode className="w-4 h-4 text-[#ff7f00]" />
                        </div>
                        <span className="text-slate-800 dark:text-white font-mono font-medium text-sm">
                          {baggage.reference}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-800 dark:text-white font-medium">
                        {baggage.travelerFirstName} {baggage.travelerLastName}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-slate-600 dark:text-slate-300 text-sm">
                        {baggage.baggageType} #{baggage.baggageIndex}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-slate-600 dark:text-slate-300 text-sm">
                        {baggage.whatsappOwner || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={baggage.status} />
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-slate-500 dark:text-slate-400 text-sm">
                        {baggage.lastScanDate 
                          ? new Date(baggage.lastScanDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : 'Jamais'
                        }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Page Component
export default function VoyageursAdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agencies, setAgencies] = useState<AgencyWithBaggages[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedAgencies, setExpandedAgencies] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchVoyageurs();
  }, []);

  const fetchVoyageurs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/voyageurs');
      const data = await response.json();
      
      // Group by agency
      const agencyMap = new Map<string, AgencyWithBaggages>();
      
      data.travelers?.forEach((traveler: {
        agencyId: string | null;
        agency: { id: string; name: string } | null;
        baggages: Baggage[];
      }) => {
        const agencyId = traveler.agencyId || 'no-agency';
        const agencyName = traveler.agency?.name || 'Sans agence';
        
        if (!agencyMap.has(agencyId)) {
          agencyMap.set(agencyId, {
            id: agencyId,
            name: agencyName,
            baggages: [],
            travelerCount: 0,
          });
        }
        
        const agency = agencyMap.get(agencyId)!;
        agency.baggages.push(...traveler.baggages);
        agency.travelerCount++;
      });
      
      // Sort agencies alphabetically, "Sans agence" at the end
      const sortedAgencies = Array.from(agencyMap.values()).sort((a, b) => {
        if (a.id === 'no-agency') return 1;
        if (b.id === 'no-agency') return -1;
        return a.name.localeCompare(b.name);
      });
      
      setAgencies(sortedAgencies);
    } catch (error) {
      console.error('Error fetching voyageurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgency = (agencyId: string) => {
    setExpandedAgencies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agencyId)) {
        newSet.delete(agencyId);
      } else {
        newSet.add(agencyId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedAgencies(new Set(agencies.map(a => a.id)));
  };

  const collapseAll = () => {
    setExpandedAgencies(new Set());
  };

  // Filter agencies
  const filteredAgencies = agencies.filter(agency => {
    if (!searchFilter) return true;
    const searchLower = searchFilter.toLowerCase();
    
    // Search in agency name
    if (agency.name.toLowerCase().includes(searchLower)) return true;
    
    // Search in baggages
    return agency.baggages.some(b => 
      b.reference.toLowerCase().includes(searchLower) ||
      `${b.travelerFirstName || ''} ${b.travelerLastName || ''}`.toLowerCase().includes(searchLower)
    );
  });

  // Calculate total stats
  const totalBaggages = agencies.reduce((sum, a) => sum + a.baggages.length, 0);
  const totalTravelers = agencies.reduce((sum, a) => sum + a.travelerCount, 0);
  const totalActive = agencies.reduce((sum, a) => sum + a.baggages.filter(b => b.status === 'active' || b.status === 'scanned').length, 0);
  const totalLost = agencies.reduce((sum, a) => sum + a.baggages.filter(b => b.status === 'lost').length, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6 lg:p-8">
          {/* Page Title */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Voyageurs</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">QR codes organisés par agence</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchVoyageurs}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Total agences</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">{agencies.length}</p>
                </div>
                <div className="w-12 h-12 bg-[#ff7f00]/10 rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-[#ff7f00]" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Total voyageurs</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalTravelers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Bagages actifs</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalActive}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Bagages perdus</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalLost}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par agence, voyageur ou référence..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7f00]/20 focus:border-[#ff7f00] transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
              >
                Tout ouvrir
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Tout fermer
              </button>
            </div>
          </div>

          {/* Agencies List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#ff7f00]/30 border-t-[#ff7f00] rounded-full animate-spin" />
            </div>
          ) : filteredAgencies.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-700">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plane className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">Aucun voyageur trouvé</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                {searchFilter ? 'Modifiez vos critères de recherche' : 'Les voyageurs apparaîtront ici une fois les QR codes générés'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAgencies.map((agency) => (
                <AgencyCard
                  key={agency.id}
                  agency={agency}
                  isExpanded={expandedAgencies.has(agency.id)}
                  onToggle={() => toggleAgency(agency.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
