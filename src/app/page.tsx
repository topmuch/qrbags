'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import {
  Plane,
  Luggage,
  QrCode,
  Smartphone,
  MapPin,
  MessageCircle,
  Star,
  Menu,
  X,
  Mail,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Play,
  Lock,
  Bell,
  Zap,
  Users,
  Headphones,
  Shield,
  Globe,
  Heart,
  CheckCircle,
} from "lucide-react";

/* ──────────────────────────────────────────────
   Fade-in wrapper (Framer Motion)
   ────────────────────────────────────────────── */
function FadeIn({ children, className, delay = 0, direction = 'up' }: { children: React.ReactNode; className?: string; delay?: number; direction?: 'up' | 'down' | 'left' | 'right' }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directions[direction] }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════════ */
function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Solutions', href: '/#pourquoi' },
    { label: 'Comment ca marche', href: '/#comment' },
    { label: 'Tarifs', href: '/#tarifs' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0f0c29]/95 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-[#FF6B35] to-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">QRBag</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#D4AF37] after:transition-all after:duration-300 hover:after:w-full">
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/demo">
              <Button variant="ghost" className="text-white/70 hover:text-white text-sm font-medium gap-1.5 hover:bg-white/10">
                <Play className="w-3.5 h-3.5" />
                Demo
              </Button>
            </Link>
            <Link href="/agence/connexion">
              <Button variant="ghost" className="text-white/50 hover:text-white text-sm font-medium border border-white/10 hover:border-white/25 hover:bg-white/5">
                Espace Agence
              </Button>
            </Link>
            <Link href="/devenir-partenaire">
              <Button className="bg-gradient-to-r from-[#D4AF37] to-[#FF6B35] hover:from-[#c4a030] hover:to-[#e65a28] text-white font-medium text-sm rounded-full px-5 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all hover:scale-[1.02]">
                Devenir Partenaire
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden text-white p-1"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden py-4 border-t border-white/10 bg-[#0f0c29]/98 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-3">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className="text-white/70 hover:text-white font-medium py-2 text-lg" onClick={() => setIsOpen(false)}>
                  {link.label}
                </a>
              ))}
              <hr className="border-white/10" />
              <Link href="/demo" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full text-white/70 justify-start gap-2 hover:bg-white/5">
                  <Play className="w-4 h-4" /> Voir la Demo
                </Button>
              </Link>
              <Link href="/agence/connexion" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full text-white/50 border border-white/10 justify-start">Espace Agence</Button>
              </Link>
              <Link href="/devenir-partenaire" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-[#D4AF37] to-[#FF6B35] text-white font-medium rounded-full">
                  Devenir Partenaire
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════════
   HERO SECTION
   ══════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Parallax */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.png"
          alt="Voyageur avec bagages"
          fill
          className="object-cover scale-105"
          priority
          quality={90}
        />
        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#0f0c29]/50 to-[#0f0c29]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0c29]/60 via-transparent to-[#0f0c29]/60" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#D4AF37]/30 rounded-full"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.8,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-24 pb-20">
        <FadeIn>
          <div className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 bg-white/5 border border-[#D4AF37]/20 rounded-full backdrop-blur-sm">
            <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
            <span className="text-sm font-medium text-[#D4AF37] tracking-wide">La protection intelligente pour vos bagages</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.08] tracking-tight">
            Un bagage perdu n&apos;est pas{' '}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#FF6B35] bg-clip-text text-transparent">
              une fatalite.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mt-6 leading-relaxed font-light">
            QRBag transforme la perte en opportunite &mdash; grace a la technologie, la confiance, et le respect.
          </p>
        </FadeIn>

        <FadeIn delay={0.45}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link href="/demo">
              <Button className="bg-[#D4AF37] hover:bg-[#c4a030] text-slate-900 px-8 py-4 rounded-full font-semibold text-base shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-[1.02] transition-all duration-300 gap-2.5">
                <Play className="w-4 h-4" />
                Decouvrir la demo immersive
              </Button>
            </Link>
            <Link href="/contact">
              <Button className="bg-[#FF6B35] hover:bg-[#e65a28] text-white px-8 py-4 rounded-full font-semibold text-base shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.02] transition-all duration-300 gap-2.5 relative overflow-hidden">
                <motion.span
                  className="absolute inset-0 bg-white/20"
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="relative">Commander des maintenant</span>
                <ArrowRight className="w-4 h-4 relative" />
              </Button>
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.6}>
          <div className="flex flex-wrap justify-center gap-4 mt-12">
            {[
              { icon: Smartphone, text: 'Sans application' },
              { icon: Zap, text: 'Sans batterie' },
              { icon: MapPin, text: 'Geolocalise en temps reel' },
              { icon: Lock, text: 'Securise RGPD' },
            ].map((item, idx) => (
              <motion.div
                key={item.text}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + idx * 0.1, duration: 0.5 }}
              >
                <item.icon className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-medium text-white/70">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f0c29] to-transparent" />
    </section>
  );
}

/* ══════════════════════════════════════════════
   POURQUOI QRBAG
   ══════════════════════════════════════════════ */
function WhyQRBagSection() {
  const cards = [
    {
      icon: Globe,
      title: 'Ancre en Afrique, pense pour le monde',
      description: 'Ne a Dakar, deploye dans 15 pays. QRBag comprend les realites du voyage africain et international avec une solution adaptee a chaque contexte.',
    },
    {
      icon: Shield,
      title: 'Securite certifiee RGPD',
      description: 'Zero donnee sensible stockee publiquement. Vos informations personnelles sont chiffrees et protegees selon les normes europeennes les plus strictes.',
    },
    {
      icon: Heart,
      title: 'Pour les pelerins, les voyageurs, les agences',
      description: 'Hajj, Omra, tourisme, affaires &mdash; une seule solution qui s\'adapte a chaque voyageur. Plus de 10 000 bagages deja proteges a travers le monde.',
    },
  ];

  return (
    <section id="pourquoi" className="relative py-24 lg:py-32 px-4 bg-[#0f0c29]">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <FadeIn className="text-center mb-16">
          <span className="text-sm font-semibold tracking-[0.2em] uppercase text-[#D4AF37] mb-4 block">Pourquoi QRBag</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight leading-tight">
            La confiance, au-dela<br className="hidden sm:block" /> des frontieres
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Une technologie conque avec soin pour servir les voyageurs les plus exigeants.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
          {cards.map((card, i) => (
            <FadeIn key={card.title} delay={i * 0.12}>
              <div className="group relative h-full bg-black/30 border border-[#D4AF37]/20 rounded-2xl p-7 lg:p-8 backdrop-blur-sm hover:border-[#D4AF37]/50 hover:bg-black/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-900/10">
                {/* Gold corner accent */}
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-2xl">
                  <div className="absolute top-0 right-0 w-[1px] h-8 bg-gradient-to-b from-[#D4AF37]/50 to-transparent" />
                  <div className="absolute top-0 right-0 h-[1px] w-8 bg-gradient-to-l from-[#D4AF37]/50 to-transparent" />
                </div>

                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/10 to-[#FF6B35]/10 border border-[#D4AF37]/20 flex items-center justify-center mb-6 group-hover:from-[#D4AF37]/20 group-hover:to-[#FF6B35]/20 transition-all duration-500">
                  <card.icon className="w-7 h-7 text-[#D4AF37]" />
                </div>

                <h3 className="text-lg lg:text-xl font-bold text-white mb-3 leading-snug">
                  {card.title}
                </h3>

                <p className="text-sm text-slate-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   COMMENT CA MARCHE
   ══════════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Recevez votre QR',
      description: 'Commandez vos QR codes via notre formulaire B2B ou aupres de votre agence partenaire.',
      icon: QrCode,
    },
    {
      number: '02',
      title: 'Activez en 30 secondes',
      description: 'Scannez le QR code et remplissez le formulaire avec vos informations de voyage.',
      icon: Zap,
    },
    {
      number: '03',
      title: 'Voyagez serain',
      description: 'Vos bagages sont proteges. Collez simplement l\'autocollant bien visible sur chaque valise.',
      icon: Plane,
    },
    {
      number: '04',
      title: 'Soyez notifie instantanement',
      description: 'Si quelqu\'un trouve votre bagage, vous recevez une alerte immediatement via WhatsApp.',
      icon: Bell,
    },
  ];

  return (
    <section id="comment" className="relative py-24 lg:py-32 px-4 bg-[#0a0820]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0c29] via-transparent to-[#0f0c29]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <FadeIn className="text-center mb-16">
          <span className="text-sm font-semibold tracking-[0.2em] uppercase text-[#FF6B35] mb-4 block">Comment ca marche</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight">
            La protection en 4 etapes
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Simple, rapide, sans application a installer.
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-[3.5rem] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/40 to-[#D4AF37]/20" />

          {steps.map((step, i) => (
            <FadeIn key={step.number} delay={i * 0.12}>
              <div className="relative group bg-black/20 border border-white/5 rounded-2xl p-7 text-center hover:border-[#D4AF37]/30 hover:bg-black/30 transition-all duration-500 hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-[#FF6B35] to-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-500/20 relative z-10 group-hover:shadow-orange-500/40 transition-shadow">
                  <span className="text-white font-bold text-lg">{step.number}</span>
                </div>

                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-5 h-5 text-[#D4AF37]" />
                </div>

                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.4} className="mt-14 text-center">
          <Link href="/demo">
            <Button className="bg-[#D4AF37] hover:bg-[#c4a030] text-slate-900 px-7 py-3.5 rounded-full font-semibold text-sm shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/40 transition-all hover:scale-[1.02] gap-2">
              <Play className="w-4 h-4" />
              Voir la demo interactive
            </Button>
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   STATISTICS
   ══════════════════════════════════════════════ */
function StatsSection() {
  const stats = [
    { value: '10K+', label: 'Bagages proteges', icon: Luggage },
    { value: '500+', label: 'Agences partenaires', icon: Users },
    { value: '98%', label: 'Taux de recuperation', icon: CheckCircle },
    { value: '24/7', label: 'Support disponible', icon: Headphones },
  ];

  return (
    <section className="py-20 px-4 bg-[#0f0c29] border-y border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.08}>
              <div className="relative group bg-black/20 border border-white/5 rounded-2xl p-6 lg:p-8 text-center hover:border-[#D4AF37]/20 hover:bg-black/30 transition-all duration-500">
                <div className="w-11 h-11 bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:border-[#D4AF37]/30 transition-colors">
                  <stat.icon className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <p className="text-3xl lg:text-4xl font-bold text-white tracking-tight">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   TESTIMONIALS
   ══════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Mamadou Diallo',
      role: 'Pelerin Hajj 2025',
      content: 'Grace a QRBag, j\'ai retrouve ma valise a Djeddah en moins de 2 heures. Une invention geniale qui devrait etre obligatoire pour tous les pelerins.',
      image: '/images/testimonial-1.png',
      initials: 'MD',
    },
    {
      name: 'Sophie Martin',
      role: 'Voyageuse frequente',
      content: 'Simple, efficace et pas cher. J\'ai utilise QRBag pour tous mes voyages cette annee. Plus de stress a l\'aeroport, enfin !',
      image: '/images/testimonial-2.png',
      initials: 'SM',
    },
  ];

  return (
    <section className="relative py-24 lg:py-32 px-4 bg-[#0a0820]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0c29] via-transparent to-[#0f0c29]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <FadeIn className="text-center mb-16">
          <span className="text-sm font-semibold tracking-[0.2em] uppercase text-[#D4AF37] mb-4 block">Temoignages</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight">
            Ils nous font confiance
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Des milliers de voyageurs et pelerins deja proteges.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.15} direction={i === 0 ? 'right' : 'left'}>
              <div className="group relative bg-black/30 border border-white/5 rounded-2xl overflow-hidden hover:border-[#D4AF37]/20 transition-all duration-500">
                {/* Photo */}
                <div className="relative h-64 md:h-72 overflow-hidden">
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Stars overlay */}
                  <div className="absolute top-4 right-4 flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 lg:p-8">
                  <p className="text-lg text-slate-200 leading-relaxed italic mb-6">
                    &ldquo;{t.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#FF6B35] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-amber-900/30">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-bold text-[#D4AF37] text-sm">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   PRICING
   ══════════════════════════════════════════════ */
function PricingSection() {
  const plans = [
    {
      title: 'Essentiel',
      badge: 'Basique',
      price: '4 €',
      duration: '7 jours de protection',
      features: [
        '3 etiquettes QR incluses',
        'Support WhatsApp',
        'Notification email',
        'Activation instantanee',
        'Geolocalisation en temps reel',
      ],
      bgClass: 'bg-[#1a1230] border-[#D4AF37]/20',
      btnClass: 'bg-[#D4AF37] hover:bg-[#c4a030] text-slate-900 shadow-lg shadow-amber-500/15',
      popular: false,
    },
    {
      title: 'Premium',
      badge: 'Recommande',
      price: '7 €',
      duration: '1 an de protection',
      features: [
        '3 etiquettes QR incluses',
        'Support prioritaire 24/7',
        'Renouvellement facile',
        'Statistiques de scans',
        'Protection multi-voyages',
        'Notifications avancees',
      ],
      bgClass: 'bg-[#0d0a25] border-[#D4AF37]/40',
      btnClass: 'bg-gradient-to-r from-[#D4AF37] to-[#FF6B35] hover:from-[#c4a030] hover:to-[#e65a28] text-white shadow-lg shadow-orange-500/20',
      popular: true,
    },
  ];

  return (
    <section id="tarifs" className="relative py-24 lg:py-32 px-4 bg-[#0f0c29]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23D4AF37' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <FadeIn className="text-center mb-16">
          <span className="text-sm font-semibold tracking-[0.2em] uppercase text-[#D4AF37] mb-4 block">Formules d&apos;elite</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight">
            Investissez dans la serenite
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Choisissez la formule adaptee a vos besoins. Pas de frais caches.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-5 lg:gap-6 items-start">
          {plans.map((plan, i) => (
            <FadeIn key={plan.title} delay={i * 0.12}>
              <div className={`relative rounded-2xl p-8 border ${plan.bgClass} ${plan.popular ? 'shadow-2xl shadow-amber-900/10' : ''} transition-all duration-500 hover:-translate-y-1`}>
                {/* Badge */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-white text-lg">{plan.title}</h3>
                  <span className={`text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full border ${plan.popular ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                    {plan.badge}
                  </span>
                </div>

                <p className="text-sm text-slate-500 mb-5">{plan.duration}</p>

                {/* Price with gold styling */}
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#D4AF37] bg-clip-text text-transparent tracking-tight">
                    {plan.price}
                  </span>
                </div>

                <div className="space-y-3.5 mb-8">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3 text-sm text-slate-300">
                      <div className="w-5 h-5 rounded-full border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0 bg-[#D4AF37]/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                      </div>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <Link href="/contact">
                  <Button className={`w-full rounded-full font-semibold text-sm py-3.5 transition-all hover:scale-[1.02] ${plan.btnClass} gap-2`}>
                    Commander
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                {/* Recommended glow effect */}
                {plan.popular && (
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#D4AF37]/20 via-transparent to-[#FF6B35]/20 -z-10 blur-sm" />
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   FINAL CTA
   ══════════════════════════════════════════════ */
function FinalCTASection() {
  return (
    <section className="relative py-24 lg:py-32 px-4 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f0c29] via-[#1a1230] to-[#2a1520]" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF6B35]/5 to-[#FF6B35]/15" />

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#FF6B35]/5 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <FadeIn>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
            Ne laissez pas un bagage<br className="hidden sm:block" /> gacher un voyage.
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Rejoignez 10 000+ voyageurs qui protegent leurs bagages avec QRBag. Activation en 30 secondes, tranquillite pour tous vos voyages.
          </p>

          <Link href="/contact">
            <Button className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-bold py-5 px-8 rounded-full text-lg shadow-xl shadow-orange-500/25 hover:shadow-2xl hover:shadow-orange-500/40 hover:scale-[1.03] transition-all duration-300 gap-2.5">
              <Zap className="w-5 h-5" />
              Activer votre protection en 30 secondes
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   CONTACT CTA
   ══════════════════════════════════════════════ */
function ContactCTASection() {
  return (
    <section className="py-20 px-4 bg-[#0f0c29] border-t border-white/5">
      <div className="max-w-4xl mx-auto text-center">
        <FadeIn>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Une question ? Contactez-nous
          </h2>
          <p className="text-slate-500 mb-8 max-w-xl mx-auto">
            Notre equipe est disponible pour repondre a toutes vos questions et vous accompagner.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact">
              <Button variant="ghost" className="text-white/70 border border-white/10 hover:border-[#D4AF37]/30 hover:text-[#D4AF37] px-7 py-3.5 rounded-full font-semibold text-sm gap-2 hover:bg-white/5 transition-all">
                <Mail className="w-4 h-4" />
                Nous contacter
              </Button>
            </Link>
            <a href="https://wa.me/33745349339" target="_blank" rel="noopener noreferrer">
              <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-7 py-3.5 rounded-full font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════════ */
function Footer() {
  const columns = [
    {
      title: 'Produit',
      links: [
        { label: 'Solutions', href: '/#pourquoi' },
        { label: 'Comment ca marche', href: '/#comment' },
        { label: 'Tarifs', href: '/#tarifs' },
        { label: 'Demo', href: '/demo' },
      ],
    },
    {
      title: 'Entreprise',
      links: [
        { label: 'Contact', href: '/contact' },
        { label: 'Devenir Partenaire', href: '/devenir-partenaire' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Mentions legales', href: '/mentions-legales' },
        { label: 'Confidentialite', href: '/confidentialite' },
        { label: 'CGU', href: '/cgu' },
      ],
    },
    {
      title: 'Contact',
      links: [
        { label: 'WhatsApp', href: 'https://wa.me/33745349339' },
        { label: 'Email', href: '/contact' },
      ],
    },
  ];

  return (
    <footer className="bg-[#070518] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-[#FF6B35] to-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/15">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">QRBag</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs text-slate-500 mb-6">
              Protection intelligente des bagages pour voyageurs et pelerins.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              <a href="https://facebook.com/qrbag" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/5 border border-white/5 rounded-full flex items-center justify-center hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all duration-300" aria-label="Facebook">
                <Facebook className="w-4 h-4 text-slate-400 hover:text-[#D4AF37]" />
              </a>
              <a href="https://instagram.com/qrbag" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/5 border border-white/5 rounded-full flex items-center justify-center hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all duration-300" aria-label="Instagram">
                <Instagram className="w-4 h-4 text-slate-400 hover:text-[#D4AF37]" />
              </a>
              <a href="https://twitter.com/qrbag" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/5 border border-white/5 rounded-full flex items-center justify-center hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all duration-300" aria-label="Twitter">
                <Twitter className="w-4 h-4 text-slate-400 hover:text-[#D4AF37]" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {columns.map(col => (
            <div key={col.title}>
              <h4 className="font-semibold text-[#D4AF37] text-sm mb-4 tracking-wide">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link.label}>
                    {'href' in link && link.href.startsWith('/') ? (
                      <Link href={link.href} className="text-sm text-slate-500 hover:text-white transition-colors duration-300">{link.label}</Link>
                    ) : (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-white transition-colors duration-300">{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} QRBag. Tous droits reserves.
          </p>
          <a
            href="https://maps.google.com/?q=Poissy+France"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1.5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            Poissy, France
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */
export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f0c29] flex flex-col">
      <Navigation />
      <HeroSection />
      <WhyQRBagSection />
      <StatsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTASection />
      <ContactCTASection />
      <Footer />
    </main>
  );
}
