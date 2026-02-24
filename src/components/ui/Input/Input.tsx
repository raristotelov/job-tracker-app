import { InputHTMLAttributes } from 'react';
import styles from './Input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export function Input({ label, id, error, className, ...rest }: InputProps) {
  const inputClassNames = [
    styles.input,
    error ? styles.inputError : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={inputClassNames}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error ? (
        <span id={`${id}-error`} className={styles.errorMessage} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
