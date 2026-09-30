'use client';

import { useEffect, useId, useRef } from 'react';

// A banknote-style guilloche seal, generated from a seed (the currency pair), so every
// pair gets its own engraving. Canvas for the thousands of line segments; SVG only for
// the microprint ring and centre mark, which need real text.

interface Props {
  /** Same seed, same seal. Use the pair, e.g. "USD-MYR". */
  seed: string;
  /** Microprint around the rim, repeated to fill it */
  ring: string;
  /** Big glyphs in the middle, e.g. "$ → RM" */
  center?: string;
  className?: string;
}

/** FNV-1a: stable 32-bit hash of the seed */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: small seeded PRNG */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function draw(canvas: HTMLCanvasElement, seed: string) {
  const size = canvas.clientWidth;
  if (!size) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const color = getComputedStyle(canvas).getPropertyValue('--seal').trim() || '#0e5a43';
  const rand = rng(hash(seed));
  const c = (size * dpr) / 2;
  const scale = c * 0.98;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';

  const stroke = (
    points: (t: number) => [number, number],
    turns: number,
    steps: number,
    width: number,
    alpha: number,
  ) => {
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width * dpr;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const [x, y] = points((i / steps) * turns);
      if (i === 0) ctx.moveTo(c + x * scale, c + y * scale);
      else ctx.lineTo(c + x * scale, c + y * scale);
    }
    ctx.stroke();
  };

  // Woven band: many phase-shifted sine rings. Where they cross is what makes it
  // read as engraving rather than a single wavy line.
  const band = (
    radius: number,
    amplitude: number,
    lobes: number,
    strands: number,
    width: number,
    alpha: number,
  ) => {
    for (let s = 0; s < strands; s++) {
      const phase = (s / strands) * ((Math.PI * 2) / lobes);
      stroke(
        (t) => {
          const r = radius + amplitude * Math.sin(lobes * t + phase * lobes);
          return [r * Math.cos(t), r * Math.sin(t)];
        },
        Math.PI * 2,
        720,
        width,
        alpha,
      );
    }
  };

  // Outer border: two hairline circles around a tight band
  const outerLobes = 36 + Math.floor(rand() * 18);
  stroke((t) => [Math.cos(t), Math.sin(t)], Math.PI * 2, 360, 0.8, 0.7);
  stroke((t) => [0.955 * Math.cos(t), 0.955 * Math.sin(t)], Math.PI * 2, 360, 0.5, 0.5);
  band(0.905, 0.028, outerLobes, 10, 0.45, 0.55);
  stroke((t) => [0.855 * Math.cos(t), 0.855 * Math.sin(t)], Math.PI * 2, 360, 0.5, 0.5);

  // Rosette: a hypotrochoid whose petal count comes from the seed
  const R = 72 + Math.floor(rand() * 40);
  let r = 11 + Math.floor(rand() * 17);
  if (R % r === 0) r += 1;
  const d = r * (0.55 + rand() * 0.6);
  const turns = (Math.PI * 2 * r) / gcd(R, r);
  const k = (R - r) / r;
  const norm = 0.66 / (R - r + d);
  for (let layer = 0; layer < 3; layer++) {
    const shrink = 1 - layer * 0.11;
    const offset = (layer * Math.PI) / R;
    stroke(
      (t) => {
        const x = (R - r) * Math.cos(t + offset) + d * Math.cos(k * t + offset);
        const y = (R - r) * Math.sin(t + offset) - d * Math.sin(k * t + offset);
        return [x * norm * shrink, y * norm * shrink];
      },
      turns,
      Math.min(6000, Math.round((turns / (Math.PI * 2)) * 900)),
      0.45,
      layer === 0 ? 0.6 : 0.35,
    );
  }

  // Inner band around the centre mark
  band(0.3, 0.035, 14 + Math.floor(rand() * 10), 8, 0.45, 0.5);
  stroke((t) => [0.245 * Math.cos(t), 0.245 * Math.sin(t)], Math.PI * 2, 240, 0.6, 0.6);
  ctx.globalAlpha = 1;
}

export default function Seal({ seed, ring, center, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringId = `seal-ring-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const redraw = () => draw(canvas, seed);
    redraw();
    // Size changes and light/dark switches both need a fresh drawing
    const ro = new ResizeObserver(redraw);
    ro.observe(canvas);
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', redraw);
    return () => {
      ro.disconnect();
      scheme.removeEventListener('change', redraw);
    };
  }, [seed]);

  // Repeat the microprint until it wraps the whole rim
  const microprint = `${ring} · `.repeat(Math.max(1, Math.ceil(150 / (ring.length + 3))));

  return (
    <div className={`relative aspect-square ${className ?? ''}`} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full motion-safe:animate-[seal-turn_240s_linear_infinite]"
      />
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <path id={ringId} d="M 100,100 m -79,0 a 79,79 0 1,1 158,0 a 79,79 0 1,1 -158,0" />
        </defs>
        <text
          className="fill-seal font-medium uppercase"
          style={{ fontSize: '3.3px', letterSpacing: '0.35px' }}
          opacity={0.85}
        >
          <textPath href={`#${ringId}`} textLength={496} lengthAdjust="spacingAndGlyphs">
            {microprint}
          </textPath>
        </text>
        {center && (
          <text
            x="100"
            y="100"
            textAnchor="middle"
            dominantBaseline="central"
            // Below desktop the seal is faint background texture; stray glyphs read as typos
            className="fill-seal font-medium max-lg:hidden"
            style={{ fontSize: center.length > 7 ? '13px' : '16px', letterSpacing: '-0.3px' }}
          >
            {center}
          </text>
        )}
      </svg>
    </div>
  );
}
