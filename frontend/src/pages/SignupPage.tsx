import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import {
  BookOpen,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Flame,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side quick checks
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      setErrorMessage('Name must be at least 2 characters long.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(trimmedName, trimmedEmail, password);
      // Redirect to sign-in page with pre-filled email and confirmation message
      navigate('/login', {
        replace: true,
        state: {
          email: trimmedEmail,
          registered: true,
          message: 'Account created successfully! Please sign in with your password to continue.',
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#ebe2d3] flex flex-col lg:flex-row antialiased select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ========================================================
          LEFT SIDE: Cinematic Study Desk with Fluctuating Lamp
         ======================================================== */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-8 xl:p-12 overflow-hidden h-full max-h-screen">
        {/* Background Image: Student studying at desk */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transform scale-105"
          style={{ backgroundImage: `url('/images/student_study_desk.jpg')` }}
        />

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/70 pointer-events-none" />
        <div className="absolute inset-0 bg-emerald-950/20 mix-blend-multiply pointer-events-none" />

        {/* ========================================================
            CINEMATIC LAMP ILLUMINATION: Photorealistic Light Breathing
            Brightens the actual lamp opening, bulb, and its warm light cone
            seamlessly from the underlying artwork without fake pasted shapes.
           ======================================================== */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transform scale-105 animate-lamp-light-pulse"
          style={{
            backgroundImage: `url('/images/student_study_desk.jpg')`,
            filter: 'brightness(1.45) saturate(1.32) contrast(1.08)',
            WebkitMaskImage:
              'radial-gradient(ellipse 60% 50% at 22% 38%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 25%, rgba(0,0,0,0.3) 50%, transparent 72%)',
            maskImage:
              'radial-gradient(ellipse 60% 50% at 22% 38%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 25%, rgba(0,0,0,0.3) 50%, transparent 72%)',
          }}
        />

        {/* Soft atmospheric golden warmth around the lamp opening (ultra-diffuse, no hard edges) */}
        <div
          className="absolute top-[37%] left-[21%] -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none animate-lamp-light-pulse mix-blend-screen blur-3xl opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(254, 240, 138, 0.6) 0%, rgba(245, 158, 11, 0.25) 50%, transparent 80%)',
          }}
        />

        {/* Top Left: Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-900/40 border-2 border-white/60 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-['Outfit'] font-black text-white text-lg tracking-tight leading-none block drop-shadow-md">
                StudyDiscipline
              </span>
              <span className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-widest mt-0.5 block drop-shadow-xs">
                Academic Focus & Mastery
              </span>
            </div>
          </Link>
        </div>

        {/* Bottom Left: Atmospheric Quotes & Feature Badges */}
        <div className="relative z-10 space-y-4 max-w-lg">
          {/* Active Feature Pills */}
          <div className="flex flex-wrap gap-2 text-xs font-bold text-white/90">
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Drift Timer</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Study Coach</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>Streak Analytics</span>
            </span>
          </div>

          {/* Quote Card */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-2xl space-y-1">
            <p className="font-['Outfit'] font-extrabold text-sm sm:text-base leading-snug drop-shadow-sm">
              “Discipline is choosing between what you want now and what you want most.”
            </p>
            <p className="text-[11px] text-emerald-200 font-medium">
              Join thousands of students turning study sessions into academic breakthroughs.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          RIGHT SIDE: Sign-Up Form Panel
         ======================================================== */}
      <div className="w-full lg:w-1/2 xl:w-5/12 h-full max-h-screen flex flex-col justify-center items-center px-4 sm:px-8 lg:px-10 py-4 overflow-hidden relative">
        {/* Mobile Background Fallback (Only on small screens) */}
        <div
          className="lg:hidden absolute inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{ backgroundImage: `url('/images/student_study_desk.jpg')` }}
        >
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs" />
        </div>

        <div className="w-full max-w-md space-y-3.5">
          {/* Form Header */}
          <div className="text-left space-y-1">
            <div className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-600 text-white shadow-lg mb-1">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-['Outfit'] font-black text-slate-900 lg:text-slate-900 tracking-tight leading-tight max-lg:text-white">
              Create your account
            </h2>
            <p className="text-xs text-slate-500 lg:text-slate-600 font-medium max-lg:text-emerald-100">
              Start mastering your study discipline and tracking academic focus.
            </p>
          </div>

          {/* 3D Porcelain Clay Form Card */}
          <div className="clay-card !rounded-[26px] bg-[#fdfcf9] border-2 border-white/95 p-5 sm:p-6 shadow-xl">
            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2 text-xs text-rose-800 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ada Lovelace"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password (min. 8 characters)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                    {password.length >= 8 ? (
                      <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Meets minimum length
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Need {8 - password.length} more character{8 - password.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  disabled={isSubmitting}
                  className="font-bold py-2 shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? 'Creating account...' : 'Create Account'}
                </Button>
              </div>
            </form>

            {/* Switch to Login */}
            <div className="mt-3.5 text-center text-xs text-slate-500 pt-2.5 border-t border-slate-100">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                Sign in
              </Link>
            </div>
          </div>

          {/* Security Assurance Badge */}
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 max-lg:text-emerald-100 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 max-lg:text-amber-300" />
              Passwords hashed with bcrypt & protected by HttpOnly cookies
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
