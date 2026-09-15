'use client';

import { useState } from 'react';
import { X, Star, Send, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ReviewModalProps {
  show: boolean;
  onClose: () => void;
  reference?: string;
  lang: string;
}

const LABELS: Record<string, { title: string; placeholder: string; submit: string; success: string; error: string; heading: string; name: string; location: string }> = {
  fr: {
    heading: 'Laisser un avis',
    title: 'Titre (optionnel)',
    placeholder: 'Partagez votre expérience avec QRBag...',
    submit: 'Envoyer mon avis',
    success: 'Merci ! Votre avis sera publié après vérification.',
    error: 'Erreur lors de l\'envoi. Réessayez.',
    name: 'Votre nom',
    location: 'Ville / Pays (optionnel)',
  },
  en: {
    heading: 'Leave a review',
    title: 'Title (optional)',
    placeholder: 'Share your experience with QRBag...',
    submit: 'Submit review',
    success: 'Thank you! Your review will be published after verification.',
    error: 'Error submitting. Please try again.',
    name: 'Your name',
    location: 'City / Country (optional)',
  },
  ar: {
    heading: 'اترك تقييم',
    title: 'العنوان (اختياري)',
    placeholder: 'شارك تجربتك مع QRBag...',
    submit: 'إرسال التقييم',
    success: 'شكراً! سيتم نشر تقييمك بعد التحقق.',
    error: 'خطأ في الإرسال. حاول مرة أخرى.',
    name: 'اسمك',
    location: 'المدينة / الدولة (اختياري)',
  },
};

export function ReviewModal({ show, onClose, reference, lang }: ReviewModalProps) {
  const labels = LABELS[lang] || LABELS.fr;
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || rating === 0 || content.trim().length < 10) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim() || undefined,
          rating,
          title: title.trim() || undefined,
          content: content.trim(),
          baggageRef: reference,
          language: lang,
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: labels.success });
      onClose();
      // Reset form
      setName(''); setLocation(''); setRating(0); setTitle(''); setContent('');
    } catch {
      toast({ title: labels.error, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl border border-[#16234e]/10 p-5 max-w-sm w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#16234e]">⭐ {labels.heading}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#16234e]/5 flex items-center justify-center text-[#16234e]" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={labels.name} required className="w-full px-3 py-2.5 bg-white border-2 border-[#16234e]/15 rounded-xl text-sm text-[#16234e] focus:outline-none focus:ring-4 focus:ring-[#2f9bff]/15 focus:border-[#2f9bff] min-h-[44px] transition-all" />

          {/* Location */}
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={labels.location} className="w-full px-3 py-2.5 bg-white border-2 border-[#16234e]/15 rounded-xl text-sm text-[#16234e] focus:outline-none focus:ring-4 focus:ring-[#2f9bff]/15 focus:border-[#2f9bff] min-h-[44px] transition-all" />

          {/* Rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)} className="p-0.5" aria-label={`${star} étoiles`}>
                <Star className={`w-7 h-7 transition-colors ${star <= (hoveredRating || rating) ? 'fill-[#f8921f] text-[#f8921f]' : 'text-[#16234e]/20'}`} />
              </button>
            ))}
            {rating > 0 && <span className="text-xs text-[#16234e]/60 ml-2">{rating}/5</span>}
          </div>

          {/* Title */}
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={labels.title} className="w-full px-3 py-2.5 bg-white border-2 border-[#16234e]/15 rounded-xl text-sm text-[#16234e] focus:outline-none focus:ring-4 focus:ring-[#2f9bff]/15 focus:border-[#2f9bff] min-h-[44px] transition-all" />

          {/* Content */}
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={labels.placeholder} required rows={3} className="w-full px-3 py-2.5 bg-white border-2 border-[#16234e]/15 rounded-xl text-sm text-[#16234e] focus:outline-none focus:ring-4 focus:ring-[#2f9bff]/15 focus:border-[#2f9bff] resize-none transition-all" />

          {/* Submit */}
          <button type="submit" disabled={submitting || !name.trim() || rating === 0 || content.trim().length < 10} className="w-full bg-gradient-qrbag text-white py-3 px-4 rounded-2xl font-bold shadow-lg shadow-[#e6216e]/25 hover:shadow-xl hover:shadow-[#e6216e]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {labels.submit}
          </button>
        </form>
      </div>
    </div>
  );
}