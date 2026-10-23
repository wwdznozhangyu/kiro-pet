// Lightweight test runner (no external deps) for the pure word-bank logic.
// Run via: tsc transpile -> node. See scripts/run-tests.sh.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildPool,
  normalizePos,
  parseCsv,
  parseJsonBank,
  sanitizeEntry,
  splitCsvRows
} from './wordbank-core';
import type { ExamTag, WordEntry } from '../src/shared/types';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    passed++;
    console.log(`  \u2713 ${name}`);
  } else {
    failed++;
    failures.push(`${name}${detail ? ' — ' + detail : ''}`);
    console.log(`  \u2717 ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function eq<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function main(): Promise<void> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  // Resolve project root from either source (electron/) or compiled (dist-test/electron/)
  // location by walking up until resources/wordbanks exists.
  let root = here;
  for (let i = 0; i < 6; i++) {
    try {
      await fs.access(path.join(root, 'resources', 'wordbanks'));
      break;
    } catch {
      root = path.resolve(root, '..');
    }
  }
  const wordbanksDir = path.join(root, 'resources', 'wordbanks');
  const samplesDir = path.join(root, 'resources', 'samples');

  console.log('\n[1] normalizePos');
  check('adds trailing dot', normalizePos('adj') === 'adj.');
  check('keeps valid pos', normalizePos('vt.') === 'vt.');
  check('invalid falls back to n.', normalizePos('xyz') === 'n.');
  check('uppercase normalized', normalizePos('ADJ') === 'adj.');

  console.log('\n[2] sanitizeEntry');
  check('rejects missing word', sanitizeEntry({ meanings: [{ pos: 'n.', text: 'x' }] }) === null);
  check('rejects empty meanings', sanitizeEntry({ word: 'foo', meanings: [] }) === null);
  const s1 = sanitizeEntry({
    word: '  hello  ',
    uk: 'həˈləʊ',
    us: 'həˈloʊ',
    meanings: [
      { pos: 'n.', text: 'a' },
      'adj. 漂亮的',
      { pos: 'junk', text: 'c' },
      { pos: 'v.', text: 'd' }
    ],
    synonyms: ['x', 'y', 'z', 'w'],
    tags: ['CET4', 'BOGUS', 'IELTS']
  });
  check('trims word', s1?.word === 'hello');
  check('maps uk/us aliases', s1?.ukPhonetic === 'həˈləʊ' && s1?.usPhonetic === 'həˈloʊ');
  check('caps meanings at 3', s1?.meanings.length === 3);
  check('parses "adj. 漂亮的" shorthand', eq(s1?.meanings[1], { pos: 'adj.', text: '漂亮的' }));
  check('invalid pos -> n.', s1?.meanings[2].pos === 'n.');
  check('caps synonyms at 3', s1?.synonyms.length === 3);
  check('filters invalid tags', eq(s1?.tags, ['CET4', 'IELTS'] as ExamTag[]));
  const s2 = sanitizeEntry({ word: 'x', meanings: [{ pos: 'n.', text: 'y' }] });
  check('defaults tags to CET4 when none valid', eq(s2?.tags, ['CET4'] as ExamTag[]));

  console.log('\n[3] splitCsvRows (quoting)');
  const rows = splitCsvRows('a,b\n"x,y","z""q"\n');
  check('row count', rows.length === 2);
  check('quoted comma kept', rows[1][0] === 'x,y');
  check('escaped quote kept', rows[1][1] === 'z"q');

  console.log('\n[4] parseCsv');
  const csv = parseCsv(
    'word,ukPhonetic,usPhonetic,meanings,synonyms,tags\n' +
      'test,test-uk,test-us,adj.:测试的|n.:测验,try|exam,CET4|IELTS\n' +
      ',skip,skip,n.:none,,CET4\n'
  );
  check('skips empty-word row', csv.length === 1);
  check('word parsed', csv[0].word === 'test');
  check('meanings split by |', csv[0].meanings.length === 2);
  check('pos:text parsed', eq(csv[0].meanings[0], { pos: 'adj.', text: '测试的' }));
  check('synonyms split', eq(csv[0].synonyms, ['try', 'exam']));
  check('tags split', eq(csv[0].tags, ['CET4', 'IELTS'] as ExamTag[]));

  console.log('\n[5] built-in banks load & validate');
  const banks: Record<string, WordEntry[]> = {};
  const byExam = new Map<ExamTag, WordEntry[]>();
  for (const [tag, file] of [
    ['CET4', 'cet4.json'],
    ['CET6', 'cet6.json'],
    ['TEM8', 'tem8.json'],
    ['IELTS', 'ielts.json'],
    ['TOEFL', 'toefl.json']
  ] as const) {
    const entries = parseJsonBank(await fs.readFile(path.join(wordbanksDir, file), 'utf-8'));
    banks[tag] = entries;
    byExam.set(tag, entries);
    check(`${tag} has entries`, entries.length > 0, `got ${entries.length}`);
    const allHaveWord = entries.every((e) => e.word.length > 0);
    const allHaveMeaning = entries.every((e) => e.meanings.length >= 1 && e.meanings.length <= 3);
    const allHavePhon = entries.every((e) => e.ukPhonetic.length > 0 && e.usPhonetic.length > 0);
    const synOk = entries.every((e) => e.synonyms.length <= 3);
    check(`${tag} every entry has word`, allHaveWord);
    check(`${tag} every entry 1-3 meanings`, allHaveMeaning);
    check(`${tag} every entry has uk+us phonetics`, allHavePhon);
    check(`${tag} synonyms <= 3`, synOk);
  }
  const total = Object.values(banks).reduce((n, b) => n + b.length, 0);
  check('total built-in words > 50', total > 50, `got ${total}`);

  console.log('\n[6] buildPool: filtering & dedup');
  const cet4Only = buildPool(byExam, [], ['CET4']);
  check('CET4-only pool matches bank size', cet4Only.length === banks.CET4.length);
  const everyCet4Tagged = cet4Only.every((e) => e.tags.includes('CET4'));
  check('every word in CET4 pool has CET4 tag', everyCet4Tagged);

  // Words tagged in multiple banks must not be duplicated across the combined pool.
  const allExams: ExamTag[] = ['CET4', 'CET6', 'TEM8', 'IELTS', 'TOEFL'];
  const fullPool = buildPool(byExam, [], allExams);
  const uniqueWords = new Set(fullPool.map((e) => e.word.toLowerCase()));
  check('full pool is deduplicated', uniqueWords.size === fullPool.length,
    `pool=${fullPool.length} unique=${uniqueWords.size}`);
  check('full pool <= sum of banks (dedup happened)', fullPool.length <= total);

  console.log('\n[7] custom file merge (JSON + CSV samples)');
  const jsonCustom = parseJsonBank(
    await fs.readFile(path.join(samplesDir, 'custom-words.sample.json'), 'utf-8')
  );
  const csvCustom = parseCsv(
    await fs.readFile(path.join(samplesDir, 'custom-words.sample.csv'), 'utf-8')
  );
  check('json sample parsed', jsonCustom.length === 2);
  check('csv sample parsed', csvCustom.length === 2);
  const withCustom = buildPool(byExam, jsonCustom, ['TOEFL']);
  const hasSerendipity = withCustom.some((e) => e.word === 'serendipity');
  check('custom word appears when its tag enabled', hasSerendipity);
  const withoutCustom = buildPool(byExam, jsonCustom, ['CET4']);
  const noSerendipity = !withoutCustom.some((e) => e.word === 'serendipity');
  check('custom word hidden when its tag NOT enabled', noSerendipity);

  console.log(`\n================= RESULT =================`);
  console.log(`PASSED: ${passed}   FAILED: ${failed}`);
  if (failed > 0) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('All tests passed \u2713');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
