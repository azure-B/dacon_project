import { useEffect, useState } from 'react';

/**
 * Animates a numeric value from 0 (or previous) to `value`.
 * Returns the current displayed number (finite) or null when value is unavailable.
 */
export default function useCountUp(value, { duration = 900, enabled = true } = {}) {
  const target = value == null || !Number.isFinite(Number(value)) ? null : Number(value);
  const [display, setDisplay] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (target == null) {
      setDisplay(null);
      return undefined;
    }

    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(target);
      return undefined;
    }

    let frameId = 0;
    const start = performance.now();
    const from = 0;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(from + (target - from) * eased);
      if (t < 1) frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [target, duration, enabled]);

  return display;
}
