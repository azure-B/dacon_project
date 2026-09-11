import { useEffect, useState } from 'react';
import './ProgressBar.css';

export default function ProgressBar({
  value = 0,
  max = 100,
  className = '',
  barClassName = 'progress-bar-gradient',
  heightClass = 'h-2',
  animate = true,
}) {
  const safeMax = Number(max) > 0 ? Number(max) : 100;
  const ratio = Math.max(0, Math.min(100, (Number(value) / safeMax) * 100));
  const [width, setWidth] = useState(animate ? 0 : ratio);

  useEffect(() => {
    if (!animate) {
      setWidth(ratio);
      return undefined;
    }
    setWidth(0);
    const frame = window.requestAnimationFrame(() => {
      setWidth(ratio);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [ratio, animate]);

  return (
    <div
      className={`progress-bar w-full overflow-hidden rounded-full bg-surface-charcoal ${heightClass} ${className}`.trim()}
      role="progressbar"
      aria-valuenow={Math.round(ratio)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`progress-bar__fill h-full rounded-full ${barClassName}`.trim()}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
