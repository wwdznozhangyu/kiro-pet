// Shared type definitions used by both the Electron main process and renderers.

/** Vocabulary exam categories, in the display/priority order requested. */
export type ExamTag = 'CET4' | 'CET6' | 'TEM8' | 'IELTS' | 'TOEFL';

export const EXAM_TAGS: ExamTag[] = ['CET4', 'CET6', 'TEM8', 'IELTS', 'TOEFL'];

export const EXAM_LABELS: Record<ExamTag, string> = {
  CET4: '四级',
  CET6: '六级',
  TEM8: '专八',
  IELTS: '雅思',
  TOEFL: '托福'
};

/** Part of speech, stored as a short English abbreviation; rendered in Chinese. */
export type PartOfSpeech =
  | 'n.'
  | 'v.'
  | 'vt.'
  | 'vi.'
  | 'adj.'
  | 'adv.'
  | 'prep.'
  | 'conj.'
  | 'pron.'
  | 'num.'
  | 'phr.';

/** A single Chinese meaning, with its part of speech. */
export interface Meaning {
  pos: PartOfSpeech;
  /** Chinese definition text. */
  text: string;
}

/** One vocabulary entry shown on a word card. */
export interface WordEntry {
  word: string;
  /** British (Received Pronunciation) IPA, without surrounding slashes. */
  ukPhonetic: string;
  /** American (General American) IPA, without surrounding slashes. */
  usPhonetic: string;
  /**
   * Meanings ordered by exam priority: CET4/6 -> TEM8 -> IELTS -> TOEFL.
   * At most the three highest-priority meanings are shown.
   */
  meanings: Meaning[];
  /** 2-3 synonyms. */
  synonyms: string[];
  /** Which exams this word is high-frequency in. */
  tags: ExamTag[];
}

/** User-configurable settings, persisted via electron-store. */
export interface Settings {
  /** Minutes between automatic card pop-ups. One of 5 | 10 | 15 | 30. */
  popupIntervalMinutes: 5 | 10 | 15 | 30;
  /** Whether the desktop pet is enabled/visible. */
  petEnabled: boolean;
  /** Launch Kiro Pet automatically at login. */
  launchAtLogin: boolean;
  /** Which exam word banks to draw cards from. */
  enabledExams: ExamTag[];
  /** Absolute paths of user-imported custom word files. */
  customWordFiles: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  popupIntervalMinutes: 10,
  petEnabled: true,
  launchAtLogin: false,
  enabledExams: ['CET4', 'CET6', 'TEM8', 'IELTS', 'TOEFL'],
  customWordFiles: []
};

/** Animation cues sent from main -> pet renderer. */
export type PetAnimation =
  | 'idle'
  | 'blink'
  | 'wander'
  | 'jump'
  | 'hold-sign' // 举牌 when a card pops up
  | 'nod' // 点头 after a card closes
  | 'wag'; // 摇尾巴 after a card closes

/** The contextBridge API exposed on window.kiro in renderers. */
export interface KiroApi {
  // ---- Pet window ----
  onAnimation(cb: (anim: PetAnimation) => void): () => void;
  petDragStart(): void;
  petDragMove(dx: number, dy: number): void;
  petDoubleClick(): void;
  petContextMenu(x: number, y: number): void;

  // ---- Card window ----
  onCardWord(cb: (word: WordEntry) => void): () => void;
  closeCard(): void;
  speak(text: string, accent: 'uk' | 'us'): void;

  // ---- Settings (both windows may read) ----
  getSettings(): Promise<Settings>;
}

declare global {
  interface Window {
    kiro: KiroApi;
  }
}
