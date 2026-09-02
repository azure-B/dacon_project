import './Card.css';

export default function Card({ children, className = '', as: Component = 'div', onClick }) {
  return (
    <Component
      className={`bg-surface-container-lowest border border-outline-variant rounded-xl shadow-level-1 ${className}`.trim()}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}
