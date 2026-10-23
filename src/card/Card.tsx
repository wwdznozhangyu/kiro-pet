import React, { useCallback, useEffect, useState } from 'react';
import type { WordEntry } from '../shared/types';
import { EXAM_LABELS } from '../shared/types';
import { speak } from './speech';
import './card.css';

const POS_CN: Record<string, string> = {
  'n.': '名词',
  'v.': '动词',
  'vt.': '及物动词',
  'vi.': '不及物动词',
  'adj.': '形容词',
  'adv.': '副词',
  'prep.': '介词',
  'conj.': '连词',
  'pron.': '代词',
  'num.': '数词',
  'phr.': '短语'
};

export function Card(): JSX.Element {
  const [word, setWord] = useState<WordEntry | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const off = window.kiro.onCardWord((w) => {
      setWord(w);
      setClosing(false);
    });
    return off;
  }, []);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => window.kiro.closeCard(), 180);
  }, []);

  // Close on Escape for convenience.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  if (!word) {
    return <div className="card-wrap" />;
  }

  return (
    <div className={`card-wrap ${closing ? 'card-wrap--closing' : ''}`} onClick={close}>
      {/* Clicking the card body should NOT close; only clicking outside / the X does. */}
      <div className="card" onClick={(e) => e.stopPropagation()}>
        <button className="card__close" aria-label="关闭" onClick={close}>
          ×
        </button>

        <div className="card__tags">
          {word.tags.map((t) => (
            <span key={t} className="card__tag">
              {EXAM_LABELS[t]}
            </span>
          ))}
        </div>

        <div className="card__word">{word.word}</div>

        <div className="card__phonetics">
          {word.ukPhonetic && (
            <button className="card__ph" onClick={() => speak(word.word, 'uk')}>
              <span className="card__ph-label">英</span>
              <span className="card__ph-ipa">/{word.ukPhonetic}/</span>
              <span className="card__speaker" aria-hidden>🔊</span>
            </button>
          )}
          {word.usPhonetic && (
            <button className="card__ph" onClick={() => speak(word.word, 'us')}>
              <span className="card__ph-label">美</span>
              <span className="card__ph-ipa">/{word.usPhonetic}/</span>
              <span className="card__speaker" aria-hidden>🔊</span>
            </button>
          )}
        </div>

        <ul className="card__meanings">
          {word.meanings.map((m, i) => (
            <li key={i} className="card__meaning">
              <span className="card__pos">{POS_CN[m.pos] ?? m.pos}</span>
              <span className="card__def">{m.text}</span>
            </li>
          ))}
        </ul>

        {word.synonyms.length > 0 && (
          <div className="card__syn">
            <span className="card__syn-label">近义词</span>
            <div className="card__syn-list">
              {word.synonyms.map((s) => (
                <span key={s} className="card__syn-chip">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="card__hint">点击任意处或按 Esc 收起</div>
      </div>
    </div>
  );
}
