import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { ModeBadge } from '../common/Badge';
import { useSessions } from '../../contexts/SessionContext';
import { STUDY_SUBJECTS } from '../../data/initialData';
import { formatDurationHuman, formatDateLabel, formatTimeOfDay } from '../../utils/formatTime';
import { ArrowRight, Clock, RefreshCw, AlertCircle, Play } from 'lucide-react';
import { Button } from '../common/Button';

export const RecentSessionsList: React.FC = () => {
  const navigate = useNavigate();
  const { recentSessions, isLoading, error, refreshSessions } = useSessions();

  return (
    <Card
      title="Recent Study Sessions"
      subtitle="History of your completed focus blocks synced with MongoDB"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshSessions()}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
            title="Refresh sessions from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/analytics')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline ml-1"
          >
            Detailed Analytics <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {isLoading && recentSessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
            <span>Loading study sessions...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => refreshSessions()}>
              Retry
            </Button>
          </div>
        ) : recentSessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-700">No completed sessions yet.</p>
            <p className="text-slate-400 max-w-xs mt-0.5">
              Launch the Focus Timer to log your first verified study block to MongoDB!
            </p>
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate('/timer')}
              className="mt-3"
              icon={<Play className="w-3.5 h-3.5 fill-current" />}
            >
              Start Focus Session
            </Button>
          </div>
        ) : (
          recentSessions.map((session) => {
            const subject = STUDY_SUBJECTS.find((s) => s.name === session.subject);
            return (
              <div
                key={session.id}
                className="p-4 rounded-2xl bg-white border border-white/80 shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.95),_4px_6px_16px_rgba(160,172,195,0.15)] hover:scale-[1.01] transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-3 h-10 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: subject?.color || '#10b981' }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800 truncate">{session.title}</p>
                      {session.isDemo && (
                        <span className="text-[10px] bg-[#f1f3f7] text-slate-500 px-2 py-0.5 rounded-full font-bold shadow-xs">
                          Demo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-bold text-slate-700">{session.subject}</span>
                      <span>•</span>
                      <span className="font-medium">{formatDateLabel(session.completedAt)} at {formatTimeOfDay(session.completedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1 justify-end">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatDurationHuman(session.durationSeconds)}
                    </span>
                    <div className="mt-1">
                      <ModeBadge mode={session.mode} size="sm" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
