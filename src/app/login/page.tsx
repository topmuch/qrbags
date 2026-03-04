'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

// Types pour les contenus spécifiques
interface LoginContent {
  title: string;
  subtitle: string;
  features: Array<{
    icon: string;
    iconBg: string;
    title: string;
    description: string;
  }>;
  footerText: string;
  formTitle: string;
  formSubtitle: string;
  formIcon: string;
  primaryColor: string;
  primaryColorHover: string;
  linkText: string;
  linkHref: string;
}

// Contenu pour l'agence
const agencyContent: LoginContent = {
  title: 'QRBag pour les agences de voyage',
  features: [
    {
      icon: '✓',
      iconBg: '#1e7e34',
      title: 'Scan en temps réel',
      description: 'suivez chaque bagage dès qu\'il est scanné',
    },
    {
      icon: '✓',
      iconBg: '#1e7e34',
      title: 'Commande en 1 clic',
      description: 'générez des lots de QR codes en 30s',
    },
    {
      icon: '✓',
      iconBg: '#1e7e34',
      title: 'Dashboard intuitif',
      description: 'suivi des pèlerins, statuts, trouvailles',
    },
    {
      icon: '✓',
      iconBg: '#1e7e34',
      title: 'Support 24/7',
      description: 'nous sommes là pour vous aider',
    },
  ],
  footerText: 'Plus de 500 agences font déjà confiance à QRBag pour protéger les bagages de leurs pèlerins.',
  formTitle: 'Espace Agence',
  formSubtitle: 'Connectez-vous à votre dashboard',
  formIcon: '🏢',
  primaryColor: '#b8860b',
  primaryColorHover: '#d4af37',
  linkText: 'Devenez partenaire',
  linkHref: '/devenir-partenaire',
};

// Contenu pour le SuperAdmin
const adminContent: LoginContent = {
  title: 'QRBag pour les administrateurs',
  features: [
    {
      icon: '✓',
      iconBg: '#ff2a6d',
      title: 'Contrôle total',
      description: 'gérez agences, QR, utilisateurs, API',
    },
    {
      icon: '✓',
      iconBg: '#ff2a6d',
      title: 'Tableau de bord centralisé',
      description: 'suivi en temps réel de toutes les activités',
    },
    {
      icon: '✓',
      iconBg: '#ff2a6d',
      title: 'Intégrations API',
      description: 'activez Green API, géoloc, PDF à la demande',
    },
    {
      icon: '✓',
      iconBg: '#ff2a6d',
      title: 'Sécurité renforcée',
      description: 'authentification stricte, logs complets, feature flags',
    },
  ],
  footerText: 'QRBag est conçu pour les équipes techniques qui veulent un système scalable, sécurisé et évolutif.',
  formTitle: 'Espace Administrateur',
  formSubtitle: 'Accédez au panneau de contrôle',
  formIcon: '🔐',
  primaryColor: '#ff2a6d',
  primaryColorHover: '#e0195c',
  linkText: 'Contactez-nous',
  linkHref: '/contact',
};

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get('role');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirection par défaut vers agency
  useEffect(() => {
    if (!role) {
      router.replace('/login?role=agency');
    }
  }, [role, router]);

  // Sélection du contenu selon le rôle
  const content = role === 'admin' ? adminContent : agencyContent;

  // Handler pour le switch de rôle
  const handleRoleSwitch = (newRole: string) => {
    setError('');
    router.push(`/login?role=${newRole}`);
  };

  // Handler pour la connexion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Utiliser NextAuth pour la connexion
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Identifiants incorrects');
        setIsLoading(false);
        return;
      }

      // Vérifier le rôle après connexion
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();

      if (!sessionData.authenticated || !sessionData.user) {
        setError('Erreur lors de la récupération de la session');
        setIsLoading(false);
        return;
      }

      const userRole = sessionData.user.role;
      const expectedRole = role || 'agency';

      // Vérifier que le rôle correspond
      if (expectedRole === 'admin' && userRole !== 'superadmin') {
        setError('Accès non autorisé - Administrateur requis');
        setIsLoading(false);
        return;
      }

      if (expectedRole === 'agency' && userRole !== 'agency' && userRole !== 'superadmin') {
        setError('Accès non autorisé - Agence requise');
        setIsLoading(false);
        return;
      }

      // Sauvegarder les infos utilisateur dans localStorage
      localStorage.setItem('user', JSON.stringify(sessionData.user));
      localStorage.setItem('isLoggedIn', 'true');

      // Rediriger vers le bon dashboard
      const redirectUrl = userRole === 'superadmin' ? '/admin/dashboard' : '/dashboard/agency';
      router.push(redirectUrl);
    } catch (err) {
      console.error('Login error:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Colonne gauche - Fond sombre */}
      <div className="hidden lg:flex w-1/2 bg-[#080c1a] text-white p-8 flex-col justify-center relative overflow-hidden">
        {/* Background pattern optionnel */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-[#b8860b] blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-[#ff2a6d] blur-3xl"></div>
        </div>

        <div className="max-w-md relative z-10">
          <h2 className="text-2xl font-bold mb-6">{content.title}</h2>

          <ul className="space-y-4 text-[#e0e6f0]">
            {content.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center mt-0.5 shrink-0 text-white text-xs font-bold"
                  style={{ backgroundColor: feature.iconBg }}
                >
                  {feature.icon}
                </div>
                <span>
                  <strong>{feature.title}</strong> — {feature.description}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <p className="text-sm opacity-80">{content.footerText}</p>
          </div>

          {/* Switch de rôle */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-sm opacity-60 mb-3">Vous êtes...</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleRoleSwitch('agency')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  role === 'agency' || !role
                    ? 'bg-[#b8860b] text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                🏢 Une agence
              </button>
              <button
                onClick={() => handleRoleSwitch('admin')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  role === 'admin'
                    ? 'bg-[#ff2a6d] text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                🔐 Administrateur
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Colonne droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Logo et titre */}
          <div className="text-center mb-8">
            <a href="/" className="inline-block mb-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl">🎒</span>
                <span className="text-2xl font-bold text-[#080c1a]">QRBag</span>
              </div>
            </a>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-3xl">{content.formIcon}</span>
              <h1 className="text-3xl font-bold text-gray-900">{content.formTitle}</h1>
            </div>
            <p className="text-gray-600">{content.formSubtitle}</p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Formulaire */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-gray-900 bg-white"
                placeholder="vous@exemple.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none text-gray-900 bg-white"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 w-4 h-4 rounded border-gray-300"
                  style={{ accentColor: content.primaryColor }}
                />
                <span className="text-sm text-gray-600">Se souvenir de moi</span>
              </label>
              <a
                href="#"
                className="text-sm font-medium hover:underline"
                style={{ color: content.primaryColor }}
              >
                Mot de passe oublié ?
              </a>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-white py-3 rounded-lg font-bold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  backgroundColor: content.primaryColor,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = content.primaryColorHover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = content.primaryColor;
                }}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Connexion...
                  </>
                ) : (
                  'Se connecter →'
                )}
              </button>
            </div>

            {/* Comptes de démo */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-2 font-medium">Comptes de démonstration :</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Admin:</strong> admin@qrbag.com / admin123</p>
                <p><strong>Agence:</strong> agence@qrbag.com / agence123</p>
              </div>
            </div>

            {/* Lien inscription */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Pas de compte ?{' '}
              <a
                href={content.linkHref}
                className="font-medium hover:underline"
                style={{ color: content.primaryColor }}
              >
                {content.linkText}
              </a>
            </p>
          </form>

          {/* Mobile: Switch de rôle */}
          <div className="lg:hidden mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-3">Vous êtes...</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => handleRoleSwitch('agency')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  role === 'agency' || !role
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: role === 'agency' || !role ? '#b8860b' : undefined,
                }}
              >
                🏢 Une agence
              </button>
              <button
                onClick={() => handleRoleSwitch('admin')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  role === 'admin'
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: role === 'admin' ? '#ff2a6d' : undefined,
                }}
              >
                🔐 Administrateur
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b8860b]"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
