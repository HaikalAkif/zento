'use client';

import { useEffect, useRef } from 'react';

export default function VantaGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // Skip on mobile — canvas animation is too costly on low-end devices
    if (window.matchMedia('(max-width: 768px)').matches) return;

    let cancelled = false;

    (async () => {
      const THREE = await import('three');
      const { default: GLOBE } = await import('vanta/dist/vanta.globe.min');

      if (cancelled || !containerRef.current) return;

      effectRef.current = GLOBE({
        el: containerRef.current,
        THREE,
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
    })();

    return () => {
      cancelled = true;
      effectRef.current?.destroy();
      effectRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 -z-10" aria-hidden="true" />;
}
