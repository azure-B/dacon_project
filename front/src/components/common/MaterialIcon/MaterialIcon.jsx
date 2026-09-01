export default function MaterialIcon({ name, className = '', filled = false }) {
  return (
    <span className={`material-symbols-outlined ${filled ? 'icon-fill' : ''} ${className}`.trim()}>
      {name}
    </span>
  );
}
