import React, { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoggingOut?: boolean;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoggingOut = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoggingOut) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isLoggingOut]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Heavy Frost Blur Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-md sm:backdrop-blur-lg transition-all duration-300"
        onClick={() => !isLoggingOut && onClose()}
      />

      {/* 3D Porcelain Clay Centered Card */}
      <div
        className="relative w-full max-w-sm clay-card !rounded-[32px] bg-[#fdfcf9] border-2 border-white/95 shadow-2xl p-6 sm:p-7 z-10 transform transition-all duration-200 scale-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
      >
        {/* Top Close Button */}
        <button
          onClick={onClose}
          disabled={isLoggingOut}
          className="absolute top-4 right-4 clay-btn-white p-2 rounded-xl text-slate-400 hover:text-slate-700 transition-all cursor-pointer disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Rose Gradient Icon Badge */}
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 border-2 border-white/80 mb-4 shrink-0">
            <LogOut className="w-7 h-7 stroke-[2.3] ml-0.5" />
          </div>

          {/* Heading */}
          <h3
            id="logout-modal-title"
            className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-['Outfit']"
          >
            Are you sure you want to log out?
          </h3>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 leading-relaxed max-w-xs">
            Your study timer and session metrics are safely synced. You can sign back in anytime to continue your streak.
          </p>

          {/* Action Buttons */}
          <div className="w-full flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoggingOut}
              className="flex-1 py-3 px-4 rounded-2xl clay-btn-white text-slate-700 hover:text-slate-900 font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoggingOut}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoggingOut ? (
                <span>Logging out...</span>
              ) : (
                <>
                  <LogOut className="w-4 h-4 stroke-[2.3]" />
                  <span>Log Out</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
