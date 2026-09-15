/**
 * Client-safe checklist constants and types.
 *
 * This file is safe to import from client components — it contains NO server-only
 * imports (no pdfkit, no qrcode, no fs). The PDF-generation utilities live in
 * `src/lib/checklist.ts` and must only be imported from API routes / server code.
 */

// ═══════════════════════════════════════════════════════
//  BRAND COLORS (shared with checklist.ts)
// ═══════════════════════════════════════════════════════

export const BRAND_COLOR = '#c5a643';
export const INK_COLOR = '#1a1a1a';
export const CREAM_COLOR = '#FDFBF7';
export const RED_COLOR = '#c0392b';

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

export interface ChecklistItem {
  category: string;
  name: string;
  qty: number;
  checked: boolean;
  /** Optional: color chosen by the passenger (e.g. "Noir", "Bleu") */
  color?: string;
  /** Optional: brand chosen by the passenger (e.g. "Nike", "Zara") */
  brand?: string;
}

export interface ChecklistCategory {
  id: string;
  label: { fr: string; en: string; ar: string };
  emoji: string;
  items: string[];
  /** Optional: map item name → image slug for product photos.
   *  Image URL is `/items/${id}/${slug}.png` for plain slugs,
   *  or the value verbatim when it starts with '/' (cross-category reuse).
   *  If absent, the UI falls back to a colored tile with the emoji. */
  itemImageSlugs?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════
//  DEFAULT CHECKLIST CATALOG — 9 catégories
//  Femmes · Hommes · Enfant · Accessoires électroniques
//  + Chaussures · Toilette · Santé · Accessoires · Divers
//  Les photos IA existantes (public/items/…) sont réutilisées
//  via des chemins complets (« /items/clothing/robes.png »).
// ═══════════════════════════════════════════════════════

export const DEFAULT_CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  {
    id: 'women',
    emoji: '👗',
    label: { fr: 'Femmes', en: 'Women', ar: 'نسائية' },
    items: [
      'Robes',
      'Jupes',
      'Blouses',
      'Tops',
      'Pulls',
      'Vestes',
      'Manteaux',
      'Pantalons',
      'Jeans',
      'Shorts',
      'Maillots de bain',
      'Sous-vêtements',
      'Chaussettes',
      'Pyjamas',
      'Foulards & voiles',
      'Bas & collants',
    ],
    itemImageSlugs: {
      'Robes': '/items/clothing/robes.png',
      'Jupes': '/items/clothing/jupes.png',
      'Blouses': '/items/clothing/chemises.png',
      'Tops': '/items/clothing/t-shirts.png',
      'Pulls': '/items/clothing/pulls.png',
      'Vestes': '/items/clothing/vestes.png',
      'Manteaux': '/items/clothing/manteaux.png',
      'Pantalons': '/items/clothing/pantalons.png',
      'Jeans': '/items/clothing/jeans.png',
      'Shorts': '/items/clothing/shorts.png',
      'Maillots de bain': '/items/clothing/maillots-de-bain.png',
      'Sous-vêtements': '/items/clothing/sous-vetements.png',
      'Chaussettes': '/items/clothing/chaussettes.png',
      'Pyjamas': '/items/clothing/pyjamas.png',
    },
  },
  {
    id: 'men',
    emoji: '👔',
    label: { fr: 'Hommes', en: 'Men', ar: 'رجالية' },
    items: [
      'Chemises',
      'Polos',
      'T-shirts',
      'Costumes',
      'Cravates',
      'Vestes',
      'Manteaux',
      'Pantalons',
      'Jeans',
      'Shorts',
      'Pulls',
      'Sous-vêtements',
      'Chaussettes',
      'Pyjamas',
      'Maillots de bain',
      'Ceintures',
    ],
    itemImageSlugs: {
      'Chemises': '/items/clothing/chemises.png',
      'Polos': '/items/clothing/polos.png',
      'T-shirts': '/items/clothing/t-shirts.png',
      'Costumes': '/items/clothing/costumes.png',
      'Cravates': '/items/clothing/cravates.png',
      'Vestes': '/items/clothing/vestes.png',
      'Manteaux': '/items/clothing/manteaux.png',
      'Pantalons': '/items/clothing/pantalons.png',
      'Jeans': '/items/clothing/jeans.png',
      'Shorts': '/items/clothing/shorts.png',
      'Pulls': '/items/clothing/pulls.png',
      'Sous-vêtements': '/items/clothing/sous-vetements.png',
      'Chaussettes': '/items/clothing/chaussettes.png',
      'Pyjamas': '/items/clothing/pyjamas.png',
      'Maillots de bain': '/items/clothing/maillots-de-bain.png',
      'Ceintures': '/items/clothing/ceintures.png',
    },
  },
  {
    id: 'children',
    emoji: '🧒',
    label: { fr: 'Enfant', en: 'Children', ar: 'أطفال' },
    items: [
      'T-shirts enfant',
      'Pantalons enfant',
      'Jeans enfant',
      'Pulls enfant',
      'Vestes enfant',
      'Manteaux enfant',
      'Robes enfant',
      'Pyjamas enfant',
      'Sous-vêtements enfant',
      'Chaussettes enfant',
      'Maillots de bain enfant',
      'Tenues de sport',
      'Bavoirs',
      'Doudou / peluche',
    ],
    itemImageSlugs: {
      'T-shirts enfant': '/items/clothing/t-shirts.png',
      'Pantalons enfant': '/items/clothing/pantalons.png',
      'Jeans enfant': '/items/clothing/jeans.png',
      'Pulls enfant': '/items/clothing/pulls.png',
      'Vestes enfant': '/items/clothing/vestes.png',
      'Manteaux enfant': '/items/clothing/manteaux.png',
      'Robes enfant': '/items/clothing/robes.png',
      'Pyjamas enfant': '/items/clothing/pyjamas.png',
      'Sous-vêtements enfant': '/items/clothing/sous-vetements.png',
      'Chaussettes enfant': '/items/clothing/chaussettes.png',
      'Maillots de bain enfant': '/items/clothing/maillots-de-bain.png',
      'Doudou / peluche': '/items/misc/jouets-enfants.png',
    },
  },
  {
    id: 'electronics',
    emoji: '📱',
    label: { fr: 'Accessoires électroniques', en: 'Electronic accessories', ar: 'إلكترونيات' },
    items: [
      'Téléphone',
      'Chargeur',
      'Câbles USB',
      'Batterie externe',
      'Tablette',
      'Ordinateur portable',
      'Chargeur PC',
      'Appareil photo',
      'Carte mémoire',
      'Casque audio',
      'Écouteurs',
      'Montre connectée',
      'Adaptateur de voyage',
      'Multiprise USB',
    ],
    itemImageSlugs: {
      'Téléphone': 'telephone',
      'Chargeur': 'chargeur',
      'Câbles USB': 'cables-usb',
      'Batterie externe': 'batterie-externe',
      'Tablette': 'tablette',
      'Ordinateur portable': 'ordinateur-portable',
      'Chargeur PC': 'chargeur-pc',
      'Appareil photo': 'appareil-photo',
      'Carte mémoire': 'carte-memoire',
      'Casque audio': 'casque-audio',
      'Écouteurs': 'ecouteurs',
      'Montre connectée': 'montre-connectee',
    },
  },
  {
    id: 'shoes',
    emoji: '👟',
    label: { fr: 'Chaussures', en: 'Shoes', ar: 'أحذية' },
    items: [
      'Baskets',
      'Chaussures de ville',
      'Sandales',
      'Tongs',
      'Bottes',
      'Chaussons',
    ],
    itemImageSlugs: {
      'Baskets': 'baskets',
      'Chaussures de ville': 'chaussures-ville',
      'Sandales': 'sandales',
      'Tongs': 'tongs',
      'Bottes': 'bottes',
      'Chaussons': 'chaussons',
    },
  },
  {
    id: 'toiletries',
    emoji: '🧴',
    label: { fr: 'Articles de toilette', en: 'Toiletries', ar: 'أدوات الزينة' },
    items: [
      'Brosse à dents',
      'Dentifrice',
      'Déodorant',
      'Shampoing',
      'Après-shampoing',
      'Gel douche',
      'Savon',
      'Rasoir',
      'Mousse à raser',
      'Parfum',
      'Crème hydratante',
      'Maquillage',
      'Brosse à cheveux',
      'Peigne',
      'Serviettes',
    ],
    itemImageSlugs: {
      'Brosse à dents': 'brosse-dents',
      'Dentifrice': 'dentifrice',
      'Déodorant': 'deodorant',
      'Shampoing': 'shampoing',
      'Après-shampoing': 'apres-shampoing',
      'Gel douche': 'gel-douche',
      'Savon': 'savon',
      'Rasoir': 'rasoir',
      'Mousse à raser': 'mousse-raser',
      'Parfum': 'parfum',
      'Crème hydratante': 'creme-hydratante',
      'Maquillage': 'maquillage',
      'Brosse à cheveux': 'brosse-cheveux',
      'Peigne': 'peigne',
      'Serviettes': 'serviettes',
    },
  },
  {
    id: 'health',
    emoji: '💊',
    label: { fr: 'Santé', en: 'Health', ar: 'صحة' },
    items: [
      'Médicaments',
      'Lunettes',
      'Lentilles de contact',
      'Solution pour lentilles',
      'Trousse de premiers secours',
    ],
    itemImageSlugs: {
      'Médicaments': 'medicaments',
      'Lunettes': 'lunettes',
      'Lentilles de contact': 'lentilles-contact',
      'Solution pour lentilles': 'solution-lentilles',
      'Trousse de premiers secours': 'trousse-premiers-secours',
    },
  },
  {
    id: 'accessories',
    emoji: '👜',
    label: { fr: 'Accessoires', en: 'Accessories', ar: 'ملحقات' },
    items: [
      'Sac à main',
      'Sac à dos',
      'Portefeuille',
      'Ceinture',
      'Bijoux',
      'Montre',
      'Lunettes de soleil',
      'Casquette',
      'Chapeau',
      'Écharpe',
      'Gants',
      'Parapluie',
    ],
    itemImageSlugs: {
      'Sac à main': 'sac-main',
      'Sac à dos': 'sac-dos',
      'Portefeuille': 'portefeuille',
      'Ceinture': 'ceinture',
      'Bijoux': 'bijoux',
      'Montre': 'montre',
      'Lunettes de soleil': 'lunettes-soleil',
      'Casquette': 'casquette',
      'Chapeau': 'chapeau',
      'Écharpe': 'echarpe',
      'Gants': 'gants',
      'Parapluie': 'parapluie',
    },
  },
  {
    id: 'misc',
    emoji: '📚',
    label: { fr: 'Divers', en: 'Misc', ar: 'متنوع' },
    items: [
      'Livres',
      'Magazines',
      'Carnet',
      'Stylos',
      'Jeux',
      'Jouets pour enfants',
      'Snacks',
      'Gourde',
    ],
    itemImageSlugs: {
      'Livres': 'livres',
      'Magazines': 'magazines',
      'Carnet': 'carnet',
      'Stylos': 'stylos',
      'Jeux': 'jeux',
      'Jouets pour enfants': 'jouets-enfants',
      'Snacks': 'snacks',
      'Gourde': 'gourde',
    },
  },
];

// ═══════════════════════════════════════════════════════
//  IMAGE HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Returns the absolute image URL for a given category/item, or null if no
 * real product photo is available (caller should fall back to emoji tile).
 *
 * Plain slug  : getItemImageUrl('electronics', 'Téléphone') → '/items/electronics/telephone.png'
 * Full path   : itemImageSlugs value starting with '/' is used verbatim
 *               (cross-category photo reuse, e.g. women → /items/clothing/robes.png)
 */
export function getItemImageUrl(categoryId: string, itemName: string): string | null {
  const cat = DEFAULT_CHECKLIST_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat || !cat.itemImageSlugs) return null;
  const slug = cat.itemImageSlugs[itemName];
  if (!slug) return null;
  if (slug.startsWith('/')) return slug;
  return `/items/${categoryId}/${slug}.png`;
}

// ═══════════════════════════════════════════════════════
//  COLOR & BRAND OPTIONS (for the selection panel dropdowns)
// ═══════════════════════════════════════════════════════

export const ITEM_COLORS: string[] = [
  'Noir',
  'Blanc',
  'Gris',
  'Beige',
  'Marron',
  'Bleu',
  'Bleu marine',
  'Rouge',
  'Vert',
  'Jaune',
  'Orange',
  'Rose',
  'Violet',
  'Multicolore',
];

export const ITEM_BRANDS: string[] = [
  'H&M',
  'Zara',
  'Uniqlo',
  'Nike',
  'Adidas',
  'Lacoste',
  'Ralph Lauren',
  'Tommy Hilfiger',
  'Levi\'s',
  'Calvin Klein',
  'Diesel',
  'Autre',
];

/**
 * Flatten catalog → list of {category, categoryName, name} for the form
 */
export function flattenCatalog(): Array<{ category: string; categoryName: string; name: string }> {
  const out: Array<{ category: string; categoryName: string; name: string }> = [];
  for (const cat of DEFAULT_CHECKLIST_CATEGORIES) {
    for (const item of cat.items) {
      out.push({ category: cat.id, categoryName: cat.label.fr, name: item });
    }
  }
  return out;
}
