/**
 * validate-wordbank — assert every word bank JSON in a directory conforms to the
 * WordEntry schema used by the app. Exits non-zero on the first failing bank so it
 * can gate commits / CI.
 *
 * Usage:
 *   npm run wordbank:validate -- [--dir resources/wordbanks]
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VALID_POS } from '../electron/wordbank-core';
import { EXAM_TAGS } from '../src/shared/types';
import type { WordEntry } from '../src/shared/types';

function validateEntry(e: any, idx: number, file: string): string[] {
  const errs: string[] = [];
  const where = `${path.basename(file)}[${idx}]`;
  if (typeof e?.word !== 'string' || !e.word.trim()) errs.push(`${where}: missing/empty word`);
  if (typeof e?.ukPhonetic !== 'string') errs.push(`${where} (${e?.word}): ukPhonetic not a string`);
  if (typeof e?.usPhonetic !== 'string') errs.push(`${where} (${e?.word}): usPhonetic not a string`);
  if (!Array.isArray(e?.meanings) || e.meanings.length < 1 || e.meanings.length > 3) {
    errs.push(`${where} (${e?.word}): meanings must have 1-3 items`);
  } else {
    e.meanings.forEach((m: any, j: number) => {
      if (!VALID_POS.has(m?.pos)) errs.push(`${where} (${e.word}).meanings[${j}]: invalid pos "${m?.pos}"`);
      if (typeof m?.text !== 'string' || !m.text.trim())
        errs.push(`${where} (${e.word}).meanings[${j}]: empty text`);
    });
  }
  if (!Array.isArray(e?.synonyms) || e.synonyms.length > 3)
    errs.push(`${where} (${e?.word}): synonyms must be an array of <= 3`);
  if (!Array.isArray(e?.tags) || e.tags.length < 1)
    errs.push(`${where} (${e?.word}): tags must be a non-empty array`);
  else {
    for (const t of e.tags)
      if (!EXAM_TAGS.includes(t)) errs.push(`${where} (${e.word}): invalid tag "${t}"`);
  }
  return errs;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dirArg = argv.indexOf('--dir') >= 0 ? argv[argv.indexOf('--dir') + 1] : 'resources/wordbanks';
  let root = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    try {
      await fs.access(path.join(root, 'package.json'));
      break;
    } catch {
      root = path.resolve(root, '..');
    }
  }
  const dir = path.isAbsolute(dirArg) ? dirArg : path.join(root, dirArg);

  const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) {
    console.error(`No JSON banks found in ${dir}`);
    process.exit(1);
  }

  let totalEntries = 0;
  let totalErrors = 0;
  const seenGlobal = new Set<string>();

  for (const f of files) {
    const full = path.join(dir, f);
    const raw = await fs.readFile(full, 'utf-8');
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error(`  ✗ ${f}: invalid JSON — ${(e as Error).message}`);
      totalErrors++;
      continue;
    }
    if (!Array.isArray(data)) {
      console.error(`  ✗ ${f}: top-level is not an array`);
      totalErrors++;
      continue;
    }

    const localSeen = new Set<string>();
    let fileErrs = 0;
    (data as WordEntry[]).forEach((e, i) => {
      const errs = validateEntry(e, i, full);
      errs.forEach((msg) => console.error(`  ✗ ${msg}`));
      fileErrs += errs.length;
      const key = String(e?.word ?? '').toLowerCase();
      if (key) {
        if (localSeen.has(key)) console.error(`  ✗ ${f}: duplicate word within file "${e.word}"`), fileErrs++;
        localSeen.add(key);
        seenGlobal.add(key);
      }
    });
    totalEntries += data.length;
    totalErrors += fileErrs;
    console.log(`  ${fileErrs === 0 ? '✓' : '✗'} ${f}  (${data.length} entries, ${fileErrs} errors)`);
  }

  console.log(`\n=== ${totalEntries} entries across ${files.length} banks, ${seenGlobal.size} unique words ===`);
  if (totalErrors > 0) {
    console.error(`FAILED: ${totalErrors} validation error(s).`);
    process.exit(1);
  }
  console.log('All banks valid ✓');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
