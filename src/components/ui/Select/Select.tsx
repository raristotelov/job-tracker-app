import { SelectHTMLAttributes } from 'react';
import styles from './Select.module.scss';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export function Select({
  label,
  id,
  options,
  error,
  placeholder,
  className,
  ...rest
}: SelectProps) {
  const selectClassNames = [
    styles.select,
    error ? styles.selectError : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.selectWrapper}>
        <select
          id={id}
          className={selectClassNames}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={error ? true : undefined}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden="true" />
      </div>
      {error ? (
        <span id={`${id}-error`} className={styles.errorMessage} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
