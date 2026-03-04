'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  QrCode,
  LogOut,
  Menu,
  X,
  Bell,
  Luggage,
  MessageCircle,
  Search,
  User,
  AlertTriangle,
  Home,
  CheckCircle,
  Clock,
  ChevronDown,
  Settings,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from '@/contexts/ThemeContext';

// Demo agency data
export const DEMO_AGENCY = {
  id: 'demo-agency-1',
  name: 'FRANCINE MAKELA',
  slug: 'diop',
  email: 'contact@francine-makela.com',
  phone: '+221 77 123 45 67',
  address: 'Dakar, Sénégal'
};

// Modern color palette for agency
const COLORS = {
  primary: '#000000',      // Black for buttons
  secondary: '#ff7f00',    // Orange
  accent: '#06b6d4',       // Cyan
  success: '#10b981',      // Emerald
  warning: '#f59e0b',      // Amber
  danger: '#ef4444',       // Red
  sidebar: '#ff7f00',      // Orange sidebar
  sidebarHover: '#e67300', // Darker orange
  background: '#f8fafc',   // Slate 50
  card: '#ffffff',
  text: '#1e293b',         // Slate 800
  textMuted: '#64748b',    // Slate 500
};

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

function Sidebar({ isOpen, setIsOpen, unreadMessages }: { isOpen: boolean; setIsOpen: (open: boolean) => void; unreadMessages?: number }) {
  const pathname = usePathname();
  
  const menuItems: MenuItem[] = [
    { label: "Tableau de bord", icon: <Home className="w-5 h-5" />, href: "/dashboard/agency" },
    { label: "Bagages", icon: <Luggage className="w-5 h-5" />, href: "/dashboard/agency/baggages" },
    { label: "Assistance", icon: <MessageCircle className="w-5 h-5" />, href: "/dashboard/agency/assistance", badge: unreadMessages },
    { label: "Trouvailles", icon: <CheckCircle className="w-5 h-5" />, href: "/dashboard/agency/trouvailles" },
    { label: "Perdus", icon: <AlertTriangle className="w-5 h-5" />, href: "/dashboard/agency/perdus" },
    { label: "Profil", icon: <User className="w-5 h-5" />, href: "/dashboard/agency/profil" },
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
          <Link href="/dashboard/agency" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">QRBag</span>
              <span className="block text-xs text-white/80 font-medium">Espace Agence</span>
            </div>
          </Link>
          <button
            className="lg:hidden absolute top-6 right-4 text-white/60 hover:text-white transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Agency Info */}
        <div className="p-4 border-b border-white/10">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                <span className="text-white font-semibold text-sm">FM</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{DEMO_AGENCY.name}</p>
                <p className="text-white/50 text-xs">@{DEMO_AGENCY.slug}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard/agency' && pathname.startsWith(item.href));
              
              return (
                <li key={index}>
                  <Link
                    href={item.href}
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

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <Link
            href="/"
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
              placeholder="Rechercher un bagage..."
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
              <span className="text-white font-semibold text-sm">FM</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-700 dark:text-white">{DEMO_AGENCY.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Agence partenaire</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} unreadMessages={unreadMessages} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header unreadMessages={unreadMessages} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
