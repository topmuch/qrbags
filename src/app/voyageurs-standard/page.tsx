'use client';

import Link from 'next/link';
import PublicLayout from '@/components/public/PublicLayout';
import {
  brandBadge,
  brandBtnGradient,
  brandBtnNavy,
} from '@/components/brand/BrandShell';
import {
  Smartphone,
  Battery,
  MapPin,
  Star,
  Play,
  Shield
} from "lucide-react";

// Hero Section — bandeau navy étiquette QRBags
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0e1734] to-[#16234e]">
      {/* Liseré dégradé signature + texture pointillée + halos */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-qrbag" aria-hidden />
      <div className="absolute inset-0 dotted-map-light opacity-60 pointer-events-none" aria-hidden />
      <div className="absolute top-1/4 -right-24 w-80 h-80 bg-[#e6216e]/15 rounded-full blur-[110px] pointer-events-none" aria-hidden />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#2f9bff]/15 rounded-full blur-[110px] pointer-events-none" aria-hidden />

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" aria-hidden>
        <div className="absolute top-10 right-10 text-8xl">✈️</div>
        <div className="absolute bottom-10 left-10 text-8xl">🌍</div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-3 mb-6">
          <span className={brandBadge}>✈️ Voyageurs</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Protection flexible<br />
          <span className="text-gradient-qrbag">pour tous vos voyages</span>
        </h1>

        <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Choisissez 1 ou 2 bagages soute avec une durée adaptée à vos besoins. Sans agence, sans engagement.
        </p>

        {/* Trust Pills */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/15">
            <Smartphone className="w-4 h-4 text-[#2f9bff]" aria-hidden />
            <span className="text-white text-sm">Sans application</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/15">
            <Battery className="w-4 h-4 text-[#f8921f]" aria-hidden />
            <span className="text-white text-sm">Sans batterie</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/15">
            <MapPin className="w-4 h-4 text-[#e6216e]" aria-hidden />
            <span className="text-white text-sm">Sans GPS</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/15">
            <div className="text-3xl font-bold text-white">1-2</div>
            <div className="text-white/60 text-sm">Bagages</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/15">
            <div className="text-3xl font-bold text-white">4€</div>
            <div className="text-white/60 text-sm">À partir de</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/15">
            <div className="text-3xl font-bold text-white">30 jours</div>
            <div className="text-white/60 text-sm">Ou 1 an</div>
          </div>
        </div>
      </div>

      {/* Wave Separator */}
      <div className="absolute bottom-0 left-0 right-0" aria-hidden>
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#ffffff"/>
        </svg>
      </div>
    </section>
  );
}

// Procedure Section
function ProcedureSection() {
  const steps = [
    {
      step: "01",
      title: "Commandez vos QR",
      desc: "Choisissez 1 ou 2 QR codes soute selon vos besoins. Paiement sécurisé en ligne.",
      icon: "🎫"
    },
    {
      step: "02",
      title: "Activez en 30s",
      desc: "Scannez un QR et remplissez vos informations. Aucune agence nécessaire.",
      icon: "⚡"
    },
    {
      step: "03",
      title: "Voyagez serein",
      desc: "Collez les autocollants sur vos bagages. Technologie identique au Hajj.",
      icon: "✈️"
    },
    {
      step: "04",
      title: "Soyez notifié",
      desc: "Recevez une alerte WhatsApp instantanée si votre bagage est retrouvé.",
      icon: "🔔"
    }
  ];

  return (
    <section id="procedure" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#16234e] mb-4">
            Comment ça <span className="text-gradient-qrbag">marche ?</span>
          </h2>
          <p className="text-[#16234e]/70 text-lg">
            Une protection en 4 étapes simples, sans intermédiaire
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => (
            <div
              key={index}
              className="relative bg-white rounded-2xl p-6 border border-[#16234e]/10 shadow-lg shadow-[#16234e]/5 hover:shadow-xl hover:shadow-[#16234e]/10 hover:-translate-y-1 transition-all group"
            >
              {/* Step Number */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-qrbag rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#e6216e]/25">
                {item.step}
              </div>

              {/* Icon */}
              <div className="text-4xl mb-4 mt-2" aria-hidden>{item.icon}</div>

              {/* Title */}
              <h3 className="text-lg font-bold text-[#16234e] mb-2">{item.title}</h3>

              {/* Description */}
              <p className="text-[#16234e]/70 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Advantages Section
function AdvantagesSection() {
  const advantages = [
    { icon: "✅", text: "1 ou 2 bagages soute (selon besoin)" },
    { icon: "✅", text: "Durée personnalisée : 30 jours ou 1 an" },
    { icon: "✅", text: "Aucune agence requise — vous gérez tout" },
    { icon: "✅", text: "Pas d'application, pas de batterie, pas de GPS" },
    { icon: "✅", text: "Certifié RGPD — données protégées" },
    { icon: "✅", text: "Support client 24/7" },
  ];

  return (
    <section id="avantages" className="py-20 px-4 bg-[#f6f9ff]">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#16234e] mb-4">
            Pourquoi choisir <span className="text-gradient-qrbag">QRBags Voyageurs ?</span>
          </h2>
        </div>

        {/* Advantages Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {advantages.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-[#16234e]/10 shadow-md shadow-[#16234e]/5 hover:shadow-lg hover:shadow-[#16234e]/10 transition-all"
            >
              <span className="text-xl" aria-hidden>{item.icon}</span>
              <span className="text-[#16234e]/80">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Security Box */}
        <div className="bg-gradient-to-r from-[#8b17c9]/10 via-[#e6216e]/5 to-[#f8921f]/10 rounded-2xl p-6 border border-[#8b17c9]/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#8b17c9] rounded-xl flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-white" aria-hidden />
            </div>
            <div>
              <h3 className="text-[#16234e] font-bold text-lg mb-2">100% Sécurisé &amp; RGPD</h3>
              <p className="text-[#16234e]/70">
                Vos données personnelles sont cryptées et stockées en Europe. Aucune information sensible n'est exposée publiquement. Vous pouvez supprimer votre compte à tout moment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Pricing Section
function PricingSection() {
  const plans = [
    {
      title: "Voyage unique",
      subtitle: "Idéal pour un voyage",
      price: "4 €",
      duration: "30 jours de protection",
      features: [
        "2 étiquettes QR incluses",
        "Support WhatsApp",
        "Notification email",
        "Activation instantanée"
      ],
      popular: false,
      commanderHref: "/commander?offre=solo"
    },
    {
      title: "Multi-voyages",
      subtitle: "Pour les voyageurs fréquents",
      price: "7 €",
      duration: "1 an de protection",
      features: [
        "2 étiquettes QR incluses",
        "Support prioritaire",
        "Renouvellement facile",
        "Statistiques de scans"
      ],
      popular: true,
      commanderHref: "/commander?offre=famille"
    }
  ];

  return (
    <section id="tarifs" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#16234e] mb-4">
            Tarifs <span className="text-gradient-qrbag">simples</span>
          </h2>
          <p className="text-[#16234e]/70 text-lg">
            Choisissez la formule adaptée à vos besoins
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-3xl p-6 ${
                plan.popular
                  ? 'border-2 border-[#e6216e]/40 shadow-2xl shadow-[#e6216e]/10'
                  : 'border border-[#16234e]/10 shadow-xl shadow-[#16234e]/5'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-qrbag text-white text-xs font-bold px-4 py-1 rounded-full shadow-md shadow-[#e6216e]/25">
                  POPULAIRE
                </div>
              )}

              <h3 className="text-xl font-bold text-[#16234e] mb-1">{plan.title}</h3>
              <p className="text-[#16234e]/60 text-sm mb-4">{plan.subtitle}</p>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-gradient-qrbag">{plan.price}</span>
              </div>

              <p className="text-[#16234e]/60 text-sm mb-6">{plan.duration}</p>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-[#16234e]/80">
                    <span className="text-[#2f9bff]" aria-hidden>✓</span>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Link href={plan.commanderHref} aria-label={`Commander l'offre ${plan.title}`}>
                <button
                  className={`w-full py-3 min-h-[48px] text-base ${plan.popular ? brandBtnGradient : brandBtnNavy}`}
                >
                  Commander
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sophie Martin",
      role: "Voyageuse fréquente",
      content: "Simple, efficace et pas cher. J'ai utilisé QRBags pour tous mes voyages cette année. Plus de stress !",
      avatar: "👩🏻"
    },
    {
      name: "Thomas Dubois",
      role: "Business traveler",
      content: "Je voyage souvent pour le travail. Avec QRBags, je suis tranquille. L'activation prend 30 secondes top chrono.",
      avatar: "👨🏻"
    }
  ];

  return (
    <section className="py-20 px-4 bg-[#f6f9ff]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#16234e] mb-4">
            Ils nous font <span className="text-gradient-qrbag">confiance</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 border border-[#16234e]/10 shadow-xl shadow-[#16234e]/5 hover:shadow-2xl hover:shadow-[#16234e]/10 transition-all"
            >
              <div className="flex gap-1 mb-4" aria-hidden>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-[#f8921f] fill-[#f8921f]" />
                ))}
              </div>
              <p className="text-[#16234e]/80 mb-6 leading-relaxed italic">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#8b17c9]/10 rounded-full flex items-center justify-center text-2xl">
                  <span aria-hidden>{t.avatar}</span>
                </div>
                <div>
                  <p className="font-semibold text-[#16234e]">{t.name}</p>
                  <p className="text-[#16234e]/60 text-sm">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section — bandeau navy
function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#16234e] py-20 px-4">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-qrbag" aria-hidden />
      <div className="absolute inset-0 dotted-map-light opacity-60 pointer-events-none" aria-hidden />

      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Prêt à protéger<br />vos bagages ?
        </h2>
        <p className="text-white/70 max-w-xl mx-auto mb-8 text-lg">
          Commandez vos QR codes en quelques clics et voyagez l'esprit tranquille.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/commander">
            <button className={`${brandBtnGradient} px-8 py-4 text-lg min-h-[52px]`}>
              🎟️ Commander maintenant
            </button>
          </Link>
          <Link href="/demo">
            <button className="bg-transparent border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white transition-all min-h-[52px] inline-flex items-center justify-center gap-2">
              <Play className="w-5 h-5" aria-hidden />
              Voir la démo
            </button>
          </Link>
        </div>

        <p className="mt-8 text-white/60 text-sm">
          Vous êtes une agence ?{' '}
          <Link href="/devenir-partenaire" className="text-[#ffd200] font-medium hover:underline">
            Devenez partenaire QRBags
          </Link>
        </p>
      </div>
    </section>
  );
}

// Main Page Component
export default function VoyageursStandardPage() {
  return (
    <PublicLayout>
      <HeroSection />
      <ProcedureSection />
      <AdvantagesSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
    </PublicLayout>
  );
}
