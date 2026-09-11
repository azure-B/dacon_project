import './Card.css';

const VARIANT_CLASS = {
  default: 'bg-surface-architectural border border-border-hairline shadow-card',
  architectural: 'bg-surface-architectural border border-border-hairline shadow-card',
  frosted: 'bg-surface-card-frosted backdrop-blur-xl border border-border-hairline shadow-card',
  charcoal: 'bg-surface-charcoal/90 border border-border-hairline shadow-card',
  ghost: 'bg-transparent border border-border-subtle',
};

export default function Card({
  children,
  className = '',
  as: Component = 'div',
  onClick,
  variant = 'default',
  hoverLift = false,
}) {
  const interactive = typeof onClick === 'function';

  return (
    <Component
      className={`rounded-xl ${VARIANT_CLASS[variant] ?? VARIANT_CLASS.default} ${hoverLift ? 'card-hover-lift' : ''} ${interactive ? 'cursor-pointer' : ''} ${className}`.trim()}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick(event);
              }
            }
          : undefined
      }
    >
      {children}
    </Component>
  );
}
