'use client';

import { useEffect, useState } from 'react';
import { ReactLenis } from 'lenis/react';
import { prefersReducedMotion } from '@/lib/motion';

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion()); // eslint-disable-line react-hooks/set-state-in-effect -- matchMedia is unavailable during SSR
  }, []);

  return (
    <ReactLenis
      root
      options={{
        // lerp 1 = no easing, so scrolling falls back to native 1:1 movement
        lerp: reduced ? 1 : 0.08,
        smoothWheel: !reduced,
        touchMultiplier: 1.2,
      }}
    >
      {children}
    </ReactLenis>
  );
}
