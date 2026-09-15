/**
 * Checklist library (SERVER-ONLY) — public travel inventory feature
 *
 * ⚠️ This module imports `pdf-lib` and `qrcode` (server-only).
 * Client components must NOT import this file — use `checklist-catalog.ts` instead
 * for the catalog constants and types.
 *
 * Provides:
 * - generateChecklistCode(): 6-char public code (base32, no I/O/0/1)
 * - generateVerificationKey(): 8-char verification key (mixed case + digits)
 * - generateChecklistPdf(): builds a timestamped PDF with stamp + QR code + items
 *
 * Brand colors — palette signature QRBag (identique au site) :
 *   NAVY    #16234e   AZURE  #2f9bff   ORANGE  #f8921f
 *   RED     #ef4036   MAGENTA #e6216e  VIOLET  #8b17c9   YELLOW #ffd200
 */

import { generateRandomCode } from './qr';

// Dynamic import caches (bypasses Turbopack bundling, works with serverExternalPackages)
let _qrCodeModule: any = null;
let _pdfLibModule: any = null;

async function loadQRCode() {
  if (!_qrCodeModule) {
    _qrCodeModule = await import('qrcode');
  }
  return _qrCodeModule;
}

async function loadPdfLib() {
  if (!_pdfLibModule) {
    _pdfLibModule = await import('pdf-lib');
  }
  return _pdfLibModule;
}

// Re-export client-safe constants/types (so server consumers can import from one place)
export {
  BRAND_COLOR,
  INK_COLOR,
  CREAM_COLOR,
  RED_COLOR,
  DEFAULT_CHECKLIST_CATEGORIES,
  flattenCatalog,
} from './checklist-catalog';
export type { ChecklistItem, ChecklistCategory } from './checklist-catalog';

// Import for internal use
import { DEFAULT_CHECKLIST_CATEGORIES, type ChecklistItem } from './checklist-catalog';

// ═══════════════════════════════════════════════════════
//  CODE GENERATION
// ═══════════════════════════════════════════════════════

/**
 * Generate a 6-char public code for the checklist URL (e.g. "K7P3MQ")
 * Uses base32 alphabet without ambiguous chars (no I, O, 0, 1).
 */
export function generateChecklistCode(): string {
  return generateRandomCode(6).toUpperCase();
}

/**
 * Generate an 8-char verification key (mixed case + digits).
 * Required to view the PDF on the public page.
 */
export function generateVerificationKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz';
  let key = '';
  for (let i = 0; i < 8; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

// ═══════════════════════════════════════════════════════
//  PDF GENERATION — Design « Wahoo » QRBag
// ═══════════════════════════════════════════════════════

export interface ChecklistPdfData {
  code: string;
  verificationKey: string;
  firstName: string;
  lastName: string;
  email: string;
  departureDate: string; // ISO date
  destinationCountry: string;
  airline?: string | null;
  items: ChecklistItem[];
  publicUrl: string; // absolute URL to /checklist/[code]
  createdAt?: Date;
}

/* ─── Palette signature QRBag (identique au site) ─── */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}

const C = {
  navy: hexToRgb('#16234e'),
  navyHover: hexToRgb('#0f1838'),
  azure: hexToRgb('#2f9bff'),
  orange: hexToRgb('#f8921f'),
  red: hexToRgb('#ef4036'),
  magenta: hexToRgb('#e6216e'),
  violet: hexToRgb('#8b17c9'),
  yellow: hexToRgb('#ffd200'),
  white: { r: 1, g: 1, b: 1 },
  gray: hexToRgb('#5a6478'),
  lightGray: hexToRgb('#c9cfdd'),
  iceBlue: hexToRgb('#ecf4ff'),
  softRed: hexToRgb('#fdf0f4'),
};

/** Couleur signature par catégorie (cycle de la palette QRBag, comme le site) */
const CATEGORY_PDF_COLORS: Array<{ hex: ReturnType<typeof hexToRgb>; darkText: boolean }> = [
  { hex: C.azure, darkText: false },
  { hex: C.orange, darkText: false },
  { hex: C.magenta, darkText: false },
  { hex: C.violet, darkText: false },
  { hex: C.red, darkText: false },
  { hex: C.navy, darkText: false },
  { hex: C.yellow, darkText: true },
];

/** PRNG déterministe — même rendu à chaque génération (zéro aléatoire) */
function seededRand(seed: number): number {
  const x = Math.sin(seed * 999.7 + 12.3) * 10000;
  return x - Math.floor(x);
}

/**
 * Format an ISO date string into a localized French date (e.g. "7 juillet 2026")
 */
function formatDateFr(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

function formatTimestamp(date: Date): string {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} à ${timeStr}`;
}

/**
 * Charge le logo QRBag (public/logo.png) pour l'intégrer au PDF.
 * Retourne null si le fichier est indisponible (fallback texte).
 */
async function loadLogoPng(): Promise<Buffer | null> {
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const buf = await fs.readFile(logoPath);
    return Buffer.from(buf);
  } catch {
    return null;
  }
}

/**
 * Build a « Wahoo » PDF checklist with the QRBag signature design:
 * - Navy header band with embedded QRBag LOGO + rainbow strip (5 brand colors)
 * - Deterministic confetti dots on the header (wahoo effect)
 * - BIG rotated timestamped certification stamp ("Cachet horodaté")
 * - Passenger info card (azure) + stamp side by side
 * - Categorized items list — each category wears a brand color band
 * - Navy QR card with scannable QR code (links to public URL)
 * - Dashed verification key block + orange "À CONSERVER" tag
 * - Navy footer with rainbow strip + generation timestamp
 *
 * Multi-page safe: continuation pages get a compact header + footer.
 *
 * @returns Buffer containing the PDF
 */
export async function generateChecklistPdf(data: ChecklistPdfData): Promise<Buffer> {
  const createdAt = data.createdAt || new Date();

  // ─── Load external packages (dynamic import, bypasses Turbopack bundling) ───
  let QRCode: any;
  try {
    QRCode = await loadQRCode();
  } catch (e) {
    throw new Error(`Failed to load qrcode package: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ─── Generate QR code as PNG buffer (navy = couleur officielle étiquette) ───
  const qrBuffer = await QRCode.toBuffer(data.publicUrl || 'https://qrbags.com', {
    type: 'png',
    width: 320,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#16234e', light: '#ffffff' },
  });

  // ─── Load pdf-lib (dynamic import, bypasses Turbopack bundling) ───
  let pdfLib: any;
  try {
    pdfLib = await loadPdfLib();
  } catch (e) {
    throw new Error(`Failed to load pdf-lib package: ${e instanceof Error ? e.message : String(e)}`);
  }
  const { PDFDocument, rgb, StandardFonts, degrees, LineCapStyle } = pdfLib;
  const roundCap = LineCapStyle?.Round ?? 0;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Attestation d'inventaire QRBag - ${data.firstName} ${data.lastName}`);
  pdfDoc.setAuthor('QRBag');
  pdfDoc.setSubject(`Checklist ${data.code}`);
  pdfDoc.setCreationDate(createdAt);

  const A4: [number, number] = [595.28, 841.89];
  const rgbOf = (c: { r: number; g: number; b: number }) => rgb(c.r, c.g, c.b);
  const navy = rgbOf(C.navy);
  const azure = rgbOf(C.azure);
  const orange = rgbOf(C.orange);
  const red = rgbOf(C.red);
  const magenta = rgbOf(C.magenta);
  const violet = rgbOf(C.violet);
  const yellow = rgbOf(C.yellow);
  const white = rgb(1, 1, 1);
  const gray = rgbOf(C.gray);
  const lightGray = rgbOf(C.lightGray);
  const iceBlue = rgbOf(C.iceBlue);
  const softRed = rgbOf(C.softRed);
  const headerWhite = rgb(0.78, 0.82, 0.90); // texte blanc atténué sur navy
  const PALETTE = [yellow, orange, red, magenta, violet];

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const margin = 50;
  const pageWidth = A4[0];
  const pageHeight = A4[1];
  const contentW = pageWidth - 2 * margin;

  // ─── Logo (embed, fallback texte) ───
  let logoImage: any = null;
  const logoBuffer = await loadLogoPng();
  if (logoBuffer) {
    try {
      logoImage = await pdfDoc.embedPng(logoBuffer);
    } catch {
      logoImage = null;
    }
  }
  const LOGO_W = 106;
  const LOGO_H = logoImage ? (LOGO_W * logoImage.height) / logoImage.width : 40;

  // ─── Briques de dessin ───

  /** Liseré arc-en-ciel signature (5 segments palette QRBag) */
  const drawRainbowStrip = (p: any, y: number, h: number) => {
    const segW = pageWidth / 5;
    PALETTE.forEach((color, i) => {
      p.drawRectangle({ x: i * segW, y, width: segW + 0.5, height: h, color });
    });
  };

  /** Confettis déterministes (effet wahoo, zéro aléatoire serveur/client) */
  const drawConfetti = (p: any, yBase: number, h: number, count: number, seedBase: number) => {
    for (let i = 0; i < count; i++) {
      const x = seededRand(seedBase + i * 7) * pageWidth;
      const y = yBase + seededRand(seedBase + i * 7 + 1) * h;
      const r = 1 + seededRand(seedBase + i * 7 + 2) * 1.9;
      p.drawCircle({
        x,
        y,
        size: r,
        color: PALETTE[i % PALETTE.length],
        opacity: 0.5,
      });
    }
  };

  /** Pied de page navy + liseré arc-en-ciel (sur TOUTES les pages) */
  const drawFooter = (p: any, pageNum: number) => {
    const footerH = 52;
    drawRainbowStrip(p, footerH, 4);
    p.drawRectangle({ x: 0, y: 0, width: pageWidth, height: footerH, color: navy });
    p.drawText('QRBag — Protection intelligente des bagages', {
      x: margin, y: footerH - 22, size: 9.5, font: fontBold, color: yellow,
    });
    p.drawText(
      `Document protégé par le protocole de certification QRBag • Généré le ${formatTimestamp(createdAt)} • qrbags.com`,
      { x: margin, y: footerH - 36, size: 6.8, font: fontRegular, color: headerWhite }
    );
    p.drawText(`Page ${pageNum}`, {
      x: pageWidth - margin - 34, y: footerH - 22, size: 7.5, font: fontBold, color: headerWhite,
    });
  };

  /** En-tête de continuation (pages 2+) */
  const drawContinuationHeader = (p: any, pageNum: number) => {
    p.drawRectangle({ x: 0, y: pageHeight - 42, width: pageWidth, height: 42, color: navy });
    drawRainbowStrip(p, pageHeight - 47, 5);
    p.drawText(`QRBag — Attestation d'inventaire`, {
      x: margin, y: pageHeight - 27, size: 10.5, font: fontBold, color: white,
    });
    const codeText = `Code : ${data.code}`;
    p.drawText(codeText, {
      x: pageWidth - margin - fontBold.widthOfTextAtSize(codeText, 10.5),
      y: pageHeight - 27, size: 10.5, font: fontBold, color: yellow,
    });
    p.drawText('(suite)', {
      x: margin, y: pageHeight - 39, size: 7, font: fontRegular, color: headerWhite,
    });
  };

  /** Nouvelle page (continuation) avec en-tête + pied */
  const addContinuationPage = (pageNum: number) => {
    const p = pdfDoc.addPage(A4);
    drawContinuationHeader(p, pageNum);
    return p;
  };

  // ═══════════ PAGE 1 ═══════════
  let page = pdfDoc.addPage(A4);
  let pageNum = 1;

  // ═══════════ HEADER (bande navy + logo + confettis + liseré arc-en-ciel) ═══════════
  page.drawRectangle({ x: 0, y: pageHeight - 96, width: pageWidth, height: 96, color: navy });
  drawConfetti(page, pageHeight - 92, 88, 24, 11);
  drawRainbowStrip(page, pageHeight - 101, 5);

  // Plaque blanche arrondie pour le logo (contraste garanti sur navy)
  const plateX = margin;
  const plateY = pageHeight - 80;
  page.drawRectangle({ x: plateX, y: plateY, width: LOGO_W + 14, height: 62, color: white });
  if (logoImage) {
    page.drawImage(logoImage, {
      x: plateX + 7,
      y: plateY + (62 - LOGO_H) / 2,
      width: LOGO_W,
      height: LOGO_H,
    });
  } else {
    page.drawText('QRBag', { x: plateX + 14, y: plateY + 22, size: 20, font: fontBold, color: navy });
  }

  // Titre à droite du logo
  const titleX = plateX + LOGO_W + 30;
  page.drawText("ATTESTATION D'INVENTAIRE", { x: titleX, y: pageHeight - 42, size: 13.5, font: fontBold, color: white });
  page.drawText('DE VOYAGE', { x: titleX, y: pageHeight - 59, size: 13.5, font: fontBold, color: white });
  page.drawText('Document officiel QRBag • qrbags.com', { x: titleX, y: pageHeight - 74, size: 7.5, font: fontRegular, color: headerWhite });

  // Code + date d'émission (haut droite)
  const codeLabel = `Code : ${data.code}`;
  page.drawText(codeLabel, {
    x: pageWidth - margin - fontBold.widthOfTextAtSize(codeLabel, 12),
    y: pageHeight - 34, size: 12, font: fontBold, color: yellow,
  });
  const emittedLabel = `Émis le ${formatTimestamp(createdAt)}`;
  page.drawText(emittedLabel, {
    x: pageWidth - margin - fontRegular.widthOfTextAtSize(emittedLabel, 7.5),
    y: pageHeight - 47, size: 7.5, font: fontRegular, color: headerWhite,
  });

  // ═══════════ SOUS-TITRE ═══════════
  let y = pageHeight - 122;
  const subtitleText = 'Document généré et horodaté électroniquement par le protocole de certification QRBag.';
  page.drawText(subtitleText, {
    x: margin, y, size: 8.5, font: fontRegular, color: gray, maxWidth: contentW - 210, lineHeight: 11,
  });

  // Zone contenu (sous le sous-titre qui peut_wrap sur 2 lignes)
  y = pageHeight - 164;

  // ═══════════ GROS CACHET HORODATÉ (pivoté, double bordure) ═══════════
  const stampW = 190;
  const stampH = 92;
  const stampX = pageWidth - margin - stampW;
  const stampY = y - stampH - 4;
  const stampAngle = -8;
  page.drawRectangle({
    x: stampX, y: stampY, width: stampW, height: stampH,
    borderColor: orange, borderWidth: 2.5, color: softRed, rotate: degrees(stampAngle),
  });
  page.drawRectangle({
    x: stampX + 5, y: stampY + 5, width: stampW - 10, height: stampH - 10,
    borderColor: magenta, borderWidth: 1.2, rotate: degrees(stampAngle),
  });
  page.drawText('CERTIFIÉ QRBag', {
    x: stampX + 18, y: stampY + 62, size: 15, font: fontBold, color: magenta, rotate: degrees(stampAngle),
  });
  page.drawText(`Horodaté le ${formatTimestamp(createdAt)}`, {
    x: stampX + 18, y: stampY + 45, size: 9, font: fontBold, color: navy, rotate: degrees(stampAngle),
  });
  page.drawText(`Réf : ${data.code}  •  Authentique`, {
    x: stampX + 18, y: stampY + 31, size: 8, font: fontRegular, color: navy, rotate: degrees(stampAngle),
  });
  page.drawText('qrbags.com', {
    x: stampX + 18, y: stampY + 16, size: 7.5, font: fontRegular, color: gray, rotate: degrees(stampAngle),
  });

  // ═══════════ CARTE INFOS PASSAGER (gauche, face au cachet) ═══════════
  page.drawText('INFORMATIONS DU PASSAGER', {
    x: margin, y, size: 11, font: fontBold, color: navy,
  });

  const infoY = y - 12;
  const infoH = 96;
  const infoW = contentW - stampW - 18;
  page.drawRectangle({
    x: margin, y: infoY - infoH, width: infoW, height: infoH,
    borderColor: azure, borderWidth: 1.2, color: iceBlue,
  });
  // Barre d'accent gauche (azure → dégradé simulé par 3 segments)
  page.drawRectangle({ x: margin, y: infoY - infoH, width: 4, height: infoH, color: azure });
  page.drawRectangle({ x: margin + 4, y: infoY - infoH, width: 2, height: infoH, color: magenta });

  const padX = 16;
  const colW = (infoW - padX * 2) / 2;
  const label = (txt: string, x: number, yy: number) =>
    page.drawText(txt.toUpperCase(), { x, y: yy, size: 6.8, font: fontBold, color: gray });
  const value = (txt: string, x: number, yy: number, size = 10) =>
    page.drawText(txt || '—', { x, y: yy, size, font: fontBold, color: navy, maxWidth: colW - 6 });

  // Rangée 1
  label('Nom complet', margin + padX, infoY - 16);
  value(`${data.firstName} ${data.lastName}`.trim(), margin + padX, infoY - 30);
  label('Pays de destination', margin + padX + colW, infoY - 16);
  value(data.destinationCountry, margin + padX + colW, infoY - 30);
  // Rangée 2
  label('Date de départ', margin + padX, infoY - 50);
  value(formatDateFr(data.departureDate), margin + padX, infoY - 64, 9.5);
  label('Compagnie aérienne', margin + padX + colW, infoY - 50);
  value(data.airline || '—', margin + padX + colW, infoY - 64, 9.5);
  // Rangée 3 (email, pleine largeur)
  label('Email', margin + padX, infoY - 78);
  value(data.email, margin + padX, infoY - 90, 8.5);

  y = infoY - infoH - 26;

  // ═══════════ INVENTAIRE (bandes colorées par catégorie) ═══════════
  const itemsTitle = `INVENTAIRE (${data.items.length} article${data.items.length > 1 ? 's' : ''})`;
  page.drawText(itemsTitle, { x: margin, y, size: 12, font: fontBold, color: navy });
  page.drawRectangle({ x: margin, y: y - 6, width: 58, height: 3, color: orange });

  y -= 24;

  // Grouper par catégorie
  const byCategory: Record<string, ChecklistItem[]> = {};
  for (const it of data.items) {
    if (!byCategory[it.category]) byCategory[it.category] = [];
    byCategory[it.category].push(it);
  }

  const catLabelFr: Record<string, string> = {};
  for (const cat of DEFAULT_CHECKLIST_CATEGORIES) catLabelFr[cat.id] = cat.label.fr;

  let colorIndex = 0;
  for (const cat of DEFAULT_CHECKLIST_CATEGORIES) {
    const catItems = byCategory[cat.id] || [];
    if (catItems.length === 0) continue;

    // Saut de page si nécessaire (réserve pied de page)
    if (y - (28 + catItems.length * 18) < 170) {
      page = addContinuationPage(++pageNum);
      y = pageHeight - 80;
    }

    const band = CATEGORY_PDF_COLORS[colorIndex % CATEGORY_PDF_COLORS.length];
    colorIndex++;
    const bandColor = rgbOf(band.hex);
    const bandText = band.darkText ? navy : white;

    // Bande catégorie colorée
    page.drawRectangle({ x: margin, y: y - 20, width: contentW, height: 20, color: bandColor });
    page.drawText(`${catLabelFr[cat.id]?.toUpperCase()}`, {
      x: margin + 10, y: y - 14.5, size: 9.5, font: fontBold, color: bandText,
    });
    const countTxt = `${catItems.length} article${catItems.length > 1 ? 's' : ''}`;
    page.drawText(countTxt, {
      x: pageWidth - margin - 10 - fontRegular.widthOfTextAtSize(countTxt, 8),
      y: y - 14.5, size: 8, font: fontRegular, color: bandText,
    });
    y -= 30;

    // Articles
    for (const item of catItems) {
      if (y < 170) {
        page = addContinuationPage(++pageNum);
        y = pageHeight - 80;
      }

      // Case à cocher
      page.drawRectangle({
        x: margin + 5, y: y - 10, width: 12, height: 12,
        borderColor: navy, borderWidth: 1.2, color: white,
      });
      // Coche dessinée (2 segments ronds — Helvetica n'a pas ✓)
      if (item.checked !== false) {
        page.drawLine({
          start: { x: margin + 7.2, y: y - 4.6 },
          end: { x: margin + 9.8, y: y - 7.8 },
          thickness: 1.6, color: azure, lineCap: roundCap,
        });
        page.drawLine({
          start: { x: margin + 9.8, y: y - 7.8 },
          end: { x: margin + 14.6, y: y - 1.4 },
          thickness: 1.6, color: azure, lineCap: roundCap,
        });
      }

      // Nom (+ couleur / marque optionnelles)
      let displayName = item.name;
      if (item.color) displayName += ` — ${item.color}`;
      if (item.brand) displayName += ` (${item.brand})`;
      page.drawText(displayName, {
        x: margin + 26, y: y - 8, size: 9, font: fontRegular, color: navy, maxWidth: 300,
      });

      // Quantité
      if (item.qty > 1) {
        const qtyText = `x${item.qty}`;
        page.drawText(qtyText, {
          x: pageWidth - margin - 40, y: y - 8, size: 9, font: fontBold, color: gray,
        });
      }

      y -= 18;
    }
    y -= 6;
  }

  // ═══════════ CARTE QR NAVY (scan → page publique) ═══════════
  if (y - 150 < 175) {
    page = addContinuationPage(++pageNum);
    y = pageHeight - 80;
  }

  const qrCardH = 132;
  const qrCardY = y - qrCardH;
  page.drawRectangle({ x: margin, y: qrCardY, width: contentW, height: qrCardH, color: navy });
  drawConfetti(page, qrCardY + 4, qrCardH - 8, 10, 77);

  // Plateau blanc + QR (navy officiel)
  page.drawRectangle({ x: margin + 14, y: qrCardY + 11, width: 110, height: 110, color: white });
  const qrImg = await pdfDoc.embedPng(qrBuffer);
  page.drawImage(qrImg, { x: margin + 19, y: qrCardY + 16, width: 100, height: 100 });

  // Textes à droite du QR
  const qrTextX = margin + 142;
  page.drawText("Scannez pour vérifier l'original", {
    x: qrTextX, y: qrCardY + 92, size: 12, font: fontBold, color: white,
  });
  page.drawText('Ce QR code pointe vers la page publique de cette', {
    x: qrTextX, y: qrCardY + 76, size: 7.8, font: fontRegular, color: headerWhite,
  });
  page.drawText('attestation. La clé de vérification est requise.', {
    x: qrTextX, y: qrCardY + 66, size: 7.8, font: fontRegular, color: headerWhite,
  });
  page.drawText('URL publique :', {
    x: qrTextX, y: qrCardY + 46, size: 8.5, font: fontBold, color: yellow,
  });
  const maxUrlLen = 48;
  const displayUrl = data.publicUrl.length > maxUrlLen ? data.publicUrl.substring(0, maxUrlLen) + '...' : data.publicUrl;
  page.drawText(displayUrl, {
    x: qrTextX, y: qrCardY + 33, size: 7.5, font: fontMono, color: white,
  });
  page.drawText(`${data.items.length} article(s) horodaté(s)`, {
    x: qrTextX, y: qrCardY + 16, size: 7.5, font: fontRegular, color: headerWhite,
  });

  y = qrCardY - 22;

  // ═══════════ CLÉ DE VÉRIFICATION (bordure pointillée + tag orange) ═══════════
  const keyBoxH = 58;
  page.drawRectangle({
    x: margin, y: y - keyBoxH, width: contentW, height: keyBoxH,
    borderColor: navy, borderWidth: 1.5, color: rgb(0.976, 0.98, 0.996),
    dashArray: [4, 2],
  });
  page.drawText('Clé de vérification requise pour consulter le PDF en ligne :', {
    x: margin + 12, y: y - 18, size: 8.5, font: fontBold, color: navy,
  });
  page.drawText(data.verificationKey, {
    x: margin + 12, y: y - 42, size: 19, font: fontMono, color: magenta,
  });
  // Tag « À CONSERVER »
  const tagW = 92;
  page.drawRectangle({ x: pageWidth - margin - tagW - 12, y: y - keyBoxH + 20, width: tagW, height: 17, color: orange });
  page.drawText('À CONSERVER', {
    x: pageWidth - margin - tagW - 12 + (tagW - fontBold.widthOfTextAtSize('À CONSERVER', 7)) / 2,
    y: y - keyBoxH + 25, size: 7, font: fontBold, color: white,
  });

  // ═══════════ PIED DE PAGE (toutes les pages) ═══════════
  const pages = pdfDoc.getPages();
  pages.forEach((p, idx) => drawFooter(p, idx + 1));

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Build the absolute public URL for a checklist code.
 * Uses NEXT_PUBLIC_BASE_URL if set, otherwise derives from request headers.
 */
export function buildPublicChecklistUrl(code: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://qrbags.com';
  return `${base.replace(/\/$/, '')}/checklist/${code}`;
}
