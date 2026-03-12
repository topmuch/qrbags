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

// Generate unique reference using raw SQL for compatibility
export async function generateReference(type: 'hajj' | 'voyageur'): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = type === 'hajj' ? 'HAJJ' : 'VOL';
  
  let reference = '';
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    reference = `${prefix}${year}-${generateRandomCode(6)}`;
    
    try {
      // Use raw SQL to check if reference exists (avoids missing column errors)
      const result = await db.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*) as count FROM Baggage WHERE reference = ${reference}
      `;
      
      if (result[0].count === 0) {
        return reference;
      }
    } catch (error) {
      // If query fails, assume reference is unique
      console.error('Error checking reference uniqueness:', error);
      return reference;
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique reference');
}

// Generate multiple baggages for a traveler
export interface GenerateBaggageOptions {
  type: 'hajj' | 'voyageur';
  agencyId?: string;
  count: 1 | 3;
}

// Generate baggage with individual traveler info
export interface GenerateIndividualOptions {
  type: 'hajj' | 'voyageur';
  firstName: string;
  lastName: string;
  whatsapp: string;
  duration: '7d' | '1y';
  baggageCount: 1 | 3;
}

// Generate unique set ID
export function generateSetId(type: 'hajj' | 'voyageur'): string {
  const year = new Date().getFullYear();
  const prefix = type === 'hajj' ? 'HAJJ' : 'VOL';
  const random = generateRandomCode(4);
  return `${prefix}-${year}-${random}`;
}

// Calculate expiration date based on type
export function calculateExpirationDate(type: 'hajj' | 'voyageur', subtype?: 'sticker' | 'tag'): Date {
  const now = new Date();
  
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
      color: 'text-emerald-600',
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

// Generate CUID-like ID
export function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}`;
}
