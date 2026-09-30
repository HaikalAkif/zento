'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlobeAltIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { Globe } from 'cobe';
import { getStrength, type StrengthEntry } from '@/lib/api';
import { getCurrency } from '@/lib/currencies';
import { formatDate } from '@/lib/format';
import { CURRENCY_LOCATIONS, phiFacing, projectLocation } from '@/lib/geo';
import { prefersReducedMotion } from '@/lib/motion';

interface Props {
  /** Whose money we're measuring. Must be an ECB currency. */
  base: string;
  onSelect: (from: string, to: string) => void;
}

const THETA = 0.3;
const ELEVATION = 0.05;
const SPIN = 0.0025;
const GREEN: [number, number, number] = [0.2, 0.83, 0.6];
const RED: [number, number, number] = [0.97, 0.44, 0.44];
const BLUE: [number, number, number] = [0.38, 0.65, 0.98];

function pct(v: number): string {
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

function ListItem({
  entry,
  base,
  onSelect,
  onFocusCurrency,
}: {
  entry: StrengthEntry;
  base: string;
  onSelect: Props['onSelect'];
  onFocusCurrency: (code: string | null) => void;
}) {
  const cur = getCurrency(entry.code);
  const up = entry.changePct >= 0;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(base, entry.code)}
        onMouseEnter={() => onFocusCurrency(entry.code)}
        onMouseLeave={() => onFocusCurrency(null)}
        onFocus={() => onFocusCurrency(entry.code)}
        onBlur={() => onFocusCurrency(null)}
        aria-label={`Convert ${base} to ${cur?.name ?? entry.code}. Your ${base} buys ${Math.abs(entry.changePct).toFixed(1)}% ${up ? 'more' : 'less'} than a year ago`}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-lg leading-none select-none">{cur?.flag}</span>
          <span className="text-sm font-semibold text-slate-200">{entry.code}</span>
          <span className="truncate text-xs text-slate-500">{cur?.name}</span>
        </span>
        <span
          className={`text-sm font-bold tabular-nums ${up ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {pct(entry.changePct)}
        </span>
      </button>
    </li>
  );
}

export default function CurrencyGlobe({ base, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // cobe re-parents its canvas into a wrapper it never removes, so React only renders
  // an empty host and the effect owns everything inside it.
  const hostRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const focusRef = useRef<string | null>(null);
  const [inView, setInView] = useState(false);
  const [focusCode, setFocusCode] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['strength', base],
    queryFn: () => getStrength(base),
    staleTime: 60 * 60 * 1000,
    enabled: inView,
  });

  const entries = useMemo(
    () => (data?.entries ?? []).filter((e) => CURRENCY_LOCATIONS[e.code]),
    [data],
  );
  const strongest = entries.slice(0, 5);
  const weakest = entries.slice(-5).reverse();

  useEffect(() => {
    focusRef.current = focusCode;
  }, [focusCode]);

  // Start WebGL only once the section scrolls near the viewport
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), {
      rootMargin: '200px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const wrap = wrapRef.current;
    if (!host || !wrap || entries.length === 0) return;

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'absolute inset-0 w-full h-full cursor-grab touch-pan-y';
    host.append(canvas);

    let globe: Globe | undefined;
    let frame = 0;
    let cancelled = false;
    const reduced = prefersReducedMotion();
    const baseLoc = CURRENCY_LOCATIONS[base];
    let phi = baseLoc ? phiFacing(baseLoc[1]) : 0;
    let theta = THETA;
    let dragging: { x: number; y: number; phi: number; theta: number } | null = null;
    let hovering = false;

    const maxAbs = Math.max(...entries.map((e) => Math.abs(e.changePct)), 1);
    const markers = [
      ...entries.map((e) => ({
        location: CURRENCY_LOCATIONS[e.code],
        size: 0.03 + (Math.abs(e.changePct) / maxAbs) * 0.07,
        color: e.changePct >= 0 ? GREEN : RED,
      })),
      ...(baseLoc ? [{ location: baseLoc, size: 0.08, color: BLUE }] : []),
    ];
    // Arcs from home to the three places your money goes furthest
    const arcs = baseLoc
      ? entries
          .filter((e) => e.changePct > 0)
          .slice(0, 3)
          .map((e) => ({ from: baseLoc, to: CURRENCY_LOCATIONS[e.code], color: GREEN }))
      : [];

    const place = () => {
      for (const [code, el] of Object.entries(markerRefs.current)) {
        const loc = CURRENCY_LOCATIONS[code];
        if (!el || !loc) continue;
        const p = projectLocation(loc, phi, theta, ELEVATION);
        el.style.left = `${p.x * 100}%`;
        el.style.top = `${p.y * 100}%`;
        el.style.opacity = p.visible ? '1' : '0';
        el.style.pointerEvents = p.visible ? 'auto' : 'none';
      }
    };

    (async () => {
      const { default: createGlobe } = await import('cobe');
      if (cancelled) return;
      const size = wrap.clientWidth;
      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        width: size,
        height: size,
        phi,
        theta,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 5,
        baseColor: [0.15, 0.2, 0.3],
        markerColor: BLUE,
        glowColor: [0.12, 0.2, 0.45],
        markers,
        arcs,
        arcColor: GREEN,
        arcWidth: 0.6,
        arcHeight: 0.25,
        markerElevation: ELEVATION,
      });

      const loop = () => {
        const target = focusRef.current && CURRENCY_LOCATIONS[focusRef.current];
        if (target) {
          // Ease round to the currency being hovered in the list, the short way
          let delta = phiFacing(target[1]) - phi;
          delta = Math.atan2(Math.sin(delta), Math.cos(delta));
          phi += reduced ? delta : delta * 0.08;
        } else if (!dragging && !hovering && !reduced) {
          phi += SPIN;
        }
        globe!.update({ phi, theta });
        place();
        frame = requestAnimationFrame(loop);
      };
      loop();
    })();

    const onDown = (e: PointerEvent) => {
      dragging = { x: e.clientX, y: e.clientY, phi, theta };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const size = wrap.clientWidth;
      phi = dragging.phi + ((e.clientX - dragging.x) / size) * Math.PI;
      theta = Math.max(
        -0.6,
        Math.min(0.9, dragging.theta + ((e.clientY - dragging.y) / size) * 1.5),
      );
    };
    const onUp = () => {
      dragging = null;
      canvas.style.cursor = 'grab';
    };
    const onEnter = () => (hovering = true);
    const onLeave = () => (hovering = false);

    // Setting width/height resizes (and clears) the canvas, so only do it on real resizes
    let lastSize = wrap.clientWidth;
    const ro = new ResizeObserver(() => {
      const size = wrap.clientWidth;
      if (size && size !== lastSize) {
        lastSize = size;
        globe?.update({ width: size, height: size });
      }
    });
    ro.observe(wrap);

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    wrap.addEventListener('pointerenter', onEnter);
    wrap.addEventListener('pointerleave', onLeave);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      globe?.destroy();
      host.replaceChildren();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      wrap.removeEventListener('pointerenter', onEnter);
      wrap.removeEventListener('pointerleave', onLeave);
    };
  }, [entries, base]);

  const baseCur = getCurrency(base);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-7">
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-50">
            <GlobeAltIcon aria-hidden="true" className="h-4.5 w-4.5 text-blue-400" />
            Where your {base} goes further
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            How much more or less {baseCur?.name ?? base} buys than a year ago. Drag the globe, tap
            a currency to convert.
          </p>
        </div>
        {data && (
          <span className="hidden shrink-0 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-400 sm:inline">
            vs {formatDate(data.since)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        {/* Globe */}
        <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[480px]">
          {isError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-slate-400">
              <ExclamationTriangleIcon className="h-6 w-6 text-slate-600" />
              Globe data unavailable right now.
            </div>
          ) : (
            <>
              {(isLoading || !data) && (
                <div className="absolute inset-[10%] animate-pulse rounded-full bg-slate-800/40" />
              )}
              <div ref={hostRef} className="absolute inset-0" />
              {/* Hit targets over the WebGL markers. Mouse-only: the list is the keyboard path. */}
              {entries.map((e) => (
                <button
                  key={e.code}
                  ref={(el) => {
                    markerRefs.current[e.code] = el;
                  }}
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={() => onSelect(base, e.code)}
                  onMouseEnter={() => setFocusCode(e.code)}
                  onMouseLeave={() => setFocusCode(null)}
                  className="group absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-300"
                >
                  <span
                    className={`pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded-md border px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap tabular-nums shadow-lg transition-opacity ${
                      focusCode === e.code ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    } ${
                      e.changePct >= 0
                        ? 'border-emerald-700/60 bg-emerald-950/90 text-emerald-300'
                        : 'border-red-800/60 bg-red-950/90 text-red-300'
                    }`}
                  >
                    {e.code} {pct(e.changePct)}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Ranked lists: the accessible, keyboard-friendly view of the same data */}
        {entries.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <h3 className="mb-2 px-3 text-[11px] font-semibold tracking-widest text-emerald-400 uppercase">
                Goes furthest
              </h3>
              <ul>
                {strongest.map((e) => (
                  <ListItem
                    key={e.code}
                    entry={e}
                    base={base}
                    onSelect={onSelect}
                    onFocusCurrency={setFocusCode}
                  />
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 px-3 text-[11px] font-semibold tracking-widest text-red-400 uppercase">
                Buys less
              </h3>
              <ul>
                {weakest.map((e) => (
                  <ListItem
                    key={e.code}
                    entry={e}
                    base={base}
                    onSelect={onSelect}
                    onFocusCurrency={setFocusCode}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
