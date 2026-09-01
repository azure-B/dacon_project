import './Button.css';

export default function Button({ children, variant = 'primary', onClick, disabled, type = 'button' }) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
