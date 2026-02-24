'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  destructive: styles.variantDestructive,
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  const classNames = [
    styles.button,
    variantClassMap[variant],
    sizeClassMap[size],
    isLoading ? styles.loading : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      disabled={isDisabled}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className={styles.spinnerWrapper} aria-hidden="true">
          <span className={styles.spinner} />
        </span>
      ) : null}
      <span className={isLoading ? styles.hiddenText : undefined}>
        {children}
      </span>
    </button>
  );
}
