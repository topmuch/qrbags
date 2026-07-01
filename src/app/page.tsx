'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

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
   Fade-in wrapper (Framer Motion)
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
   Parallax Section Wrapper
   ────────────────────────────────────────────── */
function ParallaxSection({ children, className, speed = 0.3 }: { children: React.ReactNode; className?: string; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 100]);

  return (
    <section ref={ref} className={className}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   NAVIGATION (Premium Minimal)
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
    { label: 'Solutions', href: '/#solutions' },
    { label: 'Comment ça marche', href: '/#comment' },
    { label: 'Tarifs', href: '/#tarifs' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
        : 'bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]'
    }`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <Link href="/" className="flex items-center group">
            <img src="/logo.png" alt="QRBag" className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="relative px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors duration-300 group">
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-slate-900 rounded-full transition-all duration-300 group-hover:w-4" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/agence/connexion">
              <Button variant="ghost" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 text-[13px] font-medium transition-all duration-300">
                Espace Agence
              </Button>
            </Link>
            <Link href="/devenir-partenaire">
              <Button className="bg-slate-900 text-white hover:bg-slate-800 font-semibold text-[13px] rounded-full px-5 h-9 shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 transition-all duration-300 hover:scale-[1.02]">
                Devenir Partenaire
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden text-slate-900 p-1.5"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden py-4 border-t border-slate-100 bg-white/98 backdrop-blur-xl rounded-b-2xl"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className="text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium py-2.5 px-3 rounded-xl text-base transition-colors" onClick={() => setIsOpen(false)}>
                  {link.label}
                </a>
              ))}
              <hr className="border-slate-100 my-2" />
              <Link href="/agence/connexion" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 justify-start">Espace Agence</Button>
              </Link>
              <Link href="/devenir-partenaire" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-slate-900 text-white font-medium rounded-full mt-1 hover:bg-slate-800">
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
   HERO SECTION (Cinematic Immersive)
   ══════════════════════════════════════════════ */
function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, 80]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with parallax */}
      <motion.div className="absolute inset-0" style={{ scale }}>
        <Image
          src="/hero-qrbags.png"
          alt="Voyageuse scannant un bagage QRBag"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30" />
        {/* Ambient color overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-indigo-900/20" />
      </motion.div>

      {/* Animated mesh gradient accent */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <motion.div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 text-center pt-28 pb-28" style={{ opacity, y: textY }}>
        <FadeIn>
          <div className="inline-flex items-center gap-2.5 mb-8 px-5 py-2.5 bg-white/[0.08] border border-white/[0.12] rounded-full backdrop-blur-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-sm font-medium text-white/90 tracking-wide">Protection intelligente pour vos bagages</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-[1.02] tracking-[-0.02em]">
            Un bagage perdu
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_ease-in-out_infinite]">
              n&apos;est pas une fatalité.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="text-lg sm:text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mt-2 leading-relaxed font-light tracking-wide">
            QRBag transforme la perte en opportunité — grâce à la technologie, la confiance, et le respect.
          </p>
        </FadeIn>

        <FadeIn delay={0.45}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Link href="/demo">
              <Button className="bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-full font-semibold text-base shadow-2xl shadow-black/30 hover:shadow-black/40 hover:scale-[1.03] transition-all duration-300 gap-2.5 h-14">
                <Play className="w-4 h-4" />
                Découvrir la démo
              </Button>
            </Link>
            <Link href="/contact">
              <Button className="bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] hover:border-white/[0.25] text-white px-8 py-4 rounded-full font-semibold text-base backdrop-blur-sm transition-all duration-300 gap-2.5 h-14 hover:scale-[1.03]">
                Commander maintenant
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </FadeIn>

        {/* Feature pills */}
        <FadeIn delay={0.6}>
          <div className="flex flex-wrap justify-center gap-3 mt-16">
            {[
              { icon: Smartphone, text: 'Sans application' },
              { icon: Zap, text: 'Sans batterie' },
              { icon: MapPin, text: 'Géolocalisé en temps réel' },
              { icon: Lock, text: 'Sécurisé RGPD' },
            ].map((item, idx) => (
              <motion.div
                key={item.text}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-full backdrop-blur-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + idx * 0.1, duration: 0.6 }}
              >
                <item.icon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-medium text-white/60 tracking-wide">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </FadeIn>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/50 to-transparent" />

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="w-5 h-5 text-white/40" />
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   QRBag EN ACTION SECTION (Refined)
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
    <section className="py-28 lg:py-36 px-5 bg-white" id="comment">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left - QR Code Image */}
          <FadeIn direction="right">
            <div className="relative">
              {/* Ambient glow */}
              <div className="absolute -inset-8 bg-gradient-to-br from-blue-200/30 to-cyan-100/30 rounded-[2.5rem] blur-[60px]" />
              <div className="relative rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border border-slate-100/80">
                <Image
                  src="/images/landing-v2/qrcode-reel.jpg"
                  alt="QR Code QRBag apposé sur un bagage"
                  width={1024}
                  height={1024}
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* Floating stat badge */}
              <motion.div
                className="absolute -bottom-5 -right-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6 py-4 rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] font-bold text-sm flex items-center gap-2.5"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                98% de récupération
              </motion.div>
            </div>
          </FadeIn>

          {/* Right - Content */}
          <FadeIn direction="left" delay={0.2}>
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                QRBag en action
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-7 tracking-[-0.02em] leading-[1.08]">
                Scannez, activez,{' '}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">voyagez.</span>
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-10">
                Notre technologie QR code brevetée permet à n&apos;importe qui de signaler un bagage trouvé en un seul geste. Vous recevez instantanément une notification avec la localisation exacte de votre valise.
              </p>

              <div className="space-y-4">
                {features.map((feature, i) => {
                  const Icon = featureIcons[i];
                  return (
                    <motion.div
                      key={feature}
                      className="flex items-center gap-4 group"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                        <Icon className="w-4.5 h-4.5 text-blue-600" />
                      </div>
                      <span className="text-slate-700 font-medium text-[15px]">{feature}</span>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-12 flex items-center gap-4">
                <Link href="/demo">
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white px-7 py-3.5 rounded-full font-semibold text-sm shadow-[0_16px_32px_-8px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_40px_-8px_rgba(0,0,0,0.2)] transition-all duration-300 gap-2 hover:scale-[1.02]">
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
   TRANSPORT MODES SECTION (Bento Grid)
   ══════════════════════════════════════════════ */
function TransportModesSection() {
  const modes = [
    {
      title: 'Avion',
      description: 'Protégez vos bagages en soute et cabine lors de vos vols internationaux et domestiques.',
      image: '/images/landing-v2/transport-avion.jpg',
      stat: '15M+ passagers/an',
      icon: Plane,
    },
    {
      title: 'Train',
      description: 'Voyagez serein en TGV, Eurostar ou trains régionaux avec une protection continue.',
      image: '/images/landing-v2/transport-train.jpg',
      stat: '4.5M voyageurs/jour',
      icon: Zap,
    },
    {
      title: 'Bateau',
      description: 'Croisières et ferrys — QRBag protège vos bagages sur tous les mers du monde.',
      image: '/images/landing-v2/transport-bateau.jpg',
      stat: '30M croisiéristes',
      icon: Ship,
    },
    {
      title: 'Bus',
      description: 'Bus intercity et autocars — ne perdez plus jamais vos bagages en voyage.',
      image: '/images/landing-v2/transport-bus.jpg',
      stat: '200K trajets/jour',
      icon: Bus,
    },
  ];

  return (
    <section className="py-28 lg:py-36 px-5 bg-gradient-to-b from-white via-slate-50/50 to-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5">
            <Globe className="w-3.5 h-3.5" />
            Tous les modes de transport
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-[-0.02em]">
            Une protection pour tous vos voyages
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Avion, train, bateau, bus — QRBag vous suit partout.
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {modes.map((mode, i) => (
            <FadeIn key={mode.title} delay={i * 0.1}>
              <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 hover:-translate-y-1">
                {/* Image - portrait ~3:4 ratio, dominant */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={mode.image}
                    alt={mode.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  {/* Icon badge */}
                  <div className="absolute top-3 left-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm">
                    <mode.icon className="w-4 h-4 text-slate-700" />
                  </div>
                </div>

                {/* Content below image - minimal */}
                <div className="p-4">
                  <h3 className="text-sm font-bold text-slate-900">{mode.title}</h3>
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
   POURQUOI QRBAG (Premium Cards)
   ══════════════════════════════════════════════ */
function WhyQRBagSection() {
  const cards = [
    {
      icon: Globe,
      title: 'Ancré en Afrique, pensé pour le monde',
      description: 'Né à Dakar, déployé dans 15 pays. QRBag comprend les réalités du voyage africain et international avec une solution adaptée à chaque contexte.',
      bgColor: 'bg-blue-600',
      iconBg: 'bg-blue-500',
    },
    {
      icon: Shield,
      title: 'Sécurité certifiée RGPD',
      description: 'Zéro donnée sensible stockée publiquement. Vos informations personnelles sont chiffrées et protégées selon les normes européennes les plus strictes.',
      bgColor: 'bg-orange-500',
      iconBg: 'bg-orange-400',
    },
    {
      icon: Heart,
      title: 'Pour les pèlerins, les voyageurs, les agences',
      description: "Hajj, Omra, tourisme, affaires — une seule solution qui s'adapte à chaque voyageur. Plus de 10 000 bagages déjà protégés à travers le monde.",
      bgColor: 'bg-emerald-600',
      iconBg: 'bg-emerald-500',
    },
  ];

  return (
    <section className="py-28 lg:py-36 px-5 bg-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5">
            <BadgeCheck className="w-3.5 h-3.5" />
            Pourquoi QRBag
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.08]">
            La confiance, au-delà<br className="hidden sm:block" /> des frontières
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Une technologie conçue avec soin pour servir les voyageurs les plus exigeants.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <FadeIn key={card.title} delay={i * 0.12}>
              <div className={`group h-full ${card.bgColor} rounded-[2rem] p-9 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-1.5`}>
                <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center mb-7`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 leading-snug">
                  {card.title}
                </h3>
                <p className="text-[15px] text-white/80 leading-relaxed">
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
   SOLUTIONS (Modern Cards with Gradients)
   ══════════════════════════════════════════════ */
function SolutionsSection() {
  const solutions = [
    {
      title: 'Hajj & Omra',
      description: 'Protection complète pour les pèlerins avec 3 bagages inclus (cabine + 2 soutes). Gérée par votre agence de voyage partenaire.',
      icon: Shield,
      href: '/hajj-omra',
      bgColor: 'bg-amber-500',
      iconBg: 'bg-amber-400',
    },
    {
      title: 'Voyageurs Standard',
      description: 'Protection flexible pour tous vos voyages. Choisissez 1 ou 3 bagages avec une durée adaptée à vos besoins.',
      icon: Plane,
      href: '/voyageurs-standard',
      bgColor: 'bg-blue-600',
      iconBg: 'bg-blue-500',
    },
    {
      title: 'Devenir Partenaire',
      description: 'Agences de voyage, compagnies aériennes, hôtels — proposez QRBag à vos clients et générez des revenus complémentaires.',
      icon: Users,
      href: '/devenir-partenaire',
      bgColor: 'bg-violet-600',
      iconBg: 'bg-violet-500',
    },
  ];

  return (
    <section className="py-28 lg:py-36 px-5 bg-slate-50/60" id="solutions">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5">
            <Luggage className="w-3.5 h-3.5" />
            Solutions
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-[-0.02em]">
            Deux solutions, une protection
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Que vous soyez pèlerin ou voyageur, QRBag s&apos;adapte à vos besoins avec des solutions sur mesure.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {solutions.map((sol, i) => (
            <FadeIn key={sol.title} delay={i * 0.12}>
              <Link href={sol.href} className="group block h-full">
                <div className={`h-full ${sol.bgColor} rounded-[2rem] p-9 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-1.5`}>
                  <div className={`w-14 h-14 rounded-2xl ${sol.iconBg} flex items-center justify-center mb-7`}>
                    <sol.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{sol.title}</h3>
                  <p className="text-[15px] text-white/80 leading-relaxed mb-8">{sol.description}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-white/90 transition-colors duration-300">
                    En savoir plus
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  </span>
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
   STATS SECTION (Animated Dark)
   ══════════════════════════════════════════════ */
function StatsSection() {
  const stats = [
    { value: 10000, suffix: '+', label: 'Bagages protégés' },
    { value: 15, suffix: '', label: 'Pays couverts' },
    { value: 98, suffix: '%', label: 'Taux de récupération' },
    { value: 0, suffix: '24/7', label: 'Disponibilité' },
  ];

  return (
    <section className="py-24 lg:py-28 px-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/8 rounded-full blur-[120px]" />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
          {stats.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1}>
              <div className="text-center group">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-[-0.02em] group-hover:text-blue-400 transition-colors duration-500">
                  {stat.suffix === '24/7' ? '24/7' : <AnimatedCounter target={stat.value} suffix={stat.suffix} />}
                </div>
                <div className="text-sm text-slate-500 font-medium tracking-wide">{stat.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   COMMENT ÇA MARCHE (Timeline)
   ══════════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      image: '/images/landing-v2/step-receive.jpg',
      title: 'Recevez votre QR',
      description: 'Commandez vos QR codes via notre formulaire B2B ou auprès de votre agence partenaire.',
    },
    {
      step: '02',
      image: '/images/landing-v2/step-activate.jpg',
      title: 'Activez en 30 secondes',
      description: 'Scannez le QR code et remplissez le formulaire avec vos informations de voyage.',
    },
    {
      step: '03',
      image: '/images/landing-v2/step-travel.jpg',
      title: 'Voyagez serein',
      description: 'Vos bagages sont protégés. Collez simplement l\'autocollant bien visible sur chaque valise.',
    },
    {
      step: '04',
      image: '/images/landing-v2/step-notify.jpg',
      title: 'Soyez notifié instantanément',
      description: 'Si quelqu\'un trouve votre bagage, vous recevez une alerte immédiatement via WhatsApp.',
    },
  ];

  return (
    <section className="py-28 lg:py-36 px-5 bg-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5">
            <Zap className="w-3.5 h-3.5" />
            Comment ça marche
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-[-0.02em]">
            La protection en 4 étapes
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Simple, rapide, sans application à installer.
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <FadeIn key={step.step} delay={i * 0.1}>
              <div className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 hover:-translate-y-1">
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  {/* Step number */}
                  <span className="absolute top-3 right-3 w-9 h-9 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center shadow-lg">
                    {step.step}
                  </span>
                </div>

                {/* Content */}
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
   TESTIMONIALS (Modern Quotes)
   ══════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Fatou Diallo',
      role: 'Pèlerine Hajj 2025',
      content: "Grâce à QRBag, j'ai retrouvé ma valise à Djeddah en moins de 2 heures. Une invention géniale qui devrait être obligatoire pour tous les pèlerins.",
      avatar: 'FD',
      rating: 5,
    },
    {
      name: 'Marc Dupont',
      role: 'Voyageur fréquent',
      content: "Simple, efficace et pas cher. J'ai utilisé QRBag pour tous mes voyages cette année. Plus de stress à l'aéroport, enfin !",
      avatar: 'MD',
      rating: 5,
    },
    {
      name: 'Amina Benali',
      role: 'Directrice agence de voyage',
      content: "Nous avons adopté QRBag pour tous nos pèlerins. Le taux de perte de bagages a chuté de 90%. Nos clients sont ravis.",
      avatar: 'AB',
      rating: 5,
    },
  ];

  return (
    <section className="py-28 lg:py-36 px-5 bg-gradient-to-b from-white via-slate-50/50 to-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5">
            <Star className="w-3.5 h-3.5" />
            Témoignages
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-[-0.02em]">
            Ils nous font confiance
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.12}>
              <div className="h-full bg-white border border-slate-100/80 rounded-[2rem] p-8 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] transition-all duration-500 group">
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-[15px] leading-[1.7] mb-8">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="flex items-center gap-3.5 pt-6 border-t border-slate-100">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-lg">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{t.role}</p>
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
   PRICING SECTION (Premium Cards)
   ══════════════════════════════════════════════ */
function PricingSection() {
  const plans = [
    {
      name: 'Solo',
      price: '5',
      period: '/an',
      description: 'Idéal pour un voyage ponctuel',
      features: ['1 bagage protégé', 'Activation en 30 secondes', 'Notifications WhatsApp', 'Géolocalisation temps réel'],
      popular: false,
      href: '/voyageurs-standard',
    },
    {
      name: 'Famille',
      price: '12',
      period: '/an',
      description: 'Pour les familles ou voyageurs fréquents',
      features: ['3 bagages protégés', 'Activation en 30 secondes', 'Notifications WhatsApp', 'Géolocalisation temps réel', 'Support prioritaire'],
      popular: true,
      href: '/voyageurs-standard',
    },
    {
      name: 'Hajj & Omra',
      price: '15',
      period: '/pèlerin',
      description: 'Protection complète pour les pèlerins',
      features: ['3 bagages inclus', 'Géré par votre agence', 'Notifications WhatsApp', 'Support 24/7 dédié', 'Couverture internationale'],
      popular: false,
      href: '/hajj-omra',
    },
  ];

  return (
    <section className="py-28 lg:py-36 px-5 bg-white" id="tarifs">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5">
            <Luggage className="w-3.5 h-3.5" />
            Tarifs
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-[-0.02em]">
            Protégez vos bagages à partir de 5€
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Des prix simples et transparents. Pas de frais cachés.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.12}>
              <div className={`relative h-full rounded-[2rem] p-9 transition-all duration-500 hover:-translate-y-2 ${
                plan.popular
                  ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.25)] scale-[1.03] border-0'
                  : 'bg-white border border-slate-100/80 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]'
              }`}>
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shadow-blue-500/30">
                    Populaire
                  </span>
                )}
                <h3 className={`text-lg font-bold mb-1.5 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className={`text-5xl font-bold tracking-[-0.02em] ${plan.popular ? 'text-white' : 'text-slate-900'}`}>{plan.price}€</span>
                  <span className={`text-sm ${plan.popular ? 'text-slate-500' : 'text-slate-400'}`}>{plan.period}</span>
                </div>
                <ul className="space-y-3.5 mb-9">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-cyan-400' : 'text-emerald-500'}`} />
                      <span className={plan.popular ? 'text-slate-300' : 'text-slate-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button className={`w-full py-3.5 rounded-full font-semibold text-sm transition-all duration-300 hover:scale-[1.02] ${
                    plan.popular
                      ? 'bg-white text-slate-900 hover:bg-slate-50 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.3)]'
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.12)]'
                  }`}>
                    Choisir {plan.name}
                    <ArrowRight className="w-4 h-4 ml-1" />
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
   FINAL CTA SECTION (Cinematic)
   ══════════════════════════════════════════════ */
function FinalCTASection() {
  return (
    <section className="py-28 lg:py-36 px-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-500/8 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-500/6 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] bg-cyan-500/6 rounded-full blur-[100px]" />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <FadeIn>
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-400 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Prêt à voyager serein ?
          </span>
        </FadeIn>
        <FadeIn delay={0.15}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-8 tracking-[-0.02em] leading-[1.08]">
            Rejoignez 10 000+ voyageurs qui protègent leurs bagages
          </h2>
        </FadeIn>
        <FadeIn delay={0.3}>
          <p className="text-lg text-slate-500 mb-12 leading-relaxed">
            Activation en 30 secondes, tranquillité pour tous vos voyages.
          </p>
        </FadeIn>
        <FadeIn delay={0.45}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-full font-semibold text-base shadow-[0_20px_40px_-8px_rgba(255,255,255,0.15)] hover:scale-[1.03] transition-all duration-300 gap-2.5 h-14">
                Commander maintenant
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/devenir-partenaire">
              <Button className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] hover:border-white/[0.2] text-white px-8 py-4 rounded-full font-semibold text-base backdrop-blur-sm transition-all duration-300 h-14 hover:scale-[1.03]">
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
   CONTACT CTA (Minimal)
   ══════════════════════════════════════════════ */
function ContactCTASection() {
  return (
    <section className="py-20 px-5 bg-white">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="bg-gradient-to-br from-slate-50 to-slate-50/50 rounded-[2rem] p-10 lg:p-14 flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-100/80">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Besoin d&apos;aide ?</h3>
                <p className="text-sm text-slate-500 mt-0.5">Notre équipe est disponible 24/7 pour vous accompagner.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/contact">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold text-sm shadow-[0_16px_32px_-8px_rgba(0,0,0,0.15)] hover:scale-[1.02] transition-all duration-300 gap-2 px-6 h-11">
                  <Mail className="w-4 h-4" />
                  Nous contacter
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   FOOTER (Dark Premium)
   ══════════════════════════════════════════════ */
function Footer() {
  const columns = [
    {
      title: 'Produit',
      links: [
        { label: 'Solutions', href: '/#solutions' },
        { label: 'Comment ça marche', href: '/#comment' },
        { label: 'Tarifs', href: '/#tarifs' },
        { label: 'Démo', href: '/demo' },
      ],
    },
    {
      title: 'Entreprise',
      links: [
        { label: 'À propos', href: '/a-propos' },
        { label: 'Partenaires', href: '/devenir-partenaire' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Légal',
      links: [
        { label: 'Mentions légales', href: '/mentions-legales' },
        { label: 'Confidentialité', href: '/confidentialite' },
        { label: 'CGU', href: '/cgu' },
      ],
    },
    {
      title: 'Contact',
      links: [
        { label: 'Email', href: '/contact' },
      ],
    },
  ];

  return (
    <footer className="bg-slate-950 pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-5">
              <img src="/logo.png" alt="QRBag" className="h-11 w-auto object-contain" />
            </div>
            <p className="text-base leading-relaxed max-w-xs text-white/70 mb-7">
              Protection intelligente des bagages pour voyageurs et pèlerins.
            </p>
            {/* Social */}
            <div className="flex items-center gap-2.5">
              {[
                { icon: Facebook, href: 'https://facebook.com/qrbag', label: 'Facebook' },
                { icon: Instagram, href: 'https://instagram.com/qrbag', label: 'Instagram' },
                { icon: Twitter, href: 'https://twitter.com/qrbag', label: 'Twitter' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/[0.05] hover:bg-white/[0.1] rounded-xl flex items-center justify-center transition-all duration-300" aria-label={s.label}>
                  <s.icon className="w-5 h-5 text-white/60 hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {columns.map(col => (
            <div key={col.title}>
              <h4 className="text-sm font-bold tracking-[0.1em] uppercase text-white/90 mb-5">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-base text-white/70 hover:text-white transition-colors duration-300">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-20 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/60">
            &copy; {new Date().getFullYear()} QRBag. Tous droits réservés.
          </p>
          <p className="text-sm text-white/50">
            Fait avec soin à Dakar, pour le monde.
          </p>
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
