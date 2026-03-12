'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  Eye,
  EyeOff,
  Loader2,
  Shield
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

// Admin Login Features
const adminFeatures = [
  { icon: "🔐", title: "Sécurité renforcée", desc: "Authentification stricte, logs complets, feature flags" },
  { icon: "📈", title: "Tableau de bord centralisé", desc: "Suivi en temps réel de toutes les activités" },
  { icon: "⚙️", title: "Intégrations API", desc: "Activez Green API, géoloc, PDF à la demande" },
  { icon: "👥", title: "Gestion des rôles", desc: "Agences, pèlerins, voyageurs, admins — tout contrôlé" }
];

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading, isSuperAdmin } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const buttonColor = '#000000'; // Black for buttons
  const buttonHover = '#1a1a1a';

  // Redirect if already logged in as superadmin
  useEffect(() => {
    if (!authLoading && user && isSuperAdmin) {
      router.replace('/admin/tableau-de-bord');
    }
  }, [user, authLoading, isSuperAdmin, router]);

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
          role: 'superadmin'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Use the auth context login function
        login(data.user);
        
        // Redirect to dashboard
        router.push('/admin/tableau-de-bord');
      } else {
        setError(data.error || 'Identifiants incorrects');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Left Column - Dark Demo Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white p-8 md:p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            QRBag — SuperAdmin
          </h2>
          
          {/* Demo Illustration */}
          <div className="relative mb-8">
            <div className="w-full h-80 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 flex items-center justify-center overflow-hidden">
              <div className="text-center p-6">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-black">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-2xl font-bold">Contrôle total</span>
                </div>
                <p className="text-slate-300 max-w-sm text-lg">
                  Gérez agences, QR, utilisateurs, API — tout depuis un seul tableau de bord.
                </p>
              </div>
            </div>
            
            {/* Badge */}
            <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Sécurisé • RGPD • Auto-hébergé
            </div>
          </div>

          {/* Features List */}
          <ul className="space-y-4 text-slate-300">
            {adminFeatures.map((item, i) => (
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md">
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#ff7f00] flex items-center justify-center">
                <QrCode className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Espace Administrateur</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">Connexion sécurisée réservée aux administrateurs</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7f00] focus:border-transparent transition"
                placeholder="admin@qrbag.com"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff7f00] focus:border-transparent transition pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
                  className="mr-2 h-4 w-4 rounded border-slate-300 accent-[#ff7f00]"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">Se souvenir de moi</span>
              </label>
              <Link 
                href="/forgot-password" 
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#ff7f00] dark:hover:text-[#ff7f00]"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          {/* Switch to Agency */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Vous êtes une agence ?{' '}
              <Link href="/agence/connexion" className="font-medium text-amber-500 hover:text-amber-600">
                Connexion Agence
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
