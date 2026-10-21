import React from 'react';
import { TaskPriority, TimerMode, PomodoroPhase } from '../../types';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-1 rounded-full font-bold tracking-wide',
    md: 'text-xs px-3.5 py-1.5 rounded-full font-bold',
  };

  const variantStyles = {
    emerald: 'bg-[#eafaf1] text-emerald-800 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),_inset_-1px_-1px_3px_rgba(16,185,129,0.2),_2px_3px_6px_rgba(16,185,129,0.12)] border border-emerald-100',
    blue: 'bg-[#ebf5ff] text-blue-800 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),_inset_-1px_-1px_3px_rgba(14,165,233,0.2),_2px_3px_6px_rgba(14,165,233,0.12)] border border-blue-100',
    purple: 'bg-[#f5eeff] text-purple-800 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),_inset_-1px_-1px_3px_rgba(168,85,247,0.2),_2px_3px_6px_rgba(168,85,247,0.12)] border border-purple-100',
    amber: 'bg-[#fef8e7] text-amber-800 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),_inset_-1px_-1px_3px_rgba(245,158,11,0.2),_2px_3px_6px_rgba(245,158,11,0.12)] border border-amber-100',
    rose: 'bg-[#feeff2] text-rose-800 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),_inset_-1px_-1px_3px_rgba(244,63,94,0.2),_2px_3px_6px_rgba(244,63,94,0.12)] border border-rose-100',
    slate: 'bg-[#f1f3f7] text-slate-700 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.9),_inset_-1px_-1px_3px_rgba(160,172,195,0.2),_2px_3px_6px_rgba(160,172,195,0.12)] border border-slate-200/60',
  };

  return (
    <span className={`inline-flex items-center gap-1 leading-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: TaskPriority; size?: 'sm' | 'md' }> = ({
  priority,
  size = 'sm',
}) => {
  const map: Record<TaskPriority, { label: string; variant: BadgeProps['variant'] }> = {
    low: { label: 'Low', variant: 'slate' },
    medium: { label: 'Medium', variant: 'blue' },
    high: { label: 'High', variant: 'amber' },
    urgent: { label: 'Urgent', variant: 'rose' },
  };

  const config = map[priority] || map.low;
  return (
    <Badge variant={config.variant} size={size}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {config.label}
    </Badge>
  );
};

export const ModeBadge: React.FC<{ mode: TimerMode; phase?: PomodoroPhase; size?: 'sm' | 'md' }> = ({
  mode,
  phase,
  size = 'sm',
}) => {
  if (mode === 'pomodoro') {
    if (phase === 'short_break' || phase === 'long_break') {
      return (
        <Badge variant="blue" size={size}>
          Break ({phase === 'short_break' ? '5m' : '15m'})
        </Badge>
      );
    }
    return (
      <Badge variant="emerald" size={size}>
        Pomodoro Focus
      </Badge>
    );
  }

  if (mode === 'countdown') {
    return (
      <Badge variant="purple" size={size}>
        Countdown
      </Badge>
    );
  }

  return (
    <Badge variant="slate" size={size}>
      Stopwatch
    </Badge>
  );
};
