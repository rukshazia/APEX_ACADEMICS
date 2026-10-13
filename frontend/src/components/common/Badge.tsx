import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-status-success/15 text-[#355342] border-status-success/30',
    warning: 'bg-status-warning/15 text-[#735A2D] border-status-warning/30',
    danger: 'bg-status-danger/15 text-[#7D3E3E] border-status-danger/30',
    info: 'bg-status-info/15 text-[#374E64] border-status-info/30',
    accent: 'bg-brand-blue/15 text-[#2E435B] border-brand-blue/30',
    neutral: 'bg-bg-highlight text-txt-secondary border-brd',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border tracking-wide select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
