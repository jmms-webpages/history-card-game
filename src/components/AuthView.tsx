import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, AlertCircle, ShieldCheck, ArrowRight, BookOpen } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { loginWithGoogle, loginAsAdminDirect, error, clearError, loading } = useAuth();

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
              <p className="font-semibold text-xs uppercase tracking-wider text-rose-300">Sign-in Notice</p>
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
            <h2 className="text-lg font-bold text-slate-100">Sign In to Continue</h2>
            <p className="text-xs text-slate-400 mt-1">
              Use your school Google account to access your collection and records.
            </p>
          </div>

          {/* Primary Google Sign In Button */}
          <button
            id="google-signin-button"
            type="button"
            onClick={loginWithGoogle}
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
            <span className="font-medium text-slate-800">
              {loading ? 'Connecting Google Account...' : 'Sign in with Google'}
            </span>
          </button>

          {/* Admin Auto-Detection Badge */}
          <div className="mt-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-snug">
              <span className="font-semibold text-amber-300">Master Administrator Access: </span>
              Accounts under <span className="font-mono text-amber-200">jaf2jc@bearworks.jackson.sparcc.org</span> automatically unlock full Administrator controls and the Student View toggle.
            </div>
          </div>

          {/* Direct Admin Quick Access (for immediate testing or sandbox preview) */}
          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <button
              id="direct-admin-signin"
              type="button"
              onClick={() => loginAsAdminDirect('jaf2jc@bearworks.jackson.sparcc.org', 'Admin (jaf2jc)')}
              disabled={loading}
              className="text-xs text-amber-400/90 hover:text-amber-300 transition-colors flex items-center justify-center gap-1.5 mx-auto font-medium cursor-pointer"
            >
              <span>Instant Admin Preview Sign-In</span>
              <ArrowRight className="w-3 h-3" />
            </button>
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
