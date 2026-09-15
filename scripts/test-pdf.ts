/**
 * Test standalone du générateur PDF QRBag (exécuté via bun)
 * Génère /tmp/test-qrbag.pdf avec 12 articles multi-catégories.
 */
import { generateChecklistPdf, type ChecklistPdfData } from '../src/lib/checklist';

const data: ChecklistPdfData = {
  code: 'K7P3MQ',
  verificationKey: 'Xk29fmQz',
  firstName: 'Aïssatou',
  lastName: 'Diallo',
  email: 'aissatou.diallo@example.com',
  departureDate: '2026-07-21',
  destinationCountry: 'Paris, France',
  airline: 'Air France',
  flightNumber: 'AF 0723',
  items: [
    { category: 'women', name: 'Robes', qty: 3, checked: true, color: 'Noir', brand: 'Zara' },
    { category: 'women', name: 'Jupes', qty: 2, checked: true },
    { category: 'women', name: 'Blouses', qty: 4, checked: true, color: 'Blanc' },
    { category: 'men', name: 'Chemises', qty: 3, checked: true, color: 'Bleu', brand: "Levi's" },
    { category: 'men', name: 'Costumes', qty: 1, checked: true, color: 'Bleu marine' },
    { category: 'children', name: 'T-shirts enfant', qty: 5, checked: true, color: 'Multicolore' },
    { category: 'children', name: 'Doudou / peluche', qty: 1, checked: true, color: 'Marron' },
    { category: 'electronics', name: 'Téléphone', qty: 1, checked: true, brand: 'Samsung' },
    { category: 'electronics', name: 'Batterie externe', qty: 2, checked: true },
    { category: 'shoes', name: 'Baskets', qty: 2, checked: true, color: 'Blanc', brand: 'Nike' },
    { category: 'toiletries', name: 'Parfum', qty: 1, checked: true, brand: 'Chanel' },
    { category: 'misc', name: 'Gourde', qty: 1, checked: true },
  ],
  publicUrl: 'https://qrbags.com/checklist/K7P3MQ',
  createdAt: new Date(),
};

const buffer = await generateChecklistPdf(data);
await Bun.write('/tmp/test-qrbag.pdf', buffer);
console.log(`✓ PDF généré : /tmp/test-qrbag.pdf (${(buffer.length / 1024).toFixed(1)} Ko)`);
