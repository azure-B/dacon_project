import { useState } from 'react';
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
  disabled,
  icon,
  hint,
  className = '',
  passwordToggle = false,
  min,
  step,
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password' || passwordToggle;
  const resolvedType = isPassword && passwordToggle ? (visible ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
      {label ? (
        <label className="font-label-caps text-label-caps tracking-wider text-editorial-sage-muted" htmlFor={id}>
          {label}
          {required ? <span className="text-signal-risk ml-1">*</span> : null}
        </label>
      ) : null}
      <div className="relative flex items-center">
        {icon ? (
          <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px] pointer-events-none">
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          name={name}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          step={step}
          className={`input-field w-full py-3.5 ${icon ? 'pl-10' : 'pl-4'} ${passwordToggle ? 'pr-12' : 'pr-4'} bg-surface-charcoal rounded-DEFAULT text-editorial-sage-light font-body-md text-body-md placeholder:text-outline/40 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {passwordToggle ? (
          <button
            type="button"
            className="absolute right-3.5 text-outline hover:text-editorial-sage-light flex items-center justify-center p-1 rounded transition-colors"
            aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
          >
            <span className="material-symbols-outlined text-[20px]">{visible ? 'visibility_off' : 'visibility'}</span>
          </button>
        ) : null}
      </div>
      {hint ? <p className="text-label-sm font-label-sm text-outline m-0">{hint}</p> : null}
    </div>
  );
}
