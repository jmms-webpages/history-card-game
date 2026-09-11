import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Lock, ShieldCheck, School, ArrowRight, UserCheck, Sparkles } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { loginWithGoogle, loginWithSchoolEmail, error, clearError, loading } = useAuth();

  const [emailInput, setEmailInput] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<'bearworks.jackson.sparcc.org' | 'jackson.sparcc.org'>(
    'bearworks.jackson.sparcc.org'
  );

  // Compute live preview of assigned display name: First Name + Last Initial
  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  const derivedPreview = trimmedFirst && trimmedLast
    ? `${trimmedFirst.charAt(0).toUpperCase() + trimmedFirst.slice(1)} ${trimmedLast.charAt(0).toUpperCase()}.`
    : trimmedFirst
    ? `${trimmedFirst.charAt(0).toUpperCase() + trimmedFirst.slice(1)} [Last Initial]`
    : null;

  const handleSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    let fullEmail = emailInput.trim().toLowerCase();
    if (!fullEmail.includes('@')) {
      fullEmail = `${fullEmail}@${selectedDomain}`;
    }

    await loginWithSchoolEmail(fullEmail, firstName, lastName);
  };

  const handleQuickTeacher = async () => {
    clearError();
    await loginWithSchoolEmail('jaf2jc@bearworks.jackson.sparcc.org', 'Teacher', 'Director');
  };

  const handleQuickStudent = async () => {
    clearError();
    await loginWithSchoolEmail('maya.patel@bearworks.jackson.sparcc.org', 'Maya', 'Patel');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-950/25 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg mx-auto">
        
        {/* Emblem & Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-3xl font-black text-slate-950 shadow-2xl mx-auto mb-4 border border-amber-400/40">
            ⚔️
          </div>

          <h1 className="text-3xl sm:text-4xl font-black font-serif tracking-tight text-slate-100">
            History Card <span className="text-amber-400">Quest</span>
          </h1>

          <p className="mt-1.5 text-xs sm:text-sm font-semibold text-amber-300/90 tracking-wide uppercase font-mono">
            Jackson Memorial Middle School • Ohio 8th Grade Social Studies
          </p>

          <p className="mt-2 text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
            Answer curriculum trivia, earn coins, and build your historical deck.
          </p>
        </div>

        {/* Notice alert if any error */}
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

        {/* Main Authentication Card */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6">
          
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <School className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100">
                Jackson School Account Access
              </h2>
              <p className="text-xs text-slate-400">
                Single-access login with your official district email
              </p>
            </div>
          </div>

          <form onSubmit={handleSchoolSubmit} className="space-y-4">
            
            {/* School Email Input with Domain Helpers */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  School Email or Username
                </label>
                <div className="flex gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedDomain('bearworks.jackson.sparcc.org')}
                    className={`px-2 py-0.5 rounded font-mono transition-colors ${
                      selectedDomain === 'bearworks.jackson.sparcc.org'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-300 border border-slate-700'
                    }`}
                  >
                    @bearworks (Students)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDomain('jackson.sparcc.org')}
                    className={`px-2 py-0.5 rounded font-mono transition-colors ${
                      selectedDomain === 'jackson.sparcc.org'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-300 border border-slate-700'
                    }`}
                  >
                    @jackson (Staff)
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  id="school-email-input"
                  type="text"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={
                    selectedDomain === 'bearworks.jackson.sparcc.org'
                      ? 'student.name@bearworks.jackson.sparcc.org'
                      : 'jaf2jc@jackson.sparcc.org'
                  }
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-mono placeholder:text-slate-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Must be an authorized Jackson Local Schools account.
              </p>
            </div>

            {/* Student Name: First & Last (Auto-creates First L.) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  First Name
                </label>
                <input
                  id="first-name-input"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Maya"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Last Name
                </label>
                <input
                  id="last-name-input"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Patel"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Live Auto-Derived Name Preview */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-slate-400">Assigned In-Game Name:</span>
              </div>
              <div className="font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-md">
                {derivedPreview || 'First L.'}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 -mt-2 leading-relaxed">
              <ShieldCheck className="w-3 h-3 inline mr-1 text-emerald-400" />
              For student safety and privacy, your display name is strictly locked to your First Name &amp; Last Initial. Students cannot choose custom gamertags.
            </p>

            {/* Submit Button */}
            <button
              id="submit-school-signin"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 active:to-amber-700 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 font-serif"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Enter History Card Quest</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
              Or Real Google Sign-In
            </span>
          </div>

          {/* Google SSO Button */}
          <div>
            <button
              id="google-signin-button"
              type="button"
              onClick={() => loginWithGoogle()}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold rounded-xl text-xs transition-all border border-slate-700 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>Sign in with Google Popup (@bearworks or @jackson)</span>
            </button>
          </div>

          {/* Quick Access Helper for Teacher/Testing */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>Classroom Quick Access:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleQuickTeacher}
                className="text-amber-400 hover:text-amber-300 underline font-mono flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Teacher Sign-In (jaf2jc)
              </button>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                onClick={handleQuickStudent}
                className="text-slate-400 hover:text-slate-200 underline font-mono cursor-pointer"
              >
                Sample Student (Maya P.)
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

