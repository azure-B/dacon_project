import './Button.css';

const VARIANT_CLASS = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-container shadow-extrude-sm hover:-translate-y-px active:translate-y-px active:shadow-none',
  secondary:
    'bg-surface-charcoal border border-border-subtle text-editorial-sage-light hover:bg-surface-container active:scale-[0.98]',
  outline:
    'border border-border-hairline text-editorial-sage-light bg-transparent hover:bg-surface-container-high active:scale-[0.98]',
  ghost: 'text-on-surface-variant hover:text-editorial-sage-light hover:bg-surface-container active:scale-[0.98]',
  extruded:
    'bg-primary text-on-primary font-semibold shadow-extrude hover:-translate-y-0.5 hover:shadow-[0_6px_0_#0D6D43] active:translate-y-0.5 active:shadow-none',
  pill: 'rounded-full bg-primary text-on-primary shadow-extrude-sm hover:-translate-y-px active:translate-y-px active:shadow-none',
  legacy: '',
};

export default function Button({
  children,
  variant = 'primary',
  onClick,
  disabled,
  type = 'button',
  className = '',
  fullWidth = false,
}) {
  if (variant === 'legacy') {
    return (
      <button type={type} className={`btn btn--primary ${className}`.trim()} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    );
  }

  const widthClass = fullWidth ? 'w-full' : '';
  const radiusClass = variant === 'pill' ? '' : 'rounded-DEFAULT';

  return (
    <button
      type={type}
      className={`btn-press inline-flex items-center justify-center gap-sm ${radiusClass} text-label-numeric font-label-numeric transition-all duration-tactile focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary} ${widthClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
