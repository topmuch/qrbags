import type { ReactNode } from 'react';

/* ══════════════════════════════════════════════════════════════
   QRBags — Design system « Étiquette officielle »
   Palette signature (identique à l'étiquette 7×10 cm imprimée) :
     Navy    #16234e  — titres, textes forts
     Azure   #2f9bff  — accents froids, focus
     Orange  #f8921f  — dégradé signature (début)
     Rouge   #ef4036  — dégradé signature
     Magenta #e6216e  — dégradé signature
     Violet  #8b17c9  — dégradé signature (fin)
   Motifs : arcs arc-en-ciel (coins), brackets viewfinder QR,
   fond « carte du monde en pointillés » (dotted-map).
   ══════════════════════════════════════════════════════════════ */

export const BRAND = {
  navy: '#16234e',
  navyHover: '#0f1838',
  azure: '#2f9bff',
  orange: '#f8921f',
  red: '#ef4036',
  magenta: '#e6216e',
  violet: '#8b17c9',
  yellow: '#ffd200',
} as const;

/* ─── Classes utilitaires partagées (tokens d'interface) ─── */

/** Champ de formulaire — bordure navy douce, focus azure */
export const brandInput =
  'w-full bg-white border-2 border-[#16234e]/15 text-[#16234e] placeholder:text-[#16234e]/35 ' +
  'focus:outline-none focus:ring-4 focus:ring-[#2f9bff]/15 focus:border-[#2f9bff] ' +
  'rounded-xl px-4 py-3 text-base min-h-[48px] transition-all duration-200';

/** Libellé de champ */
export const brandLabel =
  'block text-xs font-bold uppercase tracking-wider text-[#16234e]/70 mb-2';

/** Bouton principal — dégradé signature QRBags */
export const brandBtnGradient =
  'bg-gradient-qrbag text-white font-bold rounded-2xl shadow-lg shadow-[#e6216e]/25 ' +
  'hover:shadow-xl hover:shadow-[#e6216e]/40 hover:-translate-y-0.5 active:translate-y-0 ' +
  'transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0';

/** Bouton secondaire — navy plein */
export const brandBtnNavy =
  'bg-[#16234e] text-white font-bold rounded-2xl shadow-lg shadow-[#16234e]/20 ' +
  'hover:bg-[#0f1838] hover:-translate-y-0.5 active:translate-y-0 ' +
  'transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

/** Bouton tertiaire — contour navy */
export const brandBtnOutline =
  'bg-white border-2 border-[#16234e]/15 text-[#16234e] font-bold rounded-2xl ' +
  'hover:border-[#2f9bff] hover:text-[#2f9bff] transition-all duration-300 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

/** Badge pilule dégradé signature (motif « pour contacter ») */
export const brandBadge =
  'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-qrbag ' +
  'text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#e6216e]/25';

/* ─── Brackets viewfinder (motif QR de l'étiquette) ─── */

export function BrandCorners({
  inset = '-10px',
  size = 'w-9 h-9',
  border = 'border-[4px]',
}: {
  inset?: string;
  size?: string;
  border?: string;
}) {
  return (
    <>
      <span aria-hidden className={`pointer-events-none absolute ${size} ${border} rounded-tl-2xl border-[#f8921f]`} style={{ top: inset, left: inset }} />
      <span aria-hidden className={`pointer-events-none absolute ${size} ${border} rounded-tr-2xl border-[#8b17c9]`} style={{ top: inset, right: inset }} />
      <span aria-hidden className={`pointer-events-none absolute ${size} ${border} rounded-bl-2xl border-[#e6216e]`} style={{ bottom: inset, left: inset }} />
      <span aria-hidden className={`pointer-events-none absolute ${size} ${border} rounded-br-2xl border-[#2f9bff]`} style={{ bottom: inset, right: inset }} />
    </>
  );
}

/* ─── Arcs arc-en-ciel des coins (motif signature étiquette) ─── */

const ARC_COLORS = ['#ffd200', '#f8921f', '#ef4036', '#e6216e', '#8b17c9'];

function CornerArcs({ position }: { position: 'tl' | 'br' }) {
  const cx = 150;
  const radii = [142, 128, 114, 100, 86];
  return (
    <svg
      aria-hidden
      viewBox="0 0 150 150"
      className={`absolute w-32 h-32 sm:w-40 sm:h-40 pointer-events-none ${
        position === 'tl' ? 'top-0 left-0' : 'bottom-0 right-0 rotate-180'
      }`}
    >
      {radii.map((r, i) => (
        <path
          key={r}
          d={`M ${cx - r} ${cx} A ${r} ${r} 0 0 1 ${cx} ${cx - r}`}
          fill="none"
          stroke={ARC_COLORS[i]}
          strokeWidth="10"
          strokeLinecap="round"
          opacity={position === 'tl' ? 0.85 : 0.5}
        />
      ))}
    </svg>
  );
}

/* ─── Coquille de page complète ───
   Fond blanc + carte pointillée + halos de couleur + liseré dégradé
   en haut + arcs arc-en-ciel dans les coins (exactement comme
   l'étiquette officielle QRBags). */

export function BrandShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative min-h-screen bg-white overflow-x-clip ${className}`}>
      {/* Liseré dégradé signature — très haut de page */}
      <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-qrbag z-20 pointer-events-none" aria-hidden />

      {/* Texture « carte du monde en pointillés » */}
      <div className="absolute inset-0 dotted-map opacity-50 pointer-events-none" aria-hidden />

      {/* Halos de couleur (azure / magenta / orange) */}
      <div className="absolute -top-24 -left-24 w-[380px] h-[380px] rounded-full bg-[#2f9bff]/10 blur-[110px] pointer-events-none" aria-hidden />
      <div className="absolute top-1/4 -right-32 w-[420px] h-[420px] rounded-full bg-[#e6216e]/10 blur-[120px] pointer-events-none" aria-hidden />
      <div className="absolute -bottom-32 -left-28 w-[400px] h-[400px] rounded-full bg-[#f8921f]/10 blur-[110px] pointer-events-none" aria-hidden />

      {/* Arcs arc-en-ciel des coins */}
      <CornerArcs position="tl" />
      <CornerArcs position="br" />

      <div className="relative z-10 flex flex-col min-h-screen">{children}</div>
    </div>
  );
}

/* ─── Carte premium blanche (bordure douce + brackets optionnels) ─── */

export function BrandCard({
  children,
  className = '',
  corners = false,
}: {
  children: ReactNode;
  className?: string;
  corners?: boolean;
}) {
  return (
    <div
      className={`relative bg-white rounded-3xl border border-[#16234e]/10 shadow-2xl shadow-[#16234e]/10 ${className}`}
    >
      {corners && <BrandCorners inset="-11px" size="w-8 h-8" border="border-[3px]" />}
      {children}
    </div>
  );
}

/* ─── Logo cliquable (retour accueil) ─── */

export function BrandLogo({ href = '/', className = 'h-12 w-auto' }: { href?: string; className?: string }) {
  return (
    <a
      href={href}
      aria-label="QRBags — retour à l'accueil"
      className="inline-flex items-center hover:opacity-85 transition-opacity"
    >
      <img src="/logo.png" alt="QRBags" className={`${className} object-contain`} />
    </a>
  );
}

/* ─── Anneau dégradé autour d'une icône (pastille succès, etc.) ─── */

export function BrandIconRing({
  children,
  size = 'w-20 h-20',
  glow = '#e6216e',
}: {
  children: ReactNode;
  size?: string;
  glow?: string;
}) {
  return (
    <div className={`relative inline-flex ${size}`}>
      <div
        aria-hidden
        className="absolute -inset-1 rounded-full bg-gradient-qrbag opacity-90 blur-[2px]"
      />
      <div
        aria-hidden
        className="absolute -inset-3 rounded-full opacity-30 blur-xl animate-pulse"
        style={{ background: glow }}
      />
      <div className={`relative ${size} bg-white rounded-full flex items-center justify-center`}>
        {children}
      </div>
    </div>
  );
}
