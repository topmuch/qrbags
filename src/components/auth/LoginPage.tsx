'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Building2,
  ArrowRight,
  Mail,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  brandLabel,
  brandBtnGradient,
  brandBadge,
} from '@/components/brand/BrandShell';

/* ══════════════════════════════════════════════
   CONFIG PER VARIANT
   ══════════════════════════════════════════════ */
type LoginVariant = 'agence' | 'superadmin';

interface LoginConfig {
  type: LoginVariant;
  title: string;
  subtitle: string;
  role: string;
  redirectPath: string;
  badgeText: string;
  badgeIcon: typeof QrCode;
  switchText: string;
  switchLink: string;
  switchHref: string;
  stats: { value: string; label: string }[];
  testimonials: { name: string; role: string; text: string }[];
}

const CONFIGS: Record<LoginVariant, LoginConfig> = {
  agence: {
    type: 'agence',
    title: 'Bienvenue',
    subtitle: 'Connectez-vous à votre espace agence pour gérer vos bagages et QR codes',
    role: 'agency',
    redirectPath: '/agence/tableau-de-bord',
    badgeText: 'Agence',
    badgeIcon: Building2,
    switchText: 'Vous êtes administrateur ?',
    switchLink: 'Connexion SuperAdmin',
    switchHref: '/admin/connexion',
    stats: [
      { value: '2M+', label: 'Bagages protégés' },
      { value: '850+', label: 'Agences partenaires' },
      { value: '45+', label: 'Pays couverts' },
      { value: '99.9%', label: 'Disponibilité' },
    ],
    testimonials: [
      { name: 'Fatou Diallo', role: 'Agence Hajj Express', text: 'QRBag a transformé notre gestion de bagages. Zéro perte depuis 2 ans.' },
      { name: 'Moussa Koné', role: 'Voyages Sahel', text: 'Le dashboard est simple et efficace. Nos clients sont rassurés.' },
    ],
  },
  superadmin: {
    type: 'superadmin',
    title: 'Administration',
    subtitle: 'Accès réservé aux administrateurs de la plateforme QRBag',
    role: 'superadmin',
    redirectPath: '/admin/tableau-de-bord',
    badgeText: 'Admin',
    badgeIcon: Shield,
    switchText: 'Vous êtes une agence ?',
    switchLink: 'Connexion Agence',
    switchHref: '/agence/connexion',
    stats: [
      { value: '2M+', label: 'Bagages protégés' },
      { value: '850+', label: 'Agences partenaires' },
      { value: '45+', label: 'Pays couverts' },
      { value: '99.9%', label: 'Disponibilité' },
    ],
    testimonials: [
      { name: 'Fatou Diallo', role: 'Agence Hajj Express', text: 'QRBag a transformé notre gestion de bagages. Zéro perte depuis 2 ans.' },
      { name: 'Moussa Koné', role: 'Voyages Sahel', text: 'Le dashboard est simple et efficace. Nos clients sont rassurés.' },
    ],
  },
};

/* ══════════════════════════════════════════════
   LOGIN PAGE COMPONENT
   ══════════════════════════════════════════════ */
export default function LoginPage({ variant }: { variant: LoginVariant }) {
  const config = CONFIGS[variant];
  const router = useRouter();
  const { user, login, loading: authLoading, isAgency, isSuperAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (authLoading) return;
    if (user && ((variant === 'agence' && isAgency) || (variant === 'superadmin' && isSuperAdmin))) {
      router.replace(config.redirectPath);
    }
  }, [user, authLoading, isAgency, isSuperAdmin, variant, router, config.redirectPath]);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % config.testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [config.testimonials.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: config.role }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login(data.user);
        router.push(config.redirectPath);
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

  const BadgeIcon = config.badgeIcon;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#16234e]">
      {/* ─── LEFT: Immersive Brand Panel (navy étiquette) ─── */}
      <div className="relative hidden lg:flex lg:w-[52%] min-h-screen flex-col overflow-hidden">
        {/* Navy background + dotted world map texture */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[#16234e]" />
          <div className="absolute inset-0 dotted-map-light" aria-hidden />
          {/* Brand orbs */}
          <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-[#8b17c9]/20 blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-[#e6216e]/15 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#f8921f]/15 blur-[150px]" />
          <div className="absolute -top-24 right-1/4 w-80 h-80 rounded-full bg-[#2f9bff]/15 blur-[110px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Top: Logo */}
          <div className="flex items-center justify-between">
            <Link href="/" className="group">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center group-hover:bg-white/15 transition-all">
                <img src="/logo.png" alt="QRBag" className="h-9 w-auto rounded-xl" />
              </div>
            </Link>
          </div>

          {/* Middle: Hero Content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            {/* Floating QR Code illustration */}
            <div className="relative mb-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-qrbag flex items-center justify-center shadow-2xl shadow-[#e6216e]/40">
                <QrCode className="w-10 h-10 text-white" />
              </div>
              {/* Decorative floating elements */}
              <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#ffd200]/80 animate-bounce" style={{ animationDelay: '0.5s' }} />
              <div className="absolute -bottom-2 -right-6 w-4 h-4 rounded-full bg-[#2f9bff]/70 animate-bounce" style={{ animationDelay: '1s' }} />
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-[1.1]">
              Protégez chaque
              <br />
              <span className="bg-gradient-to-r from-[#ffd200] via-[#f8921f] to-[#e6216e] bg-clip-text text-transparent">
                bagage, en toute
              </span>
              <br />
              sérénité.
            </h2>
            <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-md">
              Gérez vos bagages, vos clients et vos QR codes depuis un seul tableau de bord intuitif.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
              {config.stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-white font-bold text-xl xl:text-2xl">{stat.value}</p>
                  <p className="text-white/50 text-[10px] xl:text-xs mt-1 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: Testimonial */}
          <div className="relative">
            <div className="border-l-2 border-[#f8921f]/60 pl-5">
              <p className="text-white/70 text-sm italic leading-relaxed mb-3">
                &ldquo;{config.testimonials[activeTestimonial].text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-qrbag flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {config.testimonials[activeTestimonial].name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="text-white/90 text-xs font-medium">{config.testimonials[activeTestimonial].name}</p>
                  <p className="text-white/40 text-[10px]">{config.testimonials[activeTestimonial].role}</p>
                </div>
              </div>
            </div>
            {/* Dots indicator */}
            <div className="flex gap-1.5 mt-4">
              {config.testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  aria-label={`Témoignage ${i + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeTestimonial ? 'bg-[#f8921f] w-4' : 'bg-white/25'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Clean Form Panel ─── */}
      <div className="w-full lg:w-[48%] min-h-screen flex items-center justify-center bg-white px-6 py-12 sm:px-10 relative">
        {/* Signature gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-qrbag" aria-hidden />

        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-[#16234e] flex items-center justify-center">
              <img src="/logo.png" alt="QRBag" className="h-9 w-auto rounded-xl" />
            </div>
          </div>

          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className={brandBadge}>
              <BadgeIcon className="w-3 h-3" aria-hidden />
              {config.badgeText}
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#16234e] tracking-tight mb-2">
              {config.title}
            </h1>
            <p className="text-[#16234e]/60 text-sm leading-relaxed">{config.subtitle}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#e6216e] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="login-email" className={brandLabel}>
                Email
              </label>
              <div className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
                focusedField === 'email'
                  ? 'border-[#2f9bff] bg-white ring-4 ring-[#2f9bff]/15'
                  : 'border-[#16234e]/15 bg-[#f6f9ff]/60 hover:border-[#16234e]/30'
              }`}>
                <div className={`pl-4 transition-colors ${focusedField === 'email' ? 'text-[#2f9bff]' : 'text-[#16234e]/35'}`}>
                  <Mail className="w-[18px] h-[18px]" aria-hidden />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent border-none outline-none text-[#16234e] placeholder:text-[#16234e]/35 py-3.5 px-3 text-sm"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="login-password" className={brandLabel}>
                Mot de passe
              </label>
              <div className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
                focusedField === 'password'
                  ? 'border-[#2f9bff] bg-white ring-4 ring-[#2f9bff]/15'
                  : 'border-[#16234e]/15 bg-[#f6f9ff]/60 hover:border-[#16234e]/30'
              }`}>
                <div className={`pl-4 transition-colors ${focusedField === 'password' ? 'text-[#2f9bff]' : 'text-[#16234e]/35'}`}>
                  <Lock className="w-[18px] h-[18px]" aria-hidden />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent border-none outline-none text-[#16234e] placeholder:text-[#16234e]/35 py-3.5 px-3 text-sm"
                  placeholder="Entrez votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-4 text-[#16234e]/35 hover:text-[#2f9bff] transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer gap-2 group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-[#e6216e] focus:ring-2 focus:ring-[#2f9bff]/30 focus:ring-offset-0"
                />
                <span className="text-sm text-[#16234e]/60 group-hover:text-[#16234e] transition-colors">Se souvenir de moi</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-[#2f9bff] hover:underline transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`${brandBtnGradient} w-full py-3.5 px-4 text-sm flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch */}
          <div className="mt-8 text-center text-sm text-[#16234e]/60">
            {config.switchText}{' '}
            <Link
              href={config.switchHref}
              className="font-bold text-[#16234e] hover:text-[#2f9bff] hover:underline transition-colors"
            >
              {config.switchLink}
            </Link>
          </div>

          {/* Bottom links */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-[#16234e]/40">
            <Link href="/cgu" className="hover:text-[#2f9bff] transition-colors">CGU</Link>
            <span>•</span>
            <Link href="/confidentialite" className="hover:text-[#2f9bff] transition-colors">Confidentialité</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-[#2f9bff] transition-colors">Aide</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
