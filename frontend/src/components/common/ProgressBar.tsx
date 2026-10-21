import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  height?: 'sm' | 'md' | 'lg';
  color?: 'emerald' | 'blue' | 'purple' | 'amber';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  height = 'md',
  color = 'emerald',
  showLabel = false,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorStyles = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-slate-600 mb-1.5 font-bold">
          <span>Progress</span>
          <span className="text-emerald-700 font-extrabold">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-[#ebe7df] clay-inset-sm p-0.5 rounded-full overflow-hidden ${heightStyles[height]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out shadow-[inset_1px_1px_2px_rgba(255,255,255,0.7),_inset_-1px_-1px_2px_rgba(0,0,0,0.15)] ${colorStyles[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
