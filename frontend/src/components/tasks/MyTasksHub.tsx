import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  Target,
  BookOpen,
  Code2,
  GraduationCap,
  Building2,
  PenTool,
  Search,
  X,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Play,
  Calendar,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useTasks } from '../../contexts/TaskContext';
import { useTimer } from '../../contexts/TimerContext';
import { StudyTask, TaskPriority } from '../../types';
import { STUDY_SUBJECTS } from '../../data/initialData';

interface MyTasksHubProps {
  onOpenCreateModal: () => void;
  onOpenEditModal: (task: StudyTask) => void;
}

interface TaskCategoryPreset {
  id: string;
  name: string;
  icon: React.ElementType;
  colorClass: string;
  accentClass: string;
  matchSubjects: string[];
}

const CATEGORY_PRESETS: TaskCategoryPreset[] = [
  {
    id: 'all',
    name: 'All Tasks',
    icon: BookOpen,
    colorClass: 'clay-card-mint',
    accentClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    matchSubjects: [],
  },
  {
    id: 'tech',
    name: 'Tech & Coding',
    icon: Code2,
    colorClass: 'clay-card-sky',
    accentClass: 'text-sky-700 bg-sky-50 border-sky-200',
    matchSubjects: ['Computer Science', 'DSA', 'Web Development'],
  },
  {
    id: 'math-sci',
    name: 'Maths & Sciences',
    icon: GraduationCap,
    colorClass: 'clay-card-lavender',
    accentClass: 'text-purple-700 bg-purple-50 border-purple-200',
    matchSubjects: ['Mathematics', 'Physics', 'Biology', 'Chemistry'],
  },
  {
    id: 'exams',
    name: 'Government & Exams',
    icon: Building2,
    colorClass: 'clay-card-peach',
    accentClass: 'text-rose-700 bg-rose-50 border-rose-200',
    matchSubjects: ['SSC CGL', 'UPSC', 'Banking', 'Railways', 'Competitive'],
  },
  {
    id: 'general',
    name: 'General & Others',
    icon: PenTool,
    colorClass: 'clay-card',
    accentClass: 'text-slate-700 bg-slate-100 border-slate-200',
    matchSubjects: ['General Study', 'History', 'Literature'],
  },
];

export const MyTasksHub: React.FC<MyTasksHubProps> = ({
  onOpenCreateModal,
  onOpenEditModal,
}) => {
  const navigate = useNavigate();
  const {
    tasks,
    isLoading,
    error,
    refreshTasks,
    toggleTask,
    deleteTask,
    totalTasks,
    completedTasks,
    pendingTasks,
    completionRate,
  } = useTasks();
  const { linkTask, start } = useTimer();

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [viewStyle, setViewStyle] = useState<'grouped' | 'list'>('grouped');

  // FAQ Accordion State for Subject Groups (Default all open)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    '0': true,
    '1': true,
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const notify = (message: string, type: 'success' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Remaining focus time calculation
  const totalEstimatedMinutes = tasks
    .filter((t) => !t.completed)
    .reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const estimatedHours = Math.round((totalEstimatedMinutes / 60) * 10) / 10;

  // Filter tasks based on search, category, subject, status, priority
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Category match
      if (selectedCategory !== 'all') {
        const cat = CATEGORY_PRESETS.find((c) => c.id === selectedCategory);
        if (cat && cat.matchSubjects.length > 0) {
          const matches = cat.matchSubjects.some(
            (s) => task.subject.toLowerCase().includes(s.toLowerCase()) || task.title.toLowerCase().includes(s.toLowerCase())
          );
          if (!matches) return false;
        }
      }

      // Subject match
      if (selectedSubject !== 'all' && task.subject !== selectedSubject) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchNotes = task.notes?.toLowerCase().includes(query);
        const matchSubject = task.subject.toLowerCase().includes(query);
        if (!matchTitle && !matchNotes && !matchSubject) return false;
      }

      // Status match
      if (statusFilter === 'pending' && task.completed) return false;
      if (statusFilter === 'completed' && !task.completed) return false;

      // Priority match
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

      return true;
    });
  }, [tasks, selectedCategory, selectedSubject, searchQuery, statusFilter, priorityFilter]);

  // Group filtered tasks by subject for FAQ-style presentation
  const groupedTasks = useMemo(() => {
    const map = new Map<string, StudyTask[]>();
    for (const task of filteredTasks) {
      const groupKey = task.subject || 'General Study';
      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(task);
    }
    return Array.from(map.entries()).map(([subject, items]) => ({
      subject,
      items,
      totalHours: Math.round((items.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0) / 60) * 10) / 10,
    }));
  }, [filteredTasks]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAllGroups = () => {
    const allExpanded = groupedTasks.every((_, idx) => !!expandedGroups[String(idx)]);
    const newState: Record<string, boolean> = {};
    groupedTasks.forEach((_, idx) => {
      newState[String(idx)] = !allExpanded;
    });
    setExpandedGroups(newState);
  };

  const handleStartTimer = (task: StudyTask) => {
    linkTask(task);
    start();
    navigate('/timer');
  };

  const handleDeleteTask = (task: StudyTask) => {
    deleteTask(task.id);
    notify(`Task "${task.title}" deleted`, 'info');
  };

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedSubject('all');
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedSubject !== 'all' ||
    Boolean(searchQuery.trim()) ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border-2 flex items-center justify-between text-xs font-bold shadow-lg transition-all animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-black cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-xs text-rose-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={() => refreshTasks()}
            className="clay-btn-white px-3 py-1 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* TOP HUB CARD: Symmetrical with AI Syllabus Hub Top Card */}
      <div className="clay-card rounded-[28px] p-5 sm:p-6 border-2 border-white space-y-4">
        {/* Header Row with Icon, Title, and Metrics Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl clay-btn-emerald text-white flex items-center justify-center text-xs font-black shadow-xs">
                📝
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Academic Tasks & Study Assignments
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Manage your coursework checklist, track deadlines, and launch focused stopwatch study sessions.
            </p>
          </div>

          {/* Quick Metrics Badges (Identical Pill Styling to AI Syllabus Hub) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{completedTasks} Completed</span>
            </span>
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{pendingTasks} Pending</span>
            </span>
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1.5 shadow-xs">
              <Target className="w-3.5 h-3.5 text-sky-600" />
              <span>~{estimatedHours}h Total Work</span>
            </span>
          </div>
        </div>

        {/* Category Preset Buttons (Identical 5-Card Grid to AI Syllabus) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {CATEGORY_PRESETS.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            // Calculate count for category
            const count =
              cat.id === 'all'
                ? tasks.length
                : tasks.filter((t) =>
                    cat.matchSubjects.some(
                      (s) => t.subject.toLowerCase().includes(s.toLowerCase()) || t.title.toLowerCase().includes(s.toLowerCase())
                    )
                  ).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubject('all');
                }}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? `${cat.colorClass} border-emerald-500 scale-[1.02] shadow-md ring-2 ring-emerald-500/30`
                    : 'clay-card border-white hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-xs ${
                      isSelected ? 'bg-white text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {isSelected ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                      {count}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 leading-tight">{cat.name}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Popular Subject Chips & Search Bar */}
        <div className="space-y-3 pt-2">
          {/* Subject Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-bold mr-1">Filter Subject:</span>
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSubject === 'all'
                  ? 'clay-btn-emerald text-white shadow-xs'
                  : 'clay-btn-white text-slate-700 hover:text-slate-900 shadow-2xs'
              }`}
            >
              All Subjects
            </button>
            {STUDY_SUBJECTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSubject === s.name
                    ? 'clay-btn-emerald text-white shadow-xs'
                    : 'clay-btn-white text-slate-700 hover:text-slate-900 shadow-2xs'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Search, Status Tabs & Primary Action Row */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Input in Porcelain Well */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by title, notes, or subject..."
                className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-[#f5efe4] border border-white/80 shadow-[inset_2px_2px_4px_rgba(140,125,105,0.16),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)] text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Slider Tabs */}
            <div className="flex items-center p-1 bg-[#f5efe4] rounded-2xl border border-white/80 shadow-[inset_2px_2px_4px_rgba(140,125,105,0.14),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)] gap-1 shrink-0">
              {(['all', 'pending', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
                    statusFilter === status
                      ? 'clay-btn-white !text-emerald-900 shadow-sm scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Priority Dropdown */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="clay-btn-white px-3 py-2 rounded-2xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer border border-slate-200"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Actions: Refresh & New Task */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => refreshTasks()}
                disabled={isLoading}
                className="clay-btn-white px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-900 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                title="Refresh tasks from database"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={onOpenCreateModal}
                className="clay-btn clay-btn-emerald px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all text-white cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                <span>New Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* OVERVIEW BANNER CARD: Symmetrical with AI Syllabus Curriculum Overview Banner */}
      <div className="clay-card rounded-[28px] p-6 sm:p-7 border-2 border-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100/80 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {selectedSubject === 'all'
                  ? selectedCategory === 'all'
                    ? 'All Subjects Queue'
                    : CATEGORY_PRESETS.find((c) => c.id === selectedCategory)?.name || 'Filtered Track'
                  : selectedSubject}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {completionRate}% Completion Rate
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Study Task Roadmap & Focus Queue
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-3xl">
              Organized assignment workflow. Click <strong>"Focus with Timer"</strong> on any task to launch the stopwatch and record your focus streaks directly in analytics.
            </p>
          </div>

          {/* Symmetrical Dual Counter Stat Boxes in Porcelain Wells */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <div className="p-3 bg-[#f5efe4] rounded-2xl border border-white/80 shadow-[inset_1px_1px_3px_rgba(140,125,105,0.12)] text-center min-w-[90px]">
              <div className="text-xl font-black text-slate-900">{filteredTasks.length}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
              </div>
            </div>
            <div className="p-3 bg-[#f5efe4] rounded-2xl border border-white/80 shadow-[inset_1px_1px_3px_rgba(140,125,105,0.12)] text-center min-w-[90px]">
              <div className="text-xl font-black text-emerald-800">{completedTasks}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed</div>
            </div>
          </div>
        </div>

        {/* Helper Row & Accordion / Layout Switcher Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 font-medium pt-1">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Click any subject module to expand its tasks, or switch to list view for a flat sequence.
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* View Switcher: Grouped Accordion vs Flat List */}
            <div className="flex items-center p-0.5 bg-[#f5efe4] rounded-xl border border-white/80 shadow-2xs">
              <button
                onClick={() => setViewStyle('grouped')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewStyle === 'grouped'
                    ? 'clay-btn-white text-emerald-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Subject Modules
              </button>
              <button
                onClick={() => setViewStyle('list')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewStyle === 'list'
                    ? 'clay-btn-white text-emerald-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                List View
              </button>
            </div>

            {viewStyle === 'grouped' && groupedTasks.length > 0 && (
              <button
                onClick={toggleAllGroups}
                className="clay-btn-white px-3 py-1 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer shadow-2xs shrink-0"
              >
                {groupedTasks.every((_, idx) => !!expandedGroups[String(idx)]) ? 'Collapse All' : 'Expand All'}
              </button>
            )}

            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer ml-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TASKS LIST / FAQ ACCORDION MODULES */}
      {isLoading && tasks.length === 0 ? (
        <div className="clay-card rounded-[28px] p-16 text-center flex flex-col items-center justify-center gap-3 text-slate-400 border-2 border-white">
          <RefreshCw className="w-7 h-7 animate-spin text-emerald-600" />
          <div className="space-y-1">
            <h5 className="text-sm font-bold text-slate-700">Loading Academic Tasks...</h5>
            <p className="text-xs text-slate-400 font-medium">Syncing coursework from your profile.</p>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Empty State Matching AI Syllabus Hub Empty State */
        <div className="clay-card rounded-[28px] p-10 sm:p-14 text-center border-2 border-white space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-100 text-emerald-600 mx-auto flex items-center justify-center">
            <ListTodo className="w-7 h-7 stroke-[2]" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {hasActiveFilters ? 'No tasks match your active filters' : 'No academic tasks found'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto font-medium">
              {hasActiveFilters
                ? 'Try resetting your search query or subject filters to view all tasks.'
                : 'Create study assignments to plan your curriculum schedule and launch focused timer sessions.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="clay-btn-white px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
            <button
              onClick={onOpenCreateModal}
              className="clay-btn clay-btn-emerald px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer text-white"
            >
              <Plus className="w-4 h-4 text-white inline mr-1 stroke-[2.5]" />
              <span>Create New Task</span>
            </button>
          </div>
        </div>
      ) : viewStyle === 'grouped' ? (
        /* FAQ-STYLE ACCORDION BY SUBJECT MODULES (Matches AI Syllabus Modules) */
        <div className="space-y-4">
          {groupedTasks.map((group, gIdx) => {
            const isExpanded = !!expandedGroups[String(gIdx)];
            const subjectObj = STUDY_SUBJECTS.find((s) => s.name === group.subject);

            return (
              <div
                key={group.subject}
                className={`clay-card rounded-[28px] border-2 transition-all overflow-hidden ${
                  isExpanded
                    ? 'border-emerald-300/80 shadow-md ring-2 ring-emerald-500/10'
                    : 'border-white hover:border-slate-200'
                }`}
              >
                {/* Accordion Module Header Button */}
                <button
                  onClick={() => toggleGroup(String(gIdx))}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer select-none transition-colors hover:bg-slate-50/50"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-transform ${
                        isExpanded
                          ? 'clay-btn-emerald text-white shadow-xs scale-105'
                          : 'clay-btn-white text-slate-700 shadow-2xs'
                      }`}
                    >
                      {gIdx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Module {gIdx + 1}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          {group.items.length} {group.items.length === 1 ? 'Task' : 'Tasks'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          ~{group.totalHours}h est.
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5 truncate">
                        {group.subject}
                      </h4>
                    </div>
                  </div>

                  {/* FAQ Toggle Chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                      {isExpanded ? 'Click to collapse' : 'Click to explore'}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        isExpanded ? 'bg-emerald-50 text-emerald-700 rotate-180' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  </div>
                </button>

                {/* Accordion Content: Task Cards in Grid */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 pt-0 border-t border-slate-100/80 animate-fade-in space-y-4">
                    <div className="grid grid-cols-1 gap-4 pt-4">
                      {group.items.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={onOpenEditModal}
                          onDelete={handleDeleteTask}
                          onToggle={toggleTask}
                          onStartTimer={handleStartTimer}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* FLAT LIST VIEW (Each Task Card Matches AI Syllabus Challenge Card) */
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onOpenEditModal}
              onDelete={handleDeleteTask}
              onToggle={toggleTask}
              onStartTimer={handleStartTimer}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface TaskCardProps {
  task: StudyTask;
  onEdit: (task: StudyTask) => void;
  onDelete: (task: StudyTask) => void;
  onToggle: (id: string) => void;
  onStartTimer: (task: StudyTask) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onToggle,
  onStartTimer,
}) => {
  const priorityBadgeClass =
    task.priority === 'urgent'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : task.priority === 'high'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : task.priority === 'medium'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <div
      className={`p-6 sm:p-7 rounded-[26px] border-2 transition-all space-y-4 ${
        task.completed
          ? 'bg-[#f0fbf4] border-emerald-300 shadow-xs'
          : 'bg-[#fdfcf9] border-slate-200/80 shadow-[0_4px_16px_rgba(95,78,55,0.06)] hover:border-emerald-300/80'
      }`}
    >
      {/* Header: Priority + Subject + Title + Focus Target */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span
            className={`text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full border shadow-2xs shrink-0 ${priorityBadgeClass}`}
          >
            {task.priority} Priority
          </span>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs shrink-0">
            {task.subject}
          </span>
          {task.isDemo && (
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
              Demo
            </span>
          )}
        </div>

        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 shrink-0 px-3 py-1 bg-slate-100/90 rounded-full border border-slate-200/70 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{task.estimatedMinutes || 30}m focus target</span>
        </span>
      </div>

      {/* Task Title */}
      <h4
        className={`text-base sm:text-lg font-black tracking-tight leading-snug break-words ${
          task.completed ? 'line-through text-slate-400' : 'text-slate-900'
        }`}
      >
        {task.title}
      </h4>

      {/* Notes or Guidance */}
      {task.notes && (
        <div className="text-xs sm:text-sm text-slate-700 font-medium bg-[#f5efe4]/80 p-3.5 rounded-2xl border border-white/80 shadow-[inset_1px_1px_3px_rgba(140,125,105,0.1)] flex items-start gap-2.5 leading-relaxed">
          <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>{task.notes}</span>
        </div>
      )}

      {/* Meta Due Date */}
      {task.dueDate && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Due Date: {task.dueDate}</span>
        </div>
      )}

      {/* Action Footer: Mark Done | Edit | Delete | Focus with Timer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        {/* Left Actions: Complete Toggle + Edit + Delete */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(task.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              task.completed
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-black shadow-xs'
                : 'clay-btn-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-xs hover:scale-105 active:scale-95'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${task.completed ? 'text-emerald-700 stroke-[3]' : 'text-slate-400'}`}
            />
            <span>{task.completed ? 'Completed ✓' : 'Mark Done'}</span>
          </button>

          <button
            onClick={() => onEdit(task)}
            className="clay-btn-white px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 shadow-xs hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Edit task details"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Edit</span>
          </button>

          <button
            onClick={() => onDelete(task)}
            className="clay-btn-white px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-600 border border-slate-200 shadow-xs hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Delete this task"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>

        {/* Right Action: Focus with Timer (Solid Emerald Button) */}
        {!task.completed && (
          <button
            onClick={() => onStartTimer(task)}
            className="clay-btn clay-btn-emerald px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all text-white cursor-pointer"
            title="Start focus timer session for this assignment"
          >
            <Play className="w-3.5 h-3.5 fill-current text-white" />
            <span className="text-white font-black">Focus with Timer</span>
          </button>
        )}
      </div>
    </div>
  );
};
