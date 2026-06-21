import { useEffect, useRef, useState } from 'react';

const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 4);

export function useCountUp(target: number, ready = true, duration = 1800): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef<number>(0);
  const prevTarget = useRef<number | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (target === prevTarget.current) return;
    fromRef.current = value;
    prevTarget.current = target;

    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const progress = Math.min(1, (t - start) / duration);
      const eased = EASE_OUT(progress);
      const next = fromRef.current + (target - fromRef.current) * eased;
      setValue(progress === 1 ? target : next);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, ready]);

  return value;
}
