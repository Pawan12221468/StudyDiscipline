import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Play, Timer, Sparkles, LogOut, Settings } from 'lucide-react';
import { useTimer } from '../../contexts/TimerContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';
import { NotificationBell } from '../notifications/NotificationBell';
import { LogoutModal } from './LogoutModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRunning, isPaused, timer, start } = useTimer();
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
      case '/timer':
        return { title: 'Focus Timer', subtitle: 'Select your preferred timer mode and start your study session.' };
      // case '/syllabus':
      // case '/tasks':
      //   return { title: 'AI Syllabus & Practice', subtitle: 'Curriculum roadmaps, dynamic question sets, and study discipline.' };
      case '/analytics':
        return { title: 'Session Analytics', subtitle: 'Deep dive into your weekly focus hours, subjects, and study habits.' };
      case '/coach':
        return { title: 'AI Study Coach', subtitle: 'Personalized study planning, intelligent guidance, and data-driven insights.' };
      case '/settings':
        return { title: 'Settings', subtitle: 'Configure daily study goals, Pomodoro intervals, and preferences.' };

      default:
        return { title: 'Study Discipline', subtitle: 'Modern focus and academic productivity' };
    }
  };

  const { title, subtitle } = getPageInfo();

  const handleStartSession = () => {
    if (location.pathname !== '/timer') {
      navigate('/timer');
    }
    if (!isRunning) {
      start();
    }
  };

  const handleOpenLogoutModal = () => {
    setProfileMenuOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutModal(false);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="pt-6 pb-2 bg-transparent px-4 sm:px-6 lg:pl-4 lg:pr-8 flex items-center justify-between sticky top-0 z-20">
      <div className="h-12 flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden clay-btn-white p-2.5 rounded-2xl text-slate-600 hover:text-slate-900 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col justify-center">
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">{title}</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Active Timer Pill if running/paused */}
        {(isRunning || isPaused) && location.pathname !== '/timer' && (
          <button
            onClick={() => navigate('/timer')}
            className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-full clay-btn-white !text-emerald-800 text-xs font-extrabold transition-all"
          >
            <Timer className="w-4 h-4 text-emerald-600 animate-spin" />
            <span>Active: {timer.subject}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </button>
        )}

        {/* Quick start session button */}
        {location.pathname !== '/timer' && (
          <Button
            size="sm"
            onClick={handleStartSession}
            icon={isRunning ? <Sparkles className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          >
            {isRunning ? 'Resume Timer' : 'Start Session'}
          </Button>
        )}

        {/* Phase 9 Notification Bell */}
        <NotificationBell />

        {/* Minimal User Avatar with Dropdown Menu */}
        {user && (
          <div className="relative pl-1 sm:pl-2" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-black text-sm shadow-md border-2 border-white/90 hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              aria-label="User profile menu"
              aria-expanded={profileMenuOpen}
              title={`Logged in as ${user.name} (${user.email})`}
            >
              {user.name.charAt(0).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </button>

            {/* Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2.5 w-56 rounded-2xl clay-card bg-[#fdfcf9] border-2 border-white/90 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-[#ded5c4]/60 mb-1">
                  <p className="text-xs font-black text-slate-900 truncate leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5 font-medium">{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-emerald-700 font-extrabold uppercase tracking-wide">Active</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-black/5 transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Account Settings</span>
                </button>

                <button
                  onClick={handleOpenLogoutModal}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors text-left mt-0.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Centered 3D Clay Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </header>
  );
};
