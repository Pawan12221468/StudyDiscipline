import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Calendar,
  Clock,
  Lightbulb,
  CheckCircle2,
  Coffee,
  Trash2,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Target,
  ArrowRight,
  BookOpen,
  Info,
} from 'lucide-react';
import {
  aiService,
  ChatMessage,
  StudyPlanOutput,
  StudyInsights,
} from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { FormattedCoachMessage } from '../components/coach/FormattedCoachMessage';

type ActiveTab = 'chat' | 'planner' | 'insights';

export const CoachPage: React.FC = () => {
  const { user } = useAuth();
  const { tasks } = useTasks();

  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [isConfigured, setIsConfigured] = useState<boolean>(true);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Study Planner State
  const [availableMinutes, setAvailableMinutes] = useState<number>(120);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [planResult, setPlanResult] = useState<StudyPlanOutput | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  // Insights State
  const [insights, setInsights] = useState<StudyInsights | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState<boolean>(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Fetch initial chat history and check config
  useEffect(() => {
    loadChatHistory();
    loadInsights();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isChatLoading]);

  const loadChatHistory = async () => {
    try {
      const res = await aiService.getHistory(1, 20);
      setMessages(res.messages);
      setIsConfigured(res.isConfigured);
    } catch {
      // Non-blocking
    }
  };

  const loadInsights = async () => {
    setIsInsightsLoading(true);
    setInsightsError(null);
    try {
      const res = await aiService.getInsights();
      setInsights(res.insights);
      setIsConfigured(res.isConfigured);
    } catch (err: any) {
      setInsightsError(err.message || 'Failed to load study insights');
    } finally {
      setIsInsightsLoading(false);
    }
  };

  const handleSendMessage = async (msgToSend?: string) => {
    const text = (msgToSend || inputMessage).trim();
    if (!text || isChatLoading) return;

    setInputMessage('');
    setChatError(null);

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const res = await aiService.chat(
        text,
        messages.slice(-6).map((m) => ({ role: m.role, content: m.content }))
      );

      const modelMsg: ChatMessage = {
        role: 'model',
        content: res.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, modelMsg]);
      setIsConfigured(res.isConfigured);
    } catch (err: any) {
      setChatError(err.message || 'AI Coach service is currently unavailable. Please try again.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear your conversation history with the AI Coach?')) return;
    try {
      await aiService.clearHistory();
      setMessages([]);
    } catch (err: any) {
      setChatError(err.message || 'Failed to clear chat history');
    }
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingPlan(true);
    setPlanError(null);

    try {
      const res = await aiService.generateStudyPlan({
        availableMinutes,
        preferredStartTime: startTime,
        focusSubjects: selectedSubjects.length > 0 ? selectedSubjects : undefined,
      });

      setPlanResult(res.plan);
      setIsConfigured(res.isConfigured);
    } catch (err: any) {
      setPlanError(err.message || 'Failed to generate study schedule. Please try again.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Starter Questions
  const starterQuestions = [
    'How should I structure my study blocks for pending tasks today?',
    'What Pomodoro intervals do you recommend to defeat afternoon fatigue?',
    'How can I improve my consistency and keep my daily streak alive?',
    'Which of my pending coursework subjects should I prioritize first?',
  ];

  // Unique pending subjects from tasks context
  const pendingSubjects = Array.from(new Set(tasks.map((t) => t.subject).filter(Boolean)));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Tabs Bar */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-1.5 clay-inset p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'chat'
                ? 'clay-btn-white !text-emerald-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Study Coach
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'planner'
                ? 'clay-btn-white !text-emerald-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Planner
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'insights'
                ? 'clay-btn-white !text-emerald-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Smart Insights
          </button>
        </div>
      </div>

      {/* Configuration Notice if API Key is not set */}
      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-sm">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">Google Gemini API Key Not Configured</p>
            <p className="text-amber-800 text-xs md:text-sm">
              The AI Coach is running in deterministic mode. To unlock live Gemini conversational reasoning, add{' '}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 font-mono text-xs">
                GEMINI_API_KEY=your_key
              </code>{' '}
              to <code className="font-mono text-xs">backend/.env</code> and restart the backend server.
            </p>
          </div>
        </div>
      )}

      {/* TAB 1: AI COACH CHAT */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Box */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-[650px] overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Study Mentor & Advisor</h3>
                  <p className="text-xs text-slate-500">Grounds advice in your actual timer & task progress</p>
                </div>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  title="Clear conversation"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs flex items-center gap-1.5 font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear Chat</span>
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.length === 0 && !isChatLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-base">
                      Welcome, {user?.name || 'Student'}!
                    </h4>
                    <p className="text-slate-500 text-xs md:text-sm mt-1">
                      I am your personal study coach. I evaluate your active streak, completed sessions, and pending coursework to help you focus and beat procrastination.
                    </p>
                  </div>
                  <div className="w-full text-left space-y-2 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Suggested Questions
                    </p>
                    <div className="space-y-1.5">
                      {starterQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className="w-full text-left text-xs bg-slate-50 hover:bg-emerald-50/80 hover:text-emerald-900 hover:border-emerald-200 border border-slate-200/80 p-2.5 rounded-xl transition-all flex items-center justify-between group"
                        >
                          <span className="truncate pr-2">{q}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold transition-transform ${
                        isUser
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-600/30'
                      }`}
                    >
                      {isUser ? user?.name?.charAt(0).toUpperCase() || 'U' : <Sparkles className="w-4 h-4 text-amber-200" />}
                    </div>

                    <div
                      className={`max-w-[92%] sm:max-w-[85%] rounded-3xl p-4 sm:p-5 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-slate-900 text-white rounded-tr-xs shadow-sm font-medium font-[\'Plus_Jakarta_Sans\',sans-serif]'
                          : 'bg-white/95 backdrop-blur-xs text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-card'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <FormattedCoachMessage content={msg.content} />
                      )}
                    </div>
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>Analyzing your verified study data and formulating advice...</span>
                  </div>
                </div>
              )}

              {chatError && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-rose-700 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{chatError}</span>
                  </div>
                  <button
                    onClick={() => handleSendMessage()}
                    className="font-semibold underline hover:text-rose-900 ml-3"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask for advice on staying focused, managing coursework, or planning..."
                  maxLength={1000}
                  disabled={isChatLoading}
                  className="flex-1 bg-slate-50 border border-slate-200/80 focus:border-emerald-500 focus:bg-white rounded-2xl px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isChatLoading}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Ask Coach</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Context & Advice Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>Coach Context Scope</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The AI Coach only receives verified metrics: today's goal target, active streak, recent timer sessions, and pending tasks. It will never invent fake progress or claim physical surveillance capabilities.
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Prompts
                </span>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => handleSendMessage('Break down my longest pending task into 25-minute Pomodoro sessions.')}
                    className="text-left text-xs p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/70 transition-colors"
                  >
                    🎯 Decompose high-priority task
                  </button>
                  <button
                    onClick={() => handleSendMessage('What is the best way to regain focus when feeling distracted?')}
                    className="text-left text-xs p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/70 transition-colors"
                  >
                    🧠 Reset focus protocol
                  </button>
                  <button
                    onClick={() => handleSendMessage('How should I schedule my study breaks so I do not burn out?')}
                    className="text-left text-xs p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/70 transition-colors"
                  >
                    ☕ Science of optimal breaks
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/60 rounded-3xl border border-emerald-100 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Effective Study Rule</span>
              </div>
              <p className="text-xs text-emerald-800/90 leading-relaxed">
                “Discipline is choosing between what you want now and what you want most.” Schedule your most demanding subject as the first block of your day when cognitive stamina is highest.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY STUDY PLANNER */}
      {activeTab === 'planner' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Planner Setup Form */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Schedule Generator
              </h3>
              <p className="text-xs text-slate-500">
                Generate an optimized daily timetable with structured focus intervals and restorative breaks.
              </p>
            </div>

            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Available Study Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[60, 120, 180].map((mins) => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => setAvailableMinutes(mins)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        availableMinutes === mins
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {Math.floor(mins / 60)}h {mins % 60 > 0 ? `${mins % 60}m` : ''}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="range"
                    min={30}
                    max={480}
                    step={15}
                    value={availableMinutes}
                    onChange={(e) => setAvailableMinutes(parseInt(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <span className="text-xs font-bold text-slate-700 min-w-14 text-right">
                    {Math.floor(availableMinutes / 60)}h {availableMinutes % 60}m
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Start Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {pendingSubjects.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Coursework Subjects
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {pendingSubjects.map((sub) => {
                      const isSelected = selectedSubjects.includes(sub);
                      return (
                        <button
                          type="button"
                          key={sub}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSubjects((prev) => prev.filter((s) => s !== sub));
                            } else {
                              setSelectedSubjects((prev) => [...prev, sub]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {planError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{planError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isGeneratingPlan}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
              >
                {isGeneratingPlan ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Building Schedule...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Optimized Plan</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Plan Preview Output */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            {!planResult && !isGeneratingPlan && (
              <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                  <Calendar className="w-7 h-7" />
                </div>
                <h4 className="font-semibold text-slate-800 text-base">No Schedule Generated Yet</h4>
                <p className="text-slate-500 text-xs max-w-sm">
                  Select your available study time on the left and click "Generate Optimized Plan" to produce a non-overlapping Pomodoro schedule.
                </p>
              </div>
            )}

            {isGeneratingPlan && (
              <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                <h4 className="font-semibold text-slate-800 text-sm">Designing Balanced Study Timeline</h4>
                <p className="text-slate-500 text-xs max-w-sm">
                  Aligning focus blocks with your pending coursework and inserting restorative break intervals...
                </p>
              </div>
            )}

            {planResult && !isGeneratingPlan && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{planResult.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Total Allocated Focus & Rest: {Math.floor(planResult.totalMinutes / 60)}h{' '}
                      {planResult.totalMinutes % 60}m across {planResult.blocks.length} blocks
                    </p>
                  </div>
                  <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Validated Schedule
                  </span>
                </div>

                {/* Blocks Timeline */}
                <div className="space-y-3">
                  {planResult.blocks.map((block, idx) => {
                    const isFocus = block.type === 'focus';
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                          isFocus
                            ? 'bg-white border-slate-200/90 hover:border-emerald-300 shadow-sm'
                            : 'bg-amber-50/50 border-amber-200/70'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                            isFocus
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isFocus ? <Clock className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-slate-900 text-sm truncate">
                              {block.title}
                            </h4>
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                              {block.startTime} – {block.endTime}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="font-medium text-slate-700">{block.subject}</span>
                            <span>•</span>
                            <span>{block.durationMinutes} minutes</span>
                            {block.notes && (
                              <>
                                <span>•</span>
                                <span className="text-slate-400 italic truncate">{block.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Rationale Callout */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                  <span className="font-semibold text-slate-900 block">Coach Rationale</span>
                  <p>{planResult.rationale}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SMART STUDY INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {isInsightsLoading ? (
            <div className="min-h-[300px] bg-white rounded-3xl border border-slate-200/80 p-8 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-700">Synthesizing Verified Study Insights...</p>
            </div>
          ) : insightsError ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
              <span>{insightsError}</span>
              <button
                onClick={loadInsights}
                className="font-semibold underline ml-3"
              >
                Retry
              </button>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              {/* Metric Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Consistency Rating
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg font-bold ${
                        insights.consistencyRating === 'Excellent'
                          ? 'text-emerald-700'
                          : insights.consistencyRating === 'Good'
                          ? 'text-teal-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {insights.consistencyRating}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Based on regular daily study target adherence</p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Strongest Study Day
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">
                      {insights.strongestDay || 'Collecting data'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Historical day with highest focus duration</p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Primary Focus Subject
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900 truncate">
                      {insights.mostStudiedSubject || 'Unassigned'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Subject with largest logged study volume</p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Needs More Attention
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-amber-700 truncate">
                      {insights.leastStudiedSubject || 'Balanced'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Recommended for targeted next session</p>
                </div>
              </div>

              {/* Actionable Recommendations Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      Actionable Recommendations
                    </h3>
                    <p className="text-xs text-slate-500">
                      Evidence-based suggestions generated directly from your monthly study trends.
                    </p>
                  </div>
                  <button
                    onClick={loadInsights}
                    title="Refresh insights"
                    className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  {insights.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex items-start gap-3"
                    >
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 text-sm">
                        <p className="text-slate-800 leading-relaxed font-medium">{rec}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {!insights.hasSufficientData && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      You have fewer than 2 logged sessions. As you complete more focus blocks with the timer, insights will become increasingly personalized.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
