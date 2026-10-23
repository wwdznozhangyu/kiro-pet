import React from 'react';
import type { PetAnimation } from '../shared/types';

interface Props {
  anim: PetAnimation;
  blinking: boolean;
  eye: { x: number; y: number };
}

/**
 * The Kiro mascot: a friendly rounded "ghost/blob" character in Kiro's purple
 * gradient, drawn as inline SVG so it scales crisply and can be animated via CSS.
 * Eyes follow the cursor; eyelids close on blink.
 */
export function KiroMascot({ anim, blinking, eye }: Props): JSX.Element {
  const wag = anim === 'wag';
  const nod = anim === 'nod';

  return (
    <svg
      className={`mascot ${nod ? 'mascot--nod' : ''}`}
      viewBox="0 0 160 170"
      width="160"
      height="170"
      aria-label="Kiro"
    >
      <defs>
        <linearGradient id="kiroBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <radialGradient id="kiroCheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f0abfc" stopOpacity="0" />
        </radialGradient>
        <filter id="kiroShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#1e1b4b" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Tail / little feet that wag */}
      <g className={wag ? 'mascot__tail mascot__tail--wag' : 'mascot__tail'}>
        <ellipse cx="60" cy="150" rx="12" ry="7" fill="#6d28d9" />
        <ellipse cx="100" cy="150" rx="12" ry="7" fill="#6d28d9" />
      </g>

      {/* Body */}
      <g filter="url(#kiroShadow)">
        <path
          d="M80 14
             C44 14 24 40 24 76
             L24 120
             C24 138 40 150 60 150
             C70 150 74 142 80 142
             C86 142 90 150 100 150
             C120 150 136 138 136 120
             L136 76
             C136 40 116 14 80 14 Z"
          fill="url(#kiroBody)"
        />
        {/* Face plate */}
        <ellipse cx="80" cy="84" rx="46" ry="40" fill="#1e1b4b" />
      </g>

      {/* Cheeks */}
      <circle cx="44" cy="96" r="12" fill="url(#kiroCheek)" />
      <circle cx="116" cy="96" r="12" fill="url(#kiroCheek)" />

      {/* Eyes */}
      <g>
        {/* left */}
        <circle cx="64" cy="82" r="13" fill="#ffffff" />
        <circle cx={64 + eye.x} cy={82 + eye.y} r="6.5" fill="#1e1b4b" />
        <circle cx={64 + eye.x - 2} cy={82 + eye.y - 2} r="2" fill="#ffffff" />
        {/* right */}
        <circle cx="96" cy="82" r="13" fill="#ffffff" />
        <circle cx={96 + eye.x} cy={82 + eye.y} r="6.5" fill="#1e1b4b" />
        <circle cx={96 + eye.x - 2} cy={82 + eye.y - 2} r="2" fill="#ffffff" />
        {/* eyelids (blink) */}
        <rect
          x="49"
          y="69"
          width="30"
          height={blinking ? 26 : 0}
          rx="13"
          fill="#1e1b4b"
          style={{ transition: 'height 90ms ease' }}
        />
        <rect
          x="81"
          y="69"
          width="30"
          height={blinking ? 26 : 0}
          rx="13"
          fill="#1e1b4b"
          style={{ transition: 'height 90ms ease' }}
        />
      </g>

      {/* Mouth */}
      <path
        d="M70 104 Q80 114 90 104"
        stroke="#f0abfc"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
