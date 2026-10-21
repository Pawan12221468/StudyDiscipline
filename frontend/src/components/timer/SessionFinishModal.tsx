import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTimer } from '../../contexts/TimerContext';
import { useFocusMonitor } from '../../contexts/FocusMonitorContext';
import { formatDurationHuman } from '../../utils/formatTime';
import { Award, BookOpen, Clock, Camera } from 'lucide-react';

export const SessionFinishModal: React.FC = () => {
  const { timer, elapsedMs, finish, showFinishModal, setShowFinishModal, reset } = useTimer();
  const { isEnabled, getAggregateSummary, resetSessionData, disableMonitoring } = useFocusMonitor();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [includeMonitoring, setIncludeMonitoring] = useState(true);

  const totalSecs = Math.max(5, Math.floor(elapsedMs / 1000));
  const monitoringStats = isEnabled ? getAggregateSummary() : null;
  const hasMonitored = monitoringStats && monitoringStats.totalMonitoredSeconds >= 5;

  useEffect(() => {
    if (showFinishModal) {
      setTitle(timer.taskTitle ? `Focus: ${timer.taskTitle}` : 'Study Focus Session');
      setNotes(timer.sessionNotes || '');
    }
  }, [showFinishModal, timer]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const summaryPayload =
      hasMonitored && includeMonitoring
        ? {
            totalMonitoredSeconds: monitoringStats.totalMonitoredSeconds,
            personPresentPercent: monitoringStats.personPresentPercent,
            absenceIncidentCount: monitoringStats.absenceIncidentCount,
            phoneVisibleCount: monitoringStats.phoneVisibleCount,
          }
        : undefined;

    finish(title.trim() || undefined, notes.trim() || undefined, summaryPayload);
    resetSessionData();
    disableMonitoring();
  };

  const handleDiscard = () => {
    if (window.confirm('Discard this study session without recording it?')) {
      setShowFinishModal(false);
      reset();
      resetSessionData();
      disableMonitoring();
    }
  };


  return (
    <Modal
      isOpen={showFinishModal}
      onClose={() => setShowFinishModal(false)}
      title="Complete Study Session"
      subtitle="Log your focus session to update your streak and analytics"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Celebration Banner */}
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-950">Great focus work!</h4>
            <p className="text-xs text-emerald-800">
              You clocked <strong>{formatDurationHuman(totalSecs)}</strong> of pure focused study time.
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Session Title
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              placeholder="e.g. Deep Focus Sprint"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Duration
          </label>
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800">{formatDurationHuman(totalSecs)}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Session Notes & Takeaways
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white resize-none"
            placeholder="Key concepts grasped, formulas solved, or areas to review next..."
          />
        </div>

        {/* Optional Focus Camera Monitoring Summary */}
        {hasMonitored && monitoringStats && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>On-Device Focus Monitoring Summary</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Privacy-Preserving
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Monitored</span>
                <span className="text-xs font-bold text-slate-800">
                  {formatDurationHuman(monitoringStats.totalMonitoredSeconds)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">In Frame</span>
                <span className="text-xs font-bold text-emerald-700">
                  {monitoringStats.personPresentPercent}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Absences</span>
                <span className="text-xs font-bold text-slate-800">
                  {monitoringStats.absenceIncidentCount}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Phone Visible</span>
                <span className="text-xs font-bold text-amber-700">
                  {monitoringStats.phoneVisibleCount}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Note: Automated computer vision estimates. Never penalizes or reduces your clocked focus time.
            </p>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-2 border-t border-slate-200/60">
              <input
                type="checkbox"
                checked={includeMonitoring}
                onChange={(e) => setIncludeMonitoring(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Save aggregate metrics with study session (no video or images)</span>
            </label>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">

          <Button
            type="button"
            variant="ghost"
            onClick={handleDiscard}
            className="text-slate-500 hover:text-rose-600"
          >
            Discard
          </Button>
          <Button type="submit" variant="primary" className="px-6 font-semibold">
            Save to Study History
          </Button>
        </div>
      </form>
    </Modal>
  );
};
