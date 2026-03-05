'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  Plane,
  Luggage,
  QrCode,
  Shield,
  Smartphone,
  Battery,
  MapPin,
  MessageCircle,
  CheckCircle,
  Star,
  Menu,
  X,
  Mail,
  Phone,
  MapPinned,
  Lock,
  Zap,
  Eye,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Play
} from "lucide-react";

// Navigation Component
function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

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
            <a href="/#solutions" className="text-[#e0e6f0] hover:text-[#ff2a6d] transition-colors">Solutions</a>
            <a href="/#comment" className="text-[#e0e6f0] hover:text-[#ff2a6d] transition-colors">Comment ça marche</a>
            <a href="/#tarifs" className="text-[#e0e6f0] hover:text-[#ff2a6d] transition-colors">Tarifs</a>
            <Link href="/contact" className="text-[#e0e6f0] hover:text-[#ff2a6d] transition-colors">Contact</Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/demo">
              <Button variant="ghost" className="text-[#e0e6f0] hover:text-[#ff2a6d]">
                <Play className="w-4 h-4 mr-1" />
                Démo
              </Button>
            </Link>
            <Link href="/agence/connexion">
              <Button variant="ghost" className="text-[#b8860b] hover:text-[#d4af37] border border-[#b8860b]/30">
                Espace Agence
              </Button>
            </Link>
            <Link href="/admin/connexion">
              <Button variant="ghost" className="text-[#ff2a6d] hover:text-[#e01e5a] border border-[#ff2a6d]/30">
                SuperAdmin
              </Button>
            </Link>
            <Link href="/devenir-partenaire">
              <Button className="bg-[#ff2a6d] hover:bg-[#e01e5a] text-white font-medium shadow-lg shadow-[#ff2a6d]/20">
                Devenir Partenaire
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-[#e0e6f0]"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-[#1a2238]">
            <div className="flex flex-col gap-4">
              <a href="/#solutions" className="text-[#e0e6f0] hover:text-[#ff2a6d]" onClick={() => setIsOpen(false)}>Solutions</a>
              <a href="/#comment" className="text-[#e0e6f0] hover:text-[#ff2a6d]" onClick={() => setIsOpen(false)}>Comment ça marche</a>
              <a href="/#tarifs" className="text-[#e0e6f0] hover:text-[#ff2a6d]" onClick={() => setIsOpen(false)}>Tarifs</a>
              <Link href="/contact" className="text-[#e0e6f0] hover:text-[#ff2a6d]" onClick={() => setIsOpen(false)}>Contact</Link>
              <Link href="/demo" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full text-[#ff2a6d]">Voir la Démo</Button>
              </Link>
              <Link href="/agence/connexion" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full text-[#b8860b] border border-[#b8860b]/30">Espace Agence</Button>
              </Link>
              <Link href="/admin/connexion" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full text-[#ff2a6d] border border-[#ff2a6d]/30">SuperAdmin</Button>
              </Link>
              <Link href="/devenir-partenaire" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-[#ff2a6d] hover:bg-[#e01e5a] text-white">Devenir Partenaire</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section className="min-h-screen flex items-center pt-16 pb-20 px-4 bg-[#080c1a] relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff2a6d]/5 via-transparent to-[#d35400]/5 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="px-4 py-2 bg-[#ff2a6d]/20 border border-[#ff2a6d]/50 text-[#ff2a6d] text-sm rounded-full font-medium animate-pulse">
                🔥 La protection intelligente pour vos bagages
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Un bagage perdu = un voyage gâché.
              <span className="block bg-gradient-to-r from-[#ff2a6d] to-[#d35400] bg-clip-text text-transparent text-3xl md:text-4xl lg:text-5xl mt-2">
                Avec QRBag, retrouvez-le en quelques heures.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-[#a0a8b8] text-lg md:text-xl mb-8 max-w-xl mx-auto lg:mx-0">
              Il suffit d&apos;un QR code pour le retrouver. Géolocalisé en temps réel, activé en 30 secondes, vous êtes notifié par WhatsApp dès qu&apos;il est trouvé.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/contact">
                <Button className="bg-[#ff2a6d] hover:bg-[#e01e5a] text-white px-8 py-6 rounded-lg font-bold text-lg shadow-xl shadow-[#ff2a6d]/30 transition-all hover:scale-105">
                  📦 Commander mes QR
                </Button>
              </Link>
              <Link href="/demo">
                <Button className="bg-[#d35400] hover:bg-[#c04800] text-white px-8 py-6 rounded-lg font-bold text-lg transition-all hover:scale-105">
                  <Play className="w-5 h-5 mr-2" />
                  Voir la démo
                </Button>
              </Link>
            </div>

            {/* Trust Pills */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-8">
              <div className="flex items-center gap-2 bg-[#0d1220] px-4 py-2 rounded-full border border-[#1a2238]">
                <Smartphone className="w-4 h-4 text-[#ff2a6d]" />
                <span className="text-[#a0a8b8] text-sm">Sans application</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0d1220] px-4 py-2 rounded-full border border-[#1a2238]">
                <Battery className="w-4 h-4 text-[#ff2a6d]" />
                <span className="text-[#a0a8b8] text-sm">Sans batterie</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0d1220] px-4 py-2 rounded-full border border-[#1a2238]">
                <MapPin className="w-4 h-4 text-[#ff2a6d]" />
                <span className="text-[#a0a8b8] text-sm">Géolocalisé</span>
              </div>
            </div>
          </div>

          {/* Right Content - QR Code Display */}
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-[#ff2a6d]/20 blur-3xl rounded-full animate-pulse" />
              <div className="absolute inset-4 bg-[#d35400]/10 blur-2xl rounded-full" />

              {/* QR Card */}
              <div className="relative bg-[#0d1220] rounded-3xl p-8 border border-[#1a2238] shadow-2xl hover:scale-105 transition-transform duration-300">
                <div className="w-64 h-64 bg-white rounded-2xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                  {/* QR Pattern Background */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="grid grid-cols-8 grid-rows-8 h-full w-full p-2 gap-0.5">
                      {[...Array(64)].map((_, i) => (
                        <div key={i} className="bg-[#ff2a6d] rounded-sm" />
                      ))}
                    </div>
                  </div>
                  <QrCode className="w-44 h-44 text-[#080c1a] relative z-10" />
                  <p className="text-[#080c1a] font-mono text-sm mt-2 font-bold">DEMO-001</p>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-[#ff2a6d] font-medium">Scannez pour voir la démo</p>
                  <p className="text-[#a0a8b8] text-sm mt-1">Activation en 30 secondes</p>
                </div>
                <Link href="/demo">
                  <Button className="w-full mt-4 bg-[#ff2a6d] hover:bg-[#e01e5a] text-white">
                    Essayer maintenant
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Stats Section
function StatsSection() {
  const stats = [
    { value: "10K+", label: "Bagages protégés", icon: "📦" },
    { value: "500+", label: "Agences partenaires", icon: "🤝" },
    { value: "98%", label: "Taux de récupération", icon: "✅" },
    { value: "24/7", label: "Support disponible", icon: "🛠️" }
  ];

  return (
    <section className="py-16 px-4 bg-[#080c1a]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-[#0d1220] rounded-xl border border-[#1a2238] hover:border-[#ff2a6d]/30 transition-all hover:scale-105"
            >
              <div className="text-4xl mb-3">{stat.icon}</div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff2a6d] to-[#d35400] bg-clip-text text-transparent mb-1">{stat.value}</div>
              <div className="text-[#a0a8b8] text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Solutions Section
function SolutionsSection() {
  return (
    <section id="solutions" className="py-20 px-4 bg-[#0d1220]">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff2a6d] to-[#d35400] bg-clip-text text-transparent mb-4">
            Deux solutions, une protection
          </h2>
          <p className="text-[#a0a8b8] text-lg max-w-2xl mx-auto">
            Que vous soyez pèlerin ou voyageur, QRBag s&apos;adapte à vos besoins avec des solutions sur mesure.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Hajj Card */}
          <div className="group bg-gradient-to-br from-[#1e3a2e] to-[#0d5e34] rounded-2xl p-6 border border-[#1e3a2e]/50 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-[#1e3a2e]/30">
            <div className="text-5xl mb-4">🕋</div>
            <h3 className="text-xl font-bold text-white mb-3">Hajj & Omra</h3>
            <p className="text-white/80 mb-6 text-sm leading-relaxed">
              Protection complète pour les pèlerins avec 3 bagages inclus (cabine + 2 soutes). Gérée par votre agence de voyage partenaire.
            </p>
            <Link href="/hajj-omra">
              <Button className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30">
                En savoir plus <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Voyageur Card */}
          <div className="group bg-gradient-to-br from-[#d35400] to-[#e67e22] rounded-2xl p-6 border border-[#d35400]/50 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-[#d35400]/30">
            <div className="text-5xl mb-4">✈️</div>
            <h3 className="text-xl font-bold text-white mb-3">Voyageurs Standard</h3>
            <p className="text-white/80 mb-6 text-sm leading-relaxed">
              Protection flexible pour tous vos voyages. Choisissez 1 ou 3 bagages avec une durée adaptée à vos besoins.
            </p>
            <Link href="/voyageurs-standard">
              <Button className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30">
                En savoir plus <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Security Card */}
          <div className="group bg-[#0a0f2c] rounded-2xl p-6 border border-[#1a2238] hover:scale-105 hover:border-[#ff2a6d]/30 transition-all duration-300 shadow-xl">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-3">100% Sécurisé</h3>
            <p className="text-[#a0a8b8] mb-6 text-sm leading-relaxed">
              Vos données personnelles sont protégées et cryptées. Aucune information sensible n&apos;est exposée publiquement.
            </p>
            <div className="flex items-center gap-2 text-[#ff2a6d]">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Certifié RGPD</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Recevez votre QR",
      icon: "📱",
      description: "Commandez vos QR codes via notre formulaire B2B ou auprès de votre agence partenaire."
    },
    {
      number: "02",
      title: "Activez en 30s",
      icon: "⚡",
      description: "Scannez le QR code et remplissez le formulaire avec vos informations de voyage."
    },
    {
      number: "03",
      title: "Voyagez serein",
      icon: "✈️",
      description: "Vos bagages sont protégés. Collez simplement l'autocollant bien visible."
    },
    {
      number: "04",
      title: "Soyez notifié",
      icon: "🔔",
      description: "Si quelqu'un trouve votre bagage, vous recevez une alerte instantanée via WhatsApp."
    }
  ];

  return (
    <section id="comment" className="py-20 px-4 bg-[#080c1a]">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff2a6d] to-[#d35400] bg-clip-text text-transparent mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-[#a0a8b8] text-lg">
            Une protection en 4 étapes simples
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-[#0d1220] rounded-xl p-6 border border-[#1a2238] hover:border-[#ff2a6d]/30 transition-all group"
            >
              {/* Step Number */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-r from-[#ff2a6d] to-[#d35400] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#ff2a6d]/30">
                {step.number}
              </div>

              {/* Icon */}
              <div className="text-4xl mb-4 mt-2">{step.icon}</div>

              {/* Title */}
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>

              {/* Description */}
              <p className="text-[#a0a8b8] text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Demo Link */}
        <div className="mt-16 text-center">
          <Link href="/demo">
            <Button className="bg-[#ff2a6d] hover:bg-[#e01e5a] text-white px-8 py-6 rounded-lg font-bold text-lg shadow-xl shadow-[#ff2a6d]/30 transition-all hover:scale-105">
              <Play className="w-5 h-5 mr-2" />
              Voir la démo interactive
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Mamadou Diallo",
      role: "Pèlerin Hajj 2025",
      content: "Grâce à QRBag, j'ai retrouvé ma valise perdue à l'aéroport de Djeddah en moins de 2 heures. Une invention géniale !",
      avatar: "👴🏾"
    },
    {
      name: "Sophie Martin",
      role: "Voyageuse fréquente",
      content: "Simple, efficace et pas cher. J'ai utilisé QRBag pour tous mes voyages cette année. Plus de stress !",
      avatar: "👩🏻"
    }
  ];

  return (
    <section className="py-20 px-4 bg-[#0d1220]">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff2a6d] to-[#d35400] bg-clip-text text-transparent mb-4">
            Ils nous font confiance
          </h2>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-[#0a0f2c] rounded-xl p-6 border border-[#1a2238] hover:border-[#ff2a6d]/30 transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-[#ff2a6d] fill-[#ff2a6d]" />
                ))}
              </div>

              {/* Content */}
              <p className="text-[#e0e6f0] mb-6 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#1a2238] rounded-full flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-[#a0a8b8] text-sm">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pricing Section
function PricingSection() {
  const plans = [
    {
      title: "Pour 1 voyage",
      price: "4 €",
      duration: "7 jours de protection",
      features: [
        "3 étiquettes QR incluses",
        "Support WhatsApp",
        "Notification email",
        "Activation instantanée"
      ],
      color: "#d35400"
    },
    {
      title: "Pour plusieurs voyages",
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
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff2a6d] to-[#d35400] bg-clip-text text-transparent mb-4">
            Tarifs simples
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

              <h3 className="text-xl font-bold text-white mb-2">{plan.title}</h3>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold bg-gradient-to-r from-[#ff2a6d] to-[#d35400] bg-clip-text text-transparent">{plan.price}</span>
              </div>

              <p className="text-[#a0a8b8] text-sm mb-6">{plan.duration}</p>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-[#e0e6f0]">
                    <CheckCircle className="w-5 h-5 text-[#1e3a2e]" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link href="/contact">
                <Button
                  className="w-full text-white font-bold py-6 hover:scale-105 transition-transform"
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

// Final CTA Section
function FinalCTASection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-r from-[#d35400] to-[#ff2a6d]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Commencez dès maintenant
        </h2>
        <p className="text-white/90 max-w-2xl mx-auto mb-8 text-lg">
          Rejoignez les milliers de voyageurs qui protègent leurs bagages avec QRBag. Commandez vos QR codes en quelques clics.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact">
            <Button className="bg-white text-[#ff2a6d] px-8 py-6 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:scale-105">
              📦 Commander mes QR
            </Button>
          </Link>
          <Link href="/demo">
            <Button className="bg-transparent border-2 border-white text-white px-8 py-6 rounded-lg font-bold text-lg hover:bg-white/10 transition-all hover:scale-105">
              <Play className="w-5 h-5 mr-2" />
              Voir la démo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Contact CTA Section
function ContactCTASection() {
  return (
    <section className="py-20 px-4 bg-[#0d1220]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Une question ? Contactez-nous
        </h2>
        <p className="text-[#a0a8b8] text-lg mb-8 max-w-2xl mx-auto">
          Notre équipe est disponible pour répondre à toutes vos questions et vous accompagner dans votre projet.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact">
            <Button className="bg-[#ff2a6d] hover:bg-[#e01e5a] text-white px-8 py-4 rounded-lg font-bold text-lg shadow-xl shadow-[#ff2a6d]/30 transition-all hover:scale-105">
              <Mail className="w-5 h-5 mr-2" />
              Nous contacter
            </Button>
          </Link>
          <a
            href="https://wa.me/33745349339"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105">
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp
            </Button>
          </a>
        </div>
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
              <li><a href="/#solutions" className="hover:text-[#ff2a6d] transition-colors">Solutions</a></li>
              <li><a href="/#comment" className="hover:text-[#ff2a6d] transition-colors">Comment ça marche</a></li>
              <li><a href="/#tarifs" className="hover:text-[#ff2a6d] transition-colors">Tarifs</a></li>
              <li><Link href="/demo" className="hover:text-[#ff2a6d] transition-colors">Démo</Link></li>
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Entreprise</h4>
            <ul className="space-y-2 text-[#a0a8b8] text-sm">
              <li><Link href="/contact" className="hover:text-[#ff2a6d] transition-colors">Contact</Link></li>
              <li><Link href="/a-propos" className="hover:text-[#ff2a6d] transition-colors">À propos</Link></li>
              <li><Link href="/devenir-partenaire" className="hover:text-[#ff2a6d] transition-colors">Partenaires</Link></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Légal</h4>
            <ul className="space-y-2 text-[#a0a8b8] text-sm">
              <li><Link href="/mentions-legales" className="hover:text-[#ff2a6d] transition-colors">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-[#ff2a6d] transition-colors">Politique de confidentialité</Link></li>
              <li><Link href="/cgu" className="hover:text-[#ff2a6d] transition-colors">CGU</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#1a2238] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#a0a8b8] text-sm">
            © {new Date().getFullYear()} QRBag. Tous droits réservés.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a href="https://facebook.com/qrbag" target="_blank" rel="noopener noreferrer" className="text-[#a0a8b8] hover:text-[#ff2a6d] transition-colors" aria-label="Facebook">
              <Facebook className="w-5 h-5" aria-hidden="true" />
            </a>
            <a href="https://instagram.com/qrbag" target="_blank" rel="noopener noreferrer" className="text-[#a0a8b8] hover:text-[#ff2a6d] transition-colors" aria-label="Instagram">
              <Instagram className="w-5 h-5" aria-hidden="true" />
            </a>
            <a href="https://twitter.com/qrbag" target="_blank" rel="noopener noreferrer" className="text-[#a0a8b8] hover:text-[#ff2a6d] transition-colors" aria-label="Twitter">
              <Twitter className="w-5 h-5" aria-hidden="true" />
            </a>
          </div>

          {/* Map Link */}
          <a
            href="https://maps.google.com/?q=Poissy+France"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#a0a8b8] hover:text-[#ff2a6d] text-sm flex items-center gap-1 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Nous trouver
          </a>
        </div>
      </div>
    </footer>
  );
}

// Main Page Component
export default function Home() {
  return (
    <main className="min-h-screen bg-[#080c1a]">
      <Navigation />
      <HeroSection />
      <StatsSection />
      <SolutionsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTASection />
      <ContactCTASection />
      <Footer />
    </main>
  );
}

