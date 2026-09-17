// Vérification ASR des guides QRTags — backoff anti-429
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const DIR = '/home/z/voicetest/qrtags/norm/asr';
const files = [
  'scan-guide-fr.wav',
  'scan-guide-en.wav',
  'scan-guide-ar.wav',
  'confirm-guide-fr.wav',
  'confirm-guide-en.wav',
  'confirm-guide-ar.wav',
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function transcribe(zai, filePath, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      const b64 = fs.readFileSync(filePath).toString('base64');
      const res = await zai.audio.asr.create({ file_base64: b64 });
      return res.text || '';
    } catch (e) {
      const msg = String(e?.message || e);
      if (i < tries - 1) {
        const wait = 4000 * (i + 1) + Math.floor(Math.random() * 2000);
        console.log(`  [retry ${i + 1}] ${msg.slice(0, 60)} — attente ${Math.round(wait / 1000)} s`);
        await sleep(wait);
      } else {
        return `ERREUR: ${msg}`;
      }
    }
  }
}

const zai = await ZAI.create();
for (const f of files) {
  const text = await transcribe(zai, `${DIR}/${f}`);
  console.log(`\n=== ${f} ===\n${text}`);
  await sleep(4000);
}
