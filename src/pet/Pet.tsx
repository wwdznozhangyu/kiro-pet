import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { PetAnimation } from '../shared/types';
import { KiroMascot } from './KiroMascot';
import './pet.css';

const isMac = navigator.platform.toLowerCase().includes('mac');

export function Pet(): JSX.Element {
  const [anim, setAnim] = useState<PetAnimation>('idle');
  const [blinking, setBlinking] = useState(false);
  const [eye, setEye] = useState({ x: 0, y: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const animResetRef = useRef<number | null>(null);

  // Trigger a transient animation (e.g. jump) that returns to idle after a delay.
  const flash = useCallback((a: PetAnimation, ms: number) => {
    setAnim(a);
    if (animResetRef.current) window.clearTimeout(animResetRef.current);
    animResetRef.current = window.setTimeout(() => setAnim('idle'), ms);
  }, []);

  const doBlink = useCallback(() => {
    setBlinking(true);
    window.setTimeout(() => setBlinking(false), 180);
  }, []);

  // Receive animation cues from the main process.
  useEffect(() => {
    const off = window.kiro.onAnimation((a) => {
      switch (a) {
        case 'blink':
          doBlink();
          break;
        case 'jump':
          flash('jump', 700);
          break;
        case 'wander':
          flash('wander', 900);
          break;
        case 'hold-sign':
          flash('hold-sign', 1600);
          break;
        case 'nod':
          flash('nod', 900);
          break;
        case 'wag':
          flash('wag', 900);
          break;
        default:
          setAnim('idle');
      }
    });
    return off;
  }, [doBlink, flash]);

  // Occasional self-initiated blink, independent of main-process cues.
  useEffect(() => {
    let timer: number;
    const loop = () => {
      doBlink();
      timer = window.setTimeout(loop, 3000 + Math.random() * 4000);
    };
    timer = window.setTimeout(loop, 2500);
    return () => window.clearTimeout(timer);
  }, [doBlink]);

  // Eye tracking: move pupils toward the cursor based on its position within the window.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const max = 3.5; // max pupil travel in px
      setEye({ x: (dx / dist) * Math.min(max, dist / 20), y: (dy / dist) * Math.min(max, dist / 20) });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Dragging: forward movement to the main process which repositions the window.
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // macOS context gesture: Control+Click opens the menu instead of dragging.
    if (e.button === 2 || (isMac && e.ctrlKey && e.button === 0)) {
      e.preventDefault();
      window.kiro.petContextMenu(e.screenX, e.screenY);
      return;
    }
    if (e.button !== 0) return;
    draggingRef.current = true;
    document.body.style.cursor = 'grabbing';
    window.kiro.petDragStart();
  }, []);

  useEffect(() => {
    const onMove = () => {
      if (draggingRef.current) window.kiro.petDragMove(0, 0);
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = 'grab';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const onDoubleClick = useCallback(() => {
    flash('jump', 600);
    window.kiro.petDoubleClick();
  }, [flash]);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    window.kiro.petContextMenu(e.screenX, e.screenY);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`pet pet--${anim}`}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <KiroMascot anim={anim} blinking={blinking} eye={eye} />
      {anim === 'hold-sign' && <div className="pet__sign">单词来啦!</div>}
    </div>
  );
}
