import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'clay-btn inline-flex items-center justify-center select-none font-bold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 rounded-xl',
    md: 'text-sm px-5 py-2.5 gap-2 rounded-2xl',
    lg: 'text-base px-7 py-3.5 gap-2.5 rounded-3xl font-extrabold tracking-wide',
  };

  const variantStyles = {
    primary: 'clay-btn-emerald',
    secondary: 'clay-btn-white !text-emerald-800',
    outline: 'clay-btn-white !text-slate-700',
    danger: 'clay-btn-coral',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-2xl border-transparent shadow-none',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
    </button>
  );
};
