import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Timer,
  Sparkles,
  BarChart3,
  Flame,
  ArrowRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Clock,
  Target,
  Play,
  Pause,
  RotateCcw,
  Compass,
  GraduationCap,
  ChevronRight,
  Menu,
  X,
  Award,
  Layers,
  CheckSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';
import { soundAlerts } from '../utils/soundAlerts';

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Micro 60s Focus Playground State
  const [playgroundSeconds, setPlaygroundSeconds] = useState(60);
  const [isPlaygroundRunning, setIsPlaygroundRunning] = useState(false);
  const [playgroundCompleted, setPlaygroundCompleted] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isPlaygroundRunning && playgroundSeconds > 0) {
      interval = setInterval(() => {
        setPlaygroundSeconds((prev) => {
          if (prev <= 1) {
            setIsPlaygroundRunning(false);
            setPlaygroundCompleted(true);
            soundAlerts.playCompletionChime();
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaygroundRunning, playgroundSeconds]);

  const handleResetPlayground = () => {
    setIsPlaygroundRunning(false);
    setPlaygroundSeconds(60);
    setPlaygroundCompleted(false);
  };

  const playgroundPct = Math.round(((60 - playgroundSeconds) / 60) * 100);

  return (
    <div className="min-h-screen bg-[#ebe2d3] text-slate-800 antialiased selection:bg-emerald-200 selection:text-emerald-900 font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-emerald-200/40 via-teal-100/20 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#ebe2d3]/90 backdrop-blur-md border-b border-[#ded5c4]/80 py-3.5 px-4 sm:px-8 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-['Outfit'] font-black text-slate-900 text-lg tracking-tight leading-none block">
                StudyDiscipline
              </span>
              <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-widest mt-0.5 block">
                Focus & Mastery
              </span>
            </div>
          </Link>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-bold text-slate-600">
            <a href="#features" className="hover:text-emerald-900 transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-emerald-900 transition-colors">
              Live Demo
            </a>
            <a href="#coach" className="hover:text-emerald-900 transition-colors">
              AI Study Coach
            </a>
            <a href="#analytics" className="hover:text-emerald-900 transition-colors">
              Analytics
            </a>
            <a href="#faq" className="hover:text-emerald-900 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">
                  Hi, {user?.name?.split(' ')[0] || 'Student'}!
                </span>
                <button
                  onClick={() => navigate('/timer')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                >
                  <span>Open App</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                {/* SIGN IN BUTTON */}
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl clay-btn-white text-slate-800 hover:text-slate-950 font-bold text-xs sm:text-sm transition-all"
                >
                  Sign In
                </Link>

                {/* SIGN UP / GET STARTED */}
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition-all"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl clay-btn-white text-slate-700"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-[#ded5c4] mt-3 space-y-3">
            <div className="flex flex-col gap-2 font-bold text-sm text-slate-700 px-1">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-emerald-900"
              >
                Features
              </a>
              <a
                href="#demo"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-emerald-900"
              >
                Live Demo
              </a>
              <a
                href="#coach"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-emerald-900"
              >
                AI Study Coach
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-emerald-900"
              >
                FAQ
              </a>
            </div>
            <div className="pt-2 border-t border-[#ded5c4] flex flex-col gap-2">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/timer');
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Open App</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl clay-btn-white text-center font-bold text-xs text-slate-800"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs text-center shadow-md shadow-emerald-600/20"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center space-y-6">
        {/* Floating Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#ded5c4] shadow-xs text-xs font-bold text-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Next-Gen Academic Discipline & Focus Timer</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
            AI 2.5
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-['Outfit'] font-black text-slate-900 tracking-tight leading-[1.08] max-w-4xl mx-auto">
          Master Deep Focus.{' '}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 bg-clip-text text-transparent block sm:inline">
            Defeat Procrastination.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-sm sm:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
          A science-backed study platform combining hardware-accurate Pomodoro calibration,
          MongoDB-verified analytics, and an intelligent academic coach tailored to your coursework.
        </p>

        {/* Hero CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/timer')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <span>Continue Focus Session</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <>
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <span>Start Focusing Free</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl clay-card bg-[#fdfcf9] hover:bg-white text-slate-800 font-extrabold text-sm sm:text-base border-2 border-white/95 shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Sign In to Account</span>
              </Link>
            </>
          )}
        </div>

        {/* Trust Badges */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Zero-Drift Timestamp Calibration</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Gemini 2.5 Study Mentor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verified MongoDB Analytics</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>100% Free for Students</span>
          </div>
        </div>

        {/* 3D HERO INTERACTIVE PREVIEW CARD */}
        <div className="pt-8 sm:pt-12 max-w-4xl mx-auto">
          <div className="clay-card rounded-[36px] bg-[#fdfcf9] border-2 border-white/95 shadow-2xl p-6 sm:p-8 text-left relative overflow-hidden">
            {/* Top Bar inside mockup */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#ded5c4]/60">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-mono font-bold text-slate-400">
                  session_active • mode:pomodoro
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>7 Day Streak Active</span>
                </div>
              </div>
            </div>

            {/* Inner Dashboard Preview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* Dial Simulator */}
              <div className="md:col-span-1 clay-inset rounded-3xl p-6 flex flex-col items-center justify-center text-center bg-[#f7f2ea]">
                <div className="w-36 h-36 rounded-full clay-dial bg-[#fdfcf9] border-4 border-white flex flex-col items-center justify-center relative shadow-inner">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
                    Deep Focus
                  </span>
                  <span className="font-mono text-3xl font-black text-slate-900 tracking-tight my-1">
                    23:45
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">25m Target</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-extrabold text-slate-700">
                    Advanced Mathematics
                  </span>
                </div>
              </div>

              {/* Progress & Highlights */}
              <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
                {/* Daily Goal Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="flex items-center gap-1.5 text-slate-800">
                      <Target className="w-4 h-4 text-emerald-600" />
                      Daily Target Progress
                    </span>
                    <span className="text-emerald-700 font-mono">4.5h / 6.0h (75%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all"
                      style={{ width: '75%' }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span>3 blocks completed today</span>
                    <span>1 block remaining</span>
                  </div>
                </div>

                {/* AI Coach Live Insight Snippet */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/50 border border-emerald-200/80 text-xs text-slate-700 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-emerald-950 font-black">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>AI Study Mentor Advice</span>
                  </div>
                  <p className="leading-relaxed font-medium">
                    “Outstanding momentum, Pawan! You have maintained your focus streak across 3 consecutive days. Finish this 25-minute calculus block to achieve your daily target.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE 60-SECOND FOCUS PLAYGROUND */}
      <section id="demo" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="clay-card rounded-[32px] p-6 sm:p-8 bg-[#fdfcf9] border-2 border-white/90 shadow-xl text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
            <Zap className="w-3.5 h-3.5" />
            <span>Try It Live (No Account Needed)</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-['Outfit'] font-black text-slate-900 tracking-tight">
            Take a 60-Second Micro Focus Sprint
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Experience the tactile clay timer interface right now. Click Start to begin a 60-second trial session:
          </p>

          {/* Interactive Playground Timer */}
          <div className="flex flex-col items-center justify-center pt-2 pb-2">
            <div className="w-32 h-32 rounded-full clay-dial bg-[#fdfcf9] border-4 border-white flex flex-col items-center justify-center relative shadow-inner">
              <span className="font-mono text-3xl font-black text-slate-900">
                00:{playgroundSeconds < 10 ? `0${playgroundSeconds}` : playgroundSeconds}
              </span>
              <span className="text-[10px] text-emerald-700 font-extrabold mt-0.5">
                {isPlaygroundRunning ? 'Focusing...' : playgroundCompleted ? 'Completed!' : 'Ready'}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-5">
              {!isPlaygroundRunning ? (
                <button
                  onClick={() => setIsPlaygroundRunning(true)}
                  disabled={playgroundCompleted}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{playgroundSeconds === 60 ? 'Start 60s Focus' : 'Resume'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsPlaygroundRunning(false)}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={handleResetPlayground}
                className="p-2.5 rounded-xl clay-btn-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {playgroundCompleted && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold max-w-sm mx-auto animate-in fade-in">
              🎉 Micro sprint finished! Ready to save your real study hours?{' '}
              <Link to="/signup" className="underline font-bold text-emerald-800">
                Sign up free
              </Link>{' '}
              or{' '}
              <Link to="/login" className="underline font-bold text-emerald-800">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-800">
            Engineered For Academic Mastery
          </span>
          <h2 className="text-3xl sm:text-4xl font-['Outfit'] font-black text-slate-900 tracking-tight">
            Everything You Need To Build Unbreakable Habits
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            No bloated distractions. Just pure focus tools tailored for university, exam prep, and self-directed scholars.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="clay-card rounded-[28px] p-6 bg-[#fdfcf9] border-2 border-white/90 shadow-md space-y-3 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
                <Timer className="w-6 h-6" />
              </div>
              <h3 className="font-['Outfit'] font-extrabold text-slate-900 text-base">
                Zero-Drift Timer
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Hardware timestamp calibration prevents lost time even if you switch browser tabs, minimize windows, or lose focus.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <span>Pomodoro & Stopwatch</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="clay-card rounded-[28px] p-6 bg-[#fdfcf9] border-2 border-white/90 shadow-md space-y-3 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-['Outfit'] font-extrabold text-slate-900 text-base">
                AI Discipline Coach
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Grounds advice in your real verified focus logs. Decomposes heavy coursework into manageable 25-minute Pomodoro sprints.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-1 text-[11px] font-bold text-teal-700">
              <span>Gemini 2.5 Powered</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="clay-card rounded-[28px] p-6 bg-[#fdfcf9] border-2 border-white/90 shadow-md space-y-3 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shadow-xs">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-['Outfit'] font-extrabold text-slate-900 text-base">
                Verified Analytics
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Track weekly study hours, subject distributions, daily consistency ratings, and streak preservation with MongoDB sync.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-1 text-[11px] font-bold text-sky-700">
              <span>Data-Driven Trends</span>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="clay-card rounded-[28px] p-6 bg-[#fdfcf9] border-2 border-white/90 shadow-md space-y-3 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-['Outfit'] font-extrabold text-slate-900 text-base">
                Secure & Private
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Passwords hashed with bcrypt, sessions protected by secure HttpOnly cookies, and strict anti-CSRF token shields.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-1 text-[11px] font-bold text-rose-700">
              <span>Enterprise Grade Auth</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-800">
            Simple 3-Step Flow
          </span>
          <h2 className="text-3xl font-['Outfit'] font-black text-slate-900 tracking-tight">
            How StudyDiscipline Drives Results
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="clay-card rounded-3xl p-6 bg-[#fdfcf9] border-2 border-white/90 shadow-sm space-y-3 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-['Outfit'] font-black flex items-center justify-center mx-auto text-sm shadow-md shadow-emerald-600/30">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base">Set Daily Focus Goal</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Define your daily target hours (e.g. 4 hours) and choose the coursework subjects you want to master today.
            </p>
          </div>

          <div className="clay-card rounded-3xl p-6 bg-[#fdfcf9] border-2 border-white/90 shadow-sm space-y-3 text-center">
            <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-['Outfit'] font-black flex items-center justify-center mx-auto text-sm shadow-md shadow-teal-600/30">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base">Execute Pomodoro Sprints</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Lock into 25-minute calibrated blocks followed by 5-minute restorative breaks. Eliminate multitasking.
            </p>
          </div>

          <div className="clay-card rounded-3xl p-6 bg-[#fdfcf9] border-2 border-white/90 shadow-sm space-y-3 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-['Outfit'] font-black flex items-center justify-center mx-auto text-sm shadow-md shadow-slate-900/30">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base">Review with AI Coach</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Receive smart recommendations, beat afternoon fatigue, and celebrate your daily streak milestone.
            </p>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-['Outfit'] font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Common questions about StudyDiscipline and student productivity.
          </p>
        </div>

        <div className="space-y-4">
          <div className="clay-card rounded-2xl p-5 bg-[#fdfcf9] border-2 border-white/90 space-y-1.5">
            <h3 className="font-bold text-slate-900 text-sm">
              How does the timer prevent losing time when switching tabs?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unlike ordinary browser timers that freeze or throttle when inactive, StudyDiscipline records exact system hardware timestamps (`Date.now()`). When you return to the tab, it calculates the true elapsed time instantly.
            </p>
          </div>

          <div className="clay-card rounded-2xl p-5 bg-[#fdfcf9] border-2 border-white/90 space-y-1.5">
            <h3 className="font-bold text-slate-900 text-sm">
              Is my study data and password safe?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Yes. All passwords are encrypted with bcrypt using 10 salt rounds. Authentication sessions are stored in protected HttpOnly cookies that malicious browser scripts cannot steal.
            </p>
          </div>

          <div className="clay-card rounded-2xl p-5 bg-[#fdfcf9] border-2 border-white/90 space-y-1.5">
            <h3 className="font-bold text-slate-900 text-sm">
              How does the AI Study Coach work?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The AI Coach uses Google Gemini 2.5 to analyze your logged study hours, active streak, and pending tasks to suggest personalized study schedules and actionable productivity steps.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div
          style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 35%, #0f766e 70%, #0f172a 100%)',
            boxShadow: '0 24px 48px rgba(6, 78, 59, 0.32), 0 8px 16px rgba(15, 23, 42, 0.2), inset 2px 2px 4px rgba(255, 255, 255, 0.25), inset -2px -2px 6px rgba(0, 0, 0, 0.35)',
            borderRadius: '36px',
            border: '2px solid rgba(255, 255, 255, 0.25)',
          }}
          className="p-8 sm:p-12 text-white text-center space-y-6 relative overflow-hidden"
        >
          {/* Subtle inner lighting */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mx-auto shadow-inner border border-white/25 relative z-10">
            <Sparkles className="w-7 h-7 text-amber-300" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-['Outfit'] font-black text-white tracking-tight leading-tight max-w-xl mx-auto drop-shadow-sm relative z-10">
            Ready To Turn Time Into Academic Success?
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-md mx-auto leading-relaxed relative z-10">
            Join students building unstoppable focus habits today. Start your first calibrated 25-minute sprint right now.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/timer')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <span>Go to Focus Timer</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 border-2 border-white/40 text-white font-extrabold text-sm backdrop-blur-md flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#ded5c4] py-8 px-4 sm:px-8 text-center text-xs text-slate-500 space-y-3">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-700">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>StudyDiscipline • Academic Productivity Platform</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Built for scholars, competitive exam aspirants, and lifelong learners. Protected by HttpOnly sessions and bcrypt encryption.
        </p>
        <p className="text-[10px] text-slate-400">
          © {new Date().getFullYear()} StudyDiscipline. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
