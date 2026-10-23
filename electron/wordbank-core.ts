// Pure, dependency-free word-bank logic: parsing, sanitizing, CSV handling,
// pooling and random selection. No Electron imports here so it is unit-testable
// in plain Node. The Electron-aware wrapper lives in wordbank.ts.

import type { ExamTag, Meaning, PartOfSpeech, WordEntry } from '../src/shared/types';
import { EXAM_TAGS } from '../src/shared/types';

export const VALID_POS = new Set<PartOfSpeech>([
  'n.', 'v.', 'vt.', 'vi.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'num.', 'phr.'
]);

export function normalizePos(raw: unknown): PartOfSpeech {
  const s = String(raw ?? '').trim().toLowerCase();
  const withDot = s.endsWith('.') ? s : `${s}.`;
  return (VALID_POS.has(withDot as PartOfSpeech) ? withDot : 'n.') as PartOfSpeech;
}

export function sanitizeEntry(raw: any): WordEntry | null {
  if (!raw || typeof raw.word !== 'string' || !raw.word.trim()) return null;

  const meanings: Meaning[] = Array.isArray(raw.meanings)
    ? raw.meanings
        .map((m: any) => {
          if (typeof m === 'string') {
            // Allow "n. 释义" shorthand or plain text.
            const match = m.match(/^\s*([a-zA-Z]+\.?)\s+(.*)$/);
            if (match && VALID_POS.has(normalizePos(match[1]))) {
              return { pos: normalizePos(match[1]), text: match[2].trim() };
            }
            return { pos: 'n.' as PartOfSpeech, text: m.trim() };
          }
          return { pos: normalizePos(m?.pos), text: String(m?.text ?? '').trim() };
        })
        .filter((m: Meaning) => m.text.length > 0)
    : [];

  if (meanings.length === 0) return null;

  const tags: ExamTag[] = Array.isArray(raw.tags)
    ? raw.tags.filter((t: any): t is ExamTag => EXAM_TAGS.includes(t))
    : [];

  const synonyms: string[] = Array.isArray(raw.synonyms)
    ? raw.synonyms.map((s: any) => String(s).trim()).filter(Boolean).slice(0, 3)
    : [];

  return {
    word: String(raw.word).trim(),
    ukPhonetic: String(raw.ukPhonetic ?? raw.uk ?? '').trim(),
    usPhonetic: String(raw.usPhonetic ?? raw.us ?? '').trim(),
    meanings: meanings.slice(0, 3),
    synonyms,
    tags: tags.length ? tags : ['CET4']
  };
}

/** Parse a JSON word bank from already-read text. */
export function parseJsonBank(text: string): WordEntry[] {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : Array.isArray(data?.words) ? data.words : [];
  return list.map(sanitizeEntry).filter((e: WordEntry | null): e is WordEntry => e !== null);
}

/**
 * Parse CSV. Expected header columns (case-insensitive, order-independent):
 *   word, ukPhonetic, usPhonetic, meanings, synonyms, tags
 * `meanings` uses "pos:释义" items separated by "|". `synonyms` and `tags` use "|".
 */
export function parseCsv(text: string): WordEntry[] {
  const rows = splitCsvRows(text);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const col = {
    word: idx('word'),
    uk: idx('ukphonetic') >= 0 ? idx('ukphonetic') : idx('uk'),
    us: idx('usphonetic') >= 0 ? idx('usphonetic') : idx('us'),
    meanings: idx('meanings'),
    synonyms: idx('synonyms'),
    tags: idx('tags')
  };

  const out: WordEntry[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (!cells.length || !cells[col.word]?.trim()) continue;
    const meanings = (col.meanings >= 0 ? cells[col.meanings] ?? '' : '')
      .split('|')
      .map((part) => {
        const [posPart, ...rest] = part.split(':');
        return rest.length
          ? { pos: posPart.trim(), text: rest.join(':').trim() }
          : part.trim();
      });
    const entry = sanitizeEntry({
      word: cells[col.word],
      ukPhonetic: col.uk >= 0 ? cells[col.uk] : '',
      usPhonetic: col.us >= 0 ? cells[col.us] : '',
      meanings,
      synonyms: col.synonyms >= 0 ? (cells[col.synonyms] ?? '').split('|') : [],
      tags: col.tags >= 0 ? (cells[col.tags] ?? '').split('|').map((t) => t.trim()) : []
    });
    if (entry) out.push(entry);
  }
  return out;
}

/** Minimal CSV splitter supporting quoted fields and embedded commas/newlines. */
export function splitCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f.trim().length)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((f) => f.trim().length)) rows.push(row);
  }
  return rows;
}

/** Deduplicated pool for the given enabled exams, combining built-ins + custom. */
export function buildPool(
  byExam: Map<ExamTag, WordEntry[]>,
  custom: WordEntry[],
  enabledExams: ExamTag[]
): WordEntry[] {
  const seen = new Set<string>();
  const out: WordEntry[] = [];
  const push = (e: WordEntry) => {
    const key = e.word.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(e);
    }
  };
  for (const tag of enabledExams) (byExam.get(tag) ?? []).forEach(push);
  for (const e of custom) {
    if (e.tags.some((t) => enabledExams.includes(t))) push(e);
  }
  return out;
}
