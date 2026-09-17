'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ArrowLeft, RefreshCw, CheckCircle, ShieldCheck } from 'lucide-react';
import {
  BrandShell,
  BrandCard,
  BrandLogo,
  BrandIconRing,
  brandInput,
  brandLabel,
  brandBadge,
  brandBtnGradient,
} from '@/components/brand/BrandShell';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!token) {
      setError('Token manquant');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Erreur lors de la réinitialisation');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BrandShell>
      <div className="w-full max-w-md mx-auto px-4 py-10 sm:py-14 flex flex-col items-center">
        {/* Logo + badge */}
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center rounded-2xl bg-white px-2.5 py-1 border border-[#16234e]/10 shadow-sm"><BrandLogo className="h-14 sm:h-16 w-auto" /></span>
          <span className={`${brandBadge} mt-4`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            Nouveau mot de passe
          </span>
          <p className="text-[#16234e]/60 text-sm mt-3">Sécurisez l&apos;accès à votre compte</p>
        </div>

        {/* Card */}
        <BrandCard corners className="w-full p-7 sm:p-8 mt-6">
          {!success ? (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#2f9bff]/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-[#2f9bff]" />
                </div>
                <h2 className="text-xl font-bold text-[#16234e] mb-2">Définir un nouveau mot de passe</h2>
                <p className="text-[#16234e]/60 text-sm">
                  Entrez votre nouveau mot de passe ci-dessous.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reset-password" className={brandLabel}>Nouveau mot de passe</label>
                  <div className={`relative flex items-center ${brandInput} focus-within:border-[#2f9bff] focus-within:ring-4 focus-within:ring-[#2f9bff]/15`}>
                    <Lock className={`w-[18px] h-[18px] shrink-0 mr-3 transition-colors ${
                      focusedField === 'password' ? 'text-[#16234e]' : 'text-[#16234e]/40'
                    }`} />
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      required
                      className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#16234e] placeholder:text-[#16234e]/35 text-sm py-2"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      className="pl-3 text-[#16234e]/40 hover:text-[#16234e] transition-colors shrink-0"
                    >
                      {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-confirm" className={brandLabel}>Confirmer le mot de passe</label>
                  <div className={`relative flex items-center ${brandInput} focus-within:border-[#2f9bff] focus-within:ring-4 focus-within:ring-[#2f9bff]/15`}>
                    <Lock className={`w-[18px] h-[18px] shrink-0 mr-3 transition-colors ${
                      focusedField === 'confirmPassword' ? 'text-[#16234e]' : 'text-[#16234e]/40'
                    }`} />
                    <input
                      id="reset-confirm"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      required
                      className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#16234e] placeholder:text-[#16234e]/35 text-sm py-2"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <span className="text-red-500 text-xs">!</span>
                    </div>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className={`${brandBtnGradient} w-full py-3.5 text-sm flex items-center justify-center gap-2.5`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Réinitialisation...
                    </>
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <BrandIconRing glow="#10b981">
                <CheckCircle className="w-9 h-9 text-emerald-500" />
              </BrandIconRing>
              <h2 className="text-xl font-bold text-[#16234e] mt-5 mb-2">Mot de passe réinitialisé !</h2>
              <p className="text-[#16234e]/60 text-sm mb-4">
                Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion.
              </p>
            </div>
          )}

          {/* Back link */}
          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-[#16234e]/60 hover:text-[#2f9bff] text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </BrandCard>

        {/* Tagline */}
        <p className="text-center text-[#16234e]/50 text-xs mt-6">Solution intelligente de suivi de bagages</p>
      </div>
    </BrandShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#16234e]/15 border-t-[#e6216e] rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
