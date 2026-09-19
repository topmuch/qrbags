'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';

/**
 * Chat anonyme — côté PROPRIÉTAIRE (page de suivi /suivi/[reference]).
 * Le propriétaire répond aux messages du trouveur. Son numéro n'apparaît
 * jamais ; seul son pseudo « Propriétaire » est visible côté trouveur.
 *
 * Polling HTTP 8 s + badge de messages non-lus (marqués lus seulement si
 * l'onglet est visible).
 */

interface ChatMessage {
  id: string;
  sender: 'finder' | 'owner';
  senderLabel: string | null;
  body: string;
  createdAt: string;
}

const BRAND_NAVY = '#16234e';
const BRAND_AZURE = '#2f9bff';

export default function OwnerChat({ reference }: { reference: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCountRef = useRef(0);

  const fetchThread = useCallback(async () => {
    try {
      const visible = typeof document !== 'undefined' && document.visibilityState === 'visible';
      const res = await fetch(
        `/api/suivi/${encodeURIComponent(reference)}/chat?read=${visible ? '1' : '0'}`,
        { cache: 'no-store' }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
        setUnread(typeof data.unread === 'number' ? data.unread : 0);
      }
    } catch {
      // silencieux — le polling retentera
    }
  }, [reference]);

  useEffect(() => {
    fetchThread();
    pollRef.current = setInterval(fetchThread, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchThread]);

  // Scroll auto seulement quand le nombre de messages change
  useEffect(() => {
    if (messages.length !== lastCountRef.current) {
      lastCountRef.current = messages.length;
      requestAnimationFrame(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/suivi/${encodeURIComponent(reference)}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        setDraft('');
        await fetchThread();
      }
    } catch {
      // silencieux
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#16234e]/10 shadow-xl shadow-[#16234e]/5 p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2"
        aria-expanded={open}
      >
        <h2 className="text-xs uppercase tracking-widest text-[#16234e] font-bold flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#2f9bff]" aria-hidden />
          Messages du trouveur
        </h2>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <span
              className="text-[10px] font-bold text-white px-2 py-1 rounded-full"
              style={{ backgroundColor: BRAND_AZURE }}
            >
              {unread} non lu{unread > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-[#16234e]/50 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      <p className="text-[11px] text-[#16234e]/50 mt-1.5">
        Répondez au trouveur ici — votre numéro n&apos;apparaît jamais.
      </p>

      {open && (
        <div className="mt-3 -mx-1">
          {/* Fil de discussion */}
          <div ref={listRef} className="h-56 overflow-y-auto p-3 space-y-2 bg-[#f7f9fc] rounded-2xl chat-scroll">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-1 px-6">
                <MessageCircle className="w-8 h-8 text-[#16234e]/20" aria-hidden />
                <p className="text-xs text-[#16234e]/50 font-medium">
                  Aucun message du trouveur pour le moment.
                </p>
                <p className="text-[11px] text-[#16234e]/40">
                  S&apos;il vous écrit via l&apos;étiquette, son message apparaîtra ici.
                </p>
              </div>
            ) : (
              messages.map((m) =>
                m.sender === 'finder' ? (
                  <div key={m.id} className="flex justify-start">
                    <div
                      className="max-w-[80%] rounded-2xl rounded-bl-md px-3 py-2"
                      style={{ backgroundColor: BRAND_NAVY }}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-[#2f9bff]">
                        Trouveur {m.senderLabel ? `· ${m.senderLabel}` : '(anonyme)'}
                      </p>
                      <p className="text-sm text-white break-words">{m.body}</p>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex justify-end">
                    <div
                      className="max-w-[80%] rounded-2xl rounded-br-md px-3 py-2"
                      style={{ backgroundColor: BRAND_AZURE }}
                    >
                      <p className="text-xs font-bold mb-0.5 text-white/90">Vous</p>
                      <p className="text-sm text-white break-words">{m.body}</p>
                    </div>
                  </div>
                )
              )
            )}
          </div>

          {/* Composer */}
          <div className="mt-2 flex items-center gap-2">
            <label htmlFor={`owner-chat-input-${reference}`} className="sr-only">
              Votre réponse
            </label>
            <input
              id={`owner-chat-input-${reference}`}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Répondez au trouveur…"
              className="flex-1 min-h-[44px] px-3 text-sm rounded-xl border-2 border-[#16234e]/15 bg-white text-[#16234e] placeholder:text-[#16234e]/35 focus:outline-none focus:border-[#2f9bff] transition-all"
              maxLength={1000}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !draft.trim()}
              aria-label="Envoyer la réponse"
              className="h-11 px-4 shrink-0 rounded-xl bg-gradient-qrbag text-white flex items-center justify-center gap-1.5 text-sm font-bold disabled:opacity-40 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" aria-hidden />
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
