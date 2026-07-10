/**
 * QRBag — Brand color tokens (shared across pages)
 *
 * Visual reference: blue background (#0047d6) + yellow cards (#fcd616),
 * black text on yellow, white text on blue. High-contrast, modern,
 * mobile-first.
 *
 * Usage:
 *   import { BRAND, ACCENT, INK } from '@/lib/brand';
 *   <div style={{ backgroundColor: BRAND }} />
 *   <div className="bg-[var(--brand)]" />
 */

export const BRAND = '#0047d6';   // Bleu vif QRBag — fonds principaux, headers, boutons primaires
export const ACCENT = '#fcd616';  // Jaune vif QRBag — cards, blocs de contenu, badges
export const INK = '#1a1a1a';     // Noir — texte sur jaune, bordures dashed, boutons secondaires

/**
 * Helper to use brand color as CSS var in inline styles or className strings.
 * Example: style={{ backgroundColor: BRAND }}
 */
export const BRAND_COLORS = {
  BRAND,
  ACCENT,
  INK,
  // Aliases for clarity in different contexts
  BLUE: BRAND,
  YELLOW: ACCENT,
  BLACK: INK,
} as const;
