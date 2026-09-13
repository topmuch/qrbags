import { Buffer } from 'buffer';

// Dynamic import cache (bypasses Turbopack bundling, works with serverExternalPackages)
let _qrCodeModule: any = null;
async function loadQRCode() {
  if (!_qrCodeModule) {
    _qrCodeModule = await import('qrcode');
  }
  return _qrCodeModule;
}

/**
 * QR Code Server-Side Generation Module
 * Generates QR code PNG images on the server for bulk export.
 * Each QR code encodes the scan URL: https://domain/scan/{reference}
 */

export interface QRCodeImageOptions {
  reference: string;
  type: 'hajj' | 'voyageur';
  baggageIndex: number;
  baggageType: string;
  baseUrl?: string;
  size?: number; // PNG width/height in pixels (default 400)
}

export interface GeneratedQRImage {
  reference: string;
  baggageIndex: number;
  baggageType: string;
  buffer: Buffer;
  filename: string;
}

/**
 * Generate a single QR code PNG image buffer
 */
export async function generateQRCodeImage(options: QRCodeImageOptions): Promise<GeneratedQRImage> {
  const {
    reference,
    type,
    baggageIndex,
    baggageType,
    baseUrl = '',
    size = 400,
  } = options;

  const scanUrl = baseUrl ? `${baseUrl}/scan/${reference}` : `/scan/${reference}`;
  const qrColor = type === 'hajj' ? '#0d5e34' : '#1D4ED8';
  const labelColor = type === 'hajj' ? '#0d5e34' : '#1D4ED8';

  // Load qrcode (dynamic import, bypasses Turbopack bundling)
  const QRCode = await loadQRCode();

  // Generate QR code as PNG buffer with high quality
  const qrBuffer = await QRCode.toBuffer(scanUrl, {
    type: 'png',
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: qrColor,
      light: '#ffffff',
    },
  });

  const filename = `bagage-${baggageIndex}-${baggageType}-${reference}.png`;

  return {
    reference,
    baggageIndex,
    baggageType,
    buffer: qrBuffer,
    filename,
  };
}

/**
 * Generate QR code images for multiple baggages grouped by passenger (setId)
 * Returns a map of setId -> GeneratedQRImage[]
 */
export async function generateQRCodeImagesForBaggages(
  baggages: Array<{
    reference: string;
    type: string;
    setId: string | null;
    baggageIndex: number;
    baggageType: string;
    travelerFirstName: string | null;
    travelerLastName: string | null;
  }>,
  baseUrl?: string,
): Promise<Map<string, GeneratedQRImage[]>> {
  const groupedBySetId = new Map<string, GeneratedQRImage[]>();

  // Process in batches of 50 to avoid memory issues
  const batchSize = 50;
  
  for (let i = 0; i < baggages.length; i += batchSize) {
    const batch = baggages.slice(i, i + batchSize);
    
    const results = await Promise.all(
      batch.map(async (baggage) => {
        const image = await generateQRCodeImage({
          reference: baggage.reference,
          type: baggage.type as 'hajj' | 'voyageur',
          baggageIndex: baggage.baggageIndex,
          baggageType: baggage.baggageType,
          baseUrl,
        });

        const setId = baggage.setId || baggage.reference.split('-')[0];
        return { setId, image };
      })
    );

    for (const { setId, image } of results) {
      if (!groupedBySetId.has(setId)) {
        groupedBySetId.set(setId, []);
      }
      groupedBySetId.get(setId)!.push(image);
    }
  }

  // Sort images within each set by baggageIndex
  for (const [, images] of groupedBySetId) {
    images.sort((a, b) => a.baggageIndex - b.baggageIndex);
  }

  return groupedBySetId;
}

/**
 * Format a passenger folder name
 * Example: "Passager-001-HAJJ-2026-ABCD" or "Passager-001-Ahmed-DIOP"
 */
export function formatPassengerFolderName(
  index: number,
  setId: string,
  firstName?: string | null,
  lastName?: string | null,
): string {
  const paddedIndex = String(index + 1).padStart(3, '0');
  
  if (firstName && lastName) {
    const cleanFirst = firstName.replace(/[^a-zA-ZÀ-ÿ]/g, '').substring(0, 15);
    const cleanLast = lastName.replace(/[^a-zA-ZÀ-ÿ]/g, '').substring(0, 15);
    return `Passager-${paddedIndex}-${cleanFirst}-${cleanLast}`;
  }
  
  return `Passager-${paddedIndex}-${setId}`;
}
