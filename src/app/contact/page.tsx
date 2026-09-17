'use client';

import { useState } from 'react';
import PublicLayout from '@/components/public/PublicLayout';
import {
  brandBadge,
  brandBtnGradient,
  brandBtnNavy,
  brandInput,
  brandLabel,
  BrandCard,
} from '@/components/brand/BrandShell';
import {
  Mail,
  Phone,
  MapPinned,
  Navigation,
  CheckCircle,
  Clock,
  MessageCircle
} from "lucide-react";

function ContactContent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
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
          type: 'contact',
          senderName: formData.name,
          senderEmail: formData.email,
          content: { subject: formData.subject, message: formData.message },
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
    <>
      {/* Hero section — bandeau navy étiquette QRBags */}
      <section className="relative overflow-hidden bg-[#16234e] text-center">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-qrbag" aria-hidden />
        <div className="absolute inset-0 dotted-map-light opacity-60 pointer-events-none" aria-hidden />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#e6216e]/20 blur-[110px] pointer-events-none" aria-hidden />
        <div className="absolute -bottom-28 -left-24 w-80 h-80 rounded-full bg-[#2f9bff]/15 blur-[110px] pointer-events-none" aria-hidden />

        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-20">
          <span className={brandBadge}>Contact</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 mt-6">
            Contactez-nous
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-xl leading-relaxed">
            Une question ? Un projet ? Notre équipe est là pour vous accompagner.
          </p>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Informations de contact */}
            <div>
              <h2 className="text-2xl font-bold text-[#16234e] mb-8">Nos coordonnées</h2>

              <div className="space-y-6">
                {/* Adresse */}
                <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-[#16234e]/10 shadow-lg shadow-[#16234e]/5 hover:shadow-xl hover:shadow-[#16234e]/10 hover:-translate-y-0.5 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-[#8b17c9]/10 flex items-center justify-center shrink-0">
                    <MapPinned className="w-6 h-6 text-[#8b17c9]" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-[#16234e]">Adresse</h3>
                    <p className="text-[#16234e]/70">43 Rue Maryse Bastié</p>
                    <p className="text-[#16234e]/70">78300 Poissy, France</p>
                  </div>
                </div>

                {/* Téléphone */}
                <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-[#16234e]/10 shadow-lg shadow-[#16234e]/5 hover:shadow-xl hover:shadow-[#16234e]/10 hover:-translate-y-0.5 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-[#2f9bff]/10 flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-[#2f9bff]" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-[#16234e]">Téléphone</h3>
                    <a href="tel:+33745349339" className="text-[#16234e]/70 hover:text-[#2f9bff] transition-colors">
                      +33 7 45 34 93 39
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-[#16234e]/10 shadow-lg shadow-[#16234e]/5 hover:shadow-xl hover:shadow-[#16234e]/10 hover:-translate-y-0.5 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-[#f8921f]/15 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-[#f8921f]" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-[#16234e]">Email</h3>
                    <a href="mailto:contact@qrbags.com" className="text-[#16234e]/70 hover:text-[#f8921f] transition-colors">
                      contact@qrbags.com
                    </a>
                  </div>
                </div>

                {/* Horaires */}
                <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-[#16234e]/10 shadow-lg shadow-[#16234e]/5 hover:shadow-xl hover:shadow-[#16234e]/10 hover:-translate-y-0.5 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-[#e6216e]/10 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-[#e6216e]" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-[#16234e]">Horaires</h3>
                    <p className="text-[#16234e]/70">Lundi - Vendredi : 9h - 18h</p>
                    <p className="text-[#16234e]/70">Support 24/7 pour les urgences</p>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-[#16234e]/10 shadow-lg shadow-[#16234e]/5 hover:shadow-xl hover:shadow-[#16234e]/10 hover:-translate-y-0.5 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-[#8b17c9]/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-6 h-6 text-[#8b17c9]" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-[#16234e]">WhatsApp</h3>
                    <a
                      href="https://wa.me/33745349339"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#16234e]/70 hover:text-[#8b17c9] transition-colors"
                    >
                      +33 7 45 34 93 39
                    </a>
                    <p className="text-[#16234e]/60 text-sm mt-1">Réponse rapide garantie</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulaire de contact */}
            <div>
              <h2 className="text-2xl font-bold text-[#16234e] mb-8">Envoyez-nous un message</h2>

              <BrandCard corners className="p-6 sm:p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-20 h-20 text-[#2f9bff] mx-auto mb-6" aria-hidden />
                    <h3 className="text-2xl font-semibold mb-3 text-[#16234e]">Message envoyé !</h3>
                    <p className="text-[#16234e]/70 mb-6">
                      Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: '', email: '', subject: '', message: '' });
                      }}
                      className={`${brandBtnNavy} px-6 py-3 min-h-[48px]`}
                    >
                      Envoyer un autre message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="contact-name" className={brandLabel}>Nom *</label>
                        <input
                          id="contact-name"
                          type="text"
                          placeholder="Votre nom"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={brandInput}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-email" className={brandLabel}>Email *</label>
                        <input
                          id="contact-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={brandInput}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contact-subject" className={brandLabel}>Sujet</label>
                      <input
                        id="contact-subject"
                        type="text"
                        placeholder="Objet de votre message"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className={brandInput}
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-message" className={brandLabel}>Message *</label>
                      <textarea
                        id="contact-message"
                        placeholder="Décrivez votre demande..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className={`${brandInput} resize-none`}
                        style={{ minHeight: '10rem' }}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`${brandBtnGradient} w-full py-4 text-lg min-h-[52px]`}
                    >
                      {submitting ? 'Envoi en cours...' : 'Envoyer le message'}
                    </button>

                    <p className="text-[#16234e]/60 text-sm text-center">
                      Nous répondons généralement sous 24h ouvrées.
                    </p>
                  </form>
                )}
              </BrandCard>
            </div>
          </div>
        </div>
      </section>

      {/* Map section — bandeau navy avec carte Google + itinéraire */}
      <section className="relative overflow-hidden bg-[#16234e] py-16 px-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-qrbag" aria-hidden />
        <div className="absolute inset-0 dotted-map-light opacity-60 pointer-events-none" aria-hidden />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Nous trouver</h2>
          <p className="text-white/70 mb-8">Notre bureau est situé à Poissy, dans les Yvelines (78).</p>

          {/* Carte Google Maps intégrée */}
          <div className="rounded-3xl overflow-hidden border border-white/15 shadow-2xl shadow-black/30 mb-8">
            <iframe
              title="Carte Google Maps — QRBags, 43 Rue Maryse Bastié, 78300 Poissy"
              src="https://www.google.com/maps?q=43%20Rue%20Maryse%20Basti%C3%A9%2C%2078300%20Poissy%2C%20France&output=embed"
              className="w-full h-72 md:h-96 border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=43%20Rue%20Maryse%20Basti%C3%A9%2C%2078300%20Poissy%2C%20France"
              target="_blank"
              rel="noopener noreferrer"
              className={`${brandBtnGradient} inline-flex items-center gap-2 px-6 py-3 min-h-[48px]`}
            >
              <Navigation className="w-5 h-5" aria-hidden />
              Itinéraire
            </a>
            <a
              href="https://maps.google.com/?q=43+Rue+Maryse+Basti%C3%A9+78300+Poissy+France"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-2xl border border-white/25 bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
            >
              <MapPinned className="w-5 h-5" aria-hidden />
              Ouvrir dans Google Maps
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export default function ContactPage() {
  return (
    <PublicLayout>
      <ContactContent />
    </PublicLayout>
  );
}
