import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../common/Card';
import { useSessions } from '../../contexts/SessionContext';
import { useAuth } from '../../contexts/AuthContext';
import { goalService, DailyProgress } from '../../services/goalService';
import { formatDurationHuman } from '../../utils/formatTime';
import { Target, TrendingUp, Edit2, Check, X, RefreshCw } from 'lucide-react';

export const DailyFocusMetric: React.FC = () => {
  const { todayFocusSeconds, todayProgressPercent } = useSessions();
  const { isAuthenticated } = useAuth();

  const [progress, setProgress] = useState<DailyProgress | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [targetInputMinutes, setTargetInputMinutes] = useState<number>(120);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchDailyProgress = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const res = await goalService.getDailyProgress();
      if (res?.progress) {
        setProgress(res.progress);
        setTargetInputMinutes(res.progress.targetMinutes);
      }
    } catch (err) {
      console.warn('Could not load daily goal progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchDailyProgress();
  }, [fetchDailyProgress, todayFocusSeconds]);

  const handleSaveGoal = async () => {
    if (targetInputMinutes < 1 || targetInputMinutes > 1440) return;
    setIsSaving(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await goalService.updateDailyGoal(todayStr, targetInputMinutes);
      await fetchDailyProgress();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update daily goal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Derive metrics: prioritize live backend progress if available, otherwise session context
  const targetMinutes = progress ? progress.targetMinutes : 120;
  const targetSeconds = targetMinutes * 60;
  const completedSeconds = progress ? progress.completedSeconds : todayFocusSeconds;
  const progressPercent = targetSeconds > 0 ? Math.min(100, Math.round((completedSeconds / targetSeconds) * 100)) : 0;
  const remainingSeconds = Math.max(0, targetSeconds - completedSeconds);

  const targetHoursText = (targetMinutes / 60).toFixed(targetMinutes % 60 === 0 ? 0 : 1);

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold uppercase tracking-wider">
          <Target className="w-4 h-4 text-emerald-600" />
          <span>Today's Focus Time</span>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1.5 bg-white border border-emerald-300 rounded-lg p-1 shadow-xs">
            <input
              type="number"
              min={5}
              max={1440}
              step={5}
              value={targetInputMinutes}
              onChange={(e) => setTargetInputMinutes(parseInt(e.target.value) || 30)}
              className="w-16 px-1.5 py-0.5 text-xs font-bold text-slate-800 focus:outline-none"
              title="Target duration in minutes"
            />
            <span className="text-[11px] text-slate-400 font-medium mr-1">min</span>
            <button
              onClick={handleSaveGoal}
              disabled={isSaving}
              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              title="Save target"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="clay-btn-white !text-emerald-800 flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full cursor-pointer shadow-xs"
            title="Click to edit daily study target"
          >
            <span>Target: {targetHoursText}h ({targetMinutes}m)</span>
            <Edit2 className="w-2.5 h-2.5 opacity-60" />
          </button>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {formatDurationHuman(completedSeconds)}
          </span>
          <span className="text-slate-500 text-sm ml-2 font-bold">
            / {Math.floor(targetMinutes / 60)}h {targetMinutes % 60}m
          </span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-emerald-600 drop-shadow-xs">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Progress Bar with Sunken Clay Well */}
      <div className="w-full bg-[#ebe7df] clay-inset-sm p-0.5 rounded-full h-3 overflow-hidden mb-3.5">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-[inset_1px_1px_2px_rgba(255,255,255,0.7)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          {remainingSeconds > 0 ? (
            <span><strong>{formatDurationHuman(remainingSeconds)}</strong> left to hit target</span>
          ) : (
            <span className="text-emerald-700 font-semibold">Goal achieved today! 🎉</span>
          )}
        </span>
        <span className="text-slate-400">
          {progress?.isCustomGoal ? 'Custom Target' : 'Default Target'}
        </span>
      </div>
    </Card>
  );
};
