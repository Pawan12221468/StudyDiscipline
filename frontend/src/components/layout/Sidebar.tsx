import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Timer,
  CheckSquare,
  BarChart3,
  Settings,
  Play,
  Pause,
  ArrowRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useTimer } from '../../contexts/TimerContext';
import { useSessions } from '../../contexts/SessionContext';
import { useSettings } from '../../contexts/SettingsContext';
import { formatMillisecondsToDisplay, formatDurationHuman } from '../../utils/formatTime';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const navigate = useNavigate();
  const { timer, isRunning, isPaused, elapsedMs, remainingMs, pause, resume } = useTimer();
  const { todayFocusSeconds } = useSessions();
  const { settings } = useSettings();

  const navItems = [
    // Dashboard section removed for now as requested
    // { to: '/', label: 'Dashboard', subtitle: 'Overview & Goals', icon: LayoutDashboard, colorClass: 'clay-nav-mint' },
    { to: '/timer', label: 'Focus Timer', subtitle: 'Stopwatch & Pomodoro', icon: Timer, colorClass: 'clay-nav-peach' },
    // Study Tasks & AI Syllabus sections commented out as requested
    // { to: '/tasks', label: 'Study Tasks', subtitle: 'To-do & Priority', icon: CheckSquare, colorClass: 'clay-nav-lavender' },
    // { to: '/syllabus', label: 'AI Syllabus', subtitle: 'Curriculum & Practice', icon: Sparkles, colorClass: 'clay-nav-lavender' },
    { to: '/analytics', label: 'Session Analytics', subtitle: 'Trends & Stats', icon: BarChart3, colorClass: 'clay-nav-sky' },
    { to: '/coach', label: 'AI Study Coach', subtitle: 'Smart Tips & Guidance', icon: Sparkles, colorClass: 'clay-nav-amber' },
    { to: '/settings', label: 'Settings', subtitle: 'Targets & Preferences', icon: Settings, colorClass: 'clay-nav-slate' },
  ];

  const timerDisplay = formatMillisecondsToDisplay(
    timer.mode === 'stopwatch' ? elapsedMs : remainingMs
  ).formatted;

  const todayTargetSecs = settings.dailyTargetHours * 3600;
  const progressPct = Math.min(100, Math.round((todayFocusSeconds / Math.max(1, todayTargetSecs)) * 100));

  return (
    <aside className="w-80 xl:w-88 h-full bg-transparent flex flex-col justify-between shrink-0 select-none pl-6 sm:pl-8 pr-4 pt-6 pb-5 overflow-y-auto no-scrollbar gap-4">
      {/* Top Section: Branding + Nav Menu */}
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        {/* Top Branding (height matches Header title box) */}
        <div className="h-12 flex items-center gap-3.5 px-1 shrink-0">
          <div className="w-11 h-11 rounded-2xl clay-btn-emerald flex items-center justify-center shadow-md shrink-0">
            <BookOpen className="w-5.5 h-5.5 text-white stroke-[2.5]" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">StudyDiscipline</h1>
            <span className="text-[11px] text-emerald-800 font-extrabold tracking-wider uppercase mt-1.5 block">Focus & Mastery</span>
          </div>
        </div>

        {/* 3D Rectangular Clay Card Container behind the navigation buttons */}
        <div className="clay-card rounded-[30px] p-3.5 sm:p-4 pb-4 sm:pb-5 bg-[#fbf9f5] border-2 border-white/90 shadow-md shrink-0">
          <div className="flex items-center justify-between pb-2.5 px-1 border-b border-slate-200/60 mb-2.5">
            <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase">
              Productivity Menu
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Navigation Links as 3D Clay Cards (Cleanly padded, uniform spacing, cushioned bottom) */}
          <nav className="space-y-2.5 flex flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 cursor-pointer ${item.colorClass} ${
                      isActive
                        ? 'ring-3 ring-white shadow-xl scale-[1.02] -translate-y-0.5'
                        : 'opacity-90 hover:opacity-100 hover:scale-[1.01] hover:shadow-md'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Dark squircle badge with crisp icon */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center clay-icon-badge shrink-0 transition-transform group-hover:scale-105">
                        <Icon className="w-4 h-4 text-white stroke-[2.3]" />
                      </div>

                      {/* Title & Subtitle */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs sm:text-sm tracking-tight leading-tight block truncate">
                            {item.label}
                          </span>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-white shadow-xs ml-1 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-semibold opacity-85 block truncate leading-tight mt-0.5">
                          {item.subtitle}
                        </span>
                      </div>

                      {/* Active Timer Pulse Dot */}
                      {item.to === '/timer' && (isRunning || isPaused) && (
                        <span className="w-2.5 h-2.5 rounded-full bg-white shadow-xs animate-ping shrink-0" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Area: Daily Goal & Active timer (Taller & Spacious) */}
      <div className="space-y-3 shrink-0 pt-1">
        {/* Active background timer indicator widget */}
        {(isRunning || isPaused) && (
          <div
            onClick={() => {
              navigate('/timer');
              if (onCloseMobile) onCloseMobile();
            }}
            className="p-3.5 rounded-[24px] clay-card-mint cursor-pointer hover:scale-[1.02] transition-transform group shadow-md"
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1.5">
              <span className="flex items-center gap-1.5 truncate">
                <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`} />
                <span className="truncate">{timer.taskTitle || 'Focus Session'}</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isRunning) pause();
                  else resume();
                }}
                className="p-1.5 rounded-xl bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors shadow-xs"
                title={isRunning ? 'Pause' : 'Resume'}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="timer-digits text-base font-extrabold text-emerald-950 tracking-wider">
                {timerDisplay}
              </span>
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Open <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        )}

        {/* Daily Goal Elevated 3D Porcelain Clay Card (Taller & Prominent) */}
        <div className="clay-card rounded-[28px] p-4 bg-[#fdfcf9] border-2 border-white/90 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-800 mb-2.5 font-black">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm">Daily Goal</span>
            </div>
            <span className="text-emerald-700 font-black tracking-tight text-xs">
              {formatDurationHuman(todayFocusSeconds)} / {settings.dailyTargetHours}h
            </span>
          </div>
          <div className="w-full bg-[#ded5c4] rounded-full h-3 overflow-hidden shadow-inner border border-white/60 p-0.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.max(progressPct, 4)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold mt-2">
            <span>{progressPct}% Completed</span>
            <span>Target: {settings.dailyTargetHours}h</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
