import { db } from './db';

// Generate random alphanumeric string
export function generateRandomCode(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate unique reference (single - for individual use)
export async function generateReference(type: 'hajj' | 'voyageur'): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = type === 'hajj' ? 'HAJJ' : 'VOL';
  
  let reference = '';
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    reference = `${prefix}${year}-${generateRandomCode(6)}`;
    
    const existing = await db.baggage.findUnique({
      where: { reference }
    });
    
    if (!existing) {
      return reference;
    }
    attempts++;
  }
  
  throw new Error('Failed to generate unique reference');
}

/**
 * Generate multiple unique references in bulk - MUCH faster than calling generateReference one-by-one.
 * Generates all candidates, then checks uniqueness in a single DB query.
 * Replaces any duplicates and re-checks until all are unique.
 */
export async function generateReferencesBulk(type: 'hajj' | 'voyageur', count: number): Promise<string[]> {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = type === 'hajj' ? 'HAJJ' : 'VOL';
  const uniqueRefs = new Set<string>();
  let iterations = 0;
  const maxIterations = 10; // Safety limit

  while (uniqueRefs.size < count && iterations < maxIterations) {
    // Generate candidates to fill the remaining slots
    const needed = count - uniqueRefs.size;
    const candidates: string[] = [];
    for (let i = 0; i < needed; i++) {
      candidates.push(`${prefix}${year}-${generateRandomCode(6)}`);
    }

    // Check which ones already exist in DB (single query for all)
    const existing = await db.baggage.findMany({
      where: { reference: { in: candidates } },
      select: { reference: true },
    });
    const existingSet = new Set(existing.map(b => b.reference));

    // Add non-existing candidates
    for (const candidate of candidates) {
      if (!existingSet.has(candidate) && !uniqueRefs.has(candidate)) {
        uniqueRefs.add(candidate);
      }
    }

    iterations++;
  }

  if (uniqueRefs.size < count) {
    throw new Error(`Failed to generate ${count} unique references (only got ${uniqueRefs.size})`);
  }

  return Array.from(uniqueRefs);
}

// Generate multiple baggages for a traveler
export interface GenerateBaggageOptions {
  type: 'hajj' | 'voyageur';
  agencyId?: string;
  count: 1 | 2;
}

// Generate baggage with individual traveler info
export interface GenerateIndividualOptions {
  type: 'hajj' | 'voyageur';
  firstName: string;
  lastName: string;
  whatsapp: string;
  duration: '7d' | '1y';
  baggageCount: 1 | 2;
}

// Generate unique set ID
export function generateSetId(type: 'hajj' | 'voyageur'): string {
  const year = new Date().getFullYear();
  const prefix = type === 'hajj' ? 'HAJJ' : 'VOL';
  const random = generateRandomCode(4);
  return `${prefix}-${year}-${random}`;
}

/**
 * @deprecated Use bulk generation from the API route instead for large batches.
 * This function is kept for backwards compatibility with small individual generations.
 */
export async function generateBaggages(options: GenerateBaggageOptions): Promise<string[]> {
  const { type, agencyId, count } = options;

  // Generate a unique set ID for this batch
  const setId = generateSetId(type);

  // Use bulk reference generation for efficiency
  const references = await generateReferencesBulk(type, count);

  // Batch create all baggages at once
  await db.baggage.createMany({
    data: references.map((reference, i) => ({
      reference,
      type,
      setId,
      agencyId: agencyId || null,
      baggageIndex: i + 1,
      baggageType: 'soute',
      status: 'pending_activation',
    })),
  });

  return references;
}

// Calculate expiration date based on type
// Supports both legacy mode (type+subtype) and new explicit duration mode.
// New duration enum (superadmin-selectable): '1m' | '3m' | '6m' | '1y'
export type QrDuration = '1m' | '3m' | '6m' | '1y';

// Map duration code → milliseconds
const DURATION_MS: Record<QrDuration, number> = {
  '1m': 30 * 24 * 60 * 60 * 1000,   // ~30 days
  '3m': 90 * 24 * 60 * 60 * 1000,   // ~90 days
  '6m': 180 * 24 * 60 * 60 * 1000,  // ~180 days
  '1y': 365 * 24 * 60 * 60 * 1000,  // ~365 days
};

// Human-readable labels for UI (French)
export const DURATION_LABELS: Record<QrDuration, string> = {
  '1m': '1 mois',
  '3m': '3 mois',
  '6m': '6 mois',
  '1y': '1 an',
};

export function calculateExpirationDate(
  type: 'hajj' | 'voyageur',
  subtype?: 'sticker' | 'tag',
  duration?: QrDuration
): Date {
  const now = new Date();

  // NEW: explicit duration wins over legacy type/subtype logic
  if (duration && DURATION_MS[duration]) {
    return new Date(now.getTime() + DURATION_MS[duration]);
  }

  // LEGACY fallback (used by /api/activate for public traveler activations)
  switch (type) {
    case 'hajj':
      return new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // +60 days
    case 'voyageur':
      if (subtype === 'tag') {
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // +365 days
      }
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days (sticker)
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
  }
}

// Validate reference format
export function isValidReferenceFormat(reference: string): boolean {
  const hajjPattern = /^HAJJ\d{2}-[A-Z0-9]{6}$/;
  const volPattern = /^VOL\d{2}-[A-Z0-9]{6}$/;
  return hajjPattern.test(reference) || volPattern.test(reference);
}

// Get baggage status info
export function getBaggageStatusInfo(status: string) {
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    pending_activation: {
      label: 'En attente d\'activation',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    active: {
      label: 'Actif',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    scanned: {
      label: 'Scanné',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    lost: {
      label: 'Perdu',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    found: {
      label: 'Retrouvé',
      color: 'text-blue-700',
      bgColor: 'bg-emerald-100'
    },
    blocked: {
      label: 'Bloqué',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  };
  
  return statusMap[status] || {
    label: status,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  };
}
