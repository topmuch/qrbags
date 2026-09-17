'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send, CheckCircle, RefreshCw, KeyRound } from 'lucide-react';
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      setSent(true);
    } catch {
      setSent(true);
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
            <KeyRound className="w-3.5 h-3.5" />
            Récupération d&apos;accès
          </span>
          <p className="text-[#16234e]/60 text-sm mt-3">Réinitialisation du mot de passe</p>
        </div>

        {/* Card */}
        <BrandCard corners className="w-full p-7 sm:p-8 mt-6">
          {!sent ? (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#2f9bff]/10 flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-7 h-7 text-[#2f9bff]" />
                </div>
                <h2 className="text-xl font-bold text-[#16234e] mb-2">Mot de passe oublié ?</h2>
                <p className="text-[#16234e]/60 text-sm leading-relaxed">
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="forgot-email" className={brandLabel}>Email</label>
                  <div className={`relative flex items-center ${brandInput} focus-within:border-[#2f9bff] focus-within:ring-4 focus-within:ring-[#2f9bff]/15`}>
                    <Mail className={`w-[18px] h-[18px] shrink-0 mr-3 transition-colors ${
                      focusedField === 'email' ? 'text-[#16234e]' : 'text-[#16234e]/40'
                    }`} />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="votre@email.com"
                      required
                      className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#16234e] placeholder:text-[#16234e]/35 text-sm py-2"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className={`${brandBtnGradient} w-full py-3.5 text-sm flex items-center justify-center gap-2.5`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer le lien
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <BrandIconRing glow="#10b981">
                <CheckCircle className="w-9 h-9 text-emerald-500" />
              </BrandIconRing>
              <h2 className="text-xl font-bold text-[#16234e] mt-5 mb-2">Email envoyé !</h2>
              <p className="text-[#16234e]/60 text-sm leading-relaxed mb-6">
                Si un compte existe avec l&apos;adresse <strong className="text-[#16234e]">{email}</strong>, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-[#2f9bff] font-semibold hover:underline text-sm"
              >
                Renvoyer un autre email
              </button>
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
