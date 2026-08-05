'use client';

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

export default function VantaGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // Skip on mobile. Canvas animation is too costly on low-end devices.
    if (window.matchMedia('(max-width: 768px)').matches) return;
    // Skip for users who asked for less motion. This is a constantly moving canvas.
    if (prefersReducedMotion()) return;

    let cancelled = false;

    (async () => {
      try {
        const THREE = await import('three');
        const { default: GLOBE } = await import('vanta/dist/vanta.globe.min');

        if (cancelled || !containerRef.current) return;

        effectRef.current = GLOBE({
          el: containerRef.current,
          // Vanta 0.5.24 predates three r125 and still reads THREE.VertexColors, which was
          // removed, so it now resolves to undefined and warns on every material it builds.
          // The globe geometry does set a color attribute, so `true` is the modern spelling.
          THREE: { ...THREE, VertexColors: true },
          mouseControls: true,
          touchControls: false,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x3b82f6,
          backgroundColor: 0x020617,
          points: 8,
          maxDistance: 18,
          spacing: 15,
        });
      } catch {
        // Three.js or Vanta failed to load. The page still works without the globe.
      }
    })();

    return () => {
      cancelled = true;
      effectRef.current?.destroy();
      effectRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 -z-10" aria-hidden="true" />;
}
