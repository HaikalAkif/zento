'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}

export default function AnimatedNumber({
  value,
  decimals = 2,
  duration = 500,
  className,
}: Props) {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef<number | null>(null);
  const currentRef = useRef(value);

  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const from = currentRef.current;
    const to = value;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      currentRef.current = current;
      setDisplay(current);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {display.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}
