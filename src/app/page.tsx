'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { motion, useInView, AnimatePresence } from 'framer-motion';

const LandingChatbotWidget = dynamic(
  () => import('@/components/finder/LandingChatbotWidget'),
  { ssr: false, loading: () => null }
);
import TrackingWidget from '@/components/home/TrackingWidget';
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
  Zap,
  Users,
  Headphones,
  Shield,
  Globe,
  Heart,
  CheckCircle,
  Ship,
  Bus,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  BadgeCheck,
  Phone,
  LucideIcon,
  ChevronDown,
  CircleDot,
  ScanLine,
  BellRing,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
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

/* ══════════════════════════════════════════════
   NAVIGATION (Light Glass Effect)
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
    { label: 'À propos', href: '/#comment' },
    { label: 'Tarifs', href: '/#tarifs' },
    { label: 'Contactez-nous', href: '/contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-100' : 'bg-white/60 backdrop-blur-lg'}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="QRBag" className="h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 rounded-lg hover:bg-slate-50">
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium text-[13px]">
                Connexion
              </Button>
            </Link>
            <Link href="/devenir-partenaire">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-[13px] rounded-full px-6 h-10 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all duration-300 hover:scale-[1.02]">
                Devenir Partenaire
              </Button>
            </Link>
          </div>

          <button className="md:hidden text-slate-700 p-2" onClick={() => setIsOpen(!isOpen)} aria-label="Menu">
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
                  <a key={link.href} href={link.href} className="block text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium py-2.5 px-3 rounded-xl text-base transition-colors" onClick={() => setIsOpen(false)}>
                    {link.label}
                  </a>
                ))}
                <hr className="border-slate-100 my-2" />
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full text-slate-600 font-medium justify-start">Connexion</Button>
                </Link>
                <Link href="/devenir-partenaire" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-full mt-1">
                    Devenir Partenaire
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
   HERO SECTION (Slider - Boutiko-inspired)
   ══════════════════════════════════════════════ */
const heroSlides = [
  {
    image: '/images/landing-v2/hero-woman-traveler.png',
    badge: 'Protection intelligente',
    title: 'Voyagez serein,',
    highlight: 'sans crainte',
    subtitle: "QRBag protège vos bagages avec un simple autocollant QR code. Sans application, sans batterie, sans GPS — un scan suffit.",
    cta1: { label: 'Commencer gratuitement', href: '/devenir-partenaire' },
    cta2: { label: 'Voir la démo', href: '/demo', icon: Play },
    stats: [
      { value: '10 000+', label: 'Bagages protégés' },
      { value: '98%', label: 'Taux de récupération' },
    ],
  },
  {
    image: '/images/landing-v2/hero-man-scanning.png',
    badge: 'Scan & Trouvé',
    title: 'Un scan,',
    highlight: 'une alerte instantanée',
    subtitle: "Quelqu'un trouve votre bagage, scanne le QR code et vous recevez immédiatement une notification WhatsApp avec la localisation exacte.",
    cta1: { label: 'Commander mes QR codes', href: '/contact' },
    cta2: { label: 'Comment ça marche', href: '/#comment' },
    stats: [
      { value: '24/7', label: 'Disponibilité' },
      { value: '15+', label: 'Pays couverts' },
    ],
  },
  {
    image: '/images/landing-v2/hero-family-travel.png',
    badge: 'Pour toute la famille',
    title: 'Hajj, vacances,',
    highlight: 'chaque voyage compte',
    subtitle: "Pèlerinage ou vacances en famille — chaque bagage mérite d'être protégé. 3 QR codes par passager, activation en 30 secondes.",
    cta1: { label: 'Découvrir Hajj & Omra', href: '/hajj-omra' },
    cta2: { label: 'Voyageurs Standard', href: '/voyageurs-standard' },
    stats: [
      { value: '3', label: 'Bagages/pèlerin' },
      { value: '30s', label: 'Activation' },
    ],
  },
];

function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent(prev => (prev + 1) % heroSlides.length);
    }, 6000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
    startTimer();
  };

  const slide = heroSlides[current];

  const slideVariants = {
    enter: () => ({ opacity: 0 }),
    center: { opacity: 1 },
    exit: () => ({ opacity: 0 }),
  };

  const textVariants = {
    enter: (dir: number) => ({ y: dir > 0 ? 30 : -30, opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (dir: number) => ({ y: dir > 0 ? -30 : 30, opacity: 0 }),
  };

  return (
    <section className="relative pt-24 pb-0 lg:pt-28 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/8 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-400/6 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[70vh] lg:min-h-[80vh]">
          {/* Left - Text Content */}
          <div className="order-2 lg:order-1 pt-4 lg:pt-0 pb-8 lg:pb-0">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                  </span>
                  <span className="text-base font-semibold text-blue-700">{slide.badge}</span>
                </div>

                {/* Title */}
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-[1.05] tracking-[-0.03em]">
                  {slide.title}
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
                    {slide.highlight}
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-xl text-slate-500 max-w-xl leading-relaxed mb-8">
                  {slide.subtitle}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                  <Link href={slide.cta1.href}>
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-7 py-4 rounded-full font-semibold text-base shadow-xl shadow-blue-600/20 hover:shadow-blue-600/30 hover:scale-[1.03] transition-all duration-300 gap-2 h-13">
                      {slide.cta1.label}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={slide.cta2.href}>
                    <Button className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 px-7 py-4 rounded-full font-semibold text-base transition-all duration-300 gap-2 h-13 hover:scale-[1.03] shadow-sm">
                      {slide.cta2.icon && <slide.cta2.icon className="w-4 h-4" />}
                      {slide.cta2.label}
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex gap-8">
                  {slide.stats.map((stat, i) => (
                    <div key={i}>
                      <div className="text-3xl font-extrabold text-slate-900">{stat.value}</div>
                      <div className="text-sm text-slate-500 font-medium mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slide indicators */}
            <div className="flex items-center gap-2 mt-10">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`transition-all duration-500 rounded-full ${
                    idx === current
                      ? 'w-10 h-3 bg-gradient-to-r from-blue-600 to-indigo-600'
                      : 'w-3 h-3 bg-slate-200 hover:bg-slate-300'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
              {/* Navigation arrows */}
              <button
                onClick={() => { goTo((current - 1 + heroSlides.length) % heroSlides.length); }}
                className="ml-3 w-9 h-9 rounded-full border border-slate-200 hover:border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => { goTo((current + 1) % heroSlides.length); }}
                className="w-9 h-9 rounded-full border border-slate-200 hover:border-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right - Image Slider */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
              {/* Phone frame mockup */}
              <div className="relative">
                {/* Glow behind image */}
                <div className="absolute -inset-8 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-[3rem] blur-[60px]" />
                
                <AnimatePresence mode="popLayout" custom={direction}>
                  <motion.div
                    key={current}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-300/40 border border-slate-200/60 bg-slate-900"
                  >
                    <Image
                      src={slide.image}
                      alt="QRBag - Protection bagages"
                      width={864}
                      height={1152}
                      className="w-full h-auto object-cover"
                      priority={current === 0}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Floating badges */}
                <motion.div
                  className="absolute -left-4 bottom-24 bg-white px-4 py-3 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center gap-3"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Bagage retrouvé !</div>
                    <div className="text-[10px] text-slate-500">WhatsApp · il y a 2 min</div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -right-4 top-16 bg-white px-4 py-3 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center gap-3"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Géolocalisé</div>
                    <div className="text-[10px] text-slate-500">Aéroport CDG · T4</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature cards - Full image with text overlay */}
      <div className="bg-white border-t border-slate-100 py-10 mt-4">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
            {[
              {
                image: '/images/landing-v2/features/sans-app.jpg',
                title: 'Sans application',
                subtitle: 'Un scan suffit',
              },
              {
                image: '/images/landing-v2/features/sans-batterie.jpg',
                title: 'Sans batterie',
                subtitle: 'Autonome à 100%',
              },
              {
                image: '/images/landing-v2/features/geolocalisation.jpg',
                title: 'Géolocalisation',
                subtitle: 'Temps réel',
              },
              {
                image: '/images/landing-v2/features/securise-rgpd.jpg',
                title: 'Sécurisé RGPD',
                subtitle: 'Données protégées',
              },
              {
                image: '/images/landing-v2/features/alertes-whatsapp.jpg',
                title: 'Alertes WhatsApp',
                subtitle: 'Notification instantanée',
              },
            ].map((item, idx) => (
              <div
                key={item.title}
                className="group relative w-[191px] h-[254px] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-default"
              >
                {/* Full background image */}
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="191px"
                />
                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                {/* Title at top */}
                <p className="absolute top-4 left-0 right-0 text-center text-white text-sm font-bold drop-shadow-lg px-2">
                  {item.title}
                </p>
                {/* Subtitle at bottom */}
                <p className="absolute bottom-4 left-0 right-0 text-center text-white/90 text-xs drop-shadow-md px-2">
                  {item.subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   QRBag EN ACTION SECTION
   ══════════════════════════════════════════════ */
function QRBagEnActionSection() {
  const features = [
    'Scan instantané du QR code',
    'Notification WhatsApp en temps réel',
    'Géolocalisation précise du bagage',
    'Interface intuitive sans application',
  ];
  const featureIcons: LucideIcon[] = [ScanLine, BellRing, MapPin, Smartphone];

  return (
    <section className="py-24 lg:py-32 px-5 bg-white" id="comment">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <FadeIn direction="right">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-blue-100/40 to-indigo-100/40 rounded-[2rem] blur-[40px]" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100">
                <Image src="/images/landing-v2/qrcode-reel.jpg" alt="QR Code QRBag" width={1024} height={1024} className="w-full h-auto object-cover" />
              </div>
              <motion.div
                className="absolute -bottom-4 -right-4 bg-white text-slate-900 px-5 py-3 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 font-bold text-sm flex items-center gap-2.5"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                98% de récupération
              </motion.div>
            </div>
          </FadeIn>

          <FadeIn direction="left" delay={0.2}>
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                QRBag en action
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-7 tracking-[-0.02em] leading-[1.1]">
                Scannez, activez,{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">voyagez.</span>
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-10">
                Notre technologie QR code brevetée permet à n&apos;importe qui de signaler un bagage trouvé en un seul geste. Vous recevez instantanément une notification avec la localisation exacte de votre valise.
              </p>
              <div className="space-y-4">
                {features.map((feature, i) => {
                  const Icon = featureIcons[i];
                  return (
                    <motion.div key={feature} className="flex items-center gap-4 group" initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                        <Icon className="w-4.5 h-4.5 text-blue-600" />
                      </div>
                      <span className="text-slate-700 font-medium text-[15px]">{feature}</span>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-12">
                <Link href="/demo">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-7 py-3.5 rounded-full font-semibold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 gap-2 hover:scale-[1.02]">
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
   TRANSPORT MODES SECTION
   ══════════════════════════════════════════════ */
function TransportModesSection() {
  const modes = [
    { title: 'Avion', image: '/images/landing-v2/transport-avion.jpg', stat: '15M+ passagers/an', icon: Plane, accent: 'from-blue-500 to-blue-600' },
    { title: 'Train', image: '/images/landing-v2/transport-train.jpg', stat: '4.5M voyageurs/jour', icon: Zap, accent: 'from-violet-500 to-violet-600' },
    { title: 'Bateau', image: '/images/landing-v2/transport-bateau.jpg', stat: '30M croisiéristes', icon: Ship, accent: 'from-teal-500 to-teal-600' },
    { title: 'Bus', image: '/images/landing-v2/transport-bus.jpg', stat: '200K trajets/jour', icon: Bus, accent: 'from-orange-500 to-orange-600' },
  ];

  return (
    <section className="py-24 lg:py-32 px-5 bg-gradient-to-b from-slate-50/80 to-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5">
            <Globe className="w-3.5 h-3.5" />
            Tous les modes de transport
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em]">
            Une protection pour tous vos voyages
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">Avion, train, bateau, bus — QRBag vous suit partout.</p>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {modes.map((mode, i) => (
            <FadeIn key={mode.title} delay={i * 0.1}>
              <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 hover:-translate-y-1">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image src={mode.image} alt={mode.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  <div className="absolute top-3 left-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm">
                    <mode.icon className="w-4 h-4 text-slate-700" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-slate-900">{mode.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{mode.stat}</p>
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
   POURQUOI QRBAG
   ══════════════════════════════════════════════ */
function WhyQRBagSection() {
  const cards = [
    { icon: Globe, title: 'Ancré en Afrique, pensé pour le monde', description: 'Né à Dakar, déployé dans 15 pays. QRBag comprend les réalités du voyage africain et international avec une solution adaptée à chaque contexte.', lightBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { icon: Shield, title: 'Sécurité certifiée RGPD', description: 'Zéro donnée sensible stockée publiquement. Vos informations personnelles sont chiffrées et protégées selon les normes européennes les plus strictes.', lightBg: 'bg-orange-50', iconColor: 'text-orange-600' },
    { icon: Heart, title: 'Pour les pèlerins, les voyageurs, les agences', description: "Hajj, Omra, tourisme, affaires — une seule solution qui s'adapte à chaque voyageur. Plus de 10 000 bagages déjà protégés à travers le monde.", lightBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  ];

  return (
    <section className="py-24 lg:py-32 px-5 bg-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5"><BadgeCheck className="w-3.5 h-3.5" />Pourquoi QRBag</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.1]">La confiance, au-delà<br className="hidden sm:block" /> des frontières</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">Une technologie conçue avec soin pour servir les voyageurs les plus exigeants.</p>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <FadeIn key={card.title} delay={i * 0.12}>
              <div className="group h-full bg-white border border-slate-200/80 rounded-[2rem] p-9 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 hover:-translate-y-1.5">
                <div className={`w-14 h-14 rounded-2xl ${card.lightBg} flex items-center justify-center mb-7`}><card.icon className={`w-6 h-6 ${card.iconColor}`} /></div>
                <h3 className="text-lg font-bold text-slate-900 mb-3 leading-snug">{card.title}</h3>
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
    { title: 'Hajj & Omra', description: 'Protection complète pour les pèlerins avec 3 bagages inclus (cabine + 2 soutes). Gérée par votre agence de voyage partenaire.', icon: Shield, href: '/hajj-omra', gradient: 'from-amber-500 to-orange-500' },
    { title: 'Voyageurs Standard', description: 'Protection flexible pour tous vos voyages. Choisissez 1 ou 3 bagages avec une durée adaptée à vos besoins.', icon: Plane, href: '/voyageurs-standard', gradient: 'from-blue-600 to-indigo-600' },
    { title: 'Devenir Partenaire', description: 'Agences de voyage, compagnies aériennes, hôtels — proposez QRBag à vos clients et générez des revenus complémentaires.', icon: Users, href: '/devenir-partenaire', gradient: 'from-violet-600 to-purple-600' },
  ];

  return (
    <section className="py-24 lg:py-32 px-5 bg-slate-50/60" id="solutions">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5"><Luggage className="w-3.5 h-3.5" />Solutions</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em]">Deux solutions, une protection</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">Que vous soyez pèlerin ou voyageur, QRBag s&apos;adapte à vos besoins.</p>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-6">
          {solutions.map((sol, i) => (
            <FadeIn key={sol.title} delay={i * 0.12}>
              <Link href={sol.href} className="group block h-full">
                <div className={`h-full bg-gradient-to-br ${sol.gradient} rounded-[2rem] p-9 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5`}>
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-7"><sol.icon className="w-6 h-6 text-white" /></div>
                  <h3 className="text-lg font-bold text-white mb-3">{sol.title}</h3>
                  <p className="text-[15px] text-white/80 leading-relaxed mb-8">{sol.description}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-white/90 transition-colors duration-300">En savoir plus <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" /></span>
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
   STATS SECTION
   ══════════════════════════════════════════════ */
function StatsSection() {
  const stats = [
    { value: 10000, suffix: '+', label: 'Bagages protégés', icon: Luggage },
    { value: 15, suffix: '', label: 'Pays couverts', icon: Globe },
    { value: 98, suffix: '%', label: 'Taux de récupération', icon: TrendingUp },
    { value: 0, suffix: '24/7', label: 'Disponibilité', icon: BellRing },
  ];

  return (
    <section className="py-20 lg:py-24 px-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2" />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
          {stats.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1}>
              <div className="text-center group">
                <div className="flex justify-center mb-4"><div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center"><stat.icon className="w-5 h-5 text-white" /></div></div>
                <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2 tracking-[-0.02em]">{stat.suffix === '24/7' ? '24/7' : <AnimatedCounter target={stat.value} suffix={stat.suffix} />}</div>
                <div className="text-sm text-white/70 font-medium">{stat.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   COMMENT ÇA MARCHE
   ══════════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    { step: '01', image: '/images/landing-v2/step-receive.jpg', title: 'Recevez votre QR', description: 'Commandez vos QR codes via notre formulaire B2B ou auprès de votre agence partenaire.', color: 'from-blue-500 to-blue-600' },
    { step: '02', image: '/images/landing-v2/step-activate.jpg', title: 'Activez en 30 secondes', description: 'Scannez le QR code et remplissez le formulaire avec vos informations de voyage.', color: 'from-violet-500 to-violet-600' },
    { step: '03', image: '/images/landing-v2/step-travel.jpg', title: 'Voyagez serein', description: "Vos bagages sont protégés. Collez simplement l'autocollant bien visible sur chaque valise.", color: 'from-emerald-500 to-emerald-600' },
    { step: '04', image: '/images/landing-v2/step-notify.jpg', title: 'Soyez notifié instantanément', description: "Si quelqu'un trouve votre bagage, vous recevez une alerte immédiatement via WhatsApp.", color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <section className="py-24 lg:py-32 px-5 bg-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5"><Zap className="w-3.5 h-3.5" />Comment ça marche</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em]">La protection en 4 étapes</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">Simple, rapide, sans application à installer.</p>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <FadeIn key={step.step} delay={i * 0.1}>
              <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 hover:-translate-y-1">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image src={step.image} alt={step.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  <span className={`absolute top-3 right-3 w-9 h-9 bg-gradient-to-br ${step.color} text-white text-xs font-bold rounded-xl flex items-center justify-center shadow-lg`}>{step.step}</span>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
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
   TESTIMONIALS
   ══════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    { name: 'Fatou Diallo', role: 'Pèlerine Hajj 2025', content: "Grâce à QRBag, j'ai retrouvé ma valise à Djeddah en moins de 2 heures. Une invention géniale qui devrait être obligatoire pour tous les pèlerins.", avatar: 'FD', rating: 5 },
    { name: 'Marc Dupont', role: 'Voyageur fréquent', content: "Simple, efficace et pas cher. J'ai utilisé QRBag pour tous mes voyages cette année. Plus de stress à l'aéroport, enfin !", avatar: 'MD', rating: 5 },
    { name: 'Amina Benali', role: 'Directrice agence de voyage', content: "Nous avons adopté QRBag pour tous nos pèlerins. Le taux de perte de bagages a chuté de 90%. Nos clients sont ravis.", avatar: 'AB', rating: 5 },
  ];

  return (
    <section className="py-24 lg:py-32 px-5 bg-gradient-to-b from-white via-slate-50/50 to-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5"><Star className="w-3.5 h-3.5" />Témoignages</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em]">Ils nous font confiance</h2>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.12}>
              <div className="h-full bg-white border border-slate-200/80 rounded-[2rem] p-8 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500">
                <div className="flex gap-1 mb-5">{Array.from({ length: t.rating }).map((_, j) => (<Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />))}</div>
                <p className="text-slate-600 text-[15px] leading-[1.7] mb-8">&ldquo;{t.content}&rdquo;</p>
                <div className="flex items-center gap-3.5 pt-6 border-t border-slate-100">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-lg">{t.avatar}</div>
                  <div><p className="text-sm font-semibold text-slate-900">{t.name}</p><p className="text-xs text-slate-400 font-medium">{t.role}</p></div>
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
   PRICING SECTION
   ══════════════════════════════════════════════ */
function PricingSection() {
  const plans = [
    { name: 'Solo', price: '5', period: '/an', description: 'Idéal pour un voyage ponctuel', features: ['3 bagages QR codes', 'Activation en 30 secondes', 'Notifications WhatsApp', 'Géolocalisation temps réel'], popular: false, href: '/voyageurs-standard', accentColor: 'text-cyan-600', btnClass: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-cyan-500/25', popularBorder: 'border-slate-200/80' },
    { name: 'Famille', price: '12', period: '/an', description: 'Pour les familles ou voyageurs fréquents', features: ['9 bagages QR codes', 'Activation en 30 secondes', 'Notifications WhatsApp', 'Géolocalisation temps réel', 'Support prioritaire'], popular: true, href: '/voyageurs-standard', accentColor: 'text-orange-600', btnClass: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-orange-500/25', popularBorder: 'border-orange-200 shadow-lg shadow-orange-100/50' },
    { name: 'Hajj & Omra', price: '5', period: '/pèlerin', description: 'Protection complète pour les pèlerins', features: ['3 bagages QR codes', 'Géré par votre agence', 'Notifications WhatsApp', 'Support 24/7 dédié', 'Couverture internationale'], popular: false, href: '/hajj-omra', accentColor: 'text-teal-600', btnClass: 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 shadow-teal-500/25', popularBorder: 'border-slate-200/80' },
  ];

  return (
    <section className="py-24 lg:py-32 px-5 bg-white" id="tarifs">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5"><Luggage className="w-3.5 h-3.5" />Tarifs</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em]">Protégez vos bagages à partir de 5€</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">Des prix simples et transparents. Pas de frais cachés.</p>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.12}>
              <div className={`relative h-full bg-white rounded-[2rem] p-9 border transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${plan.popularBorder}`}>
                {plan.popular && (<span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shadow-orange-500/30">Populaire</span>)}
                <h3 className="text-xl font-bold mb-1.5 text-slate-900">{plan.name}</h3>
                <p className="text-sm mb-6 text-slate-500">{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className={`text-5xl font-extrabold tracking-[-0.02em] ${plan.accentColor}`}>{plan.price}€</span>
                  <span className="text-sm text-slate-400">{plan.period}</span>
                </div>
                <ul className="space-y-3.5 mb-9">
                  {plan.features.map((f) => (<li key={f} className="flex items-center gap-3 text-sm"><CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.accentColor}`} /><span className="text-slate-600">{f}</span></li>))}
                </ul>
                <Link href={plan.href}>
                  <Button className={`w-full py-3.5 rounded-full font-semibold text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg ${plan.btnClass}`}>Choisir {plan.name}<ArrowRight className="w-4 h-4 ml-1" /></Button>
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
   FINAL CTA
   ══════════════════════════════════════════════ */
function FinalCTASection() {
  return (
    <section className="py-24 lg:py-32 px-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4" />
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <FadeIn><span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-200 mb-6"><Sparkles className="w-3.5 h-3.5" />Prêt à voyager serein ?</span></FadeIn>
        <FadeIn delay={0.15}><h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-8 tracking-[-0.02em] leading-[1.1]">Rejoignez 10 000+ voyageurs qui protègent leurs bagages</h2></FadeIn>
        <FadeIn delay={0.3}><p className="text-lg text-white/70 mb-12 leading-relaxed">Activation en 30 secondes, tranquillité pour tous vos voyages.</p></FadeIn>
        <FadeIn delay={0.45}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact"><Button className="bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-full font-semibold text-base shadow-xl hover:scale-[1.03] transition-all duration-300 gap-2.5 h-14">Commander maintenant<ArrowRight className="w-4 h-4" /></Button></Link>
            <Link href="/devenir-partenaire"><Button className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-8 py-4 rounded-full font-semibold text-base backdrop-blur-sm transition-all duration-300 h-14 hover:scale-[1.03]">Devenir partenaire</Button></Link>
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
    <section className="py-20 px-5 bg-slate-50/60">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="bg-white rounded-[2rem] p-10 lg:p-14 flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0"><Headphones className="w-6 h-6 text-blue-600" /></div>
              <div><h3 className="text-lg font-bold text-slate-900">Besoin d&apos;aide ?</h3><p className="text-sm text-slate-500 mt-0.5">Notre équipe est disponible 24/7 pour vous accompagner.</p></div>
            </div>
            <Link href="/contact"><Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-semibold text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all duration-300 gap-2 px-6 h-11"><Mail className="w-4 h-4" />Nous contacter</Button></Link>
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
    { title: 'Produit', links: [{ label: 'Solutions', href: '/#solutions' }, { label: 'Comment ça marche', href: '/#comment' }, { label: 'Tarifs', href: '/#tarifs' }, { label: 'Démo', href: '/demo' }] },
    { title: 'Entreprise', links: [{ label: 'À propos', href: '/#comment' }, { label: 'Partenaires', href: '/devenir-partenaire' }, { label: 'Espace Agence', href: '/agence/connexion' }, { label: 'Contact', href: '/contact' }] },
    { title: 'Légal', links: [{ label: 'Mentions légales', href: '/mentions-legales' }, { label: 'Confidentialité', href: '/confidentialite' }, { label: 'CGU', href: '/cgu' }] },
    { title: 'Contact', links: [{ label: 'Email', href: '/contact' }] },
  ];

  return (
    <footer className="bg-slate-900 pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-12">
          <div className="lg:col-span-2">
            <div className="mb-5"><img src="/logo.png" alt="QRBag" className="h-14 w-auto object-contain" /></div>
            <p className="text-base leading-relaxed max-w-xs text-white/60 mb-7">Protection intelligente des bagages pour voyageurs et pèlerins.</p>
            <div className="flex items-center gap-2.5">
              {[{ icon: Facebook, href: 'https://facebook.com/qrbag', label: 'Facebook' }, { icon: Instagram, href: 'https://instagram.com/qrbag', label: 'Instagram' }, { icon: Twitter, href: 'https://twitter.com/qrbag', label: 'Twitter' }].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl flex items-center justify-center transition-all duration-300" aria-label={s.label}><s.icon className="w-5 h-5 text-white/50 hover:text-white transition-colors" /></a>
              ))}
            </div>
          </div>
          {columns.map(col => (
            <div key={col.title}>
              <h4 className="text-sm font-bold tracking-[0.1em] uppercase text-white/80 mb-5">{col.title}</h4>
              <ul className="space-y-3">{col.links.map(link => (<li key={link.label}><Link href={link.href} className="text-base text-white/50 hover:text-white transition-colors duration-300">{link.label}</Link></li>))}</ul>
            </div>
          ))}
        </div>
        <div className="mt-20 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/40">&copy; {new Date().getFullYear()} QRBag. Tous droits réservés.</p>
          <p className="text-sm text-white/30">Fait avec soin à Dakar, pour le monde.</p>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <main className="bg-white">
      <Navigation />
      <HeroSection />
      <TrackingWidget />
      <QRBagEnActionSection />
      <TransportModesSection />
      <WhyQRBagSection />
      <SolutionsSection />
      <StatsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTASection />
      <ContactCTASection />
      <Footer />
      <LandingChatbotWidget />
    </main>
  );
}
