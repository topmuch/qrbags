/**
 * Task 2b: Generate 18 clothing product images for travel checklist web app.
 *
 * Each image: clean e-commerce product photo, pure white background, centered,
 * soft shadows, professional studio lighting, 1024x1024, no text/watermark.
 *
 * Uses bounded concurrency (CONCURRENCY at a time) to avoid 429 rate-limit
 * errors from the image-gen API. Each generation has up to MAX_ATTEMPTS
 * attempts with exponential backoff (longer backoff for 429 responses).
 *
 * Skip already-existing files so we can resume after a partial run.
 */

// Import from the GLOBAL SDK install (v0.0.18) — the local qrbags install
// (v0.0.16) does NOT send the `X-Token` header required by the image-gen
// API and 401s. The global install is what the `z-ai` CLI uses and it works.
// Use an absolute import path so bun resolves the global module regardless of cwd.
// @ts-ignore — no type declarations needed at runtime
import ZAI from '/home/z/.bun/install/global/node_modules/z-ai-web-dev-sdk/dist/index.js';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/home/z/my-project/qrbags/public/items/clothing';
const CONCURRENCY = 3; // parallel in-flight requests
const MAX_ATTEMPTS = 6; // initial + 5 retries
const SKIP_EXISTING = true; // resume support

type Item = { slug: string; subject: string };

const ITEMS: Item[] = [
  { slug: 't-shirts', subject: 'a neatly folded stack of 3 white cotton t-shirts' },
  { slug: 'chemises', subject: 'a neatly folded white button-up dress shirt' },
  { slug: 'polos', subject: 'a folded light blue short-sleeve collared polo shirt' },
  { slug: 'pulls', subject: 'a folded beige cream knit sweater' },
  { slug: 'vestes', subject: 'a casual dark gray jacket' },
  { slug: 'manteaux', subject: 'a long camel beige winter coat' },
  { slug: 'pantalons', subject: 'a pair of neatly folded black dress pants' },
  { slug: 'jeans', subject: 'a pair of neatly folded blue denim jeans' },
  { slug: 'shorts', subject: 'a pair of folded beige chino shorts' },
  { slug: 'jupes', subject: 'a navy blue pleated skirt' },
  { slug: 'robes', subject: 'a floral pattern summer dress' },
  { slug: 'costumes', subject: 'a dark navy mens suit jacket on a wooden hanger' },
  { slug: 'cravates', subject: 'three rolled mens ties, one red, one blue, one black' },
  { slug: 'ceintures', subject: 'a coiled brown leather belt with metal buckle' },
  { slug: 'sous-vetements', subject: 'a small neatly folded stack of white cotton underwear briefs' },
  { slug: 'chaussettes', subject: 'a neatly folded pair of white cotton socks' },
  { slug: 'pyjamas', subject: 'a folded light blue striped pajama set, top and bottom' },
  { slug: 'maillots-de-bain', subject: 'a navy blue mens swim trunk swimsuit' },
];

function buildPrompt(subject: string): string {
  return (
    `A clean e-commerce product photo of ${subject}, ` +
    `pure white background, centered composition, soft drop shadows, ` +
    `professional studio lighting, sharp focus, high detail, ` +
    `no text, no watermark, no logo, square 1024x1024`
  );
}

function isRateLimitError(msg: string): boolean {
  return /status 429|Too many requests/i.test(msg);
}

async function generateOne(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  item: Item,
): Promise<{ slug: string; ok: boolean; path?: string; bytes?: number; error?: string; attempts: number; skipped?: boolean }> {
  const outPath = path.join(OUTPUT_DIR, `${item.slug}.png`);
  const prompt = buildPrompt(item.subject);

  // Skip if already exists with reasonable size (resume support)
  if (SKIP_EXISTING && fs.existsSync(outPath)) {
    const st = fs.statSync(outPath);
    if (st.size > 5_000) {
      console.log(`SKIP [${item.slug}] already exists (${st.size} bytes)`);
      return { slug: item.slug, ok: true, path: outPath, bytes: st.size, attempts: 0, skipped: true };
    }
  }

  let lastError: string | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await zai.images.generations.create({
        prompt,
        size: '1024x1024',
      });

      const b64 = response?.data?.[0]?.base64;
      if (!b64) throw new Error('API returned no base64 image data');

      const buffer = Buffer.from(b64, 'base64');
      if (buffer.length < 1024) throw new Error(`Image buffer too small: ${buffer.length} bytes`);

      fs.writeFileSync(outPath, buffer);

      console.log(`OK   [${item.slug}] attempt ${attempt} -> ${outPath} (${buffer.length} bytes)`);
      return { slug: item.slug, ok: true, path: outPath, bytes: buffer.length, attempts: attempt };
    } catch (err: any) {
      lastError = err?.message ?? String(err);
      const rl = isRateLimitError(lastError);
      // Backoff: 429 -> longer waits (4s, 8s, 16s, 30s, 60s); other errors -> 2s, 4s, 8s, 16s, 30s
      const baseWait = rl ? 4000 : 2000;
      const wait = attempt < MAX_ATTEMPTS ? Math.min(baseWait * Math.pow(2, attempt - 1), 60000) : 0;
      console.error(
        `FAIL [${item.slug}] attempt ${attempt}/${MAX_ATTEMPTS}${rl ? ' (429)' : ''}: ${lastError.slice(0, 200)}` +
          (wait ? ` -> retry in ${Math.round(wait / 1000)}s` : ''),
      );
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    }
  }

  return { slug: item.slug, ok: false, error: lastError, attempts: MAX_ATTEMPTS };
}

// Bounded concurrency runner
async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, idx: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function next(): Promise<void> {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      results[idx] = await worker(items[idx], idx);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => next());
  await Promise.all(workers);
  return results;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Initializing Z-AI SDK...`);
  const zai = await ZAI.create();
  console.log(
    `SDK ready. Generating ${ITEMS.length} images with concurrency=${CONCURRENCY}, max_attempts=${MAX_ATTEMPTS} to ${OUTPUT_DIR}/\n`,
  );

  const results = await runWithConcurrency(ITEMS, CONCURRENCY, (item) => generateOne(zai, item));

  console.log('\n=== SUMMARY ===');
  const ok = results.filter((r) => r.ok);
  const fail = results.filter((r) => !r.ok);
  const generated = ok.filter((r) => !r.skipped);
  console.log(
    `Total: ${ITEMS.length} | Success: ${ok.length} (newly generated: ${generated.length}, skipped: ${ok.length - generated.length}) | Failed: ${fail.length}`,
  );
  if (fail.length > 0) {
    console.log(`\nFailed items:`);
    for (const f of fail) console.log(`  - ${f.slug}: ${f.error}`);
  }
  console.log(`\nFiles on disk:`);
  for (const r of ok) {
    console.log(`  ${r.path}  (${r.bytes} bytes${r.skipped ? ', skipped (already existed)' : `, attempt ${r.attempts}`})`);
  }

  if (fail.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error in main():', err);
  process.exit(2);
});

