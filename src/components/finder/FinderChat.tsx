'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mail, MessageCircle, Send, ShieldCheck, X } from 'lucide-react';

/**
 * Chat anonyme trouveur ↔ propriétaire (comme QRTags, aux couleurs QRBags).
 * Le trouveur discute via la référence scannée — son numéro n'est JAMAIS
 * transmis (pas de champ téléphone ici). Le pseudo est optionnel et éditable.
 * L'e-mail est OPTIONNEL : sert uniquement à recevoir une notification quand
 * le propriétaire répond. Jamais visible par le propriétaire.
 *
 * Polling HTTP 5 s (pas de websocket — simple et robuste).
 */

interface ChatMessage {
  id: string;
  sender: 'finder' | 'owner';
  senderLabel: string | null;
  body: string;
  createdAt: string;
}

interface FinderChatProps {
  reference: string;
  /** Prénom saisi dans le formulaire du trouveur (utilisé comme pseudo) */
  defaultName?: string;
  /** Callback appelé quand l'utilisateur ferme le chat */
  onClose?: () => void;
}

const NOTIFY_EMAIL_KEY = 'qrbags_finder_notify_email';

const BRAND_NAVY = '#16234e';
const BRAND_AZURE = '#2f9bff';

export default function FinderChat({ reference, defaultName, onClose }: FinderChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [label, setLabel] = useState(defaultName || '');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/scan/${encodeURIComponent(reference)}/chat`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
        setError(null);
      }
    } catch {
      // silencieux — le polling retentera
    } finally {
      setLoading(false);
    }
  }, [reference]);

  // Chargement initial + polling 5 s
  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  useEffect(scrollToBottom, [messages.length, scrollToBottom]);

  // Restauration depuis le formulaire ou localStorage
  useEffect(() => {
    if (defaultName) setLabel(defaultName);
  }, [defaultName]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTIFY_EMAIL_KEY);
      if (saved) setNotifyEmail(saved);
    } catch {
      /* localStorage indisponible */
    }
  }, []);

  const handleEmailChange = (value: string) => {
    const v = value.slice(0, 100);
    setNotifyEmail(v);
    try {
      if (v) localStorage.setItem(NOTIFY_EMAIL_KEY, v);
      else localStorage.removeItem(NOTIFY_EMAIL_KEY);
    } catch {
      /* localStorage indisponible */
    }
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/scan/${encodeURIComponent(reference)}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: text,
          senderLabel: label.trim() || undefined,
          notifyEmail: notifyEmail.trim() || undefined,
        }),
      });
      if (res.ok) {
        setDraft('');
        await fetchMessages();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Envoi impossible, réessayez.');
      }
    } catch {
      setError('Envoi impossible, vérifiez votre connexion.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="bg-white rounded-3xl border border-[#16234e]/10 shadow-xl shadow-[#16234e]/5 overflow-hidden"
      role="region"
      aria-label="Discussion anonyme avec le propriétaire"
    >
      {/* Bandeau navy */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-3"
        style={{ backgroundColor: BRAND_NAVY }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className="w-5 h-5 shrink-0 text-white" aria-hidden />
          <span className="font-bold text-sm text-white">
            Discussion anonyme
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-white/10 text-white/90 whitespace-nowrap"
            title="Votre numéro n'est jamais transmis"
          >
            <ShieldCheck className="w-3 h-3" aria-hidden />
            Coordonnées masquées
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le chat"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* Fil de discussion */}
      <div ref={listRef} className="h-64 overflow-y-auto p-3 space-y-2 bg-[#f7f9fc] chat-scroll">
        {loading && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#16234e]/40">
            Chargement de la discussion…
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-1 px-6">
            <MessageCircle className="w-8 h-8 text-[#16234e]/20" aria-hidden />
            <p className="text-xs text-[#16234e]/50 font-medium">
              Aucun message pour le moment.
            </p>
            <p className="text-[11px] text-[#16234e]/40">
              Écrivez au propriétaire sans donner votre numéro : il vous répondra ici.
            </p>
          </div>
        ) : (
          messages.map((m) =>
            m.sender === 'finder' ? (
              <div key={m.id} className="flex justify-end">
                <div
                  className="max-w-[80%] rounded-2xl rounded-br-md px-3 py-2"
                  style={{ backgroundColor: BRAND_AZURE }}
                >
                  <p className="text-xs font-bold mb-0.5 text-white/90">
                    {m.senderLabel || 'Vous'}
                  </p>
                  <p className="text-sm text-white break-words">{m.body}</p>
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex justify-start">
                <div
                  className="max-w-[80%] rounded-2xl rounded-bl-md px-3 py-2"
                  style={{ backgroundColor: BRAND_NAVY }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-[#2f9bff]">
                    Propriétaire
                  </p>
                  <p className="text-sm text-white break-words">{m.body}</p>
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* Pseudo + e-mail optionnels */}
      <div className="px-3 pt-2 space-y-2">
        <label htmlFor={`chat-label-${reference}`} className="sr-only">
          Votre prénom (optionnel)
        </label>
        <input
          id={`chat-label-${reference}`}
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value.slice(0, 40))}
          placeholder="Votre prénom (optionnel)"
          className="w-full min-h-[40px] px-3 text-sm rounded-xl border-2 border-[#16234e]/15 bg-white text-[#16234e] placeholder:text-[#16234e]/35 focus:outline-none focus:ring-4 focus:ring-[#2f9bff]/15 focus:border-[#2f9bff] transition-all"
          maxLength={40}
        />
        <div>
          <label htmlFor={`chat-email-${reference}`} className="sr-only">
            Votre e-mail pour être notifié d&apos;une réponse (optionnel)
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#16234e]/30 pointer-events-none" aria-hidden />
            <input
              id={`chat-email-${reference}`}
              type="email"
              value={notifyEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="E-mail pour être notifié d'une réponse (optionnel)"
              className="w-full min-h-[40px] pl-9 pr-3 text-sm rounded-xl border-2 border-[#16234e]/15 bg-white text-[#16234e] placeholder:text-[#16234e]/35 focus:outline-none focus:ring-4 focus:ring-[#2f9bff]/15 focus:border-[#2f9bff] transition-all"
              maxLength={100}
            />
          </div>
          <p className="text-[10px] text-[#16234e]/40 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 shrink-0" aria-hidden />
            Jamais visible par le propriétaire — sert uniquement à vous prévenir d&apos;une réponse.
          </p>
        </div>
      </div>

      {/* Composer */}
      <div className="p-3 flex items-center gap-2">
        <label htmlFor={`chat-input-${reference}`} className="sr-only">
          Votre message
        </label>
        <input
          id={`chat-input-${reference}`}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Écrivez votre message…"
          className="flex-1 min-h-[44px] px-3 text-sm rounded-xl border-2 border-[#16234e]/15 bg-white text-[#16234e] placeholder:text-[#16234e]/35 focus:outline-none focus:border-[#2f9bff] transition-all"
          maxLength={1000}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          aria-label="Envoyer le message"
          className="w-11 h-11 shrink-0 rounded-xl bg-gradient-qrbag text-white flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95"
        >
          <Send className="w-5 h-5" aria-hidden />
        </button>
      </div>

      {error && (
        <p className="px-3 pb-2 text-[11px] font-semibold text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
