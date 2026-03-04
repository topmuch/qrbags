'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  QrCode,
  LogOut,
  Menu,
  X,
  Bell,
  Clock,
  Users,
  Building,
  Package,
  MessageSquare,
  Settings,
  Search,
  Moon,
  Sun,
  LayoutDashboard,
  Layers,
  ShoppingCart,
  Globe,
  ChevronDown,
  HelpCircle,
  FileText,
  BarChart3
} from "lucide-react";
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/admin/NotificationBell';

// Types
interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: number;
  isCategory?: boolean;
}

// Modern Sidebar Component - Orange Theme with Black Buttons
function Sidebar({ isOpen, setIsOpen, unreadMessages, onLogout, userName }: { isOpen: boolean; setIsOpen: (open: boolean) => void; unreadMessages?: number; onLogout: () => void; userName: string }) {
  const pathname = usePathname();
  
  const menuItems: MenuItem[] = [
    { label: "Tableau de bord", icon: <LayoutDashboard className="w-5 h-5" />, href: "/admin/tableau-de-bord" },
    { label: "MENU", icon: null, isCategory: true },
    { label: "Utilisateurs", icon: <Users className="w-5 h-5" />, href: "/admin/utilisateurs" },
    { label: "Agences", icon: <Building className="w-5 h-5" />, href: "/admin/agences", badge: 3 },
    { label: "PRODUITS", icon: null, isCategory: true },
    { label: "Générer QR", icon: <QrCode className="w-5 h-5" />, href: "/admin/generer" },
    { label: "Étiquettes", icon: <Layers className="w-5 h-5" />, href: "/admin/etiquettes" },
    { label: "VOYAGEURS", icon: null, isCategory: true },
    { label: "Pèlerins Hajj", icon: <Users className="w-5 h-5" />, href: "/admin/hajj" },
    { label: "Voyageurs", icon: <Package className="w-5 h-5" />, href: "/admin/voyageurs" },
    { label: "MESSAGES", icon: null, isCategory: true },
    { label: "Messages", icon: <MessageSquare className="w-5 h-5" />, href: "/admin/messages", badge: unreadMessages },
    { label: "Trouvailles", icon: <Search className="w-5 h-5" />, href: "/admin/trouvailles" },
    { label: "ANALYSE", icon: null, isCategory: true },
    { label: "Rapports", icon: <BarChart3 className="w-5 h-5" />, href: "/admin/rapports" },
    { label: "PARAMÈTRES", icon: null, isCategory: true },
    { label: "Paramètres", icon: <Settings className="w-5 h-5" />, href: "/admin/parametres" },
    { label: "Fonctionnalités", icon: <Globe className="w-5 h-5" />, href: "/admin/parametres/fonctionnalites" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Orange Background */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[280px] bg-[#ff7f00]
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col shadow-2xl
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/admin/tableau-de-bord" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">QRBag</span>
              <span className="block text-xs text-white/60 font-medium">Administration</span>
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
                    <span className="px-4 text-xs font-semibold text-white uppercase tracking-wider">
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
                      relative flex items-center gap-3 px-4 py-2.5 rounded-xl
                      transition-all duration-200 group
                      ${isActive 
                        ? 'bg-black text-white shadow-lg' 
                        : 'bg-black text-white hover:bg-black/80'
                      }
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className={`shrink-0 text-white`}>
                      {item.icon}
                    </span>
                    <span className="font-medium text-sm flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
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
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/20">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
              <span className="text-white font-semibold text-sm">SA</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName || 'Super Admin'}</p>
              <p className="text-xs text-white/60">Administrateur</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl bg-black text-white hover:bg-black/80 transition-all duration-200 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// Modern Header Component
function Header({ unreadMessages, onMenuClick, userName }: { unreadMessages?: number; onMenuClick: () => void; userName: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          
          {/* Search */}
          <div className="hidden md:flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 w-80">
            <Search className="w-4 h-4 text-slate-400" />
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
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
          
          {/* Notifications Bell with Dropdown */}
          <NotificationBell />
          
          {/* User */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
            <div className="w-9 h-9 rounded-full bg-[#ff7f00] flex items-center justify-center">
              <span className="text-white font-semibold text-sm">SA</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{userName || 'Super Admin'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Administrateur</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user, loading, logout, isSuperAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect if not authenticated or not superadmin
  useEffect(() => {
    if (loading) return;
    
    // Skip redirect for login page
    if (pathname === '/admin/connexion') return;
    
    if (!user) {
      router.replace('/admin/connexion');
      return;
    }
    
    if (!isSuperAdmin) {
      // User is authenticated but not superadmin - redirect to their area
      router.replace('/agence/tableau-de-bord');
    }
  }, [user, loading, isSuperAdmin, router, pathname]);

  // Handle logout
  const handleLogout = () => {
    logout();
    router.replace('/admin/connexion');
  };

  // Don't wrap login page with sidebar
  if (pathname === '/admin/connexion') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#ff7f00]/30 border-t-[#ff7f00] rounded-full animate-spin" />
          <span className="text-slate-500">Vérification...</span>
        </div>
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} unreadMessages={unreadMessages} onLogout={handleLogout} userName={user.name} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header unreadMessages={unreadMessages} onMenuClick={() => setSidebarOpen(true)} userName={user.name} />

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
