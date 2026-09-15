'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, RefreshCw, Mail, ArrowLeft, ShieldCheck, MailCheck } from 'lucide-react';
import {
  BrandShell,
  BrandCard,
  BrandLogo,
  BrandIconRing,
  brandInput,
  brandLabel,
  brandBadge,
  brandBtnGradient,
  brandBtnNavy,
} from '@/components/brand/BrandShell';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      verifyWithToken(token);
    }
  }, [token]);

  const verifyWithToken = async (token: string) => {
    setStatus('loading');
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Votre email a été vérifié avec succès !');
      } else {
        setStatus('error');
        setMessage(data.error || 'Erreur lors de la vérification');
      }
    } catch {
      setStatus('error');
      setMessage('Erreur de connexion');
    }
  };

  const verifyWithCode = async () => {
    if (!code || !email) return;

    setVerifying(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Votre email a été vérifié avec succès !');
      } else {
        setMessage(data.error || 'Code invalide');
      }
    } catch {
      setMessage('Erreur de connexion');
    } finally {
      setVerifying(false);
    }
  };

  const resendVerification = async () => {
    if (!email) return;

    setVerifying(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      setMessage('Si un compte existe, un nouveau code a été envoyé');
    } catch {
      setMessage('Erreur lors de l\'envoi');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <BrandShell>
      <div className="w-full max-w-md mx-auto px-4 py-10 sm:py-14 flex flex-col items-center">
        {/* Logo + badge */}
        <div className="flex flex-col items-center text-center">
          <BrandLogo className="h-14 w-auto" />
          <span className={`${brandBadge} mt-4`}>
            <MailCheck className="w-3.5 h-3.5" />
            Vérification email
          </span>
          <p className="text-[#16234e]/60 text-sm mt-3">Confirmez votre adresse email</p>
        </div>

        {/* Card */}
        <BrandCard corners className="w-full p-7 sm:p-8 mt-6">
          {status === 'loading' && token && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-[#2f9bff]/10 flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-7 h-7 text-[#2f9bff] animate-spin" />
              </div>
              <p className="text-[#16234e]/60 text-sm">Vérification en cours...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <BrandIconRing glow="#10b981">
                <CheckCircle className="w-9 h-9 text-emerald-500" />
              </BrandIconRing>
              <h2 className="text-xl font-bold text-[#16234e] mt-5 mb-2">Email vérifié !</h2>
              <p className="text-[#16234e]/60 text-sm mb-6">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className={`${brandBtnGradient} w-full py-3.5 text-sm flex items-center justify-center gap-2.5`}
              >
                Se connecter
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <BrandIconRing glow="#ef4444">
                <XCircle className="w-9 h-9 text-red-500" />
              </BrandIconRing>
              <h2 className="text-xl font-bold text-[#16234e] mt-5 mb-2">Erreur</h2>
              <p className="text-[#16234e]/60 text-sm mb-6">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className={`${brandBtnNavy} w-full py-3.5 text-sm`}
              >
                Retour à la connexion
              </button>
            </div>
          )}

          {/* Code verification form */}
          {status !== 'success' && (!token || status === 'error') && (
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#2f9bff]/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-[#2f9bff]" />
                </div>
                <h2 className="text-xl font-bold text-[#16234e] mb-2">Entrez votre code</h2>
                <p className="text-[#16234e]/60 text-sm">
                  Entrez votre email et le code à 6 chiffres reçu par email
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="verify-email-field" className={brandLabel}>Email</label>
                  <div className={`relative flex items-center ${brandInput} focus-within:border-[#2f9bff] focus-within:ring-4 focus-within:ring-[#2f9bff]/15`}>
                    <Mail className={`w-[18px] h-[18px] shrink-0 mr-3 transition-colors ${
                      focusedField === 'email' ? 'text-[#16234e]' : 'text-[#16234e]/40'
                    }`} />
                    <input
                      id="verify-email-field"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="votre@email.com"
                      className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#16234e] placeholder:text-[#16234e]/35 text-sm py-2"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="verify-code" className={brandLabel}>Code de vérification</label>
                  <input
                    id="verify-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3.5 border-2 border-[#16234e]/15 focus:border-[#2f9bff] focus:ring-4 focus:ring-[#2f9bff]/15 rounded-xl text-[#16234e] text-center text-2xl tracking-[0.5em] font-mono bg-white placeholder:text-[#16234e]/35 focus:outline-none transition-all"
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={verifyWithCode}
                  disabled={verifying || code.length !== 6 || !email}
                  className={`${brandBtnGradient} w-full py-3.5 text-sm flex items-center justify-center gap-2.5`}
                >
                  {verifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    'Vérifier'
                  )}
                </button>

                {message && status !== 'success' && (
                  <p className="text-center text-red-600 text-sm">{message}</p>
                )}

                <button
                  onClick={resendVerification}
                  disabled={verifying || !email}
                  className="w-full py-3 text-[#2f9bff] font-semibold hover:underline text-sm disabled:opacity-50"
                >
                  Renvoyer le code
                </button>
              </div>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#16234e]/15 border-t-[#e6216e] rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
