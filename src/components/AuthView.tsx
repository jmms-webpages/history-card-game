import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ShieldCheck, GraduationCap } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { loginWithGoogle, error, clearError, loading } = useAuth();

  const handleSignInClick = async () => {
    clearError();
    await loginWithGoogle();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      {/* Background subtle historical geometry */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-950/25 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto">
        
        {/* Emblem & Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-4xl font-black text-slate-950 shadow-2xl mx-auto mb-4 border border-amber-400/40">
            ⚔️
          </div>

          <h1 className="text-3xl sm:text-4xl font-black font-serif tracking-tight text-slate-100">
            History Card <span className="text-amber-400">Quest</span>
          </h1>

          <p className="mt-2 text-xs sm:text-sm font-semibold text-amber-300/90 tracking-wide uppercase font-mono">
            Jackson Memorial Middle School • Ohio 8th Grade Social Studies
          </p>

          <p className="mt-2 text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
            Answer curriculum trivia, earn coins, and collect historical figures, events, and artifacts.
          </p>
        </div>

        {/* Notice alert if any unauthorized account or error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-200 text-xs flex items-start gap-3 shadow-xl text-left animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold uppercase tracking-wider text-rose-300">Notice</p>
              <p className="mt-0.5 leading-normal">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-rose-400 hover:text-white underline cursor-pointer text-xs shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Clean Google Sign-In Card (Authentic Google SSO) */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-slate-100">
              Classroom Single Sign-On
            </h2>
            <p className="text-xs text-slate-400">
              Select your Jackson Local Schools Google profile to begin
            </p>
          </div>

          {/* Primary Sign in with Google Button */}
          <div>
            <button
              id="google-signin-button"
              type="button"
              onClick={handleSignInClick}
              disabled={loading}
              className="w-full py-3.5 px-6 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold rounded-xl text-sm sm:text-base transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3.5 cursor-pointer disabled:opacity-60 border border-slate-200"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
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
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
          </div>

          {/* District Domain & Privacy Information */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5 text-center text-xs text-slate-400 leading-relaxed">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>@bearworks.jackson.sparcc.org &bull; @jackson.sparcc.org</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Display names are automatically assigned as <span className="font-semibold text-slate-200">First Name + Last Initial</span> (e.g. Maya P.) from your chosen Google account profile to safeguard student privacy.
            </p>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-mono">
              <GraduationCap className="w-3 h-3 text-slate-500" />
              <span>Staff accounts automatically unlock teacher dashboard &amp; student view mode</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
