/**
 * Régénère les 3 images hero de la page d'accueil QRBag
 * avec des hommes/femmes noirs à l'aéroport ou en voyage.
 * Taille : 864x1152 (portrait, identique aux images actuelles)
 */
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const OUT_DIR = 'public/images/landing-v2';

const images: Array<{ file: string; prompt: string }> = [
  {
    file: 'hero-woman-traveler.png',
    prompt:
      'Professional lifestyle photography of a beautiful young Black African woman traveler in a modern airport terminal, smiling confidently, pulling a stylish navy blue suitcase with a purple and orange QR code luggage tag attached, wearing an elegant orange headwrap and chic travel outfit, large glass windows with airplanes visible outside, warm golden natural light, cinematic depth of field, high quality, detailed, photorealistic',
  },
  {
    file: 'hero-man-scanning.png',
    prompt:
      'Professional lifestyle photography of a smiling Black African man in a modern airport departure hall, scanning a QR code luggage tag on his navy suitcase with his smartphone, wearing a smart casual violet shirt, luggage trolley with bags beside him, departure boards and glass architecture in background, natural daylight, cinematic, photorealistic, high quality, detailed',
  },
  {
    file: 'hero-family-travel.png',
    prompt:
      'Professional lifestyle photography of a happy Black African family at a modern airport, elegant mother and father walking with their two cheerful children, pulling colorful suitcases with QR code luggage tags, bright modern terminal with large windows and airplane visible, warm sunlight, joyful authentic moment, cinematic, photorealistic, high quality, detailed',
  },
];

async function generateWithRetry(zai: Awaited<ReturnType<typeof ZAI.create>>, prompt: string, size: string, retries = 3) {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await zai.images.generations.create({ prompt, size });
      const base64 = response.data?.[0]?.base64;
      if (!base64) throw new Error('Réponse vide de l\'API de génération');
      return Buffer.from(base64, 'base64');
    } catch (err) {
      lastError = err as Error;
      console.error(`  Tentative ${attempt}/${retries} échouée : ${lastError.message}`);
      if (attempt < retries) await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  throw lastError ?? new Error('Échec de génération');
}

async function main() {
  const zai = await ZAI.create();
  for (const { file, prompt } of images) {
    const outPath = `${OUT_DIR}/${file}`;
    const backupPath = `${outPath}.old.bak`;
    try {
      // Sauvegarde de l'ancienne image
      if (fs.existsSync(outPath)) fs.copyFileSync(outPath, backupPath);
      console.log(`Génération de ${file}…`);
      const buffer = await generateWithRetry(zai, prompt, '864x1152');
      fs.writeFileSync(outPath, buffer);
      console.log(`✓ ${file} générée (${(buffer.length / 1024).toFixed(0)} Ko)`);
    } catch (err) {
      console.error(`✗ Échec définitif pour ${file} : ${(err as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log('Terminé.');
}

main();
