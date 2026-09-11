import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { deriveDisplayName } from '../context/AuthContext';
import { AlertCircle, Lock, ShieldCheck, X, ChevronRight, User, Sparkles } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { 
    loginWithGoogle, 
    error, 
    clearError, 
    loading, 
    isGoogleChooserOpen, 
    setIsGoogleChooserOpen 
  } = useAuth();

  const [customStudentName, setCustomStudentName] = useState('');
  const [showCustomStudentInput, setShowCustomStudentInput] = useState(false);

  const handleSignInClick = async () => {
    clearError();
    await loginWithGoogle();
  };

  const handleSelectAccount = async (email: string, displayName?: string) => {
    clearError();
    await loginWithGoogle({ email, displayName });
  };

  const handleCustomStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStudentName.trim()) return;
    clearError();
    const cleanName = customStudentName.trim();
    // Create deterministic safe student email from name
    const emailPrefix = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.');
    await loginWithGoogle({
      email: `${emailPrefix}@bearworks.jackson.sparcc.org`,
      displayName: cleanName
    });
  };

  const previewDerivedName = customStudentName.trim()
    ? deriveDisplayName(customStudentName, 'Student S.')
    : null;

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

        {/* Notice alert if any unauthorized access or genuine error */}
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

        {/* Clean Google Sign-In Card (Zero manual inputs or forms) */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-slate-100">
              Classroom Single Sign-On
            </h2>
            <p className="text-xs text-slate-400">
              Sign in with your official Jackson Local Schools account
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

          {/* Privacy & Student Safety Badge */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2 text-center text-xs text-slate-400 leading-relaxed">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>@bearworks.jackson.sparcc.org &bull; @jackson.sparcc.org</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Display names are automatically assigned as <span className="font-semibold text-slate-200">First Name + Last Initial</span> (e.g. Maya P.) to protect student safety and privacy.
            </p>
          </div>

        </div>

      </div>

      {/* Authentic Google Account Chooser Modal (Dialog) */}
      {isGoogleChooserOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white text-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Google Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
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
                <div>
                  <h3 className="font-semibold text-base text-slate-900 leading-tight">
                    Sign in with Google
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose an account to continue to History Card Quest
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGoogleChooserOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Selection List */}
            <div className="divide-y divide-slate-100">
              
              {/* Option 1: Teacher / Master Administrator */}
              <button
                type="button"
                onClick={() => handleSelectAccount('jaf2jc@bearworks.jackson.sparcc.org', 'Teacher & Director')}
                className="w-full p-4 hover:bg-slate-50 active:bg-slate-100 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-sm shrink-0 shadow-sm border border-amber-600">
                    J
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        John Fleming (Teacher &amp; Admin)
                      </p>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Staff
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate font-mono">
                      jaf2jc@bearworks.jackson.sparcc.org
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* Option 2: 8th Grade Student Account (1-Click) */}
              <button
                type="button"
                onClick={() => handleSelectAccount('student@bearworks.jackson.sparcc.org', 'Student Historian')}
                className="w-full p-4 hover:bg-slate-50 active:bg-slate-100 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-sm">
                    🎓
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        8th Grade Student Account
                      </p>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Student
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      @bearworks.jackson.sparcc.org &bull; Auto-assigned First Name &amp; Last Initial
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* Option 3: Optional Custom Student Name Sign-In */}
              <div className="p-4 bg-slate-50/70">
                {!showCustomStudentInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomStudentInput(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Sign in with a specific student name</span>
                  </button>
                ) : (
                  <form onSubmit={handleCustomStudentSubmit} className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-700">
                        Student Full Name (e.g. Maya Patel):
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCustomStudentInput(false)}
                        className="text-slate-400 hover:text-slate-600 text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>

                    <input
                      type="text"
                      required
                      autoFocus
                      value={customStudentName}
                      onChange={(e) => setCustomStudentName(e.target.value)}
                      placeholder="e.g. Maya Patel"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />

                    {previewDerivedName && (
                      <div className="flex items-center justify-between text-[11px] bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded text-blue-900">
                        <span className="text-blue-700">In-game display name:</span>
                        <span className="font-bold font-mono">{previewDerivedName}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Continue as {previewDerivedName || 'Student'}
                    </button>
                  </form>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Restricted to Jackson Local Schools District Domain</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
