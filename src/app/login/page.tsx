'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  Scan,
  Shield,
  BarChart3,
  Settings,
  Users,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";

// Agency Login Features
const agencyFeatures = [
  { icon: "✅", title: "Scan en temps réel", desc: "Suivez chaque bagage dès qu'il est scanné" },
  { icon: "⚡", title: "Commande en 1 clic", desc: "Générez des lots de QR en 30 secondes" },
  { icon: "📊", title: "Dashboard intuitif", desc: "Suivi des pèlerins, statuts, trouvailles" },
  { icon: "🛠️", title: "Support 24/7", desc: "Nous sommes là pour vous aider — sans délai" }
];

// Admin Login Features
const adminFeatures = [
  { icon: "🔐", title: "Sécurité renforcée", desc: "Authentification stricte, logs complets, feature flags" },
  { icon: "📈", title: "Tableau de bord centralisé", desc: "Suivi en temps réel de toutes les activités" },
  { icon: "⚙️", title: "Intégrations API", desc: "Activez Green API, géoloc, PDF à la demande" },
  { icon: "👥", title: "Gestion des rôles", desc: "Agences, pèlerins, voyageurs, admins — tout contrôlé" }
];

// Demo Accounts
const demoAccounts = {
  agency: { email: "agence@qrbag.com", password: "agence123" },
  admin: { email: "admin@qrbag.com", password: "admin123" }
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'agency';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const isAdmin = role === 'admin';
  const features = isAdmin ? adminFeatures : agencyFeatures;
  const buttonColor = isAdmin ? '#ff2a6d' : '#b8860b';
  const buttonHover = isAdmin ? '#e01e5a' : '#d4af37';

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            router.push(isAdmin ? '/admin/dashboard' : '/dashboard/agency');
          }
        }
      } catch {
        // Not logged in, continue
      }
    };
    checkSession();
  }, [router, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password,
          role: isAdmin ? 'superadmin' : 'agency'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect based on role
        router.push(isAdmin ? '/admin/dashboard' : '/dashboard/agency');
      } else {
        setError(data.error || 'Identifiants incorrects');
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    const account = demoAccounts[isAdmin ? 'admin' : 'agency'];
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex">
      {/* Left Column - Dark Demo Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#080c1a] text-white p-8 md:p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            {isAdmin ? 'QRBag — SuperAdmin' : 'QRBag pour les agences de voyage'}
          </h2>
          
          {/* Demo Illustration */}
          <div className="relative mb-8">
            <div className="w-full h-80 rounded-2xl bg-gradient-to-br from-[#1e3a2e] to-[#0d152a] flex items-center justify-center overflow-hidden">
              <div className="text-center p-6">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isAdmin ? 'bg-[#ff2a6d]' : 'bg-[#b8860b]'}`}>
                    {isAdmin ? (
                      <Shield className="w-7 h-7 text-white" />
                    ) : (
                      <QrCode className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <span className="text-2xl font-bold">
                    {isAdmin ? 'Contrôle total' : 'Scan en 30s'}
                  </span>
                </div>
                <p className="text-[#e0e6f0] max-w-sm text-lg">
                  {isAdmin 
                    ? 'Gérez agences, QR, utilisateurs, API — tout depuis un seul tableau de bord.'
                    : 'Suivez chaque bagage dès qu\'il est scanné — sans application, sans batterie.'
                  }
                </p>
              </div>
            </div>
            
            {/* Badge */}
            <div className={`absolute bottom-4 ${isAdmin ? 'right-4' : 'left-4'} bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg text-sm flex items-center gap-2`}>
              {isAdmin ? (
                <>
                  <Shield className="w-4 h-4" />
                  Sécurisé • RGPD • Auto-hébergé
                </>
              ) : (
                <>
                  💡 +500 agences font déjà confiance à QRBag
                </>
              )}
            </div>
          </div>

          {/* Features List */}
          <ul className="space-y-4 text-[#e0e6f0]">
            {features.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-sm opacity-80">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 bg-[#f9fafb]">
        <div className="w-full max-w-md">
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: buttonColor }}
              >
                <span className="text-white font-bold text-lg">QR</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isAdmin ? 'Espace Administrateur' : 'Espace Agence'}
              </h1>
            </div>
            <p className="text-gray-600">Connectez-vous à votre dashboard sécurisé</p>
          </div>

          {/* Role Switcher */}
          <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
            <Link
              href="/login?role=agency"
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all text-center ${
                !isAdmin 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Agence
            </Link>
            <Link
              href="/login?role=admin"
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all text-center ${
                isAdmin 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              SuperAdmin
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{ '--tw-ring-color': buttonColor } as React.CSSProperties}
                placeholder={isAdmin ? "admin@qrbag.com" : "vous@agence.com"}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition pr-12"
                  style={{ '--tw-ring-color': buttonColor } as React.CSSProperties}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 h-4 w-4 rounded border-gray-300 focus:ring-2"
                  style={{ accentColor: buttonColor }}
                />
                <span className="text-sm text-gray-600">Se souvenir de moi</span>
              </label>
              <a href="#" className="text-sm font-medium hover:underline" style={{ color: buttonColor }}>
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3.5 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              style={{ backgroundColor: buttonColor }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = buttonHover)}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = buttonColor)}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              {isAdmin ? (
                <>
                  Accès réservé ?{' '}
                  <a href="#" className="font-medium hover:underline" style={{ color: buttonColor }}>
                    Contactez-nous
                  </a>
                </>
              ) : (
                <>
                  Pas de compte ?{' '}
                  <Link href="/partenaires" className="font-medium hover:underline" style={{ color: buttonColor }}>
                    Devenez partenaire
                  </Link>
                </>
              )}
            </p>
          </div>

          {/* Demo Accounts */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Comptes de démonstration
              </h3>
              <button
                type="button"
                onClick={fillDemoAccount}
                className="text-xs font-medium hover:underline"
                style={{ color: buttonColor }}
              >
                Remplir
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">
                  {isAdmin ? 'SuperAdmin' : 'Agence'}
                </span>
                <span className="text-gray-500 font-mono">
                  {demoAccounts[isAdmin ? 'admin' : 'agency'].email} / {demoAccounts[isAdmin ? 'admin' : 'agency'].password}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Role Info */}
          <div className="lg:hidden mt-6 p-4 bg-[#080c1a] rounded-xl text-white">
            <p className="text-sm text-center opacity-80">
              {isAdmin 
                ? '🔐 SuperAdmin : Gérez agences, QR, utilisateurs, API'
                : '✅ Agence : Suivez vos bagages en temps réel'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
