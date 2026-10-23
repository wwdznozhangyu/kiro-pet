import { app } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ExamTag, WordEntry } from '../src/shared/types';
import { EXAM_TAGS } from '../src/shared/types';
import { buildPool, parseCsv, parseJsonBank } from './wordbank-core';

/**
 * Resolve the directory holding the bundled JSON word banks.
 * In production they are copied to process.resourcesPath/wordbanks (see electron-builder
 * extraResources); in dev they live next to the source tree.
 */
function builtInDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'wordbanks');
  }
  return path.join(app.getAppPath(), 'resources', 'wordbanks');
}

async function readJsonBank(file: string): Promise<WordEntry[]> {
  return parseJsonBank(await fs.readFile(file, 'utf-8'));
}

/** Load a user-provided custom file (by extension). Returns [] on any error. */
export async function loadCustomFile(file: string): Promise<WordEntry[]> {
  try {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.json') return await readJsonBank(file);
    if (ext === '.csv') return parseCsv(await fs.readFile(file, 'utf-8'));
    return [];
  } catch (err) {
    console.error(`Failed to load custom word file ${file}:`, err);
    return [];
  }
}

const BUILTIN_FILES: Record<ExamTag, string> = {
  CET4: 'cet4.json',
  CET6: 'cet6.json',
  TEM8: 'tem8.json',
  IELTS: 'ielts.json',
  TOEFL: 'toefl.json'
};

export class WordBank {
  private byExam = new Map<ExamTag, WordEntry[]>();
  private custom: WordEntry[] = [];

  async loadBuiltIns(): Promise<void> {
    const dir = builtInDir();
    await Promise.all(
      EXAM_TAGS.map(async (tag) => {
        try {
          const entries = await readJsonBank(path.join(dir, BUILTIN_FILES[tag]));
          this.byExam.set(tag, entries);
        } catch (err) {
          console.error(`Failed to load built-in bank ${tag}:`, err);
          this.byExam.set(tag, []);
        }
      })
    );
  }

  async setCustomFiles(files: string[]): Promise<void> {
    const loaded = await Promise.all(files.map(loadCustomFile));
    this.custom = loaded.flat();
  }

  /** Deduplicated pool for the given enabled exams, including custom words. */
  pool(enabledExams: ExamTag[]): WordEntry[] {
    return buildPool(this.byExam, this.custom, enabledExams);
  }

  randomWord(enabledExams: ExamTag[]): WordEntry | null {
    const pool = this.pool(enabledExams);
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  totalCount(): number {
    let n = this.custom.length;
    for (const list of this.byExam.values()) n += list.length;
    return n;
  }
}
