import './Button.css';

const VARIANT_CLASS = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-fixed-dim hover:text-on-primary-fixed shadow-sm',
  secondary: 'bg-secondary text-on-secondary hover:bg-on-secondary-container shadow-sm',
  outline:
    'border border-outline-variant text-on-surface bg-surface-container-lowest hover:bg-surface-variant',
  ghost: 'text-on-surface-variant hover:text-secondary hover:bg-surface-variant',
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

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-sm rounded-lg text-label-md font-label-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary} ${widthClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
