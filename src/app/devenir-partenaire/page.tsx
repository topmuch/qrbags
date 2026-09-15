'use client';

import { useState } from 'react';
import PublicLayout from '@/components/public/PublicLayout';
import {
  brandBadge,
  brandBtnGradient,
  brandInput,
  BrandCard,
} from '@/components/brand/BrandShell';
import {
  CheckCircle,
  Send
} from "lucide-react";

// Hero Section — bandeau navy étiquette QRBag
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0e1734] to-[#16234e]">
      {/* Liseré dégradé signature + texture pointillée + halos */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-qrbag" aria-hidden />
      <div className="absolute inset-0 dotted-map-light opacity-60 pointer-events-none" aria-hidden />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#e6216e]/15 rounded-full blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#2f9bff]/15 rounded-full blur-3xl pointer-events-none" aria-hidden />

      <div className="max-w-4xl mx-auto text-center relative z-10 px-4 py-20">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className={brandBadge}>🤝 Partenaires</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Devenez partenaire <span className="text-gradient-qrbag">QRBag</span>
        </h1>

        <p className="text-white/70 max-w-2xl mx-auto mb-8 text-lg">
          Rejoignez plus de 500 agences de voyage et organisateurs de Hajj qui protègent déjà les bagages de leurs clients avec nos QR codes intelligents.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#formulaire"
            className={`${brandBtnGradient} px-8 py-4 text-lg min-h-[52px] inline-flex items-center justify-center gap-2`}
          >
            📩 Demander un devis
          </a>
          <a
            href="#avantages"
            className="border-2 border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/50 transition-all min-h-[52px] inline-flex items-center justify-center gap-2"
          >
            📊 Voir les avantages
          </a>
        </div>
      </div>
    </section>
  );
}

// Why Partner Section
function WhyPartnerSection() {
  const cards = [
    {
      title: "Revenus supplémentaires",
      desc: "Gagnez jusqu'à 3€ par QR code vendu — sans investissement.",
      icon: "💰",
      pill: "bg-[#f8921f]/15"
    },
    {
      title: "Service clé en main",
      desc: "Nous fournissons les QR codes, le dashboard, le support 24/7.",
      icon: "🛠️",
      pill: "bg-[#2f9bff]/10"
    },
    {
      title: "Confiance renforcée",
      desc: "Vos clients retrouvent leurs bagages en moins de 2h — votre réputation s'élève.",
      icon: "⭐",
      pill: "bg-[#e6216e]/10"
    }
  ];

  return (
    <section id="avantages" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gradient-qrbag mb-4">
            Pourquoi collaborer avec nous ?
          </h2>
          <p className="text-[#16234e]/70 text-lg">
            Trois raisons de devenir partenaire QRBag
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className="relative bg-white p-6 rounded-3xl border border-[#16234e]/10 shadow-xl shadow-[#16234e]/5 hover:shadow-2xl hover:shadow-[#16234e]/10 hover:-translate-y-1 gradient-ring transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl ${card.pill} flex items-center justify-center mb-4 text-3xl group-hover:scale-110 transition-transform`}>
                <span aria-hidden>{card.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-[#16234e] mb-2">{card.title}</h3>
              <p className="text-[#16234e]/70">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Who Can Partner Section
function WhoCanPartnerSection() {
  const partners = [
    { icon: "✈️", label: "Agences de voyages (Hajj, Omra, tourisme)" },
    { icon: "🕋", label: "Tour-opérateurs" },
    { icon: "🤝", label: "Organisateurs de pèlerinage" },
    { icon: "🛫", label: "Compagnies aériennes (B2B)" },
    { icon: "🕌", label: "Associations religieuses" },
  ];

  return (
    <section className="py-20 px-4 bg-[#f6f9ff]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gradient-qrbag mb-4">
            Qui peut devenir partenaire ?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {partners.map((partner, i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-[#16234e]/10 shadow-md shadow-[#16234e]/5 hover:shadow-lg hover:shadow-[#16234e]/10 hover:-translate-y-0.5 transition-all"
            >
              <span className="text-3xl" aria-hidden>{partner.icon}</span>
              <span className="text-[#16234e] font-medium">{partner.label}</span>
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
      name: "Amadou Diallo",
      role: "Directeur, Pèlerins du Sénégal",
      text: "QRBag a réduit de 90% les pertes de bagages lors du Hajj 2025. Un service révolutionnaire.",
      avatar: "AD"
    },
    {
      name: "Sophie Martin",
      role: "Responsable client, Voyage Senegal",
      text: "Simple, efficace et pas cher. Nos clients adorent la notification WhatsApp instantanée.",
      avatar: "SM"
    }
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gradient-qrbag mb-12">
          Ce que disent nos partenaires
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl border border-[#16234e]/10 shadow-xl shadow-[#16234e]/5 hover:shadow-2xl hover:shadow-[#16234e]/10 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-qrbag flex items-center justify-center text-white font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-[#16234e]">{t.name}</div>
                  <div className="text-[#16234e]/60 text-sm">{t.role}</div>
                </div>
              </div>
              <p className="text-[#16234e]/80 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex gap-1 mt-4" aria-hidden>
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-[#f8921f]">★</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact Form Section
function ContactFormSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'partenaire',
          senderName: formData.name,
          senderEmail: formData.email,
          content: {
            agence: formData.company,
            message: formData.message,
          },
        }),
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="formulaire" className="relative overflow-hidden bg-[#16234e] py-20 px-4">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-qrbag" aria-hidden />
      <div className="absolute inset-0 dotted-map-light opacity-60 pointer-events-none" aria-hidden />

      <div className="relative max-w-2xl mx-auto">
        <BrandCard corners className="p-8">
          <h3 className="text-2xl font-bold text-[#16234e] mb-2">Prêt à booster votre offre ?</h3>
          <p className="text-[#16234e]/70 mb-8">
            Remplissez ce formulaire — nous vous répondrons sous 24h avec un devis personnalisé.
          </p>

          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-[#2f9bff] mx-auto mb-4" aria-hidden />
              <h4 className="text-xl font-semibold text-[#16234e] mb-2">Demande envoyée !</h4>
              <p className="text-[#16234e]/70">Nous vous contacterons sous 24h avec votre devis personnalisé.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Votre nom"
                aria-label="Votre nom"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={brandInput}
                required
              />
              <input
                type="email"
                placeholder="Votre email"
                aria-label="Votre email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={brandInput}
                required
              />
              <input
                type="text"
                placeholder="Votre agence / entreprise"
                aria-label="Votre agence ou entreprise"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className={brandInput}
                required
              />
              <textarea
                placeholder="Message (ex: nombre de pèlerins, pays, besoins...)"
                aria-label="Votre message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={`${brandInput} resize-none`}
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className={`${brandBtnGradient} w-full py-4 text-lg min-h-[52px] inline-flex items-center justify-center gap-2`}
              >
                <Send className="w-5 h-5" aria-hidden />
                Envoyer ma demande
              </button>
            </form>
          )}
        </BrandCard>
      </div>
    </section>
  );
}

// Main Page Component
export default function DevenirPartenairePage() {
  return (
    <PublicLayout>
      <HeroSection />
      <WhyPartnerSection />
      <WhoCanPartnerSection />
      <TestimonialsSection />
      <ContactFormSection />
    </PublicLayout>
  );
}
