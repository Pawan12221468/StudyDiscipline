import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { StudyTask, TaskPriority } from '../../types';
import { STUDY_SUBJECTS } from '../../data/initialData';
import { useTasks } from '../../contexts/TaskContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: StudyTask | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
}) => {
  const { addTask, updateTask } = useTasks();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(STUDY_SUBJECTS[0].name);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [dueDate, setDueDate] = useState('Today');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setSubject(taskToEdit.subject);
      setPriority(taskToEdit.priority);
      setEstimatedMinutes(taskToEdit.estimatedMinutes);
      setDueDate(taskToEdit.dueDate || '');
      setNotes(taskToEdit.notes || '');
    } else {
      setTitle('');
      setSubject(STUDY_SUBJECTS[0].name);
      setPriority('medium');
      setEstimatedMinutes(30);
      setDueDate('Today');
      setNotes('');
    }
  }, [taskToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (taskToEdit) {
      updateTask(taskToEdit.id, {
        title: title.trim(),
        subject,
        priority,
        estimatedMinutes: Math.max(5, estimatedMinutes),
        dueDate: dueDate.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addTask({
        title: title.trim(),
        subject,
        priority,
        estimatedMinutes: Math.max(5, estimatedMinutes),
        dueDate: dueDate.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Study Task' : 'New Study Task'}
      subtitle="Define academic assignment goals and estimated focus duration"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Task Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Linear Algebra: Eigenvalues & Vector Spaces"
            className="w-full px-4 py-2.5 rounded-2xl bg-[#f5efe4] border border-white/80 shadow-[inset_2px_2px_4px_rgba(140,125,105,0.16),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Subject & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#f5efe4] border border-white/80 shadow-[inset_2px_2px_4px_rgba(140,125,105,0.16),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 cursor-pointer"
            >
              {STUDY_SUBJECTS.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#f5efe4] border border-white/80 shadow-[inset_2px_2px_4px_rgba(140,125,105,0.16),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 cursor-pointer"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Duration & Due Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Est. Focus Duration (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={300}
              step={5}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 25)}
              className="w-full px-4 py-2.5 rounded-2xl bg-[#f5efe4] border border-white/80 shadow-[inset_2px_2px_4px_rgba(140,125,105,0.16),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Due Date / Target
            </label>
            <input
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="e.g. Today, Tomorrow, Friday"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#f5efe4] border border-white/80 shadow-[inset_2px_2px_4px_rgba(140,125,105,0.16),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Notes & Reference Chapters
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key textbook exercises, homework links, or lecture references..."
            className="w-full px-4 py-2.5 rounded-2xl bg-[#f5efe4] border border-white/80 shadow-[inset_2px_2px_4px_rgba(140,125,105,0.16),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 placeholder:text-slate-400 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100/80">
          <button
            type="button"
            onClick={onClose}
            className="clay-btn-white px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="clay-btn clay-btn-emerald px-6 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
          >
            {taskToEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
