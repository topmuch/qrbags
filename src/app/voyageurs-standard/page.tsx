'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  QrCode,
  Smartphone,
  Battery,
  MapPin,
  Star,
  Play,
  Facebook,
  Instagram,
  Twitter,
  Phone,
  Mail,
  MapPinned,
  Shield
} from "lucide-react";

// Navigation Component
function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080c1a]/95 backdrop-blur-md border-b border-[#1a2238]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#ff2a6d] to-[#d35400] rounded-lg flex items-center justify-center shadow-lg shadow-[#ff2a6d]/20">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#ff2a6d]">QRBag</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#procedure" className="text-[#e0e6f0] hover:text-[#d35400] transition-colors">Procédure</a>
            <a href="#avantages" className="text-[#e0e6f0] hover:text-[#d35400] transition-colors">Avantages</a>
            <a href="#tarifs" className="text-[#e0e6f0] hover:text-[#d35400] transition-colors">Tarifs</a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/demo">
              <Button variant="ghost" className="text-[#e0e6f0] hover:text-[#d35400]">
                <Play className="w-4 h-4 mr-1" />
                Démo
              </Button>
            </Link>
            <Link href="/#contact">
              <Button className="bg-[#d35400] hover:bg-[#c04800] text-white font-medium shadow-lg shadow-[#d35400]/20">
                Commander
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Link href="/" className="md:hidden text-[#e0e6f0] text-sm">
            ← Retour
          </Link>
        </div>
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section className="pt-16 bg-gradient-to-br from-[#d35400] to-[#e67e22] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 text-8xl">✈️</div>
        <div className="absolute bottom-10 left-10 text-8xl">🌍</div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-20 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
            <span className="text-2xl">✈️</span>
          </div>
          <span className="text-white font-bold text-2xl">Voyageurs Standard</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Protection flexible<br />
          <span className="text-[#ffd700]">pour tous vos voyages</span>
        </h1>

        <p className="text-[#e0e6f0]/90 text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Choisissez 1 ou 3 bagages avec une durée adaptée à vos besoins. Sans agence, sans engagement.
        </p>

        {/* Trust Pills */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20">
            <Smartphone className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Sans application</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20">
            <Battery className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Sans batterie</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20">
            <MapPin className="w-4 h-4 text-white" />
            <span className="text-white text-sm">Sans GPS</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="text-3xl font-bold text-white">1-3</div>
            <div className="text-white/70 text-sm">Bagages</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="text-3xl font-bold text-white">4€</div>
            <div className="text-white/70 text-sm">À partir de</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="text-3xl font-bold text-white">72h</div>
            <div className="text-white/70 text-sm">Ou 1 an</div>
          </div>
        </div>
      </div>

      {/* Wave Separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#080c1a"/>
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
      desc: "Choisissez 1 ou 3 QR codes selon vos besoins. Paiement sécurisé en ligne.",
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
    <section id="procedure" className="py-20 px-4 bg-[#080c1a]">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comment ça <span className="text-[#d35400]">marche ?</span>
          </h2>
          <p className="text-[#a0a8b8] text-lg">
            Une protection en 4 étapes simples, sans intermédiaire
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => (
            <div
              key={index}
              className="relative bg-[#0d1220] rounded-xl p-6 border border-[#1a2238] hover:border-[#d35400]/50 transition-all group"
            >
              {/* Step Number */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-r from-[#d35400] to-[#e67e22] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#d35400]/30">
                {item.step}
              </div>

              {/* Icon */}
              <div className="text-4xl mb-4 mt-2">{item.icon}</div>

              {/* Title */}
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>

              {/* Description */}
              <p className="text-[#a0a8b8] text-sm leading-relaxed">{item.desc}</p>
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
    { icon: "✅", text: "1 ou 3 bagages (selon besoin)" },
    { icon: "✅", text: "Durée personnalisée : 72h ou 1 an" },
    { icon: "✅", text: "Aucune agence requise — vous gérez tout" },
    { icon: "✅", text: "Pas d'application, pas de batterie, pas de GPS" },
    { icon: "✅", text: "Certifié RGPD — données protégées" },
    { icon: "✅", text: "Support client 24/7" },
  ];

  return (
    <section id="avantages" className="py-20 px-4 bg-[#0d1220]">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pourquoi choisir <span className="text-[#d35400]">QRBag Voyageurs ?</span>
          </h2>
        </div>

        {/* Advantages Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {advantages.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-[#0a0f2c] rounded-xl p-4 border border-[#1a2238] hover:border-[#d35400]/30 transition-all"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[#e0e6f0]">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Security Box */}
        <div className="bg-gradient-to-r from-[#d35400]/20 to-[#e67e22]/20 rounded-xl p-6 border border-[#d35400]/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#d35400] rounded-lg flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-2">100% Sécurisé & RGPD</h3>
              <p className="text-[#a0a8b8]">
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
      duration: "72h de protection",
      features: [
        "3 étiquettes QR incluses",
        "Support WhatsApp",
        "Notification email",
        "Activation instantanée"
      ],
      color: "#d35400",
      popular: false
    },
    {
      title: "Multi-voyages",
      subtitle: "Pour les voyageurs fréquents",
      price: "7 €",
      duration: "1 an de protection",
      features: [
        "3 étiquettes QR incluses",
        "Support prioritaire",
        "Renouvellement facile",
        "Statistiques de scans"
      ],
      color: "#ff2a6d",
      popular: true
    }
  ];

  return (
    <section id="tarifs" className="py-20 px-4 bg-[#080c1a]">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Tarifs <span className="text-[#d35400]">simples</span>
          </h2>
          <p className="text-[#a0a8b8] text-lg">
            Choisissez la formule adaptée à vos besoins
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-[#0d1220] rounded-xl p-6 border ${
                plan.popular ? 'border-[#ff2a6d] shadow-lg shadow-[#ff2a6d]/20' : 'border-[#1a2238]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff2a6d] text-white text-xs font-bold px-4 py-1 rounded-full">
                  POPULAIRE
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-1">{plan.title}</h3>
              <p className="text-[#a0a8b8] text-sm mb-4">{plan.subtitle}</p>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-[#d35400]">{plan.price}</span>
              </div>

              <p className="text-[#a0a8b8] text-sm mb-6">{plan.duration}</p>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-[#e0e6f0]">
                    <span className="text-[#d35400]">✓</span>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Link href="/#contact">
                <Button
                  className="w-full text-white font-bold py-3 hover:scale-105 transition-transform"
                  style={{ backgroundColor: plan.color }}
                >
                  Commander
                </Button>
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
      content: "Simple, efficace et pas cher. J'ai utilisé QRBag pour tous mes voyages cette année. Plus de stress !",
      avatar: "👩🏻"
    },
    {
      name: "Thomas Dubois",
      role: "Business traveler",
      content: "Je voyage souvent pour le travail. Avec QRBag, je suis tranquille. L'activation prend 30 secondes top chrono.",
      avatar: "👨🏻"
    }
  ];

  return (
    <section className="py-20 px-4 bg-[#0d1220]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ils nous font <span className="text-[#d35400]">confiance</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-[#0a0f2c] rounded-xl p-6 border border-[#1a2238] hover:border-[#d35400]/30 transition-colors"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-[#d35400] fill-[#d35400]" />
                ))}
              </div>
              <p className="text-[#e0e6f0] mb-6 leading-relaxed italic">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#d35400]/30 rounded-full flex items-center justify-center text-2xl">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-[#a0a8b8] text-sm">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-r from-[#d35400] to-[#e67e22]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Prêt à protéger<br />vos bagages ?
        </h2>
        <p className="text-[#e0e6f0]/80 max-w-xl mx-auto mb-8 text-lg">
          Commandez vos QR codes en quelques clics et voyagez l'esprit tranquille.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/#contact">
            <Button className="bg-white text-[#d35400] px-8 py-6 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-xl">
              🎟️ Commander maintenant
            </Button>
          </Link>
          <Link href="/demo">
            <Button className="bg-transparent border-2 border-white text-white px-8 py-6 rounded-lg font-bold text-lg hover:bg-white/10 transition-all">
              <Play className="w-5 h-5 mr-2" />
              Voir la démo
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-[#e0e6f0]/70 text-sm">
          Vous êtes une agence ?{' '}
          <Link href="/devenir-partenaire" className="text-[#ffd700] font-medium hover:underline">
            Devenez partenaire QRBag
          </Link>
        </p>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="border-t border-[#1a2238] py-12 px-4 bg-[#080c1a]">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff2a6d] to-[#d35400] rounded-lg flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#ff2a6d] to-[#d35400] bg-clip-text text-transparent">QRBag</span>
            </div>
            <p className="text-[#a0a8b8] text-sm">
              Protection intelligente des bagages pour voyageurs et pèlerins.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Produit</h4>
            <ul className="space-y-2 text-[#a0a8b8] text-sm">
              <li><Link href="/hajj-omra" className="hover:text-[#d35400] transition-colors">Hajj & Omra</Link></li>
              <li><Link href="/voyageurs-standard" className="hover:text-[#d35400] transition-colors">Voyageurs Standard</Link></li>
              <li><Link href="/demo" className="hover:text-[#d35400] transition-colors">Démo</Link></li>
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Entreprise</h4>
            <ul className="space-y-2 text-[#a0a8b8] text-sm">
              <li><Link href="/devenir-partenaire" className="hover:text-[#d35400] transition-colors">Devenir Partenaire</Link></li>
              <li><a href="/#contact" className="hover:text-[#d35400] transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contact</h4>
            <ul className="space-y-2 text-[#a0a8b8] text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#d35400]" />
                +33 7 45 34 93 39
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#d35400]" />
                contact@qrbag.com
              </li>
              <li className="flex items-center gap-2">
                <MapPinned className="w-4 h-4 text-[#d35400]" />
                Poissy, France
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#1a2238] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#a0a8b8] text-sm">
            © {new Date().getFullYear()} QRBag. Tous droits réservés.
          </p>

          <div className="flex items-center gap-4">
            <a href="https://facebook.com/qrbag" target="_blank" rel="noopener noreferrer" className="text-[#a0a8b8] hover:text-[#d35400] transition-colors" aria-label="Facebook">
              <Facebook className="w-5 h-5" aria-hidden="true" />
            </a>
            <a href="https://instagram.com/qrbag" target="_blank" rel="noopener noreferrer" className="text-[#a0a8b8] hover:text-[#d35400] transition-colors" aria-label="Instagram">
              <Instagram className="w-5 h-5" aria-hidden="true" />
            </a>
            <a href="https://twitter.com/qrbag" target="_blank" rel="noopener noreferrer" className="text-[#a0a8b8] hover:text-[#d35400] transition-colors" aria-label="Twitter">
              <Twitter className="w-5 h-5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Page Component
export default function VoyageursStandardPage() {
  return (
    <main className="min-h-screen bg-[#080c1a]">
      <Navigation />
      <HeroSection />
      <ProcedureSection />
      <AdvantagesSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
