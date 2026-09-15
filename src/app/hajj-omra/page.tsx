'use client';

import Link from 'next/link';
import {
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
import { BrandCard, brandBtnGradient } from '@/components/brand/BrandShell';

// Navigation Component
function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#16234e]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label="QRBag — retour à l'accueil">
            <img src="/logo.png" alt="QRBag" className="h-12 w-auto object-contain" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#procedure" className="text-white/80 hover:text-[#2f9bff] transition-colors">Procédure</a>
            <a href="#avantages" className="text-white/80 hover:text-[#2f9bff] transition-colors">Avantages</a>
            <a href="#faq" className="text-white/80 hover:text-[#2f9bff] transition-colors">FAQ</a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] text-sm font-semibold text-white/80 hover:text-[#2f9bff] transition-colors"
            >
              <Play className="w-4 h-4" aria-hidden />
              Démo
            </Link>
            <Link
              href="/devenir-partenaire"
              className={`${brandBtnGradient} inline-flex items-center px-5 py-2.5 min-h-[44px] text-sm`}
            >
              Devenir Partenaire
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Link href="/" className="md:hidden inline-flex items-center min-h-[44px] text-white/80 hover:text-white text-sm" aria-label="Retour à l'accueil">
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
    <section className="pt-16 bg-[#16234e] relative overflow-hidden">
      {/* Texture « carte du monde en pointillés » */}
      <div className="absolute inset-0 dotted-map-light pointer-events-none" aria-hidden />

      {/* Halos de couleur (azure / magenta) */}
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-[#2f9bff]/15 blur-[120px] pointer-events-none" aria-hidden />
      <div className="absolute top-1/3 -right-32 w-[420px] h-[420px] rounded-full bg-[#e6216e]/15 blur-[120px] pointer-events-none" aria-hidden />

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
        <div className="absolute top-10 left-10 text-8xl">🕋</div>
        <div className="absolute bottom-10 right-10 text-8xl">🕌</div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-qrbag flex items-center justify-center shadow-lg shadow-[#e6216e]/30">
            <span className="text-2xl">🕋</span>
          </div>
          <span className="text-white font-bold text-2xl">Hajj &amp; Omra</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
          Protection complète<br />
          <span className="text-gradient-qrbag">pour les pèlerins</span>
        </h1>

        <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto mb-8">
          3 bagages inclus (cabine + 2 soutes). Gérée par votre agence de voyage partenaire.
        </p>

        {/* Trust Pills */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/15">
            <Smartphone className="w-4 h-4 text-[#2f9bff]" aria-hidden />
            <span className="text-white text-sm">Sans application</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/15">
            <Battery className="w-4 h-4 text-[#2f9bff]" aria-hidden />
            <span className="text-white text-sm">Sans batterie</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/15">
            <MapPin className="w-4 h-4 text-[#2f9bff]" aria-hidden />
            <span className="text-white text-sm">Sans GPS</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="bg-white/10 rounded-xl p-4 border border-white/15">
            <div className="text-3xl font-bold text-white">3</div>
            <div className="text-white/70 text-sm">Bagages inclus</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/15">
            <div className="text-3xl font-bold text-white">98%</div>
            <div className="text-white/70 text-sm">Récupération</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/15">
            <div className="text-3xl font-bold text-white">30s</div>
            <div className="text-white/70 text-sm">Activation</div>
          </div>
        </div>
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
    <section id="procedure" className="py-20 px-4 bg-[#0f1838]">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Comment ça <span className="text-gradient-qrbag">marche ?</span>
          </h2>
          <p className="text-white/60 text-lg">
            Une protection en 4 étapes simples pour votre pèlerinage
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => (
            <div key={index} className="relative group">
              <BrandCard className="p-6 h-full transition-transform duration-300 group-hover:-translate-y-1">
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-qrbag rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#e6216e]/30">
                  {item.step}
                </div>

                {/* Icon */}
                <div className="text-4xl mb-4 mt-2">{item.icon}</div>

                {/* Title */}
                <h3 className="text-lg font-bold text-[#16234e] mb-2">{item.title}</h3>

                {/* Description */}
                <p className="text-[#16234e]/60 text-sm leading-relaxed">{item.desc}</p>
              </BrandCard>
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
    <section id="avantages" className="py-20 px-4 bg-[#16234e]">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Pourquoi choisir <span className="text-gradient-qrbag">QRBag Hajj ?</span>
          </h2>
        </div>

        {/* Advantages Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {advantages.map((item, index) => (
            <BrandCard key={index} className="flex items-center gap-3 p-4 hover:border-[#2f9bff]/40 transition-colors">
              <span className="text-xl">{item.icon}</span>
              <span className="text-[#16234e] text-sm sm:text-base font-medium">{item.text}</span>
            </BrandCard>
          ))}
        </div>

        {/* Info Box — touche émeraude « identité Hajj » */}
        <div className="bg-emerald-500/10 rounded-3xl p-6 border border-emerald-400/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400/40 rounded-xl flex items-center justify-center text-2xl shrink-0">
              🕌
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-2">Conçu pour le Hajj &amp; Omra</h3>
              <p className="text-white/70">
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
    <section className="py-20 px-4 bg-[#0f1838]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ils nous font <span className="text-gradient-qrbag">confiance</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <BrandCard key={i} className="p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-[#f8921f] fill-[#f8921f]" aria-hidden />
                ))}
              </div>
              <p className="text-[#16234e]/80 mb-6 leading-relaxed italic">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#16234e]/10 rounded-full flex items-center justify-center text-2xl">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-[#16234e]">{t.name}</p>
                  <p className="text-[#16234e]/60 text-sm">{t.role}</p>
                </div>
              </div>
            </BrandCard>
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
    <section id="faq" className="py-20 px-4 bg-[#16234e]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Questions <span className="text-gradient-qrbag">fréquentes</span>
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <BrandCard key={i} className="p-6">
              <h3 className="text-[#16234e] font-bold mb-2">{faq.q}</h3>
              <p className="text-[#16234e]/60">{faq.a}</p>
            </BrandCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  return (
    <section className="py-20 px-4 bg-gradient-qrbag relative overflow-hidden">
      {/* Texture « carte du monde en pointillés » */}
      <div className="absolute inset-0 dotted-map-light opacity-60 pointer-events-none" aria-hidden />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
          Prêt à protéger vos bagages<br />pour le Hajj 2026 ?
        </h2>
        <p className="text-white/85 max-w-xl mx-auto mb-8 text-lg">
          Demandez à votre agence de voyage si elle propose QRBag, ou contactez-nous pour plus d'informations.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/#contact"
            className="bg-white text-[#16234e] inline-flex items-center justify-center px-8 py-4 min-h-[52px] rounded-2xl font-bold text-lg shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-300"
          >
            📦 Commander via votre agence
          </Link>
          <Link
            href="/demo"
            className="bg-white/10 backdrop-blur-sm border-2 border-white text-white inline-flex items-center justify-center px-8 py-4 min-h-[52px] rounded-2xl font-bold text-lg hover:bg-white/20 transition-all duration-300"
          >
            <Play className="w-5 h-5 mr-2" aria-hidden />
            Voir la démo
          </Link>
        </div>

        <p className="mt-8 text-white/80 text-sm">
          Vous êtes agence ?{' '}
          <Link href="/devenir-partenaire" className="text-[#ffd200] font-bold hover:underline">
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
    <footer className="border-t border-white/10 py-12 px-4 bg-[#0f1838]">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="QRBag" className="h-12 w-auto object-contain" />
            </div>
            <p className="text-white/60 text-sm">
              Protection intelligente des bagages pour voyageurs et pèlerins.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Produit</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><Link href="/hajj-omra" className="hover:text-[#2f9bff] transition-colors">Hajj &amp; Omra</Link></li>
              <li><Link href="/voyageurs-standard" className="hover:text-[#2f9bff] transition-colors">Voyageurs Standard</Link></li>
              <li><Link href="/demo" className="hover:text-[#2f9bff] transition-colors">Démo</Link></li>
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Entreprise</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><Link href="/devenir-partenaire" className="hover:text-[#2f9bff] transition-colors">Devenir Partenaire</Link></li>
              <li><a href="/#contact" className="hover:text-[#2f9bff] transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contact</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#2f9bff]" aria-hidden />
                +33 7 45 34 93 39
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#2f9bff]" aria-hidden />
                contact@qrbag.com
              </li>
              <li className="flex items-center gap-2">
                <MapPinned className="w-4 h-4 text-[#2f9bff]" aria-hidden />
                Poissy, France
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} QRBag. Tous droits réservés.
          </p>

          <div className="flex items-center gap-4">
            <a href="https://facebook.com/qrbag" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#2f9bff] transition-colors" aria-label="Facebook">
              <Facebook className="w-5 h-5" aria-hidden="true" />
            </a>
            <a href="https://instagram.com/qrbag" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#2f9bff] transition-colors" aria-label="Instagram">
              <Instagram className="w-5 h-5" aria-hidden="true" />
            </a>
            <a href="https://twitter.com/qrbag" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#2f9bff] transition-colors" aria-label="Twitter">
              <Twitter className="w-5 h-5" aria-hidden="true" />
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
    <main className="min-h-screen bg-[#16234e]">
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
