import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Timer, CheckSquare, BarChart3, Settings, Sparkles } from 'lucide-react';
import { useTimer } from '../../contexts/TimerContext';

export const MobileNav: React.FC = () => {
  const { isRunning, isPaused } = useTimer();

  const navItems = [
    // Dashboard section removed for now as requested
    // { to: '/', label: 'Home', icon: LayoutDashboard, colorClass: 'clay-nav-mint' },
    { to: '/timer', label: 'Timer', icon: Timer, colorClass: 'clay-nav-peach' },
    // Study Tasks & Syllabus sections commented out as requested
    // { to: '/tasks', label: 'Tasks', icon: CheckSquare, colorClass: 'clay-nav-lavender' },
    // { to: '/syllabus', label: 'Syllabus', icon: Sparkles, colorClass: 'clay-nav-lavender' },
    { to: '/coach', label: 'Coach', icon: Sparkles, colorClass: 'clay-nav-amber' },
    { to: '/analytics', label: 'Stats', icon: BarChart3, colorClass: 'clay-nav-sky' },
    { to: '/settings', label: 'Settings', icon: Settings, colorClass: 'clay-nav-slate' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#ebe2d3]/95 backdrop-blur-md border-t border-[#ded5c4] px-2 py-2 flex items-center justify-around z-30 shadow-[0_-8px_24px_rgba(150,135,115,0.2)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? `${item.colorClass} shadow-md scale-105`
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <div className="relative flex flex-col items-center">
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'text-slate-400'}`} />
                <span className="text-[10px] font-extrabold">{item.label}</span>
                {item.to === '/timer' && (isRunning || isPaused) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
