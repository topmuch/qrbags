'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  QrCode,
  CheckCircle,
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
  MapPinned
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
            <a href="#procedure" className="text-[#e0e6f0] hover:text-[#1e3a2e] transition-colors">Procédure</a>
            <a href="#avantages" className="text-[#e0e6f0] hover:text-[#1e3a2e] transition-colors">Avantages</a>
            <a href="#faq" className="text-[#e0e6f0] hover:text-[#1e3a2e] transition-colors">FAQ</a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/demo">
              <Button variant="ghost" className="text-[#e0e6f0] hover:text-[#1e3a2e]">
                <Play className="w-4 h-4 mr-1" />
                Démo
              </Button>
            </Link>
            <Link href="/devenir-partenaire">
              <Button className="bg-[#1e3a2e] hover:bg-[#0d5e34] text-white font-medium shadow-lg shadow-[#1e3a2e]/20">
                Devenir Partenaire
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
    <section className="pt-16 bg-gradient-to-br from-[#1e3a2e] to-[#0d5e34] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-8xl">🕋</div>
        <div className="absolute bottom-10 right-10 text-8xl">🕌</div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-20 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-xl bg-[#b8860b] flex items-center justify-center shadow-lg">
            <span className="text-2xl">🕋</span>
          </div>
          <span className="text-white font-bold text-2xl">Hajj & Omra</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Protection complète<br />
          <span className="text-[#ffd700]">pour les pèlerins</span>
        </h1>

        <p className="text-[#e0e6f0]/90 text-lg md:text-xl max-w-2xl mx-auto mb-8">
          3 bagages inclus (cabine + 2 soutes). Gérée par votre agence de voyage partenaire.
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
            <div className="text-3xl font-bold text-white">3</div>
            <div className="text-white/70 text-sm">Bagages inclus</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="text-3xl font-bold text-white">98%</div>
            <div className="text-white/70 text-sm">Récupération</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="text-3xl font-bold text-white">30s</div>
            <div className="text-white/70 text-sm">Activation</div>
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
      title: "Recevez vos QR",
      desc: "Votre agence vous fournit 3 QR codes (1 cabine + 2 soutes) avant votre départ.",
      icon: "📦"
    },
    {
      step: "02",
      title: "Activez en 30s",
      desc: "Scannez un QR et remplissez le formulaire avec vos informations de voyage.",
      icon: "⚡"
    },
    {
      step: "03",
      title: "Voyagez serein",
      desc: "Collez les autocollants sur vos bagages. Ils sont maintenant protégés.",
      icon: "✈️"
    },
    {
      step: "04",
      title: "Soyez notifié",
      desc: "Recevez une alerte WhatsApp instantanée dès qu'un bagage est retrouvé.",
      icon: "🔔"
    }
  ];

  return (
    <section id="procedure" className="py-20 px-4 bg-[#080c1a]">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comment ça <span className="text-[#1e3a2e]">marche ?</span>
          </h2>
          <p className="text-[#a0a8b8] text-lg">
            Une protection en 4 étapes simples pour votre pèlerinage
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => (
            <div
              key={index}
              className="relative bg-[#0d1220] rounded-xl p-6 border border-[#1a2238] hover:border-[#1e3a2e]/50 transition-all group"
            >
              {/* Step Number */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-r from-[#1e3a2e] to-[#0d5e34] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#1e3a2e]/30">
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
    { icon: "✅", text: "3 QR codes inclus (cabine + 2 soutes)" },
    { icon: "✅", text: "Activation en 30 secondes" },
    { icon: "✅", text: "Notification WhatsApp instantanée" },
    { icon: "✅", text: "Géré par votre agence — pas de gestion technique" },
    { icon: "✅", text: "98% de taux de récupération" },
    { icon: "✅", text: "Support 24/7 disponible" },
  ];

  return (
    <section id="avantages" className="py-20 px-4 bg-[#0d1220]">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pourquoi choisir <span className="text-[#1e3a2e]">QRBag Hajj ?</span>
          </h2>
        </div>

        {/* Advantages Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {advantages.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-[#0a0f2c] rounded-xl p-4 border border-[#1a2238] hover:border-[#1e3a2e]/30 transition-all"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[#e0e6f0]">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-[#1e3a2e]/20 to-[#0d5e34]/20 rounded-xl p-6 border border-[#1e3a2e]/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#1e3a2e] rounded-lg flex items-center justify-center text-2xl shrink-0">
              🕌
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-2">Conçu pour le Hajj & Omra</h3>
              <p className="text-[#a0a8b8]">
                Notre système est spécialement adapté aux besoins des pèlerins. Les localisations incluent La Mecque, Médine, Djeddah et tous les sites saints. Les notifications WhatsApp fonctionnent même avec une connexion limitée.
              </p>
            </div>
          </div>
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
      name: "Fatou Ndiaye",
      role: "Pèlerine Omra 2025",
      content: "Mon agence m'a fourni les QR codes avant le départ. J'ai activé en quelques secondes et j'étais tranquille pour tout le voyage.",
      avatar: "👩🏾"
    }
  ];

  return (
    <section className="py-20 px-4 bg-[#080c1a]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ils nous font <span className="text-[#1e3a2e]">confiance</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-[#0d1220] rounded-xl p-6 border border-[#1a2238] hover:border-[#1e3a2e]/30 transition-colors"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-[#b8860b] fill-[#b8860b]" />
                ))}
              </div>
              <p className="text-[#e0e6f0] mb-6 leading-relaxed italic">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#1e3a2e]/30 rounded-full flex items-center justify-center text-2xl">
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

// FAQ Section
function FAQSection() {
  const faqs = [
    {
      q: "Comment obtenir mes QR codes ?",
      a: "Les QR codes sont fournis par votre agence de voyage partenaire. Demandez-leur s'ils proposent QRBag."
    },
    {
      q: "Combien de temps dure la protection ?",
      a: "La protection couvre toute la durée de votre pèlerinage, jusqu'à votre retour chez vous."
    },
    {
      q: "Que faire si mon bagage est perdu ?",
      a: "Rien à faire ! Si quelqu'un trouve votre bagage et scanne le QR code, vous recevez automatiquement une notification WhatsApp avec sa position."
    }
  ];

  return (
    <section id="faq" className="py-20 px-4 bg-[#0d1220]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Questions <span className="text-[#1e3a2e]">fréquentes</span>
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#0a0f2c] rounded-xl p-6 border border-[#1a2238]">
              <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
              <p className="text-[#a0a8b8]">{faq.a}</p>
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
    <section className="py-20 px-4 bg-gradient-to-r from-[#1e3a2e] to-[#0d5e34]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Prêt à protéger vos bagages<br />pour le Hajj 2026 ?
        </h2>
        <p className="text-[#e0e6f0]/80 max-w-xl mx-auto mb-8 text-lg">
          Demandez à votre agence de voyage si elle propose QRBag, ou contactez-nous pour plus d'informations.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/#contact">
            <Button className="bg-white text-[#1e3a2e] px-8 py-6 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-xl">
              📦 Commander via votre agence
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
          Vous êtes agence ?{' '}
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
              <li><Link href="/hajj-omra" className="hover:text-[#1e3a2e] transition-colors">Hajj & Omra</Link></li>
              <li><Link href="/voyageurs-standard" className="hover:text-[#1e3a2e] transition-colors">Voyageurs Standard</Link></li>
              <li><Link href="/demo" className="hover:text-[#1e3a2e] transition-colors">Démo</Link></li>
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Entreprise</h4>
            <ul className="space-y-2 text-[#a0a8b8] text-sm">
              <li><Link href="/devenir-partenaire" className="hover:text-[#1e3a2e] transition-colors">Devenir Partenaire</Link></li>
              <li><a href="/#contact" className="hover:text-[#1e3a2e] transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contact</h4>
            <ul className="space-y-2 text-[#a0a8b8] text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#1e3a2e]" />
                +33 7 45 34 93 39
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#1e3a2e]" />
                contact@qrbag.com
              </li>
              <li className="flex items-center gap-2">
                <MapPinned className="w-4 h-4 text-[#1e3a2e]" />
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
            <a href="#" className="text-[#a0a8b8] hover:text-[#1e3a2e] transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-[#a0a8b8] hover:text-[#1e3a2e] transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="text-[#a0a8b8] hover:text-[#1e3a2e] transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Page Component
export default function HajjOmraPage() {
  return (
    <main className="min-h-screen bg-[#080c1a]">
      <Navigation />
      <HeroSection />
      <ProcedureSection />
      <AdvantagesSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
