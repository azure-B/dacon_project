import './SegmentedControl.css';

/**
 * Pill segmented control — avalanche/snowball, timeline tabs, etc.
 */
export default function SegmentedControl({
  options = [],
  value,
  onChange,
  className = '',
  size = 'md',
  disabled = false,
}) {
  const pad = size === 'sm' ? 'px-space-md py-1' : 'px-4 py-2';

  return (
    <div
      className={`segmented inline-flex items-center gap-0 p-1.5 rounded-full bg-surface-charcoal border border-border-hairline shadow-[inset_0_2px_4px_rgba(0,0,0,0.45)] ${className}`.trim()}
      role="tablist"
    >
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled || option.disabled}
            onClick={() => onChange?.(option.id)}
            className={`segmented__item ${pad} rounded-full font-label-numeric text-label-numeric transition-all duration-tactile min-h-[40px] disabled:opacity-40 disabled:cursor-not-allowed ${
              active
                ? 'bg-primary-container text-on-primary-container font-bold shadow-extrude-sm'
                : 'text-on-surface-variant hover:text-editorial-sage-light'
            }`}
          >
            {option.label}
            {option.badge ? <span className="ml-1 opacity-80">{option.badge}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
