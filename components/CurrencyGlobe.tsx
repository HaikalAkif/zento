'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Globe } from 'cobe';
import { getStrength, type StrengthEntry } from '@/lib/api';
import { getCurrency } from '@/lib/currencies';
import { formatDate } from '@/lib/format';
import { CURRENCY_LOCATIONS, phiFacing, projectLocation } from '@/lib/geo';
import { prefersReducedMotion } from '@/lib/motion';
import CurrencyMark from './CurrencyMark';

interface Props {
  /** Whose money we're measuring. Must be an ECB currency. */
  base: string;
  onSelect: (from: string, to: string) => void;
}

const THETA = 0.3;
const ELEVATION = 0.05;
const SPIN = 0.0025;
type RGB = [number, number, number];

/** WebGL can't read CSS variables, so the globe gets its own copy of each theme. */
function palette(dark: boolean) {
  return dark
    ? {
        dark: 1,
        diffuse: 1.2,
        mapBrightness: 5,
        base: [0.1, 0.13, 0.11] as RGB,
        glow: [0.16, 0.22, 0.18] as RGB,
        up: [0.44, 0.83, 0.62] as RGB,
        down: [1, 0.54, 0.5] as RGB,
        home: [0.79, 0.7, 0.49] as RGB,
      }
    : {
        dark: 0,
        diffuse: 1.4,
        mapBrightness: 7,
        base: [0.95, 0.93, 0.89] as RGB,
        glow: [0.9, 0.87, 0.8] as RGB,
        up: [0.05, 0.48, 0.31] as RGB,
        down: [0.7, 0.15, 0.12] as RGB,
        home: [0.09, 0.08, 0.06] as RGB,
      };
}

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
        className="group flex w-full items-center justify-between gap-3 border-b border-line py-2.5 text-left"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <CurrencyMark code={entry.code} size="sm" />
          <span className="text-sm font-semibold text-ink transition-colors group-hover:text-accent">
            {entry.code}
          </span>
          <span className="truncate text-xs text-ink-3">{cur?.name}</span>
        </span>
        <span className={`text-sm font-medium tabular-nums ${up ? 'text-up' : 'text-down'}`}>
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
  const [dark, setDark] = useState(false);

  // Follow the system theme, which is what the CSS tokens follow
  useEffect(() => {
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setDark(scheme.matches);
    update();
    scheme.addEventListener('change', update);
    return () => scheme.removeEventListener('change', update);
  }, []);

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

    const colors = palette(dark);
    const maxAbs = Math.max(...entries.map((e) => Math.abs(e.changePct)), 1);
    const markers = [
      ...entries.map((e) => ({
        location: CURRENCY_LOCATIONS[e.code],
        size: 0.03 + (Math.abs(e.changePct) / maxAbs) * 0.07,
        color: e.changePct >= 0 ? colors.up : colors.down,
      })),
      ...(baseLoc ? [{ location: baseLoc, size: 0.08, color: colors.home }] : []),
    ];
    // Arcs from home to the three places your money goes furthest
    const arcs = baseLoc
      ? entries
          .filter((e) => e.changePct > 0)
          .slice(0, 3)
          .map((e) => ({ from: baseLoc, to: CURRENCY_LOCATIONS[e.code], color: colors.up }))
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

    // Only render while on screen. Scrolled past, the globe costs nothing.
    let visible = true;
    let running = false;

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
        dark: colors.dark,
        diffuse: colors.diffuse,
        mapSamples: 16000,
        mapBrightness: colors.mapBrightness,
        baseColor: colors.base,
        markerColor: colors.home,
        glowColor: colors.glow,
        markers,
        arcs,
        arcColor: colors.up,
        arcWidth: 0.6,
        arcHeight: 0.25,
        markerElevation: ELEVATION,
      });

      start();
    })();

    function loop() {
      if (!visible || !globe) {
        running = false;
        return;
      }
      const target = focusRef.current && CURRENCY_LOCATIONS[focusRef.current];
      if (target) {
        // Ease round to the currency being hovered in the list, the short way
        let delta = phiFacing(target[1]) - phi;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta));
        phi += reduced ? delta : delta * 0.08;
      } else if (!dragging && !hovering && !reduced) {
        phi += SPIN;
      }
      globe.update({ phi, theta });
      place();
      frame = requestAnimationFrame(loop);
    }
    function start() {
      if (running) return;
      running = true;
      loop();
    }
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    visibility.observe(wrap);

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
      visibility.disconnect();
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
  }, [entries, base, dark]);

  return (
    <div className="grid grid-cols-1 items-center gap-8 xl:grid-cols-[minmax(0,1fr)_16rem]">
      {/* Globe */}
      <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[520px]">
        {isError ? (
          <p className="absolute inset-0 grid place-items-center text-sm text-ink-2">
            Globe data unavailable right now.
          </p>
        ) : (
          <>
            {(isLoading || !data) && (
              <div className="absolute inset-[10%] animate-pulse rounded-full bg-paper-2" />
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
                  className={`pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded-full border border-line-strong bg-paper px-2 py-0.5 text-[11px] font-medium whitespace-nowrap tabular-nums shadow-lift transition-opacity ${
                    focusCode === e.code ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  } ${e.changePct >= 0 ? 'text-up' : 'text-down'}`}
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
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-1">
          <div>
            <h3 className="mb-1 t-label text-up">Goes furthest</h3>
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
            <h3 className="mb-1 t-label text-down">Buys less</h3>
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
          {data && (
            <p className="text-xs text-ink-3 sm:col-span-2 xl:col-span-1">
              Compared with {formatDate(data.since)}. ECB reference rates.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
