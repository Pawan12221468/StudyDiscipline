import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  badge,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  hoverable = false,
}) => {
  return (
    <div
      className={`clay-card rounded-[28px] ${
        hoverable ? 'clay-card-hover' : ''
      } ${className}`}
    >
      {(title || subtitle || action || badge) && (
        <div className={`px-6 py-4 border-b border-slate-100/80 flex items-center justify-between gap-4 ${headerClassName}`}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              {typeof title === 'string' ? (
                <h3 className="text-base font-bold text-slate-800 tracking-tight truncate">{title}</h3>
              ) : (
                title
              )}
              {badge}
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
};
