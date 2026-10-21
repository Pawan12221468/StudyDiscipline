import React from 'react';
import { Info, Sparkles } from 'lucide-react';

export interface DemoDataBannerProps {
  message?: string;
  className?: string;
  compact?: boolean;
}

export const DemoDataBanner: React.FC<DemoDataBannerProps> = ({
  message = 'Demo Data: Sample study metrics shown alongside your active session logs',
  className = '',
  compact = false,
}) => {
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/80 border border-emerald-200/60 text-[11px] font-medium text-emerald-800 ${className}`}>
        <Sparkles className="w-3 h-3 text-emerald-600" />
        <span>Demo Data Preview</span>
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/50 text-xs text-emerald-800 ${className}`}>
      <Info className="w-4 h-4 text-emerald-600 shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  );
};
