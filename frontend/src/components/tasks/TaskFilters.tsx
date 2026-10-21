import React from 'react';
import { STUDY_SUBJECTS } from '../../data/initialData';
import { Search, Filter, X } from 'lucide-react';

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'pending' | 'completed';
  onStatusChange: (status: 'all' | 'pending' | 'completed') => void;
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  onResetFilters: () => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  selectedSubject,
  onSubjectChange,
  selectedPriority,
  onPriorityChange,
  onResetFilters,
}) => {
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || selectedSubject !== 'all' || selectedPriority !== 'all';

  return (
    <div className="clay-card p-5 sm:p-6 rounded-[28px] space-y-3.5 border-2 border-white">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input with Soft Porcelain Clay Well */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks by topic or notes..."
            className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-[#f5efe4] border border-white/80 shadow-[inset_2px_2px_4px_rgba(140,125,105,0.16),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center p-1 bg-[#f5efe4] rounded-2xl border border-white/80 shadow-[inset_2px_2px_4px_rgba(140,125,105,0.14),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)] shrink-0 self-start sm:self-auto gap-1">
          {(['all', 'pending', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all ${
                statusFilter === status
                  ? 'clay-btn-white !text-emerald-900 shadow-sm scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdown Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#ded5c4]/40">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs text-slate-500 font-extrabold flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filter:</span>
          </span>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl clay-btn-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer shadow-xs"
          >
            <option value="all">All Subjects</option>
            {STUDY_SUBJECTS.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl clay-btn-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer shadow-xs"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
