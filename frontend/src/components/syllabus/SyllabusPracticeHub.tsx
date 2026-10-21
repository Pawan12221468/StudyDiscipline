import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  SkipForward,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  RefreshCw,
  Award,
  Zap,
  Code2,
  Building2,
  GraduationCap,
  Target,
  PenTool,
  Check,
  ListTodo,
} from 'lucide-react';
import {
  aiService,
  SyllabusOutput,
  SyllabusTopic,
  QuestionItem,
} from '../../services/aiService';
import { useTasks } from '../../contexts/TaskContext';
import { useTimer } from '../../contexts/TimerContext';

interface TrackPreset {
  id: string;
  name: string;
  icon: React.ElementType;
  colorClass: string;
  accentClass: string;
  presets: string[];
}

const TRACK_PRESETS: TrackPreset[] = [
  {
    id: 'tech',
    name: 'Tech & Coding',
    icon: Code2,
    colorClass: 'clay-card-sky',
    accentClass: 'text-sky-700 bg-sky-50 border-sky-200',
    presets: [
      'Data Structures & Algorithms (DSA)',
      'Full Stack Web Development (MERN)',
      'System Design & Backend Architecture',
    ],
  },
  {
    id: 'govt',
    name: 'Government Exams',
    icon: Building2,
    colorClass: 'clay-card-peach',
    accentClass: 'text-rose-700 bg-rose-50 border-rose-200',
    presets: [
      'SSC CGL (Maths, Reasoning, English, GK)',
      'UPSC Civil Services Prelims (GS + CSAT)',
      'Banking / IBPS PO & Clerk Aptitude',
      'Railways RRB NTPC Examination',
    ],
  },
  {
    id: 'boards',
    name: 'Class 10th & 12th Boards',
    icon: GraduationCap,
    colorClass: 'clay-card-mint',
    accentClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    presets: [
      'Class 10th Board (Maths & Science)',
      'Class 12th Board (Physics, Chemistry, Maths)',
      'Class 12th Board (Commerce & Accounts)',
    ],
  },
  {
    id: 'entrance',
    name: 'Competitive Entrance',
    icon: Target,
    colorClass: 'clay-card-lavender',
    accentClass: 'text-purple-700 bg-purple-50 border-purple-200',
    presets: [
      'JEE Mains & Advanced (PCM)',
      'NEET UG (Biology, Physics, Chemistry)',
      'CUET General & Domain Subjects',
    ],
  },
  {
    id: 'custom',
    name: 'Custom Goal',
    icon: PenTool,
    colorClass: 'clay-card',
    accentClass: 'text-slate-700 bg-slate-100 border-slate-200',
    presets: [],
  },
];

const STORAGE_KEYS = {
  CURRENT_TRACK: 'sd_syllabus_track',
  CURRENT_TARGET: 'sd_syllabus_target',
  SYLLABUS_DATA: 'sd_syllabus_data',
  ACTIVE_TOPIC: 'sd_syllabus_active_topic',
  VIEW_MODE: 'sd_syllabus_view_mode',
  QUESTIONS_DATA: 'sd_syllabus_questions',
  SKIPPED_QUESTIONS: 'sd_syllabus_skipped_list',
  SOLVED_QUESTIONS: 'sd_syllabus_solved_list',
};

export const SyllabusPracticeHub: React.FC = () => {
  const navigate = useNavigate();
  const { addTask } = useTasks();
  const { linkTask, start } = useTimer();
  const containerRef = useRef<HTMLDivElement>(null);

  // Selection states
  const [selectedTrackId, setSelectedTrackId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_TRACK) || 'tech';
  });
  const [customTarget, setCustomTarget] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_TARGET) || 'Data Structures & Algorithms (DSA)';
  });

  // View Mode: 'roadmap' (Full-width curriculum overview) vs 'practice' (Full-width deep dive in the same space)
  const [viewMode, setViewMode] = useState<'roadmap' | 'practice'>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
    return cached === 'practice' ? 'practice' : 'roadmap';
  });

  // Accordion state for FAQ-style expandable modules (1st module open by default)
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    '0': true,
  });

  // Syllabus & Question states
  const [syllabus, setSyllabus] = useState<SyllabusOutput | null>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.SYLLABUS_DATA);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [activeTopic, setActiveTopic] = useState<SyllabusTopic | null>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.ACTIVE_TOPIC);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [questions, setQuestions] = useState<QuestionItem[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.QUESTIONS_DATA);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [skippedQuestions, setSkippedQuestions] = useState<string[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.SKIPPED_QUESTIONS);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [solvedQuestions, setSolvedQuestions] = useState<string[]>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.SOLVED_QUESTIONS);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return [];
      }
    }
    return [];
  });

  // UI Loaders & Messages
  const [isGeneratingSyllabus, setIsGeneratingSyllabus] = useState<boolean>(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [visibleHints, setVisibleHints] = useState<Record<string, boolean>>({});
  const [statusNotification, setStatusNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_TRACK, selectedTrackId);
    localStorage.setItem(STORAGE_KEYS.CURRENT_TARGET, customTarget);
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
    if (syllabus) localStorage.setItem(STORAGE_KEYS.SYLLABUS_DATA, JSON.stringify(syllabus));
    if (activeTopic) localStorage.setItem(STORAGE_KEYS.ACTIVE_TOPIC, JSON.stringify(activeTopic));
    localStorage.setItem(STORAGE_KEYS.QUESTIONS_DATA, JSON.stringify(questions));
    localStorage.setItem(STORAGE_KEYS.SKIPPED_QUESTIONS, JSON.stringify(skippedQuestions));
    localStorage.setItem(STORAGE_KEYS.SOLVED_QUESTIONS, JSON.stringify(solvedQuestions));
  }, [selectedTrackId, customTarget, viewMode, syllabus, activeTopic, questions, skippedQuestions, solvedQuestions]);

  const activeTrack = TRACK_PRESETS.find((t) => t.id === selectedTrackId) || TRACK_PRESETS[0];

  const notify = (message: string, type: 'success' | 'info' = 'info') => {
    setStatusNotification({ message, type });
    setTimeout(() => setStatusNotification(null), 3500);
  };

  /**
   * Toggle Module FAQ expansion
   */
  const toggleModule = (moduleKey: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  /**
   * Expand / Collapse All Modules
   */
  const toggleAllModules = () => {
    if (!syllabus) return;
    const allExpanded = syllabus.modules.every((_, idx) => !!expandedModules[String(idx)]);
    const newState: Record<string, boolean> = {};
    syllabus.modules.forEach((_, idx) => {
      newState[String(idx)] = !allExpanded;
    });
    setExpandedModules(newState);
  };

  /**
   * Trigger Gemini Syllabus Generation
   */
  const handleGenerateSyllabus = async () => {
    if (!customTarget.trim()) return;

    setIsGeneratingSyllabus(true);
    try {
      const res = await aiService.generateSyllabus({
        track: activeTrack.name,
        targetName: customTarget.trim(),
      });

      setSyllabus(res.syllabus);
      setViewMode('roadmap');
      // Set first module expanded
      setExpandedModules({ '0': true });
      // Set first topic as default active
      if (res.syllabus.modules[0]?.topics[0]) {
        setActiveTopic(res.syllabus.modules[0].topics[0]);
      }
      notify(`Syllabus for "${res.syllabus.targetName}" generated successfully!`, 'success');
    } catch (err: any) {
      notify(err.message || 'Error generating syllabus. Please try again.', 'info');
    } finally {
      setIsGeneratingSyllabus(false);
    }
  };

  /**
   * Load Questions for a Topic (excluding already skipped/solved)
   */
  const loadQuestionsForTopic = async (topic: SyllabusTopic, trackName: string, extraExcluded: string[] = []) => {
    setIsGeneratingQuestions(true);
    try {
      const combinedExcluded = Array.from(new Set([...skippedQuestions, ...solvedQuestions, ...extraExcluded]));
      const res = await aiService.generateQuestions({
        track: trackName,
        topic: topic.name,
        excludeQuestions: combinedExcluded,
        count: 3,
      });

      setQuestions(res.questions);
    } catch (err: any) {
      console.warn('Failed to load questions:', err.message);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  /**
   * User clicks on a topic card in the Roadmap to open full-width practice
   */
  const handleOpenTopicPractice = (topic: SyllabusTopic) => {
    setActiveTopic(topic);
    setViewMode('practice');
    loadQuestionsForTopic(topic, syllabus?.track || activeTrack.name);
    // Smooth scroll to container top
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /**
   * Back to Curriculum Roadmap
   */
  const handleBackToRoadmap = () => {
    setViewMode('roadmap');
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /**
   * Find Next Topic in Curriculum
   */
  const getNextTopic = (): SyllabusTopic | null => {
    if (!syllabus || !activeTopic) return null;
    const allTopics = syllabus.modules.flatMap((m) => m.topics);
    const currentIndex = allTopics.findIndex((t) => t.id === activeTopic.id || t.name === activeTopic.name);
    if (currentIndex >= 0 && currentIndex < allTopics.length - 1) {
      return allTopics[currentIndex + 1];
    }
    return null;
  };

  /**
   * Feature: "Skip / Mastered" (User already knows this challenge)
   */
  const handleSkipQuestion = async (question: QuestionItem) => {
    const updatedSkipped = [...skippedQuestions, question.title];
    setSkippedQuestions(updatedSkipped);
    notify(`⏩ "${question.title}" skipped (marked as already known). Loading fresh challenge...`, 'info');

    // Remove from current visible questions immediately
    const remaining = questions.filter((q) => q.id !== question.id && q.title !== question.title);
    setQuestions(remaining);

    // If remaining questions are low, fetch new ones via Gemini with exclusion
    if (remaining.length <= 1 && activeTopic) {
      try {
        const res = await aiService.generateQuestions({
          track: syllabus?.track || activeTrack.name,
          topic: activeTopic.name,
          excludeQuestions: updatedSkipped,
          count: 2,
        });

        const merged = [...remaining];
        for (const newQ of res.questions) {
          if (!merged.some((m) => m.title === newQ.title) && !updatedSkipped.includes(newQ.title)) {
            merged.push(newQ);
          }
        }
        setQuestions(merged);
      } catch (err) {
        // keep remaining
      }
    }
  };

  /**
   * Mark Question Solved
   */
  const handleMarkSolved = (question: QuestionItem) => {
    if (!solvedQuestions.includes(question.title)) {
      setSolvedQuestions([...solvedQuestions, question.title]);
      notify(`🎉 Awesome! Marked "${question.title}" as completed!`, 'success');
    }
  };

  /**
   * Solve with Timer: Connects question directly to Focus Timer
   */
  const handleSolveWithTimer = (question: QuestionItem) => {
    addTask({
      title: `${question.title} (${activeTopic?.name || 'Practice'})`,
      subject: activeTopic?.name || question.subject || 'Practice',
      priority: question.difficulty === 'hard' ? 'urgent' : question.difficulty === 'medium' ? 'high' : 'medium',
      estimatedMinutes: question.estimatedMinutes || 30,
      notes: `${question.problemStatement}\n\nKey Takeaway: ${question.keyTakeaway || ''}`,
    });

    linkTask({
      id: `task-${Date.now()}`,
      title: question.title,
      subject: activeTopic?.name || question.subject || 'Practice',
      priority: question.difficulty === 'hard' ? 'urgent' : 'medium',
      estimatedMinutes: question.estimatedMinutes || 30,
      completed: false,
      createdAt: new Date().toISOString(),
    });

    start();
    navigate('/timer');
  };

  const toggleHint = (questionId: string) => {
    setVisibleHints((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // Find module title for active topic
  const activeModule = syllabus?.modules.find((m) =>
    m.topics.some((t) => t.id === activeTopic?.id || t.name === activeTopic?.name)
  );
  const nextTopic = getNextTopic();

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Toast Notification */}
      {statusNotification && (
        <div
          className={`p-4 rounded-2xl border-2 flex items-center justify-between text-xs font-bold shadow-lg transition-all animate-fade-in ${
            statusNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusNotification.message}</span>
          </div>
          <button
            onClick={() => setStatusNotification(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-black cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Track Selection Card (Full Width) */}
      <div className="clay-card rounded-[28px] p-5 sm:p-6 border-2 border-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl clay-btn-emerald text-white flex items-center justify-center text-xs font-black shadow-xs">
                ✨
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Personalized Syllabus & Practice Hub
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Select your academic goal or field to create a structured curriculum roadmap and practice challenges.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{solvedQuestions.length} Solved</span>
            </span>
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 shadow-xs">
              <SkipForward className="w-3.5 h-3.5 text-amber-600" />
              <span>{skippedQuestions.length} Skipped (Mastered)</span>
            </span>
          </div>
        </div>

        {/* Track Category Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {TRACK_PRESETS.map((track) => {
            const Icon = track.icon;
            const isSelected = selectedTrackId === track.id;
            return (
              <button
                key={track.id}
                onClick={() => {
                  setSelectedTrackId(track.id);
                  if (track.presets[0]) {
                    setCustomTarget(track.presets[0]);
                  }
                }}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? `${track.colorClass} border-emerald-500 scale-[1.02] shadow-md ring-2 ring-emerald-500/30`
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
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 leading-tight">{track.name}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Preset Chips & Custom Input */}
        <div className="space-y-3 pt-2">
          {activeTrack.presets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-bold mr-1">Popular Goals:</span>
              {activeTrack.presets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setCustomTarget(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    customTarget === preset
                      ? 'clay-btn-emerald text-white shadow-xs'
                      : 'clay-btn-white text-slate-700 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          )}

          {/* Target Input and Gemini Generate Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                placeholder="Type your exam, syllabus or topic (e.g. Data Structures, 10th Maths, SSC CGL)..."
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f5efe4] border border-white/80 shadow-[inset_2px_2px_4px_rgba(140,125,105,0.16),_inset_-2px_-2px_4px_rgba(255,255,255,0.9)] text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <button
              onClick={handleGenerateSyllabus}
              disabled={isGeneratingSyllabus || !customTarget.trim()}
              className="clay-btn clay-btn-emerald px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-60 cursor-pointer shrink-0"
            >
              {isGeneratingSyllabus ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Syllabus...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-100" />
                  <span>Generate Syllabus</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container: Full Width View (Roadmap OR Practice in the same full-width space) */}
      {syllabus ? (
        viewMode === 'roadmap' ? (
          /* =========================================================================
             VIEW 1: FULL-WIDTH DETAILED CURRICULUM ROADMAP (WITH FAQ-STYLE ACCORDION)
             ========================================================================= */
          <div className="space-y-6 animate-fade-in">
            {/* Curriculum Overview Banner */}
            <div className="clay-card rounded-[28px] p-6 sm:p-7 border-2 border-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100/80 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {syllabus.track}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      ~{syllabus.totalEstimatedHours} Hours Study Plan
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {syllabus.targetName}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-3xl">
                    {syllabus.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <div className="p-3 bg-[#f5efe4] rounded-2xl border border-white/80 shadow-[inset_1px_1px_3px_rgba(140,125,105,0.12)] text-center min-w-[90px]">
                    <div className="text-xl font-black text-slate-900">{syllabus.modules.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Modules</div>
                  </div>
                  <div className="p-3 bg-[#f5efe4] rounded-2xl border border-white/80 shadow-[inset_1px_1px_3px_rgba(140,125,105,0.12)] text-center min-w-[90px]">
                    <div className="text-xl font-black text-emerald-800">
                      {syllabus.modules.reduce((acc, m) => acc + m.topics.length, 0)}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Topics</div>
                  </div>
                </div>
              </div>

              {/* Module Header Helper / Accordion Controls */}
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 font-medium pt-1">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Click any module below to expand its topics, then select <strong>"Open Practice & Challenges"</strong> to start practicing.
                  </span>
                </div>
                <button
                  onClick={toggleAllModules}
                  className="clay-btn-white px-3 py-1 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer shadow-2xs shrink-0"
                >
                  {syllabus.modules.every((_, idx) => !!expandedModules[String(idx)])
                    ? 'Collapse All Modules'
                    : 'Expand All Modules'}
                </button>
              </div>
            </div>

            {/* Modules List: FAQ / Accordion Style */}
            <div className="space-y-4">
              {syllabus.modules.map((module, mIdx) => {
                const isExpanded = !!expandedModules[String(mIdx)];
                const totalModuleHours = module.topics.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);

                return (
                  <div
                    key={module.id || mIdx}
                    className={`clay-card rounded-[28px] border-2 transition-all overflow-hidden ${
                      isExpanded
                        ? 'border-emerald-300/80 shadow-md ring-2 ring-emerald-500/10'
                        : 'border-white hover:border-slate-200'
                    }`}
                  >
                    {/* Module FAQ / Accordion Header (Clickable Area) */}
                    <button
                      onClick={() => toggleModule(String(mIdx))}
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
                          {mIdx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Module {mIdx + 1}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                              {module.topics.length} Topics
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              ~{totalModuleHours}h est.
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5 truncate">
                            {module.moduleTitle}
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

                    {/* Accordion Content (Topics Grid inside Module) */}
                    {isExpanded && (
                      <div className="p-5 sm:p-6 pt-0 border-t border-slate-100/80 animate-fade-in space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                          {module.topics.map((topic) => {
                            return (
                              <div
                                key={topic.id}
                                className="clay-card rounded-[24px] p-5 border-2 border-white/90 shadow-sm hover:shadow-md hover:border-emerald-300/60 transition-all flex flex-col justify-between gap-4 bg-[#fdfcf9]"
                              >
                                <div className="space-y-3">
                                  {/* Topic Title & Duration Badge */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                      <h5 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug">
                                        {topic.name}
                                      </h5>
                                    </div>
                                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-200/80 shadow-2xs shrink-0 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      <span>~{topic.estimatedHours}h est.</span>
                                    </span>
                                  </div>

                                  {/* Full Detailed Description */}
                                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    {topic.description}
                                  </p>

                                  {/* Key Subtopics / Syllabus Breakdown */}
                                  {topic.subtopics && topic.subtopics.length > 0 && (
                                    <div className="space-y-1.5 pt-1">
                                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        Key Concepts to Master:
                                      </span>
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {topic.subtopics.map((sub, sIdx) => (
                                          <span
                                            key={sIdx}
                                            className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-[#f5efe4] border border-white/80 text-slate-700 shadow-2xs"
                                          >
                                            {sub}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Open Practice & Challenges Button (Solid Green with clear white text that NEVER disappears on hover!) */}
                                <button
                                  onClick={() => handleOpenTopicPractice(topic)}
                                  className="w-full clay-btn clay-btn-emerald py-2.5 px-4 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer mt-1"
                                >
                                  <span className="text-white font-black">Open Practice & Challenges</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* =========================================================================
             VIEW 2: FULL-WIDTH TOPIC PRACTICE & CHALLENGES (IN THE SAME SPOT!)
             ========================================================================= */
          <div className="space-y-6 animate-fade-in">
            {/* Top Navigation & Breadcrumbs Bar */}
            <div className="clay-card rounded-[28px] p-6 sm:p-7 border-2 border-white space-y-4">
              {/* Row 1: Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100/80 pb-3.5">
                <button
                  onClick={handleBackToRoadmap}
                  className="clay-btn-white px-4 py-2 rounded-xl text-xs font-black text-slate-800 hover:text-emerald-800 flex items-center gap-2 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Go back to the full curriculum roadmap"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <span>Back to Curriculum Roadmap</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => activeTopic && loadQuestionsForTopic(activeTopic, syllabus.track)}
                    disabled={isGeneratingQuestions}
                    className="clay-btn-white px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isGeneratingQuestions ? 'animate-spin' : ''}`} />
                    <span>Fetch Fresh Challenges</span>
                  </button>

                  {nextTopic && (
                    <button
                      onClick={() => handleOpenTopicPractice(nextTopic)}
                      className="clay-btn-white px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Next Topic</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Clean Single-Line Breadcrumb Trail */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 pt-0.5">
                <span className="text-slate-400 font-medium">{syllabus.targetName}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span className="text-slate-600 font-bold">{activeModule?.moduleTitle || 'Module'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span className="text-emerald-800 font-black">{activeTopic?.name}</span>
              </div>

              {/* Row 3: Active Topic Details & Typography */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                    Active Topic Focus
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 shadow-2xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>~{activeTopic?.estimatedHours || 5} Hours Study Target</span>
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {activeTopic?.name || 'Topic Practice'}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-4xl">
                  {activeTopic?.description}
                </p>

                {activeTopic?.subtopics && activeTopic.subtopics.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                      Core Concepts to Master:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {activeTopic.subtopics.map((sub, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#f5efe4] border border-white/80 text-slate-700 shadow-2xs hover:bg-[#ede5d4] transition-colors"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Questions Container (Full Width Cards with Full Breathing Room) */}
            <div className="clay-card rounded-[28px] p-6 sm:p-7 border-2 border-white space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100/80 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h4 className="text-base font-black text-slate-900 tracking-tight">
                    Practice Problems & Daily Challenges
                  </h4>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Solve in-browser or launch the Focus Timer. If you already know a problem, click <strong>"I Know This (Skip)"</strong> to advance!
                </p>
              </div>

              {/* Questions List */}
              {isGeneratingQuestions ? (
                <div className="p-16 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-7 h-7 animate-spin text-emerald-600" />
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-700">Generating personalized challenges...</h5>
                    <p className="text-xs text-slate-400 font-medium">
                      Curating challenges for {activeTopic?.name} with hints, examples and key concepts.
                    </p>
                  </div>
                </div>
              ) : questions.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
                    <Award className="w-7 h-7" />
                  </div>
                  <h5 className="text-base font-black text-slate-800">
                    All Challenges in this topic Completed or Skipped!
                  </h5>
                  <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                    You have mastered or skipped all available challenges for this topic. Generate fresh practice problems or proceed to the next topic.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => activeTopic && loadQuestionsForTopic(activeTopic, syllabus.track, [])}
                      className="clay-btn clay-btn-emerald px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Generate More Challenges
                    </button>
                    {nextTopic && (
                      <button
                        onClick={() => handleOpenTopicPractice(nextTopic)}
                        className="clay-btn-white px-4 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        Next Topic: {nextTopic.name} →
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {questions.map((q, idx) => {
                    const isSolved = solvedQuestions.includes(q.title);
                    const isHintVisible = visibleHints[q.id];

                    const diffBadge =
                      q.difficulty === 'hard'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : q.difficulty === 'medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                    return (
                      <div
                        key={q.id || idx}
                        className={`p-6 sm:p-7 rounded-[26px] border-2 transition-all space-y-4.5 ${
                          isSolved
                            ? 'bg-[#f0fbf4] border-emerald-300 shadow-xs'
                            : 'bg-[#fdfcf9] border-slate-200/80 shadow-[0_4px_16px_rgba(95,78,55,0.06)] hover:border-emerald-300/80'
                        }`}
                      >
                        {/* Header: Title + Difficulty Badge + Est Time */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span
                              className={`text-[11px] uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs shrink-0 ${diffBadge}`}
                            >
                              {q.difficulty}
                            </span>
                            <h5 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                              {q.title}
                            </h5>
                          </div>

                          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 shrink-0 px-3 py-1 bg-slate-100/90 rounded-full border border-slate-200/70 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{q.estimatedMinutes || 25}m focus time</span>
                          </span>
                        </div>

                        {/* Problem Statement (Clean, high-contrast, uncluttered) */}
                        <div className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed py-0.5">
                          {q.problemStatement}
                        </div>

                        {/* Examples / Context / Test Cases (Modern Code Editor Terminal) */}
                        {q.examplesOrContext && (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                              <span>Example / Test Case</span>
                              <span className="text-[10px] text-slate-400 font-mono">Code Snippet</span>
                            </div>
                            <div className="rounded-2xl overflow-hidden border border-slate-800/90 bg-[#1e222d] shadow-md">
                              <div className="flex items-center gap-1.5 px-4 py-2 bg-[#171a22] border-b border-slate-800/80">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                                <span className="text-[11px] font-mono text-slate-400 ml-2">problem.test.js</span>
                              </div>
                              <pre className="p-4 text-xs font-mono text-[#e2e8f0] whitespace-pre-wrap leading-relaxed overflow-x-auto selection:bg-emerald-500/30">
                                <code>{q.examplesOrContext}</code>
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Collapsible Hint */}
                        {q.hints && q.hints.length > 0 && (
                          <div>
                            <button
                              onClick={() => toggleHint(q.id)}
                              className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50/90 hover:bg-amber-100/90 px-3.5 py-1.5 rounded-xl border border-amber-200/80 flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                            >
                              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                              <span>{isHintVisible ? 'Hide Hints' : 'Need a hint? (Click to view guidance)'}</span>
                            </button>
                            {isHintVisible && (
                              <div className="mt-2.5 p-4 bg-amber-50/90 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1.5 animate-fade-in font-medium">
                                {q.hints.map((hint, hIdx) => (
                                  <div key={hIdx} className="flex items-start gap-2">
                                    <span className="font-black text-amber-700 shrink-0">{hIdx + 1}.</span>
                                    <span className="leading-relaxed">{hint}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Core Concept Takeaway */}
                        {q.keyTakeaway && (
                          <div className="text-xs text-emerald-950 font-medium bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200/90 flex items-start gap-2.5 shadow-2xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-emerald-900 font-extrabold mr-1">Concept:</strong>
                              <span>{q.keyTakeaway}</span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons Footer: I Know This (Skip) | Solve with Timer | Mark Solved */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                          {/* Left Action: I Know This (Skip) */}
                          <button
                            onClick={() => handleSkipQuestion(q)}
                            className="clay-btn-white px-4 py-2.5 rounded-xl text-xs font-black text-amber-900 hover:text-amber-950 border border-amber-300/80 hover:bg-amber-50/80 shadow-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            title="Click if you already know this problem - loads next fresh challenge"
                          >
                            <SkipForward className="w-4 h-4 text-amber-600 stroke-[2.5]" />
                            <span>I Know This (Skip)</span>
                          </button>

                          {/* Right Actions: Mark Solved & Focus Timer */}
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => handleMarkSolved(q)}
                              disabled={isSolved}
                              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isSolved
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-black shadow-xs'
                                  : 'clay-btn-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-xs hover:scale-105 active:scale-95'
                              }`}
                            >
                              <CheckCircle2 className={`w-4 h-4 ${isSolved ? 'text-emerald-700 stroke-[3]' : 'text-slate-400'}`} />
                              <span>{isSolved ? 'Solved ✓' : 'Mark Solved'}</span>
                            </button>

                            <button
                              onClick={() => handleSolveWithTimer(q)}
                              className="clay-btn clay-btn-emerald px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer text-white"
                              title="Start stopwatch or focus session for this problem"
                            >
                              <Play className="w-3.5 h-3.5 fill-current text-white" />
                              <span className="text-white font-black">Solve with Timer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Navigation between Topics */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={handleBackToRoadmap}
                  className="clay-btn-white px-4 py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Back to Curriculum Roadmap</span>
                </button>

                {nextTopic && (
                  <button
                    onClick={() => handleOpenTopicPractice(nextTopic)}
                    className="clay-btn clay-btn-emerald px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer text-white"
                  >
                    <span className="text-white font-bold">Next Topic: {nextTopic.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      ) : (
        /* Empty State before generating */
        <div className="clay-card rounded-[28px] p-10 sm:p-14 text-center border-2 border-white space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-100 text-emerald-600 mx-auto flex items-center justify-center">
            <Sparkles className="w-7 h-7 stroke-[2]" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Ready to generate your study syllabus & practice challenges?
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto font-medium">
              Select a category above (e.g., Tech/DSA, High School Boards, or Competitive Exams) and click <strong>"Generate Syllabus"</strong>.
            </p>
          </div>
          <button
            onClick={handleGenerateSyllabus}
            disabled={isGeneratingSyllabus || !customTarget.trim()}
            className="clay-btn clay-btn-emerald px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer text-white"
          >
            {isGeneratingSyllabus ? 'Generating...' : 'Generate Syllabus ✨'}
          </button>
        </div>
      )}
    </div>
  );
};
