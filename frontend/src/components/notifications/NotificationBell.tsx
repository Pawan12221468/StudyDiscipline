import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Target,
  Clock,
  Coffee,
  Play,
  BarChart3,
  Timer,
  Trash2,
  Moon,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { AppNotification, NotificationType } from '../../types/notification';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isQuietHoursActive,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'goal_reminder':
        return <Target className="w-4 h-4 text-amber-600" />;
      case 'task_deadline':
        return <Clock className="w-4 h-4 text-rose-600" />;
      case 'pomodoro_break':
        return <Coffee className="w-4 h-4 text-teal-600" />;
      case 'break_end':
        return <Play className="w-4 h-4 text-indigo-600" />;
      case 'daily_summary':
        return <BarChart3 className="w-4 h-4 text-purple-600" />;
      case 'session_reminder':
      default:
        return <Timer className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getIconBackground = (type: NotificationType) => {
    switch (type) {
      case 'goal_reminder':
        return 'bg-amber-50 border-amber-200';
      case 'task_deadline':
        return 'bg-rose-50 border-rose-200';
      case 'pomodoro_break':
        return 'bg-teal-50 border-teal-200';
      case 'break_end':
        return 'bg-indigo-50 border-indigo-200';
      case 'daily_summary':
        return 'bg-purple-50 border-purple-200';
      case 'session_reminder':
      default:
        return 'bg-emerald-50 border-emerald-200';
    }
  };

  const formatRelativeTime = (isoString: string): string => {
    try {
      const now = Date.now();
      const past = new Date(isoString).getTime();
      const diffSecs = Math.max(0, Math.floor((now - past) / 1000));

      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      setIsOpen(false);
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative clay-btn-white p-2.5 rounded-2xl text-slate-600 hover:text-slate-900 transition-all focus:outline-none"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[10px] font-black text-white clay-btn-coral rounded-full ring-2 ring-white shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Quiet Hours small indicator */}
        {isQuietHoursActive && unreadCount === 0 && (
          <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-1 ring-white" title="Quiet Hours active" />
        )}
      </button>

      {/* Flyout Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 clay-card !rounded-[28px] shadow-2xl z-50 overflow-hidden animate-fade-in border-2 border-white">
          {/* Header */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-[#eafaf1] text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  {unreadCount} new
                </span>
              )}
              {isQuietHoursActive && (
                <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200" title="Notifications are silenced during quiet hours">
                  <Moon className="w-3 h-3 text-indigo-500" />
                  Quiet Hours
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-bold transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2.5 border-b border-slate-100/80 flex gap-2 text-xs clay-inset m-2 rounded-2xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                filter === 'all'
                  ? 'clay-btn-white !text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                filter === 'unread'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold text-slate-600">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {filter === 'unread'
                    ? 'No unread notifications.'
                    : 'Study reminders, goal notices, and break alerts will appear here.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 group relative cursor-pointer ${
                    !notification.isRead ? 'bg-emerald-50/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Icon */}
                  <div
                    className={`p-2 rounded-xl border shrink-0 ${getIconBackground(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs truncate ${
                          !notification.isRead
                            ? 'font-bold text-slate-900'
                            : 'font-semibold text-slate-700'
                        }`}
                      >
                        {notification.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>

                    {notification.actionUrl && (
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold group-hover:text-emerald-700">
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Actions (Delete button) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="absolute right-3 top-3 p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Unread dot */}
                  {!notification.isRead && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 absolute left-2 top-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/settings');
              }}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Notification Settings</span>
            </button>

            <span className="text-[10px] text-slate-400">Phase 9 Smart Alerts</span>
          </div>
        </div>
      )}
    </div>
  );
};
