'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Moon,
  Sun,
  HelpCircle,
  Settings,
  BarChart3
} from "lucide-react";
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

// Demo agency data - used as fallback
export const DEMO_AGENCY = {
  id: 'demo-agency-1',
  name: 'FRANCINE MAKELA',
  slug: 'diop',
  email: 'contact@francine-makela.com',
  phone: '+221 77 123 45 67',
  address: 'Dakar, Sénégal'
};

// Agency Context for sharing agency data across pages
interface AgencyContextType {
  agencyId: string;
  agencyName: string;
  agencyData: typeof DEMO_AGENCY | null;
  userName: string;
  userEmail: string;
}

export const AgencyContext = createContext<AgencyContextType>({
  agencyId: DEMO_AGENCY.id,
  agencyName: DEMO_AGENCY.name,
  agencyData: null,
  userName: '',
  userEmail: ''
});

export const useAgency = () => useContext(AgencyContext);

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

// Modern Sidebar Component - Orange Theme with Black Buttons
function Sidebar({ isOpen, setIsOpen, unreadMessages, onLogout, userName }: { isOpen: boolean; setIsOpen: (open: boolean) => void; unreadMessages?: number; onLogout: () => void; userName: string }) {
  const pathname = usePathname();
  
  const menuItems: MenuItem[] = [
    { label: "Tableau de bord", icon: <Home className="w-5 h-5" />, href: "/agence/tableau-de-bord" },
    { label: "Bagages", icon: <Luggage className="w-5 h-5" />, href: "/agence/baggages" },
    { label: "Assistance", icon: <MessageCircle className="w-5 h-5" />, href: "/agence/assistance", badge: unreadMessages },
    { label: "Trouvailles", icon: <CheckCircle className="w-5 h-5" />, href: "/agence/trouvailles" },
    { label: "Perdus", icon: <AlertTriangle className="w-5 h-5" />, href: "/agence/perdus" },
    { label: "Rapports", icon: <BarChart3 className="w-5 h-5" />, href: "/agence/rapports" },
    { label: "Profil", icon: <User className="w-5 h-5" />, href: "/agence/profil" },
  ];

  return (
    <>
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
          <Link href="/agence/tableau-de-bord" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">QRBag</span>
              <span className="block text-xs text-white/60 font-medium">Espace Agence</span>
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
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/20">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
              <span className="text-white font-semibold text-sm">FM</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName || DEMO_AGENCY.name}</p>
              <p className="text-xs text-white/60">@{DEMO_AGENCY.slug}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href || 
                (item.href !== '/agence/tableau-de-bord' && pathname.startsWith(item.href));
              
              return (
                <li key={index}>
                  <Link
                    href={item.href}
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
                    <span className="shrink-0 text-white">
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

        {/* Support Section */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-black/30 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Besoin d'aide ?</span>
            </div>
            <p className="text-xs text-white/80 mb-3">Notre équipe est disponible 24/7</p>
            <Link 
              href="/agence/assistance"
              className="block w-full text-center py-2 bg-black rounded-xl text-sm font-medium hover:bg-black/80 transition-colors"
            >
              Contacter
            </Link>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black text-white hover:bg-black/80 transition-all duration-200 w-full"
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
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
          
          {/* Notifications */}
          <button className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            {unreadMessages && unreadMessages > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
            )}
          </button>
          
          {/* User */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
            <div className="w-9 h-9 rounded-full bg-[#ff7f00] flex items-center justify-center">
              <span className="text-white font-semibold text-sm">FM</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{userName || DEMO_AGENCY.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Agence partenaire</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AgencyRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user, loading, logout, isAgency } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect if not authenticated or not agency
  useEffect(() => {
    if (loading) return;
    
    // Skip redirect for login page
    if (pathname === '/agence/connexion') return;
    
    if (!user) {
      router.replace('/agence/connexion');
      return;
    }
    
    if (!isAgency) {
      // User is authenticated but not agency - redirect to admin area
      router.replace('/admin/tableau-de-bord');
    }
  }, [user, loading, isAgency, router, pathname]);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.replace('/agence/connexion');
  };

  // Get the actual agency ID from user data or use demo agency
  const agencyId = user?.agencyId || user?.agency?.id || DEMO_AGENCY.id;
  const agencyName = user?.agency?.name || user?.name || DEMO_AGENCY.name;
  const agencyData = user?.agency ? {
    id: user.agency.id,
    name: user.agency.name,
    slug: user.agency.slug,
    email: user.agency.email || DEMO_AGENCY.email,
    phone: user.agency.phone || DEMO_AGENCY.phone,
    address: user.agency.address || DEMO_AGENCY.address
  } : null;

  // Don't wrap login page with sidebar
  if (pathname === '/agence/connexion') {
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

  if (!user || !isAgency) {
    return null;
  }

  return (
    <AgencyContext.Provider value={{
      agencyId,
      agencyName,
      agencyData: agencyData || DEMO_AGENCY,
      userName: user.name,
      userEmail: user.email
    }}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} unreadMessages={unreadMessages} onLogout={handleLogout} userName={user.name} />

        <div className="flex-1 flex flex-col min-w-0">
          <Header unreadMessages={unreadMessages} onMenuClick={() => setSidebarOpen(true)} userName={user.name} />

          <main className="flex-1 p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AgencyContext.Provider>
  );
}
