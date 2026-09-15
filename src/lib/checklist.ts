/**
 * Checklist library (SERVER-ONLY) — public travel inventory feature
 *
 * ⚠️ This module imports `pdf-lib`, `qrcode` and `node:crypto` (server-only).
 * Client components must NOT import this file — use `checklist-catalog.ts` instead
 * for the catalog constants and types.
 *
 * Provides:
 * - generateChecklistCode(): 6-char public code (base32, no I/O/0/1)
 * - generateVerificationKey(): 8-char verification key (mixed case + digits)
 * - generateChecklistPdf(): premium "invoice-style" attestation with round seal + QR
 *
 * Brand colors — palette signature QRBag (identique au site) :
 *   NAVY    #16234e   AZURE  #2f9bff   ORANGE  #f8921f
 *   RED     #ef4036   MAGENTA #e6216e  VIOLET  #8b17c9   YELLOW #ffd200
 */

import { createHash } from 'node:crypto';
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
//  PDF GENERATION — Design premium « facture certifiée » QRBag
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
  flightNumber?: string | null;
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
  lightGray: hexToRgb('#d7dde9'),
  iceBlue: hexToRgb('#eef5ff'),
  zebra: hexToRgb('#f4f8fe'),
  softRed: hexToRgb('#fdf1f3'),
};

/** Couleur signature par catégorie (cohérente avec le site) */
const CATEGORY_COLORS: Record<string, { hex: ReturnType<typeof hexToRgb>; darkText: boolean }> = {
  women: { hex: C.magenta, darkText: false },
  men: { hex: C.azure, darkText: false },
  children: { hex: C.orange, darkText: false },
  electronics: { hex: C.violet, darkText: false },
  shoes: { hex: C.red, darkText: false },
  toiletries: { hex: C.azure, darkText: false },
  health: { hex: C.violet, darkText: false },
  accessories: { hex: C.navy, darkText: false },
  misc: { hex: C.yellow, darkText: true },
};
const OTHER_COLOR: { hex: ReturnType<typeof hexToRgb>; darkText: boolean } = { hex: C.gray, darkText: false };

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

/** "07/07/2026 à 14:32:05" — horodatage complet à la seconde */
function formatTimestamp(date: Date): string {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${dateStr} à ${timeStr}`;
}

/**
 * Numéro de série infalsifiable : SER-{code}-{AAMMJJ}
 */
function buildSerial(code: string, createdAt: Date): string {
  const d = new Date(createdAt);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `SER-${code}-${yy}${mm}${dd}`;
}

/** Regroupe l'empreinte : "A1B2 C3D4 E5F6 0708" (16 premiers caractères) */
function shortFingerprint(fp: string): string {
  return (fp.slice(0, 16).match(/.{4}/g) || []).join(' ');
}

export interface ChecklistSecurityFields {
  code: string;
  verificationKey: string;
  firstName: string;
  lastName: string;
  email: string;
  departureDate: string;
  destinationCountry: string;
  airline?: string | null;
  flightNumber?: string | null;
  items: ChecklistItem[];
  createdAt: Date;
}

/**
 * Numéro de série + empreinte SHA-256 infalsifiable d'une attestation.
 * Utilisée par le PDF ET l'API publique (affichage sur la page publique).
 */
export function computeChecklistSecurity(f: ChecklistSecurityFields): {
  serial: string;
  fingerprint: string;
  fingerprintShort: string;
} {
  const serial = buildSerial(f.code, f.createdAt);
  const payload = [
    f.code,
    f.verificationKey,
    f.firstName,
    f.lastName,
    f.email,
    f.departureDate,
    f.destinationCountry,
    f.airline || '',
    f.flightNumber || '',
    f.items.length,
    f.items.map((i) => `${i.category}:${i.name}:${i.qty}`).join('|'),
    f.createdAt.toISOString(),
  ].join('#');
  const fingerprint = createHash('sha256').update(payload).digest('hex').toUpperCase();
  return { serial, fingerprint, fingerprintShort: shortFingerprint(fingerprint) };
}

/** Charge le logo QRBag (public/logo.png) — null si indisponible (fallback texte) */
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
 * Build the premium « facture certifiée » PDF attestation:
 * - Navy header with ROUNDED logo plate + QR code plate (top of page 1)
 * - Passenger & flight card (nom, prénom, compagnie, N° de vol, départ, destination)
 * - Professional round certification seal (arc text + horodatage à la seconde
 *   + numéro de série + empreinte SHA-256 infalsifiable)
 * - INVOICE-STYLE items table (N° / Désignation / Catégorie / Qté, zebra rows, total)
 * - Rounded dashed verification block with key + full fingerprint
 * - Navy footer with rainbow strip on every page
 *
 * Multi-page safe: continuation pages get a compact header + footer.
 *
 * @returns Buffer containing the PDF
 */
export async function generateChecklistPdf(data: ChecklistPdfData): Promise<Buffer> {
  const createdAt = data.createdAt || new Date();
  const { serial, fingerprint } = computeChecklistSecurity({
    code: data.code,
    verificationKey: data.verificationKey,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    departureDate: data.departureDate,
    destinationCountry: data.destinationCountry,
    airline: data.airline,
    flightNumber: data.flightNumber,
    items: data.items,
    createdAt,
  });

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
    width: 360,
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#16234e', light: '#ffffff' },
  });

  // ─── Load pdf-lib ───
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
  pdfDoc.setSubject(`Checklist ${data.code} — ${serial}`);
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
  const zebra = rgbOf(C.zebra);
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
  const LOGO_W = 104;
  const LOGO_H = logoImage ? (LOGO_W * logoImage.height) / logoImage.width : 40;

  // ═══════════ Briques de dessin ═══════════

  /** Liseré arc-en-ciel signature (5 segments palette QRBag) */
  const drawRainbowStrip = (p: any, y: number, h: number) => {
    const segW = pageWidth / 5;
    PALETTE.forEach((color, i) => {
      p.drawRectangle({ x: i * segW, y, width: segW + 0.5, height: h, color });
    });
  };

  /** SVG path d'un rectangle arrondi (origine = coin haut-gauche, y vers le bas) */
  const roundedRectPath = (w: number, h: number, r: number): string => {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    return (
      `M ${rr},0 H ${w - rr} A ${rr},${rr} 0 0 1 ${w},${rr} V ${h - rr} ` +
      `A ${rr},${rr} 0 0 1 ${w - rr},${h} H ${rr} A ${rr},${rr} 0 0 1 0,${h - rr} ` +
      `V ${rr} A ${rr},${rr} 0 0 1 ${rr},0 Z`
    );
  };

  /** Rectangle arrondi (coins doux — logo, QR, tags, blocs) */
  const drawRoundedRect = (
    p: any,
    opts: {
      x: number; y: number; w: number; h: number; r: number;
      color?: any; borderColor?: any; borderWidth?: number;
      opacity?: number; borderOpacity?: number; borderDashArray?: number[];
    }
  ) => {
    p.drawSvgPath(roundedRectPath(opts.w, opts.h, opts.r), {
      x: opts.x,
      y: opts.y + opts.h, // origine SVG = coin haut-gauche (axe y inversé)
      color: opts.color,
      borderColor: opts.borderColor,
      borderWidth: opts.borderWidth,
      opacity: opts.opacity,
      borderOpacity: opts.borderOpacity,
      borderDashArray: opts.borderDashArray,
    });
  };

  /** Texte arrondi dans une pastille (tag) */
  const drawTag = (p: any, text: string, x: number, y: number, bg: any, fg: any, size = 7) => {
    const w = fontBold.widthOfTextAtSize(text, size) + 16;
    const h = size + 9;
    drawRoundedRect(p, { x, y, w, h, r: h / 2, color: bg });
    p.drawText(text, { x: x + 8, y: y + 5.5, size, font: fontBold, color: fg });
    return w;
  };

  /** Texte courbé sur un cercle — style cachet officiel */
  const drawArcText = (
    p: any,
    text: string,
    cx: number, cy: number, radius: number,
    size: number, font: any, color: any,
    mode: 'top' | 'bottom',
  ) => {
    const letterSpacing = 0.5;
    const chars = text.split('');
    const widths = chars.map((ch) => font.widthOfTextAtSize(ch, size));
    const totalW = widths.reduce((a, b) => a + b, 0) + letterSpacing * (chars.length - 1);
    const halfSpanDeg = (totalW / 2 / radius) * (180 / Math.PI);
    let cum = 0;
    for (let i = 0; i < chars.length; i++) {
      const w = widths[i];
      const mid = cum + w / 2;
      cum += w + letterSpacing;
      const offsetDeg = ((mid - totalW / 2) / radius) * (180 / Math.PI);
      let alphaDeg: number;
      if (mode === 'top') {
        alphaDeg = 90 + halfSpanDeg - offsetDeg; // lecture gauche→droite, sens horaire
      } else {
        alphaDeg = 270 - halfSpanDeg + offsetDeg; // lecture gauche→droite sous le cercle
      }
      const rad = (alphaDeg * Math.PI) / 180;
      const px = cx + radius * Math.cos(rad);
      const py = cy + radius * Math.sin(rad);
      // direction de lecture (décalage pour centrer le caractère sur le cercle)
      const flowX = mode === 'top' ? Math.sin(rad) : -Math.sin(rad);
      const flowY = mode === 'top' ? -Math.cos(rad) : Math.cos(rad);
      p.drawText(chars[i], {
        x: px - (w / 2) * flowX,
        y: py - (w / 2) * flowY,
        size,
        font,
        color,
        rotate: degrees(mode === 'top' ? alphaDeg - 90 : alphaDeg - 270),
      });
    }
  };

  /** CACHET OFFICIEL ROND — horodatage à la seconde + série + empreinte SHA-256 */
  const drawCertificationSeal = (
    p: any,
    cx: number, cy: number, R: number,
    fp: string, serialNo: string,
  ) => {
    // Disque de fond
    p.drawCircle({ x: cx, y: cy, size: R, color: white, borderColor: navy, borderWidth: 2.4 });
    p.drawCircle({ x: cx, y: cy, size: R - 5, borderColor: magenta, borderWidth: 1.0 });
    p.drawCircle({ x: cx, y: cy, size: R - 30, color: softRed, opacity: 0.55 });

    // Textes courbés
    drawArcText(p, '• PROTECTION INTELLIGENTE DES BAGAGES •', cx, cy, R - 13, 5.4, fontBold, navy, 'top');
    drawArcText(p, 'qrbags.com  •  DOCUMENT CERTIFIÉ', cx, cy, R - 14, 5.4, fontBold, magenta, 'bottom');

    // Séparateurs latéraux (radiaux)
    for (const ang of [0, 180]) {
      const rad = (ang * Math.PI) / 180;
      p.drawLine({
        start: { x: cx + (R - 24) * Math.cos(rad), y: cy + (R - 24) * Math.sin(rad) },
        end: { x: cx + (R - 7) * Math.cos(rad), y: cy + (R - 7) * Math.sin(rad) },
        thickness: 1, color: navy, lineCap: roundCap,
      });
    }

    // Bloc central : CERTIFIÉ + horodatage + série + empreinte
    p.drawText('CERTIFIÉ', { x: cx - fontBold.widthOfTextAtSize('CERTIFIÉ', 10) / 2, y: cy + 21, size: 10, font: fontBold, color: magenta });
    p.drawText('QRBag', { x: cx - fontBold.widthOfTextAtSize('QRBag', 6.5) / 2, y: cy + 12, size: 6.5, font: fontBold, color: azure });
    const tsLine1 = `Émis le ${new Date(createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    const tsLine2 = `à ${new Date(createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    p.drawText(tsLine1, { x: cx - fontBold.widthOfTextAtSize(tsLine1, 6.6) / 2, y: cy + 0.5, size: 6.6, font: fontBold, color: navy });
    p.drawText(tsLine2, { x: cx - fontBold.widthOfTextAtSize(tsLine2, 6.6) / 2, y: cy - 7, size: 6.6, font: fontBold, color: navy });
    p.drawText(`N° ${serialNo}`, { x: cx - fontMono.widthOfTextAtSize(`N° ${serialNo}`, 4.6) / 2, y: cy - 15.5, size: 4.6, font: fontMono, color: gray });
    const fpShort = shortFingerprint(fp);
    p.drawText(fpShort, { x: cx - fontMono.widthOfTextAtSize(fpShort, 5) / 2, y: cy - 24.5, size: 5, font: fontMono, color: navy });
  };

  /** Pied de page navy + liseré arc-en-ciel (sur TOUTES les pages) */
  const drawFooter = (p: any, pageNum: number) => {
    const footerH = 50;
    drawRainbowStrip(p, footerH, 4);
    p.drawRectangle({ x: 0, y: 0, width: pageWidth, height: footerH, color: navy });
    p.drawText('QRBag — Protection intelligente des bagages', {
      x: margin, y: footerH - 20, size: 9, font: fontBold, color: yellow,
    });
    p.drawText(
      `Généré le ${formatTimestamp(createdAt)} • Série ${serial} • qrbags.com`,
      { x: margin, y: footerH - 33, size: 6.4, font: fontRegular, color: headerWhite }
    );
    const pageTxt = `Page ${pageNum}`;
    p.drawText(pageTxt, {
      x: pageWidth - margin - fontBold.widthOfTextAtSize(pageTxt, 8),
      y: footerH - 20, size: 8, font: fontBold, color: white,
    });
    p.drawText('qrbags.com', {
      x: pageWidth - margin - fontRegular.widthOfTextAtSize('qrbags.com', 6.4),
      y: footerH - 33, size: 6.4, font: fontRegular, color: headerWhite,
    });
  };

  /** En-tête compact des pages de continuation (2+) */
  const drawContinuationHeader = (p: any, _pageNum: number) => {
    p.drawRectangle({ x: 0, y: pageHeight - 44, width: pageWidth, height: 44, color: navy });
    drawRainbowStrip(p, pageHeight - 49, 5);
    p.drawText(`QRBag — Attestation d'inventaire (suite)`, {
      x: margin, y: pageHeight - 28, size: 10.5, font: fontBold, color: white,
    });
    const codeText = `Code : ${data.code}`;
    p.drawText(codeText, {
      x: pageWidth - margin - fontBold.widthOfTextAtSize(codeText, 10.5),
      y: pageHeight - 28, size: 10.5, font: fontBold, color: yellow,
    });
  };

  const addContinuationPage = (pageNum: number) => {
    const p = pdfDoc.addPage(A4);
    drawContinuationHeader(p, pageNum);
    return p;
  };

  // ═══════════════ PAGE 1 — EN-TÊTE PREMIUM ═══════════════
  let page = pdfDoc.addPage(A4);
  let pageNum = 1;

  const HEADER_H = 138;
  page.drawRectangle({ x: 0, y: pageHeight - HEADER_H, width: pageWidth, height: HEADER_H, color: navy });
  // confettis discrets
  for (let i = 0; i < 12; i++) {
    const x = seededRand(i * 7 + 3) * pageWidth;
    const y = pageHeight - HEADER_H + 4 + seededRand(i * 7 + 4) * (HEADER_H - 10);
    page.drawCircle({ x, y, size: 0.8 + seededRand(i * 7 + 5) * 1.4, color: PALETTE[i % PALETTE.length], opacity: 0.35 });
  }
  drawRainbowStrip(page, pageHeight - HEADER_H - 5, 5);

  // ─── PLAQUE LOGO ARRONDIE (blanche, coins doux) ───
  const plateX = margin;
  const plateW = LOGO_W + 28;
  const plateH = 64;
  const plateY = pageHeight - 26 - plateH;
  drawRoundedRect(page, { x: plateX, y: plateY, w: plateW, h: plateH, r: 14, color: white });
  if (logoImage) {
    page.drawImage(logoImage, {
      x: plateX + 14,
      y: plateY + (plateH - LOGO_H) / 2,
      width: LOGO_W,
      height: LOGO_H,
    });
  } else {
    page.drawText('QRBag', { x: plateX + 20, y: plateY + 22, size: 20, font: fontBold, color: navy });
  }

  // ─── TITRES ───
  const titleX = plateX + plateW + 22;
  page.drawText("ATTESTATION D'INVENTAIRE", { x: titleX, y: pageHeight - 48, size: 14, font: fontBold, color: white });
  page.drawText('DE VOYAGE', { x: titleX, y: pageHeight - 66, size: 14, font: fontBold, color: yellow });
  page.drawText('Document officiel • qrbags.com', { x: titleX, y: pageHeight - 81, size: 7.5, font: fontRegular, color: headerWhite });
  const codeLabel = `N° ${data.code}`;
  page.drawText(codeLabel, { x: titleX, y: pageHeight - 102, size: 13, font: fontMono, color: white });
  const emittedLabel = `Émis le ${formatTimestamp(createdAt)}`;
  page.drawText(emittedLabel, { x: titleX, y: pageHeight - 116, size: 7.5, font: fontRegular, color: headerWhite });

  // ─── PLAQUE QR ARRONDIE (HAUT DU DOCUMENT, 1ʳᵉ PAGE) ───
  const QR_PLATE = 96;
  const qrPlateX = pageWidth - margin - QR_PLATE;
  const qrPlateY = pageHeight - 22 - QR_PLATE;
  drawRoundedRect(page, { x: qrPlateX, y: qrPlateY, w: QR_PLATE, h: QR_PLATE, r: 12, color: white });
  const qrImg = await pdfDoc.embedPng(qrBuffer);
  const QR_INNER = QR_PLATE - 14;
  page.drawImage(qrImg, { x: qrPlateX + 7, y: qrPlateY + 7, width: QR_INNER, height: QR_INNER });
  const scanTxt = 'SCANNEZ POUR VÉRIFIER';
  page.drawText(scanTxt, {
    x: qrPlateX + (QR_PLATE - fontBold.widthOfTextAtSize(scanTxt, 5.6)) / 2,
    y: qrPlateY - 11, size: 5.6, font: fontBold, color: yellow,
  });

  // ─── LIGNE MÉTA (sous le bandeau) ───
  let y = pageHeight - HEADER_H - 34;
  page.drawText(`Série : ${serial}`, { x: margin, y, size: 7.5, font: fontMono, color: gray });
  const docTypeTxt = 'Inventaire de bagage certifié — usage déclaratif';
  page.drawText(docTypeTxt, {
    x: pageWidth - margin - fontRegular.widthOfTextAtSize(docTypeTxt, 7.5),
    y, size: 7.5, font: fontRegular, color: gray,
  });

  y -= 16;

  // ═══════════════ CARTE VOYAGEUR & VOL + CACHET ROND ═══════════════
  const SEAL_ZONE = 158; // largeur réservée au cachet à droite
  const cardW = contentW - SEAL_ZONE - 10;
  const cardH = 158;
  const cardY = y - cardH;

  drawRoundedRect(page, { x: margin, y: cardY, w: cardW, h: cardH, r: 10, color: white, borderColor: lightGray, borderWidth: 1.1 });
  // barres d'accent gauche (azure + magenta)
  page.drawRectangle({ x: margin, y: cardY, width: 4.5, height: cardH, color: azure });
  page.drawRectangle({ x: margin + 4.5, y: cardY, width: 2, height: cardH, color: magenta });

  page.drawText('INFORMATIONS VOYAGEUR & VOL', { x: margin + 18, y: y - 18, size: 10, font: fontBold, color: navy });
  page.drawRectangle({ x: margin + 18, y: y - 23, width: 52, height: 2.5, color: orange });

  const padX = 18;
  const colW = (cardW - padX * 2 - 14) / 2;
  const infoLabel = (txt: string, x: number, yy: number) =>
    page.drawText(txt.toUpperCase(), { x, y: yy, size: 6, font: fontBold, color: gray });
  const infoValue = (txt: string, x: number, yy: number, size = 9.5) =>
    page.drawText(txt || '—', { x, y: yy, size, font: fontBold, color: navy, maxWidth: colW - 4 });

  // Colonne 1 : NOM / COMPAGNIE / DATE DE DÉPART
  infoLabel('Nom', margin + padX, y - 36);
  infoValue(data.lastName.toUpperCase(), margin + padX, y - 49);
  infoLabel('Compagnie aérienne', margin + padX, y - 72);
  infoValue(data.airline || '—', margin + padX, y - 85, 9);
  infoLabel('Date de départ', margin + padX, y - 108);
  infoValue(formatDateFr(data.departureDate), margin + padX, y - 121, 8.5);

  // Colonne 2 : PRÉNOM / N° DE VOL / DESTINATION
  const col2X = margin + padX + colW + 14;
  infoLabel('Prénom', col2X, y - 36);
  infoValue(data.firstName, col2X, y - 49);
  infoLabel('N° de vol', col2X, y - 72);
  infoValue(data.flightNumber || '—', col2X, y - 85, 9);
  infoLabel('Destination', col2X, y - 108);
  infoValue(data.destinationCountry, col2X, y - 121, 9);

  // Email (ligne pleine largeur, discret)
  infoLabel('Email', margin + padX, y - 140);
  page.drawText(data.email, { x: margin + padX, y: y - 150, size: 7, font: fontRegular, color: gray, maxWidth: cardW - padX * 2 });

  // Cachet rond à droite de la carte
  drawCertificationSeal(page, margin + contentW - SEAL_ZONE / 2, y - cardH / 2, 68, fingerprint, serial);

  y = cardY - 30;

  // ═══════════════ TABLEAU FACTURE — DÉTAIL DE L'INVENTAIRE ═══════════════
  page.drawText("DÉTAIL DE L'INVENTAIRE", { x: margin, y, size: 12, font: fontBold, color: navy });
  const countTxt = `${data.items.length} article${data.items.length > 1 ? 's' : ''}`;
  const tagW = fontBold.widthOfTextAtSize(countTxt, 7) + 16;
  drawTag(page, countTxt, pageWidth - margin - tagW, y - 6, orange, white, 7);
  page.drawRectangle({ x: margin, y: y - 7, width: 64, height: 3, color: orange });

  y -= 26;

  // Colonnes : N° | DÉSIGNATION | CATÉGORIE | QTÉ
  const colNoW = 30;
  const colQtyW = 42;
  const colCatW = 128;
  const colNoX = margin;
  const colDesX = margin + colNoW;
  const colCatX = margin + contentW - colQtyW - colCatW;
  const colQtyRightX = margin + contentW - 10;

  const catLabelFr: Record<string, string> = {};
  for (const cat of DEFAULT_CHECKLIST_CATEGORIES) catLabelFr[cat.id] = cat.label.fr;

  // Ordonner : catégories du catalogue d'abord, puis « Autres »
  const known: ChecklistItem[] = [];
  const unknown: ChecklistItem[] = [];
  for (const cat of DEFAULT_CHECKLIST_CATEGORIES) {
    for (const it of data.items) if (it.category === cat.id) known.push(it);
  }
  const knownKeys = new Set(known.map((it) => `${it.category}__${it.name}`));
  for (const it of data.items) if (!knownKeys.has(`${it.category}__${it.name}`)) unknown.push(it);
  const orderedItems = [...known, ...unknown];

  const drawInvoiceHeaderRow = (p: any, topY: number) => {
    p.drawRectangle({ x: margin, y: topY - 20, width: contentW, height: 20, color: navy });
    p.drawText('N°', { x: colNoX + 8, y: topY - 14, size: 7.5, font: fontBold, color: white });
    p.drawText('DÉSIGNATION', { x: colDesX + 8, y: topY - 14, size: 7.5, font: fontBold, color: white });
    p.drawText('CATÉGORIE', { x: colCatX + 8, y: topY - 14, size: 7.5, font: fontBold, color: white });
    const q = 'QTÉ';
    p.drawText(q, { x: colQtyRightX - fontBold.widthOfTextAtSize(q, 7.5), y: topY - 14, size: 7.5, font: fontBold, color: white });
    return topY - 20;
  };

  let rowTop = drawInvoiceHeaderRow(page, y);
  let rowIndex = 0;
  let totalUnits = 0;

  for (const item of orderedItems) {
    totalUnits += item.qty;

    // Saut de page (réserve pied de page)
    if (rowTop - 17 < 92) {
      page = addContinuationPage(++pageNum);
      rowTop = drawInvoiceHeaderRow(page, pageHeight - 66);
    }

    const isUnknown = !catLabelFr[item.category];
    const catMeta = isUnknown ? OTHER_COLOR : (CATEGORY_COLORS[item.category] || OTHER_COLOR);
    const catName = isUnknown ? 'Autres' : catLabelFr[item.category];
    const bandColor = rgbOf(catMeta.hex);
    const catTextColor = catMeta.darkText ? navy : bandColor;

    // Zébrage
    if (rowIndex % 2 === 1) {
      page.drawRectangle({ x: margin, y: rowTop - 17, width: contentW, height: 17, color: zebra });
    }
    // Filet bas
    page.drawLine({
      start: { x: margin, y: rowTop - 17 },
      end: { x: margin + contentW, y: rowTop - 17 },
      thickness: 0.5, color: lightGray,
    });

    // N° (mono, centré dans sa colonne)
    const noTxt = String(rowIndex + 1).padStart(2, '0');
    page.drawText(noTxt, { x: colNoX + (colNoW - fontMono.widthOfTextAtSize(noTxt, 7.5)) / 2, y: rowTop - 12, size: 7.5, font: fontMono, color: gray });

    // DÉSIGNATION (+ détails couleur/marque en fin de ligne si la place le permet)
    let displayName = item.name;
    const details: string[] = [];
    if (item.color) details.push(item.color);
    if (item.brand) details.push(item.brand);
    const desMax = colCatX - colDesX - 26;
    page.drawText(displayName, { x: colDesX + 8, y: rowTop - 11.5, size: 8.5, font: fontBold, color: navy, maxWidth: desMax });
    if (details.length) {
      const nameW = Math.min(fontBold.widthOfTextAtSize(displayName, 8.5), desMax);
      let detTxt = `— ${details.join(' · ')}`;
      const detMax = colCatX - (colDesX + 8 + nameW + 6) - 8;
      while (detTxt.length > 3 && fontRegular.widthOfTextAtSize(detTxt, 6.8) > detMax) {
        detTxt = detTxt.slice(0, -2) + '…';
      }
      if (detMax > 30) {
        page.drawText(detTxt, { x: colDesX + 8 + nameW + 6, y: rowTop - 11.5, size: 6.8, font: fontRegular, color: gray, maxWidth: detMax });
      }
    }

    // CATÉGORIE : pastille ronde colorée + libellé
    page.drawCircle({ x: colCatX + 13, y: rowTop - 8.5, size: 2.6, color: bandColor });
    page.drawText(catName, { x: colCatX + 20, y: rowTop - 11, size: 7.3, font: fontBold, color: catTextColor, maxWidth: colCatW - 26 });

    // QTÉ (alignée à droite)
    const qtyTxt = `×${item.qty}`;
    page.drawText(qtyTxt, { x: colQtyRightX - fontBold.widthOfTextAtSize(qtyTxt, 8.5), y: rowTop - 11.5, size: 8.5, font: fontBold, color: navy });

    rowTop -= 17;
    rowIndex++;
  }

  // Ligne TOTAL (navy)
  if (rowTop - 22 < 92) {
    page = addContinuationPage(++pageNum);
    rowTop = pageHeight - 66;
  }
  page.drawRectangle({ x: margin, y: rowTop - 22, width: contentW, height: 22, color: navy });
  page.drawText('TOTAL', { x: colDesX + 8, y: rowTop - 15, size: 8.5, font: fontBold, color: yellow });
  const totalTxt = `${data.items.length} article${data.items.length > 1 ? 's' : ''} • ${totalUnits} unité${totalUnits > 1 ? 's' : ''} déclarée${totalUnits > 1 ? 's' : ''}`;
  page.drawText(totalTxt, {
    x: colQtyRightX - fontBold.widthOfTextAtSize(totalTxt, 7.5),
    y: rowTop - 15, size: 7.5, font: fontBold, color: white,
  });

  rowTop -= 36;

  // ═══════════════ BLOC VÉRIFICATION (arrondi, pointillé) ═══════════════
  if (rowTop - 74 < 92) {
    page = addContinuationPage(++pageNum);
    rowTop = pageHeight - 66;
  }
  const keyBoxH = 74;
  drawRoundedRect(page, {
    x: margin, y: rowTop - keyBoxH, w: contentW, h: keyBoxH, r: 10,
    color: rgb(0.976, 0.98, 0.996), borderColor: navy, borderWidth: 1.4, borderDashArray: [5, 3],
  });
  page.drawText('CLÉ DE VÉRIFICATION', { x: margin + 14, y: rowTop - 18, size: 8.5, font: fontBold, color: navy });
  page.drawText('Requise pour consulter le document en ligne', { x: margin + 14, y: rowTop - 27, size: 6, font: fontRegular, color: gray });
  page.drawText(data.verificationKey, { x: margin + 14, y: rowTop - 52, size: 19, font: fontMono, color: magenta });

  // Empreinte complète (2 lignes de 32 + espaces)
  const fpLine1 = (fingerprint.slice(0, 32).match(/.{4}/g) || []).join(' ');
  const fpLine2 = (fingerprint.slice(32, 64).match(/.{4}/g) || []).join(' ');
  const fpBlockX = pageWidth - margin - 224;
  page.drawText('Empreinte SHA-256 — infalsifiable', { x: fpBlockX, y: rowTop - 18, size: 6.2, font: fontBold, color: gray });
  page.drawText(fpLine1, { x: fpBlockX, y: rowTop - 32, size: 6.4, font: fontMono, color: navy });
  page.drawText(fpLine2, { x: fpBlockX, y: rowTop - 42, size: 6.4, font: fontMono, color: navy });
  page.drawText('Vérifiez cette empreinte sur qrbags.com', { x: fpBlockX, y: rowTop - 55, size: 5.8, font: fontRegular, color: gray });

  // Tag « À CONSERVER »
  const keepW = drawTag(page, 'À CONSERVER', pageWidth - margin - 86, rowTop - keyBoxH - 2, orange, white, 7);
  void keepW;

  // ═══════════════ PIEDS DE PAGE ═══════════════
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
