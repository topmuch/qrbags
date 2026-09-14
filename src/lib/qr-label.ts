import { Buffer } from 'buffer';
import path from 'path';

/**
 * QRBag — Génération d'étiquettes QR prêtes à imprimer (7 × 10 cm)
 *
 * Chaque QR code généré est composé sur le design officiel QRBag
 * (« Scannez pour contacter le propriétaire ») pour obtenir une
 * étiquette bagage imprimable directement au format 7 cm × 10 cm.
 *
 * - Résolution : design natif 1049 × 1499 px ≈ 381 DPI (qualité impression)
 * - Métadonnées PNG pHYs définies pour un physical size EXACT de 7 × 10 cm
 * - PDF : page de exactement 198.42 × 283.46 pt (= 7 × 10 cm) pour impression
 * - QR positionné dans l'encadré blanc du design, en évitant les 4 coins
 *   décoratifs, avec zone de silence (quiet zone) suffisante pour le scan
 */

// ─── Géométrie du design officiel 2025 (mesurée précisément sur l'artwork ori.png) ───
const DESIGN_WIDTH = 1049;
const DESIGN_HEIGHT = 1499;

// Largeur physique cible : 7 cm → DPI effectif du design natif
// 1049 px / (70 mm / 25.4) = 380.87 DPI → imprime exactement 7 × 10 cm
const DESIGN_DPI = DESIGN_WIDTH / (70 / 25.4); // ≈ 380.87

// Zone QR mesurée : encadré blanc intérieur aux 4 coins décoratifs (viewfinder)
//   bracket TL : coin (248,650), bras → x:398 / y:750, épaisseur ~26 px
//   bracket TR : coin (775,650), bras → x:663 / y:801
//   bracket BL : coin (248,1155), bras → y:1010
//   bracket BR : coin (799,1155), bras → x:647 / y:1011
// Zone sûre intérieure : x:275-770, y:680-1150 (495 × 470 px)
// QR 420 px centré (522, 915) → x:312-732, y:705-1125 (marges ≥ 25 px +
//   quiet zone du générateur ≈ 1 module → ~3 modules de silence au total)
const QR_RECT = { left: 312, top: 705, size: 420 };

// Couleur QR : noir pur (comme l'artwork officiel), contraste maximal → scan optimal
const QR_DARK_COLOR = '#000000';

// Format PDF : 7 cm × 10 cm en points PDF (1 pt = 1/72 pouce)
const PDF_WIDTH_PT = 70 / 25.4 * 72;  // 198.42 pt
const PDF_HEIGHT_PT = 100 / 25.4 * 72; // 283.46 pt

// ─── Cache du design (lecture disque une seule fois) ───
let _designBuffer: Buffer | null = null;
async function loadDesign(): Promise<Buffer> {
  if (!_designBuffer) {
    const fs = await import('fs/promises');
    const designPath = path.join(process.cwd(), 'public', 'design', 'etiquette-qrbag-7x10.png');
    _designBuffer = await fs.readFile(designPath);
  }
  return _designBuffer;
}

export interface QrLabelOptions {
  reference: string;
  /** URL complète encodée dans le QR (ex: https://qrbags.com/scan/REF) */
  scanUrl: string;
}

export interface GeneratedQrLabel {
  png: Buffer;
  pdf: Buffer;
  filenameBase: string;
}

/**
 * Génère le buffer PNG du QR seul (haute qualité, prêt à composer)
 */
async function generateQrBuffer(scanUrl: string): Promise<Buffer> {
  const QRCode = await import('qrcode');
  return QRCode.toBuffer(scanUrl, {
    type: 'png',
    width: QR_RECT.size,
    margin: 1, // le carré blanc du design sert de quiet zone principale
    errorCorrectionLevel: 'Q',
    color: {
      dark: QR_DARK_COLOR,
      light: '#ffffff',
    },
  });
}

/**
 * Génère l'étiquette complète (design + QR) en PNG print-ready 7 × 10 cm.
 * Les métadonnées de densité (pHYs) garantissent une impression à
 * exactement 7 cm × 10 cm, sans mise à l'échelle dans le logiciel d'impression.
 *
 * Optimisations : alpha aplati sur blanc (poids ÷ 4, ~464 Ko) + compression
 * maximale — qualité lossless préservée pour l'impression.
 */
export async function generateQrLabelPng(options: QrLabelOptions): Promise<Buffer> {
  const { scanUrl } = options;
  const [design, qrBuffer] = await Promise.all([loadDesign(), generateQrBuffer(scanUrl)]);

  const sharp = (await import('sharp')).default;
  return sharp(design)
    .composite([
      {
        input: qrBuffer,
        left: QR_RECT.left,
        top: QR_RECT.top,
      },
    ])
    .flatten({ background: '#ffffff' })
    .png({ compressionLevel: 9, effort: 7 })
    .withMetadata({ density: DESIGN_DPI })
    .toBuffer();
}

/**
 * Génère l'étiquette en PDF print-ready : page de exactement 7 × 10 cm
 * contenant l'étiquette en pleine page. Idéal pour l'impression (aucune
 * ambiguïté de dimensions, contrairement au PNG redimensionnable).
 *
 * L'image est incorporée en JPEG q92 (~300 Ko au lieu de 1,9 Mo en PNG)
 * — qualité visuelle et scanabilité du QR inchangées à 381 DPI.
 */
export async function generateQrLabelPdf(options: QrLabelOptions): Promise<Buffer> {
  const [design, qrBuffer] = await Promise.all([loadDesign(), generateQrBuffer(options.scanUrl)]);

  const sharp = (await import('sharp')).default;
  const jpeg = await sharp(design)
    .composite([{ input: qrBuffer, left: QR_RECT.left, top: QR_RECT.top }])
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 92 })
    .toBuffer();

  const { PDFDocument } = await import('pdf-lib');

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PDF_WIDTH_PT, PDF_HEIGHT_PT]);
  const image = await pdf.embedJpg(jpeg);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: PDF_WIDTH_PT,
    height: PDF_HEIGHT_PT,
  });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

/**
 * Génère l'étiquette en PNG + PDF avec les noms de fichiers standards
 */
export async function generateQrLabel(options: QrLabelOptions): Promise<GeneratedQrLabel> {
  const [png, pdf] = await Promise.all([
    generateQrLabelPng(options),
    generateQrLabelPdf(options),
  ]);

  return {
    png,
    pdf,
    filenameBase: `ETIQUETTE-7x10cm-${options.reference}`,
  };
}
