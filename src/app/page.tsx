'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Caveat } from 'next/font/google';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { motion, useInView, AnimatePresence } from 'framer-motion';

const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', weight: ['600', '700'] });

const LandingChatbotWidget = dynamic(
  () => import('@/components/finder/LandingChatbotWidget'),
  { ssr: false, loading: () => null }
);
import TrackingWidget from '@/components/home/TrackingWidget';
import {
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
  Zap,
  Users,
  Headphones,
  Shield,
  Globe,
  Heart,
  CheckCircle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  BadgeCheck,
  LucideIcon,
  ChevronDown,
  ScanLine,
  BellRing,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Plane,
} from "lucide-react";

/* ──────────────────────────────────────────────
   PALETTE MARQUE QRBag (issue de l'étiquette QR)
   ────────────────────────────────────────────── */
const NAVY = '#16234e';
const NAVY_DEEP = '#0e1834';
const AZURE = '#2f9bff';
const ORANGE = '#f8921f';
const MAGENTA = '#e6216e';
const PURPLE = '#8b17c9';

/* ──────────────────────────────────────────────
   Animated Counter
   ────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString('fr-FR')}{suffix}</span>;
}

/* ──────────────────────────────────────────────
   Fade-in wrapper
   ────────────────────────────────────────────── */
function FadeIn({ children, className, delay = 0, direction = 'up' }: { children: React.ReactNode; className?: string; delay?: number; direction?: 'up' | 'down' | 'left' | 'right' }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const directions = {
    up: { y: 50, x: 0 },
    down: { y: -50, x: 0 },
    left: { x: 50, y: 0 },
    right: { x: -50, y: 0 },
  };
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directions[direction] }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   QR VIEWFINDER CORNERS — motif signature de
   l'étiquette (4 coins orange/magenta/violet)
   ────────────────────────────────────────────── */
function CornerBrackets({ inset = '-14px', size = 'w-12 h-12', border = 'border-[5px]' }: { inset?: string; size?: string; border?: string }) {
  return (
    <>
      <span aria-hidden className={`pointer-events-none absolute ${size} ${border} rounded-tl-2xl border-[#f8921f]`} style={{ top: inset, left: inset }} />
      <span aria-hidden className={`pointer-events-none absolute ${size} ${border} rounded-tr-2xl border-[#8b17c9]`} style={{ top: inset, right: inset }} />
      <span aria-hidden className={`pointer-events-none absolute ${size} ${border} rounded-bl-2xl border-[#e6216e]`} style={{ bottom: inset, left: inset }} />
      <span aria-hidden className={`pointer-events-none absolute ${size} ${border} rounded-br-2xl border-[#f8921f]`} style={{ bottom: inset, right: inset }} />
    </>
  );
}

/* ══════════════════════════════════════════════
   NAVIGATION (Glass + signature QRBag)
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
    { label: 'Accueil', href: '/' },
    { label: 'Checklist', href: '/checklist' },
    { label: 'Comment ça marche', href: '/#comment' },
    { label: 'Tarifs', href: '/#tarifs' },
    { label: 'Contactez-nous', href: '/contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-100' : 'bg-white/60 backdrop-blur-lg'}`}>
      {/* Liseré dégradé signature en haut */}
      <div className="h-[3px] w-full bg-gradient-qrbag" aria-hidden />
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[68px]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="QRBag" className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="px-4 py-2 text-[13px] font-semibold text-[#16234e]/70 hover:text-[#16234e] transition-colors duration-200 rounded-lg hover:bg-[#16234e]/5">
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-[#16234e]/80 hover:text-[#16234e] font-semibold text-[13px]">
                Connexion
              </Button>
            </Link>
            <Link href="/devenir-partenaire">
              <Button className="bg-gradient-qrbag text-white font-semibold text-[13px] rounded-full px-6 h-10 shadow-lg shadow-[#e6216e]/25 hover:shadow-[#e6216e]/40 transition-all duration-300 hover:scale-[1.02]">
                Commander mes QR
              </Button>
            </Link>
          </div>

          <button className="md:hidden text-[#16234e] p-2" onClick={() => setIsOpen(!isOpen)} aria-label="Menu">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 border-t border-slate-100 space-y-1">
                {navLinks.map(link => (
                  <a key={link.href} href={link.href} className="block text-[#16234e]/70 hover:text-[#16234e] hover:bg-[#16234e]/5 font-medium py-2.5 px-3 rounded-xl text-base transition-colors" onClick={() => setIsOpen(false)}>
                    {link.label}
                  </a>
                ))}
                <hr className="border-slate-100 my-2" />
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full text-[#16234e]/80 font-medium justify-start">Connexion</Button>
                </Link>
                <Link href="/devenir-partenaire" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-gradient-qrbag text-white font-semibold rounded-full mt-1">
                    Commander mes QR
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════════
   HERO — Ultra premium, palette étiquette QR
   ══════════════════════════════════════════════ */
const heroSlides = [
  { image: '/images/landing-v2/hero-woman-traveler.png', alt: 'Voyageuse QRBag avec valise protégée' },
  { image: '/images/landing-v2/hero-man-scanning.png', alt: 'Voyageur scannant un QR code QRBag' },
  { image: '/images/landing-v2/hero-family-travel.png', alt: 'Famille en voyage avec bagages protégés QRBag' },
];

function HeroSection() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % heroSlides.length);
    }, 5500);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const goTo = (idx: number) => {
    setCurrent(idx);
    startTimer();
  };

  return (
    <section className="relative pt-28 lg:pt-32 pb-0 overflow-hidden bg-white">
      {/* Fond carte du monde en pointillés (motif étiquette) */}
      <div className="absolute inset-0 dotted-map opacity-60" aria-hidden />
      {/* Blobs dégradés signature */}
      <div className="absolute -top-32 -right-24 w-[560px] h-[560px] rounded-full blur-[130px] opacity-25 bg-[radial-gradient(circle,#f8921f,transparent_65%)]" aria-hidden />
      <div className="absolute top-64 -left-32 w-[480px] h-[480px] rounded-full blur-[120px] opacity-20 bg-[radial-gradient(circle,#8b17c9,transparent_65%)]" aria-hidden />
      <div className="absolute bottom-0 right-1/3 w-[420px] h-[420px] rounded-full blur-[110px] opacity-15 bg-[radial-gradient(circle,#2f9bff,transparent_65%)]" aria-hidden />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center min-h-[68vh] lg:min-h-[78vh]">

          {/* ── Colonne texte ── */}
          <div className="order-2 lg:order-1 text-center lg:text-left pb-4 lg:pb-16">
            {/* Accent manuscrit — tagline officielle de l'étiquette */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className={`font-script text-3xl sm:text-4xl text-[#f8921f] mb-3 ${caveat.variable}`}
            >
              Voyagez l&apos;esprit tranquille
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-[2.75rem] leading-[1.02] sm:text-6xl xl:text-7xl font-black text-[#16234e] mb-6 tracking-[-0.03em]"
            >
              Scannez pour
              <br />
              retrouver <span className="text-gradient-qrbag">vos bagages.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8"
            >
              L&apos;autocollant QR code intelligent collé sur votre valise.
              <strong className="text-[#16234e] font-semibold"> Sans application, sans batterie, sans GPS</strong> —
              un scan du trouveur et vous êtes alerté sur WhatsApp avec la localisation.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start mb-9"
            >
              <Link href="/devenir-partenaire">
                <Button className="bg-gradient-qrbag text-white px-8 py-4 rounded-full font-bold text-base shadow-xl shadow-[#e6216e]/25 hover:shadow-[#e6216e]/45 hover:scale-[1.03] transition-all duration-300 gap-2 h-14 w-full sm:w-auto">
                  <QrCode className="w-5 h-5" />
                  Commander mes QR codes
                </Button>
              </Link>
              <Link href="/demo">
                <Button className="bg-white hover:bg-[#16234e]/5 border-2 border-[#16234e]/10 hover:border-[#16234e]/25 text-[#16234e] px-8 py-4 rounded-full font-bold text-base transition-all duration-300 gap-2 h-14 hover:scale-[1.03] w-full sm:w-auto">
                  <Play className="w-4 h-4" />
                  Voir la démo
                </Button>
              </Link>
            </motion.div>

            {/* Stats + note clients */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4"
            >
              <div>
                <div className="text-3xl font-black text-[#16234e]">10 000+</div>
                <div className="text-[13px] text-slate-500 font-medium">bagages protégés</div>
              </div>
              <div className="w-px h-10 bg-slate-200 hidden sm:block" aria-hidden />
              <div>
                <div className="text-3xl font-black text-gradient-qrbag">98 %</div>
                <div className="text-[13px] text-slate-500 font-medium">de récupération</div>
              </div>
              <div className="w-px h-10 bg-slate-200 hidden sm:block" aria-hidden />
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#f8921f] fill-[#f8921f]" />
                  ))}
                </div>
                <div className="text-[13px] text-slate-500 font-medium">4.9/5 · voyageurs ravis</div>
              </div>
            </motion.div>
          </div>

          {/* ── Colonne visuel : slider + coins viewfinder ── */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[380px] sm:max-w-md lg:max-w-[440px]">
              {/* Halo dégradé signature */}
              <div className="absolute -inset-10 bg-[conic-gradient(from_180deg,#f8921f33,#e6216e22,#8b17c933,#2f9bff22,#f8921f33)] rounded-[3rem] blur-[70px]" aria-hidden />

              {/* Coins viewfinder (motif étiquette QR) */}
              <CornerBrackets inset="-18px" size="w-14 h-14 sm:w-16 sm:h-16" border="border-[6px]" />

              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#16234e]/25 border-4 border-white bg-white">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  >
                    <Image
                      src={heroSlides[current].image}
                      alt={heroSlides[current].alt}
                      width={864}
                      height={1152}
                      className="w-full h-auto object-cover"
                      priority={current === 0}
                    />
                    {/* Reflet premium */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#16234e]/25 via-transparent to-white/10 pointer-events-none" />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Carte flottante : bagage retrouvé */}
              <motion.div
                className="absolute -left-5 sm:-left-10 bottom-20 bg-white px-4 py-3 rounded-2xl shadow-xl shadow-[#16234e]/15 border border-slate-100 flex items-center gap-3"
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-qrbag flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#16234e]">Bagage retrouvé !</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1"><MessageCircle className="w-3 h-3 text-[#2f9bff]" /> WhatsApp · il y a 2 min</div>
                </div>
              </motion.div>

              {/* Carte flottante : géolocalisation */}
              <motion.div
                className="absolute -right-3 sm:-right-8 top-14 bg-white px-4 py-3 rounded-2xl shadow-xl shadow-[#16234e]/15 border border-slate-100 flex items-center gap-3"
                animate={{ y: [0, -9, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              >
                <div className="w-10 h-10 rounded-xl bg-[#16234e] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#f8921f]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#16234e]">Géolocalisé</div>
                  <div className="text-[10px] text-slate-500">Aéroport Dakar · Terminal 1</div>
                </div>
              </motion.div>

              {/* Indicateurs */}
              <div className="flex items-center justify-center gap-2 mt-8">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goTo(idx)}
                    aria-label={`Photo ${idx + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-500 ${idx === current ? 'w-9 bg-gradient-qrbag' : 'w-2.5 bg-slate-200 hover:bg-slate-300'}`}
                  />
                ))}
                <button onClick={() => goTo((current - 1 + heroSlides.length) % heroSlides.length)} className="ml-2 w-8 h-8 rounded-full border border-slate-200 hover:border-[#e6216e]/40 flex items-center justify-center text-slate-400 hover:text-[#e6216e] transition-colors" aria-label="Photo précédente">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => goTo((current + 1) % heroSlides.length)} className="w-8 h-8 rounded-full border border-slate-200 hover:border-[#e6216e]/40 flex items-center justify-center text-slate-400 hover:text-[#e6216e] transition-colors" aria-label="Photo suivante">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cartes fonctionnalités (images cliquables) ── */}
      <div className="relative bg-white/80 backdrop-blur border-t border-slate-100/80 py-10 mt-2">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
            {[
              { image: '/images/landing-v2/features/sans-app.jpg', title: 'Sans application', subtitle: 'Un scan suffit', href: '/fonctionnalites/sans-application' },
              { image: '/images/landing-v2/features/sans-batterie.jpg', title: 'Sans batterie', subtitle: 'Autonome à 100%', href: '/fonctionnalites/sans-batterie' },
              { image: '/images/landing-v2/features/geolocalisation.jpg', title: 'Géolocalisation', subtitle: 'Temps réel', href: '/fonctionnalites/geolocalisation' },
              { image: '/images/landing-v2/features/securise-rgpd.jpg', title: 'Sécurisé RGPD', subtitle: 'Données protégées', href: '/fonctionnalites/securite-rgpd' },
              { image: '/images/landing-v2/features/alertes-whatsapp.jpg', title: 'Alertes WhatsApp', subtitle: 'Notification instantanée', href: '/fonctionnalites/alertes-whatsapp' },
            ].map((item, idx) => (
              <FadeIn key={item.title} delay={idx * 0.06}>
                <Link
                  href={item.href}
                  className="group relative block w-[168px] h-[224px] rounded-2xl overflow-hidden shadow-lg shadow-[#16234e]/10 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ring-2 ring-transparent hover:ring-[#f8921f]/60"
                >
                  <Image src={item.image} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="168px" />
                  <div className="absolute inset-0 bg-gradient-to-b from-[#16234e]/50 via-transparent to-[#16234e]/70" />
                  <p className="absolute top-4 left-0 right-0 text-center text-white text-sm font-bold drop-shadow-lg px-2">{item.title}</p>
                  <p className="absolute bottom-4 left-0 right-0 text-center text-white/90 text-xs drop-shadow-md px-2">{item.subtitle}</p>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   BANDEAU DÉFILANT — promesses QRBag (marquee)
   ══════════════════════════════════════════════ */
function MarqueeStrip() {
  const items = [
    { icon: Smartphone, text: 'Sans application' },
    { icon: Zap, text: 'Alertes WhatsApp instantanées' },
    { icon: MapPin, text: 'Géolocalisation' },
    { icon: Lock, text: 'Données chiffrées RGPD' },
    { icon: Globe, text: '15 pays couverts' },
    { icon: QrCode, text: 'Activation en 30 secondes' },
  ];
  const row = [...items, ...items];
  return (
    <div className="relative bg-[#16234e] py-4 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 dotted-map-light opacity-50" />
      <div className="flex w-max animate-marquee gap-0 relative">
        {[0, 1].map(half => (
          <div key={half} className="flex items-center shrink-0">
            {row.map((item, i) => (
              <span key={`${half}-${i}`} className="flex items-center gap-2.5 px-7 text-white/90 text-sm font-semibold whitespace-nowrap">
                <item.icon className="w-4 h-4 text-[#f8921f]" />
                {item.text}
                <span className="ml-6 w-1.5 h-1.5 rounded-full bg-gradient-qrbag inline-block" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CHECKLIST CTA — conservé, habillage QRBag
   ══════════════════════════════════════════════ */
function ChecklistCTASection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-[#f6f9ff] relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#f8921f]/10 rounded-full blur-3xl" aria-hidden />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#8b17c9]/10 rounded-full blur-3xl" aria-hidden />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Texte + CTA */}
          <FadeIn direction="left">
            <div className="inline-flex items-center gap-2 bg-gradient-qrbag text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 shadow-lg shadow-[#e6216e]/20">
              <Sparkles className="w-3.5 h-3.5" />
              Service gratuit
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#16234e] mb-4 leading-[1.1] tracking-[-0.02em]">
              Votre <span className="text-gradient-qrbag">checklist de voyage</span> certifiée QRBag
            </h2>
            <p className="text-slate-600 text-base md:text-lg mb-6 leading-relaxed">
              Inventoriez vos bagages en quelques clics, générez un PDF horodaté avec tampon officiel et QR code vérifiable. L&apos;attestation est envoyée par email avec une page publique de consultation.
            </p>

            <ul className="space-y-2.5 mb-8">
              {[
                'PDF horodaté avec tampon de certification',
                'QR code scannable pour vérification publique',
                'Page protégée par clé de vérification à 8 caractères',
                'Envoi automatique par email avec pièce jointe',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#f8921f] to-[#e6216e] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </span>
                  <span className="text-sm md:text-base">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/checklist"
              className="inline-flex items-center gap-2 bg-gradient-qrbag hover:opacity-95 text-white px-7 py-4 rounded-full font-bold text-base transition-all shadow-xl shadow-[#e6216e]/25 hover:shadow-[#e6216e]/40 hover:scale-[1.03]"
            >
              <ClipboardCheck className="w-5 h-5" />
              Créer ma checklist gratuite
              <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>

          {/* Visuel : attestation PDF + étiquette officielle */}
          <FadeIn direction="right" delay={0.2}>
            <div className="relative">
              {/* Étiquette QR officielle en arrière-plan */}
              <div className="absolute -top-10 -right-4 sm:-right-8 w-32 sm:w-40 rotate-12 rounded-2xl overflow-hidden shadow-2xl shadow-[#16234e]/25 border-4 border-white z-0">
                <Image src="/design/etiquette-qrbag-preview.png" alt="Étiquette QR officielle QRBag" width={400} height={572} className="w-full h-auto" />
              </div>

              {/* Mockup PDF */}
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden -rotate-2 hover:rotate-0 transition-transform duration-500 max-w-sm">
                <div className="bg-[#16234e] px-5 py-3 flex items-center justify-between">
                  <div className="font-bold text-white">🎒 QRBag</div>
                  <div className="text-[10px] text-[#f8921f] font-mono font-bold">RÉF : K7P3MQ</div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">Attestation d&apos;inventaire</div>
                    <div className="text-base font-bold text-[#16234e]">Voyage de Aïssatou</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-[#f6f9ff] rounded-lg p-2 border border-[#2f9bff]/20">
                      <div className="text-slate-500">Destination</div>
                      <div className="font-bold text-[#16234e]">Paris, France</div>
                    </div>
                    <div className="bg-[#f6f9ff] rounded-lg p-2 border border-[#2f9bff]/20">
                      <div className="text-slate-500">Départ</div>
                      <div className="font-bold text-[#16234e]">15 août 2026</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {['T-shirts x3', 'Passeport', 'Chargeur téléphone', 'Médicaments'].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-3 h-3 text-[#e6216e]" />
                        <span className="text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-end justify-between pt-2 border-t border-slate-100">
                    <div className="bg-gradient-qrbag rounded-lg px-2.5 py-1.5">
                      <div className="text-[8px] text-white font-bold tracking-wider">CERTIFIÉ QRBag</div>
                    </div>
                    {/* Coins viewfinder mini + QR simulé */}
                    <div className="relative bg-[#16234e] p-2 rounded-lg">
                      <div className="grid grid-cols-5 gap-px w-12 h-12">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div key={i} className={`${[0,1,2,4,5,9,10,12,14,16,20,22,23,24,6,8].includes(i) ? 'bg-[#2f9bff]' : 'bg-transparent'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge flottant */}
              <div className="absolute -bottom-5 -left-3 bg-gradient-qrbag rounded-full px-5 py-2.5 shadow-xl shadow-[#e6216e]/30 -rotate-6 z-20">
                <div className="text-[11px] font-black text-white tracking-wider">100% GRATUIT</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   QRBAG EN ACTION
   ══════════════════════════════════════════════ */
function QRBagEnActionSection() {
  const features = [
    { label: 'Scan instantané du QR code', Icon: ScanLine, color: '#2f9bff', bg: 'rgba(47,155,255,0.10)' },
    { label: 'Notification WhatsApp en temps réel', Icon: BellRing, color: '#e6216e', bg: 'rgba(230,33,110,0.10)' },
    { label: 'Géolocalisation précise du bagage', Icon: MapPin, color: '#8b17c9', bg: 'rgba(139,23,201,0.10)' },
    { label: 'Interface intuitive sans application', Icon: Smartphone, color: '#f8921f', bg: 'rgba(248,146,31,0.10)' },
  ];

  return (
    <section className="py-24 lg:py-32 px-5 bg-white relative overflow-hidden" id="comment">
      <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-[#2f9bff]/5 rounded-full blur-[100px]" aria-hidden />
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* Visuel : étiquette officielle avec coins viewfinder */}
          <FadeIn direction="right">
            <div className="relative flex justify-center">
              <div className="absolute -inset-8 bg-[conic-gradient(from_90deg,#f8921f22,#e6216e18,#8b17c922,#2f9bff18,#f8921f22)] rounded-[3rem] blur-[60px]" aria-hidden />
              <CornerBrackets inset="-12px" size="w-12 h-12" border="border-[5px]" />
              <div className="relative w-64 sm:w-72 rounded-3xl overflow-hidden shadow-2xl shadow-[#16234e]/25 border-[6px] border-white -rotate-2 hover:rotate-0 transition-transform duration-500">
                <Image src="/design/etiquette-qrbag-preview.png" alt="Étiquette QR officielle QRBag 7×10 cm" width={600} height={858} className="w-full h-auto" />
              </div>
              <motion.div
                className="absolute -bottom-5 -left-2 sm:left-4 bg-white text-[#16234e] px-5 py-3 rounded-2xl shadow-xl shadow-[#16234e]/15 border border-slate-100 font-bold text-sm flex items-center gap-2.5"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="w-8 h-8 rounded-lg bg-gradient-qrbag flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </span>
                98% de récupération
              </motion.div>
            </div>
          </FadeIn>

          {/* Texte */}
          <FadeIn direction="left" delay={0.2}>
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[#2f9bff] mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                QRBag en action
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#16234e] mb-7 tracking-[-0.02em] leading-[1.08]">
                Scannez, activez,{' '}
                <span className="text-gradient-qrbag">voyagez.</span>
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-10">
                Notre technologie QR permet à n&apos;importe qui de signaler un bagage trouvé en un seul geste.
                Vous recevez instantanément une notification avec la localisation exacte de votre valise.
              </p>
              <div className="space-y-4">
                {features.map(({ label, Icon, color, bg }, i) => (
                  <motion.div key={label} className="flex items-center gap-4 group" initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: bg }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <span className="text-[#16234e] font-semibold text-[15px]">{label}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-11">
                <Link href="/demo">
                  <Button className="bg-[#16234e] hover:bg-[#0e1834] text-white px-7 py-3.5 rounded-full font-bold text-sm shadow-lg shadow-[#16234e]/25 hover:shadow-[#16234e]/40 transition-all duration-300 gap-2 hover:scale-[1.02]">
                    <Play className="w-4 h-4" />
                    Voir la démo
                  </Button>
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   STATS — compteurs animés sur bande marine
   ══════════════════════════════════════════════ */
function StatsSection() {
  const stats = [
    { value: 10000, suffix: '+', label: 'Bagages protégés', Icon: Luggage, color: '#f8921f' },
    { value: 15, suffix: '', label: 'Pays couverts', Icon: Globe, color: '#2f9bff' },
    { value: 98, suffix: '%', label: 'Taux de récupération', Icon: TrendingUp, color: '#e6216e' },
    { value: 30000, suffix: '+', label: 'Scans traités', Icon: ScanLine, color: '#8b17c9' },
  ];

  return (
    <section className="relative py-20 lg:py-24 px-5 bg-[#16234e] overflow-hidden">
      <div className="absolute inset-0 dotted-map-light opacity-40" aria-hidden />
      <div className="absolute -top-32 left-1/4 w-[420px] h-[420px] bg-[#8b17c9]/20 rounded-full blur-[110px]" aria-hidden />
      <div className="absolute -bottom-32 right-1/4 w-[420px] h-[420px] bg-[#f8921f]/15 rounded-full blur-[110px]" aria-hidden />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14">
          {stats.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1}>
              <div className="text-center group">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <stat.Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-[-0.02em]">
                  {stat.suffix === '+' && stat.value === 30000 ? '30K+' : <AnimatedCounter target={stat.value} suffix={stat.suffix} />}
                </div>
                <div className="text-sm text-white/60 font-medium">{stat.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Vague basse vers la section suivante */}
      <svg className="absolute bottom-0 left-0 w-full text-white" viewBox="0 0 1440 60" fill="currentColor" preserveAspectRatio="none" aria-hidden>
        <path d="M0,60 C360,10 1080,10 1440,60 L1440,60 L0,60 Z" opacity="1" />
      </svg>
    </section>
  );
}

/* ══════════════════════════════════════════════
   COMMENT ÇA MARCHE — 4 étapes, 4 couleurs marque
   ══════════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    { step: '01', image: '/images/landing-v2/step-receive.jpg', title: 'Recevez votre QR', description: 'Commandez vos QR codes via notre formulaire B2B ou auprès de votre agence partenaire.', color: '#2f9bff', href: '/etapes/recevez-votre-qr' },
    { step: '02', image: '/images/landing-v2/step-activate.jpg', title: 'Activez en 30 secondes', description: 'Scannez le QR code et remplissez le formulaire avec vos informations de voyage.', color: '#8b17c9', href: '/etapes/activez-30-secondes' },
    { step: '03', image: '/images/landing-v2/step-travel.jpg', title: 'Voyagez serein', description: "Vos bagages sont protégés. Collez simplement l'autocollant bien visible sur chaque valise.", color: '#e6216e', href: '/etapes/voyagez-serein' },
    { step: '04', image: '/images/landing-v2/step-notify.jpg', title: 'Soyez notifié instantanément', description: "Si quelqu'un trouve votre bagage, vous recevez une alerte immédiatement via WhatsApp.", color: '#f8921f', href: '/etapes/soyez-notifie' },
  ];

  return (
    <section className="py-24 lg:py-32 px-5 bg-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[#2f9bff] mb-5"><Zap className="w-3.5 h-3.5" />Comment ça marche</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#16234e] mb-6 tracking-[-0.02em]">La protection en <span className="text-gradient-qrbag">4 étapes</span></h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">Simple, rapide, sans application à installer.</p>
        </FadeIn>

        <div className="relative">
          {/* Ligne de connexion dégradée (desktop) */}
          <div className="hidden lg:block absolute top-[38%] left-[12%] right-[12%] h-[3px] bg-gradient-to-r from-[#2f9bff] via-[#8b17c9] via-50% to-[#f8921f] opacity-25 rounded-full" aria-hidden />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {steps.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.1}>
                <Link href={step.href} className="group block bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-[#16234e]/10 transition-all duration-500 hover:-translate-y-1.5 h-full">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image src={step.image} alt={step.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" sizes="(max-width:640px) 100vw, 25vw" />
                    <span className="absolute top-3 right-3 w-10 h-10 text-white text-xs font-black rounded-xl flex items-center justify-center shadow-lg" style={{ background: step.color }}>{step.step}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-bold text-[#16234e] mb-1.5">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   POURQUOI QRBAG
   ══════════════════════════════════════════════ */
function WhyQRBagSection() {
  const cards = [
    { icon: Globe, title: 'Ancré en Afrique, pensé pour le monde', description: 'Né à Dakar, déployé dans 15 pays. QRBag comprend les réalités du voyage africain et international avec une solution adaptée à chaque contexte.', color: '#2f9bff' },
    { icon: Shield, title: 'Sécurité certifiée RGPD', description: 'Zéro donnée sensible stockée publiquement. Vos informations personnelles sont chiffrées et protégées selon les normes européennes les plus strictes.', color: '#f8921f' },
    { icon: Heart, title: 'Pour les pèlerins, les voyageurs, les agences', description: "Hajj, Omra, tourisme, affaires — une seule solution qui s'adapte à chaque voyageur. Plus de 10 000 bagages déjà protégés à travers le monde.", color: '#e6216e' },
  ];

  return (
    <section className="py-24 lg:py-32 px-5 bg-gradient-to-b from-[#f6f9ff] to-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[#2f9bff] mb-5"><BadgeCheck className="w-3.5 h-3.5" />Pourquoi QRBag</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#16234e] mb-6 tracking-[-0.02em] leading-[1.1]">La confiance, au-delà<br className="hidden sm:block" /> des frontières</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">Une technologie conçue avec soin pour servir les voyageurs les plus exigeants.</p>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <FadeIn key={card.title} delay={i * 0.12}>
              <div className="group h-full bg-white border border-slate-200/80 rounded-[2rem] p-9 hover:shadow-xl hover:shadow-[#16234e]/10 transition-all duration-500 hover:-translate-y-1.5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-7 transition-transform duration-300 group-hover:scale-110" style={{ background: `${card.color}14` }}>
                  <card.icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
                <h3 className="text-lg font-bold text-[#16234e] mb-3 leading-snug">{card.title}</h3>
                <p className="text-[15px] text-slate-500 leading-relaxed">{card.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   SOLUTIONS
   ══════════════════════════════════════════════ */
function SolutionsSection() {
  const solutions = [
    { title: 'Hajj & Omra', description: 'Protection complète pour les pèlerins avec 3 bagages inclus (cabine + 2 soutes). Gérée par votre agence de voyage partenaire.', icon: Shield, href: '/hajj-omra', style: { background: 'linear-gradient(135deg, #f8921f 0%, #ef4036 100%)' } },
    { title: 'Voyageurs Standard', description: 'Protection flexible pour tous vos voyages. Choisissez 1 ou 2 bagages soute avec une durée adaptée à vos besoins.', icon: Plane, href: '/voyageurs-standard', style: { background: `linear-gradient(135deg, ${AZURE} 0%, ${NAVY} 100%)` } },
    { title: 'Devenir Partenaire', description: 'Agences de voyage, compagnies aériennes, hôtels — proposez QRBag à vos clients et générez des revenus complémentaires.', icon: Users, href: '/devenir-partenaire', style: { background: 'linear-gradient(135deg, #8b17c9 0%, #e6216e 100%)' } },
  ];

  return (
    <section className="py-24 lg:py-32 px-5 bg-white" id="solutions">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[#2f9bff] mb-5"><Luggage className="w-3.5 h-3.5" />Solutions</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#16234e] mb-6 tracking-[-0.02em]">Une solution pour <span className="text-gradient-qrbag">chaque voyageur</span></h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">Que vous soyez pèlerin ou voyageur, QRBag s&apos;adapte à vos besoins.</p>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-6">
          {solutions.map((sol, i) => (
            <FadeIn key={sol.title} delay={i * 0.12}>
              <Link href={sol.href} className="group block h-full">
                <div className="h-full rounded-[2rem] p-9 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 text-white relative overflow-hidden" style={sol.style}>
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" aria-hidden />
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-7 relative z-10"><sol.icon className="w-6 h-6 text-white" /></div>
                  <h3 className="text-lg font-bold mb-3 relative z-10">{sol.title}</h3>
                  <p className="text-[15px] text-white/85 leading-relaxed mb-8 relative z-10">{sol.description}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-white relative z-10">En savoir plus <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" /></span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   TÉMOIGNAGES
   ══════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    { name: 'Fatou Diallo', role: 'Pèlerine Hajj 2025', content: "Grâce à QRBag, j'ai retrouvé ma valise à Djeddah en moins de 2 heures. Une invention géniale qui devrait être obligatoire pour tous les pèlerins.", avatar: 'FD', color: '#e6216e', rating: 5 },
    { name: 'Marc Dupont', role: 'Voyageur fréquent', content: "Simple, efficace et pas cher. J'ai utilisé QRBag pour tous mes voyages cette année. Plus de stress à l'aéroport, enfin !", avatar: 'MD', color: '#2f9bff', rating: 5 },
    { name: 'Amina Benali', role: 'Directrice agence de voyage', content: "Nous avons adopté QRBag pour tous nos pèlerins. Le taux de perte de bagages a chuté de 90%. Nos clients sont ravis.", avatar: 'AB', color: '#8b17c9', rating: 5 },
  ];

  return (
    <section className="py-24 lg:py-32 px-5 bg-gradient-to-b from-white via-[#f6f9ff]/60 to-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[#2f9bff] mb-5"><Star className="w-3.5 h-3.5" />Témoignages</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#16234e] mb-6 tracking-[-0.02em]">Ils nous font <span className="text-gradient-qrbag">confiance</span></h2>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.12}>
              <div className="h-full bg-white border border-slate-200/80 rounded-[2rem] p-8 hover:shadow-xl hover:shadow-[#16234e]/10 transition-all duration-500 gradient-ring">
                <div className="flex gap-1 mb-5">{Array.from({ length: t.rating }).map((_, j) => (<Star key={j} className="w-4 h-4 text-[#f8921f] fill-[#f8921f]" />))}</div>
                <p className="text-slate-600 text-[15px] leading-[1.7] mb-8">&ldquo;{t.content}&rdquo;</p>
                <div className="flex items-center gap-3.5 pt-6 border-t border-slate-100">
                  <div className="w-11 h-11 rounded-full text-white flex items-center justify-center text-xs font-black shadow-lg" style={{ background: `linear-gradient(135deg, ${t.color}, ${NAVY})` }}>{t.avatar}</div>
                  <div><p className="text-sm font-semibold text-[#16234e]">{t.name}</p><p className="text-xs text-slate-400 font-medium">{t.role}</p></div>
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
   TARIFS
   ══════════════════════════════════════════════ */
function PricingSection() {
  const plans = [
    { name: 'Solo', price: '5', period: '/an', description: 'Idéal pour un voyage ponctuel', features: ['2 bagages QR codes', 'Activation en 30 secondes', 'Notifications WhatsApp', 'Géolocalisation temps réel'], popular: false, href: '/voyageurs-standard', accentColor: '#2f9bff', popularBorder: 'border-slate-200/80' },
    { name: 'Famille', price: '12', period: '/an', description: 'Pour les familles ou voyageurs fréquents', features: ['6 bagages QR codes', 'Activation en 30 secondes', 'Notifications WhatsApp', 'Géolocalisation temps réel', 'Support prioritaire'], popular: true, href: '/voyageurs-standard', accentColor: '#f8921f', popularBorder: 'border-transparent' },
    { name: 'Hajj & Omra', price: '5', period: '/pèlerin', description: 'Protection complète pour les pèlerins', features: ['3 bagages QR codes', 'Géré par votre agence', 'Notifications WhatsApp', 'Support 24/7 dédié', 'Couverture internationale'], popular: false, href: '/hajj-omra', accentColor: '#8b17c9', popularBorder: 'border-slate-200/80' },
  ];

  return (
    <section className="py-24 lg:py-32 px-5 bg-gradient-to-b from-white to-[#f6f9ff]" id="tarifs">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[#2f9bff] mb-5"><Luggage className="w-3.5 h-3.5" />Tarifs</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#16234e] mb-6 tracking-[-0.02em]">Protégez vos bagages <span className="text-gradient-qrbag">dès 5€</span></h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">Des prix simples et transparents. Pas de frais cachés.</p>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.12} className="h-full">
              <div className={`relative h-full bg-white rounded-[2rem] p-9 border transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${plan.popular ? 'gradient-ring shadow-lg' : plan.popularBorder}`}>
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-qrbag text-white text-xs font-black px-5 py-1.5 rounded-full shadow-lg shadow-[#e6216e]/30 tracking-wide">★ Populaire</span>
                )}
                <h3 className="text-xl font-black mb-1.5 text-[#16234e]">{plan.name}</h3>
                <p className="text-sm mb-6 text-slate-500">{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-black tracking-[-0.02em]" style={{ color: plan.accentColor }}>{plan.price}€</span>
                  <span className="text-sm text-slate-400">{plan.period}</span>
                </div>
                <ul className="space-y-3.5 mb-9">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <span className="w-4.5 h-4.5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${plan.accentColor}18` }}>
                        <CheckCircle2 className="w-4 h-4" style={{ color: plan.accentColor }} />
                      </span>
                      <span className="text-slate-600">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button
                    className="w-full py-3.5 rounded-full font-bold text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg h-12"
                    style={plan.popular
                      ? { background: 'linear-gradient(95deg, #f8921f, #ef4036, #e6216e, #8b17c9)' }
                      : { background: plan.accentColor }}
                  >
                    Choisir {plan.name}<ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   CTA FINAL — marine + dégradé + avion
   ══════════════════════════════════════════════ */
function FinalCTASection() {
  return (
    <section className="relative py-24 lg:py-32 px-5 bg-[#16234e] overflow-hidden">
      <div className="absolute inset-0 dotted-map-light opacity-40" aria-hidden />
      <div className="absolute -top-32 -right-16 w-[480px] h-[480px] bg-[#e6216e]/20 rounded-full blur-[120px]" aria-hidden />
      <div className="absolute -bottom-32 -left-16 w-[480px] h-[480px] bg-[#f8921f]/15 rounded-full blur-[120px]" aria-hidden />

      {/* Avion décoratif */}
      <motion.div
        className="absolute top-16 right-[12%] text-[#2f9bff]/60 hidden lg:block"
        animate={{ x: [0, 30, 0], y: [0, -12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      >
        <Plane className="w-14 h-14 -rotate-12" />
      </motion.div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <FadeIn>
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-[#f8921f] mb-6"><Sparkles className="w-3.5 h-3.5" />Prêt à voyager serein ?</span>
        </FadeIn>
        <FadeIn delay={0.15}>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white mb-6 tracking-[-0.02em] leading-[1.08]">
            Rejoignez 10 000+ voyageurs
            <br />
            <span className="text-gradient-qrbag">protégés par QRBag</span>
          </h2>
        </FadeIn>
        <FadeIn delay={0.25}>
          <p className={`font-script text-3xl text-[#f8921f] mb-8 ${caveat.variable}`}>et voyagez l&apos;esprit tranquille…</p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <p className="text-lg text-white/60 mb-12 leading-relaxed max-w-xl mx-auto">Activation en 30 secondes, tranquillité pour tous vos voyages.</p>
        </FadeIn>
        <FadeIn delay={0.45}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-gradient-qrbag text-white px-8 py-4 rounded-full font-bold text-base shadow-xl shadow-[#e6216e]/30 hover:shadow-[#e6216e]/50 hover:scale-[1.03] transition-all duration-300 gap-2.5 h-14">
                Commander maintenant<ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/devenir-partenaire">
              <Button className="bg-white/10 hover:bg-white/15 border border-white/25 text-white px-8 py-4 rounded-full font-bold text-base transition-all duration-300 h-14 hover:scale-[1.03] backdrop-blur">
                Devenir partenaire
              </Button>
            </Link>
          </div>
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
    <section className="py-20 px-5 bg-white">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="bg-white rounded-[2rem] p-10 lg:p-14 flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-200/80 shadow-xl shadow-[#16234e]/5">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-qrbag flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#e6216e]/20"><Headphones className="w-6 h-6 text-white" /></div>
              <div><h3 className="text-lg font-black text-[#16234e]">Besoin d&apos;aide ?</h3><p className="text-sm text-slate-500 mt-0.5">Notre équipe est disponible 24/7 pour vous accompagner.</p></div>
            </div>
            <Link href="/contact"><Button className="bg-[#16234e] hover:bg-[#0e1834] text-white rounded-full font-bold text-sm shadow-lg shadow-[#16234e]/25 hover:scale-[1.02] transition-all duration-300 gap-2 px-6 h-11"><Mail className="w-4 h-4" />Nous contacter</Button></Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   FOOTER — marine premium, toutes les pages
   ══════════════════════════════════════════════ */
function Footer() {
  const columns = [
    { title: 'Produit', links: [{ label: 'Solutions', href: '/#solutions' }, { label: 'Comment ça marche', href: '/#comment' }, { label: 'Tarifs', href: '/#tarifs' }, { label: 'Démo', href: '/demo' }, { label: 'Checklist voyage', href: '/checklist' }] },
    { title: 'Entreprise', links: [{ label: 'À propos', href: '/a-propos' }, { label: 'Partenaires', href: '/devenir-partenaire' }, { label: 'Espace Agence', href: '/agence/connexion' }, { label: 'Contact', href: '/contact' }] },
    { title: 'Légal', links: [{ label: 'Mentions légales', href: '/mentions-legales' }, { label: 'Confidentialité', href: '/confidentialite' }, { label: 'CGU', href: '/cgu' }] },
    { title: 'Contact', links: [{ label: 'Email', href: '/contact' }, { label: 'Suivre mon bagage', href: '/#suivi' }] },
  ];

  return (
    <footer className="relative bg-[#16234e] pt-16 pb-10 mt-auto overflow-hidden">
      <div className="absolute inset-0 dotted-map-light opacity-30" aria-hidden />
      {/* Liseré dégradé signature */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-qrbag" aria-hidden />

      <div className="max-w-6xl mx-auto px-5 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-12">
          <div className="lg:col-span-2">
            <div className="mb-5 inline-block bg-white rounded-2xl px-4 py-2.5"><img src="/logo.png" alt="QRBag" className="h-11 w-auto object-contain" /></div>
            <p className="text-base leading-relaxed max-w-xs text-white/60 mb-7">Solution intelligente de suivi de bagages. Scannez, retrouvez, voyagez l&apos;esprit tranquille.</p>
            <div className="flex items-center gap-2.5">
              {[{ icon: Facebook, href: 'https://facebook.com/qrbag', label: 'Facebook' }, { icon: Instagram, href: 'https://instagram.com/qrbag', label: 'Instagram' }, { icon: Twitter, href: 'https://twitter.com/qrbag', label: 'Twitter' }].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 hover:bg-gradient-qrbag rounded-xl flex items-center justify-center transition-all duration-300" aria-label={s.label}><s.icon className="w-5 h-5 text-white/70 hover:text-white transition-colors" /></a>
              ))}
            </div>
          </div>
          {columns.map(col => (
            <div key={col.title}>
              <h4 className="text-sm font-black tracking-[0.1em] uppercase text-[#f8921f] mb-5">{col.title}</h4>
              <ul className="space-y-3">{col.links.map(link => (<li key={link.label}><Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors duration-300">{link.label}</Link></li>))}</ul>
            </div>
          ))}
        </div>
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/40">&copy; {new Date().getFullYear()} QRBag. Tous droits réservés.</p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/mentions-legales" className="text-white/40 hover:text-white transition-colors">Mentions légales</Link>
            <span className="text-white/20">·</span>
            <Link href="/confidentialite" className="text-white/40 hover:text-white transition-colors">Confidentialité</Link>
            <span className="text-white/20">·</span>
            <Link href="/cgu" className="text-white/40 hover:text-white transition-colors">CGU</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE — Landing ULTRA PREMIUM QRBag
   Palette étiquette QR : navy · azure · orange ·
   magenta · violet · dégradé signature
   ══════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <main className="bg-white flex flex-col min-h-screen">
      <Navigation />
      <HeroSection />
      <MarqueeStrip />
      <ChecklistCTASection />
      <TrackingWidget />
      <QRBagEnActionSection />
      <StatsSection />
      <HowItWorksSection />
      <WhyQRBagSection />
      <SolutionsSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTASection />
      <ContactCTASection />
      <Footer />
      <LandingChatbotWidget />
    </main>
  );
}
