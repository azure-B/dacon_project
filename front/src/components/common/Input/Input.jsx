import './Input.css';

export default function Input({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
  icon,
  hint,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-xs ${className}`.trim()}>
      {label ? (
        <label className="text-label-md font-label-md text-on-surface" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div className="relative flex items-center">
        {icon ? (
          <span className="material-symbols-outlined absolute left-md text-on-surface-variant/50 pointer-events-none">
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full h-[48px] ${icon ? 'pl-[44px]' : 'px-md'} pr-md bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow`}
        />
      </div>
      {hint ? <p className="text-label-sm font-label-sm text-on-surface-variant">{hint}</p> : null}
    </div>
  );
}
