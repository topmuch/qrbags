/**
 * QRBag — Brand color tokens (shared across pages)
 *
 * Visual reference: blue background (#0047d6) + yellow cards (#fcd616),
 * black text on yellow, white text on blue. High-contrast, modern,
 * mobile-first.
 */

export const BRAND = '#0047d6';   // Bleu vif QRBag — fonds principaux, headers, boutons primaires
export const ACCENT = '#fcd616';  // Jaune vif QRBag — cards, blocs de contenu, badges
export const INK = '#1a1a1a';     // Noir — texte sur jaune, bordures dashed

export const BRAND_COLORS = {
  BRAND,
  ACCENT,
  INK,
  BLUE: BRAND,
  YELLOW: ACCENT,
  BLACK: INK,
} as const;
