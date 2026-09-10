import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, AlertCircle, ShieldCheck, ArrowRight, BookOpen, ChevronDown, UserCheck } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { loginWithGoogle, error, clearError, loading } = useAuth();
  const [showStudentInput, setShowStudentInput] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [studentName, setStudentName] = useState('');

  const handleAdminGoogleSignIn = () => {
    loginWithGoogle('jaf2jc@bearworks.jackson.sparcc.org', 'Teacher & Director');
  };

  const handleStudentGoogleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const email = studentEmail.trim() || 'student@bearworks.jackson.sparcc.org';
    const name = studentName.trim() || email.split('@')[0];
    loginWithGoogle(email, name);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle historic atmospheric gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-950/25 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Ohio 8th Grade Social Studies
          </div>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-3xl font-black text-slate-950 shadow-2xl mx-auto mb-4 border border-amber-400/40">
            ⚔️
          </div>

          <h1 className="text-3xl sm:text-4xl font-black font-serif tracking-tight text-slate-100">
            History Card <span className="text-amber-400">Quest</span>
          </h1>
          <p className="mt-2.5 text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            Answer curriculum-aligned daily trivia, earn classroom coins, and unlock historical trading cards.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-sm flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-xs uppercase tracking-wider text-rose-300">Notice</p>
              <p className="text-rose-200 text-xs mt-1">{error}</p>
            </div>
            <button 
              onClick={clearError}
              className="text-xs text-rose-400 hover:text-white underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Google Sign-In Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-100">Sign In with Google</h2>
            <p className="text-xs text-slate-400 mt-1">
              Connect using your Jackson Local Schools Google account.
            </p>
          </div>

          {/* Primary Google Sign In Button */}
          <button
            id="google-signin-button"
            type="button"
            onClick={handleAdminGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 border border-slate-200"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-semibold text-slate-900">
              {loading ? 'Connecting Google Account...' : 'Sign in with Google'}
            </span>
          </button>

          {/* Teacher & Director Auto-Detection Badge */}
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-snug">
              <span className="font-semibold text-amber-300">Teacher & Program Director: </span>
              Signing in connects <span className="font-mono text-amber-200">jaf2jc@bearworks.jackson.sparcc.org</span> with access to the Teacher Dashboard, Admin Console, and Student View mode.
            </div>
          </div>

          {/* Optional Student Google Account Section */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <button
              type="button"
              id="toggle-student-account-form"
              onClick={() => setShowStudentInput(!showStudentInput)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-between w-full py-1 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                Sign in with a student school account
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showStudentInput ? 'rotate-180' : ''}`} />
            </button>

            {showStudentInput && (
              <form onSubmit={handleStudentGoogleSignIn} className="mt-3 space-y-2.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                    Student Google Email
                  </label>
                  <input
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="student@bearworks.jackson.sparcc.org"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                    Student Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Alex M."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow"
                >
                  <span>Continue as Student</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Student Privacy & District Info */}
        <div className="mt-6 text-center text-xs text-slate-500 max-w-sm mx-auto flex items-center justify-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Single Sign-On • School District Google Workspace</span>
        </div>

      </div>
    </div>
  );
};
