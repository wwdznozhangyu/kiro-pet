/**
 * build-wordbank — scale the Kiro Pet word bank up to N high-frequency words.
 *
 * Reads a FREQUENCY-ORDERED source word list and produces validated, de-duplicated
 * per-exam JSON banks in resources/wordbanks/. Because the source is ordered by
 * frequency (most frequent first), the first N entries are taken as the "top N
 * high-frequency words"; exam tags are assigned by rank bands when the source does
 * not already provide them.
 *
 * Usage (via npm, which transpiles then runs with Node):
 *   npm run wordbank:build -- \
 *     --input <path>            # .csv | .json | .txt  (REQUIRED)
 *     --count 6000              # target number of words (default 6000)
 *     --out resources/wordbanks # output dir (default resources/wordbanks)
 *     --merged all.json         # also write a single combined file (optional)
 *     --dry-run                 # validate & report only, write nothing
 *
 * Accepted input formats
 * ----------------------
 *   .json : array of objects (full schema) OR array of strings (bare words,
 *           frequency order). Objects are passed through sanitizeEntry.
 *   .csv  : same columns as a custom import (word,ukPhonetic,usPhonetic,
 *           meanings,synonyms,tags). Rows are treated as frequency order.
 *   .txt  : one word per line, frequency order (most frequent first). Minimal
 *           placeholder entries are generated (see --require-rich to reject these).
 *
 * The script NEVER invents phonetics or meanings it cannot derive: bare-word
 * sources yield entries flagged as "needsEnrichment" so you can see data quality
 * at a glance and enrich later.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, parseJsonBank, sanitizeEntry } from '../electron/wordbank-core';
import type { ExamTag, WordEntry } from '../src/shared/types';

type Args = {
  input: string;
  count: number;
  out: string;
  merged?: string;
  dryRun: boolean;
  requireRich: boolean;
};

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const input = get('--input');
  if (!input) {
    console.error('ERROR: --input <file> is required (.csv | .json | .txt)');
    process.exit(2);
  }
  return {
    input,
    count: Number(get('--count') ?? 6000),
    out: get('--out') ?? 'resources/wordbanks',
    merged: get('--merged'),
    dryRun: argv.includes('--dry-run'),
    requireRich: argv.includes('--require-rich')
  };
}

/**
 * Assign exam tags from a frequency rank when the source has none.
 * Bands are cumulative (easier exams are subsets of harder ones in practice),
 * reflecting that lower-rank (more frequent) words appear across more exams.
 */
function tagsForRank(rank: number, total: number): ExamTag[] {
  const pct = rank / Math.max(total, 1);
  if (pct < 0.3) return ['CET4', 'CET6', 'IELTS', 'TOEFL'];
  if (pct < 0.5) return ['CET6', 'IELTS', 'TOEFL'];
  if (pct < 0.7) return ['IELTS', 'TOEFL', 'TEM8'];
  if (pct < 0.85) return ['TOEFL', 'TEM8'];
  return ['TEM8'];
}

/** Load the raw ordered list of candidate entries (pre-sanitize) from any supported format. */
async function loadSource(file: string): Promise<{ entries: WordEntry[]; bareWords: string[] }> {
  const ext = path.extname(file).toLowerCase();
  const text = await fs.readFile(file, 'utf-8');

  if (ext === '.txt') {
    const words = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));
    return { entries: [], bareWords: words };
  }

  if (ext === '.csv') {
    return { entries: parseCsv(text), bareWords: [] };
  }

  if (ext === '.json') {
    const data = JSON.parse(text);
    if (Array.isArray(data) && data.every((d) => typeof d === 'string')) {
      return { entries: [], bareWords: data as string[] };
    }
    return { entries: parseJsonBank(text), bareWords: [] };
  }

  console.error(`ERROR: unsupported input extension "${ext}" (use .csv, .json, or .txt)`);
  process.exit(2);
}

/** Build a minimal placeholder entry for a bare word; flagged for enrichment. */
function placeholderEntry(word: string, tags: ExamTag[]): WordEntry & { needsEnrichment?: boolean } {
  const sanitized = sanitizeEntry({
    word,
    ukPhonetic: '',
    usPhonetic: '',
    meanings: [{ pos: 'n.', text: '（待补充释义）' }],
    synonyms: [],
    tags
  });
  return { ...(sanitized as WordEntry), needsEnrichment: true };
}

const BANK_FILES: Record<ExamTag, string> = {
  CET4: 'cet4.json',
  CET6: 'cet6.json',
  TEM8: 'tem8.json',
  IELTS: 'ielts.json',
  TOEFL: 'toefl.json'
};

/** Walk up until a directory containing package.json is found (robust to compiled layout). */
async function findProjectRoot(start: string): Promise<string> {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    try {
      await fs.access(path.join(dir, 'package.json'));
      return dir;
    } catch {
      dir = path.resolve(dir, '..');
    }
  }
  return start;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const root = await findProjectRoot(path.dirname(fileURLToPath(import.meta.url)));
  const inputPath = path.isAbsolute(args.input) ? args.input : path.join(root, args.input);
  const outDir = path.isAbsolute(args.out) ? args.out : path.join(root, args.out);

  console.log(`\n→ input:   ${inputPath}`);
  console.log(`→ target:  ${args.count} words`);
  console.log(`→ out:     ${outDir}${args.dryRun ? '  (DRY RUN)' : ''}\n`);

  const { entries: rich, bareWords } = await loadSource(inputPath);

  // Normalize into a single ordered list (frequency order preserved).
  const ordered: Array<WordEntry & { needsEnrichment?: boolean }> = [];
  if (rich.length) {
    ordered.push(...rich);
  } else {
    const total = bareWords.length;
    bareWords.forEach((w, i) => ordered.push(placeholderEntry(w, tagsForRank(i, total))));
  }

  // De-duplicate by lowercased word, keeping the first (highest-frequency) occurrence.
  const seen = new Set<string>();
  const deduped: Array<WordEntry & { needsEnrichment?: boolean }> = [];
  for (const e of ordered) {
    const key = e.word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(e);
  }

  // If the source lacked tags, assign by rank band now (after dedup, stable order).
  const tagged = deduped.map((e, i) => {
    const hasRealTags = Array.isArray(e.tags) && e.tags.length > 0;
    const defaultedCet4 = hasRealTags && e.tags.length === 1 && e.tags[0] === 'CET4';
    // sanitizeEntry defaults untagged entries to ['CET4']; treat that as "no tag" for bare sources.
    if (!hasRealTags || (bareWords.length && defaultedCet4)) {
      return { ...e, tags: tagsForRank(i, deduped.length) };
    }
    return e;
  });

  // Take the top N by frequency order.
  const selected = tagged.slice(0, args.count);

  // Quality report.
  const enrichCount = selected.filter((e) => e.needsEnrichment).length;
  const missingPhon = selected.filter((e) => !e.ukPhonetic || !e.usPhonetic).length;
  const perExam: Record<ExamTag, number> = { CET4: 0, CET6: 0, TEM8: 0, IELTS: 0, TOEFL: 0 };
  for (const e of selected) for (const t of e.tags) perExam[t]++;

  console.log('=== Quality report ===');
  console.log(`  source entries:        ${ordered.length}`);
  console.log(`  after dedup:           ${deduped.length}`);
  console.log(`  selected (top N):      ${selected.length}`);
  console.log(`  needs enrichment:      ${enrichCount}`);
  console.log(`  missing uk/us IPA:     ${missingPhon}`);
  console.log('  per-exam counts:       ' + JSON.stringify(perExam));

  if (args.requireRich && (enrichCount > 0 || missingPhon > 0)) {
    console.error(
      `\nERROR: --require-rich set but ${enrichCount} entries need enrichment / ` +
        `${missingPhon} lack phonetics. Provide a richer source.`
    );
    process.exit(1);
  }

  if (args.dryRun) {
    console.log('\nDRY RUN — no files written.');
    return;
  }

  // Strip the internal needsEnrichment flag before writing.
  const clean = selected.map(({ needsEnrichment, ...rest }) => {
    void needsEnrichment;
    return rest as WordEntry;
  });

  // Split into per-exam bank files (a word may appear in multiple banks via its tags).
  await fs.mkdir(outDir, { recursive: true });
  for (const tag of Object.keys(BANK_FILES) as ExamTag[]) {
    const bank = clean.filter((e) => e.tags.includes(tag));
    const file = path.join(outDir, BANK_FILES[tag]);
    await fs.writeFile(file, JSON.stringify(bank, null, 2) + '\n', 'utf-8');
    console.log(`  wrote ${path.relative(root, file)}  (${bank.length})`);
  }

  if (args.merged) {
    const mergedPath = path.isAbsolute(args.merged) ? args.merged : path.join(outDir, args.merged);
    await fs.writeFile(mergedPath, JSON.stringify(clean, null, 2) + '\n', 'utf-8');
    console.log(`  wrote ${path.relative(root, mergedPath)}  (${clean.length})`);
  }

  console.log('\nDone ✅');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
