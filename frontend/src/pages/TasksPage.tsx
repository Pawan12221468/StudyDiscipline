import React, { useState } from 'react';
import { TaskModal } from '../components/tasks/TaskModal';
import { SyllabusPracticeHub } from '../components/syllabus/SyllabusPracticeHub';
import { MyTasksHub } from '../components/tasks/MyTasksHub';
import { useTasks } from '../contexts/TaskContext';
import { StudyTask } from '../types';
import { Sparkles, ListTodo } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { tasks } = useTasks();

  const [activeView, setActiveView] = useState<'syllabus' | 'tasks'>('syllabus');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<StudyTask | null>(null);

  const handleOpenCreateModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: StudyTask) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & View Tabs (Stable, Symmetrical, Non-Jumping) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Study & Practice Hub
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            AI-powered curriculum roadmaps, dynamic problem sets, and academic assignment tracking.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center p-1 bg-[#f5efe4] rounded-2xl border border-white/80 shadow-[inset_2px_2px_4px_rgba(140,125,105,0.16),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)] gap-1 shrink-0">
          <button
            onClick={() => setActiveView('syllabus')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'syllabus'
                ? 'clay-btn-white !text-emerald-900 shadow-sm scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Syllabus & Questions</span>
            <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-2xs">
              New
            </span>
          </button>

          {/* Study Task switcher button commented out as requested */}
          {/*
          <button
            onClick={() => setActiveView('tasks')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'tasks'
                ? 'clay-btn-white !text-emerald-900 shadow-sm scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5 text-slate-600" />
            <span>My Tasks ({tasks.length})</span>
          </button>
          */}
        </div>
      </div>

      {/* View 1: AI Syllabus & Practice Hub commented out as requested */}
      {/* {activeView === 'syllabus' && <SyllabusPracticeHub />} */}

      {/* Study Task Section commented out for now as requested */}
      {/*
      {activeView === 'tasks' && (
        <MyTasksHub
          onOpenCreateModal={handleOpenCreateModal}
          onOpenEditModal={handleOpenEditModal}
        />
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
      />
      */}
    </div>
  );
};
