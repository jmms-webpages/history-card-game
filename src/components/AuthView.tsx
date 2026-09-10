import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, AlertCircle, ShieldCheck, ArrowRight, BookOpen, UserCheck, GraduationCap, CheckCircle } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { loginWithGoogle, error, clearError, loading, lastUsedEmail } = useAuth();
  
  const [emailInput, setEmailInput] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<'bearworks.jackson.sparcc.org' | 'jackson.sparcc.org'>('bearworks.jackson.sparcc.org');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Normalize current typed email
  const typedUsername = emailInput.trim();
  const fullEmail = typedUsername.includes('@') 
    ? typedUsername.toLowerCase() 
    : (typedUsername ? `${typedUsername.toLowerCase()}@${selectedDomain}` : '');
  
  const isTypedAdmin = fullEmail === 'jaf2jc@bearworks.jackson.sparcc.org' || 
                       fullEmail === 'jaf2jc@jackson.sparcc.org' || 
                       typedUsername.toLowerCase() === 'jaf2jc';

  const handleTeacherSignIn = (email: string) => {
    loginWithGoogle(email, 'Teacher & Director');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!typedUsername) {
      setValidationError('Please enter your school username or email address.');
      return;
    }

    if (!fullEmail.endsWith('@bearworks.jackson.sparcc.org') && !fullEmail.endsWith('@jackson.sparcc.org')) {
      setValidationError('Access restricted: Email must end in @bearworks.jackson.sparcc.org or @jackson.sparcc.org');
      return;
    }

    const defaultName = isTypedAdmin ? 'Teacher & Director' : (displayNameInput.trim() || '8th Grade Student');
    loginWithGoogle(fullEmail, defaultName);
  };

  const handleQuickStudentSignIn = () => {
    loginWithGoogle('student@bearworks.jackson.sparcc.org', '8th Grade Student');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle historic atmospheric gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-950/25 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg mx-auto">
        
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
          <p className="mt-2 text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
            Authorized Jackson Local Schools Portal for curriculum trivia, classroom coin rewards, and historical card trading.
          </p>
        </div>

        {/* Error Alert */}
        {(error || validationError) && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-sm flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-xs uppercase tracking-wider text-rose-300">Authentication Notice</p>
              <p className="text-rose-200 text-xs mt-1">{error || validationError}</p>
            </div>
            <button 
              onClick={() => { clearError(); setValidationError(null); }}
              className="text-xs text-rose-400 hover:text-white underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Primary Auth Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">

          {/* Section 1: Administrator / Teacher Direct Access (Top Priority) */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-amber-500/15 to-amber-500/5 border-2 border-amber-500/40 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                  Teacher & Director Access (jaf2jc)
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 font-bold">
                Admin
              </span>
            </div>
            
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Sign in as the classroom educator to automatically activate full administrative privileges (Teacher Dashboard, Admin Console, and Student View mode):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                id="teacher-signin-bearworks"
                type="button"
                onClick={() => handleTeacherSignIn('jaf2jc@bearworks.jackson.sparcc.org')}
                disabled={loading}
                className="py-3 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow-md hover:shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>jaf2jc@bearworks...</span>
              </button>

              <button
                id="teacher-signin-jackson"
                type="button"
                onClick={() => handleTeacherSignIn('jaf2jc@jackson.sparcc.org')}
                disabled={loading}
                className="py-3 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>jaf2jc@jackson...</span>
              </button>
            </div>
          </div>

          {/* Section Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Or Sign In with School Account
            </span>
          </div>

          {/* Section 2: Custom School Account Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  School Username or Google Email
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Jackson Local Schools</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="auth-username-input"
                  type="text"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="e.g. jaf2jc or 29asmith"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />

                {!emailInput.includes('@') && (
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="bearworks.jackson.sparcc.org">@bearworks.jackson.sparcc.org</option>
                    <option value="jackson.sparcc.org">@jackson.sparcc.org</option>
                  </select>
                )}
              </div>

              {/* Dynamic Role Indicator */}
              {typedUsername && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {isTypedAdmin ? (
                    <div className="flex items-center gap-1.5 text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Administrator Account Recognized ({fullEmail})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-300 font-medium bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>8th Grade Student Account ({fullEmail})</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              id="auth-submit-account-button"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Sign In with School Account</span>
              <ArrowRight className="w-4 h-4 text-slate-900" />
            </button>
          </form>

          {/* Section 3: Quick Student Demo Button */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Quick Student Mode:</span>
              <span className="text-[11px] text-slate-500 font-mono">50 coins • Ohio-8A</span>
            </div>
            <button
              id="quick-student-signin-button"
              type="button"
              onClick={handleQuickStudentSignIn}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-700 text-slate-300 font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>Sign In as 8th Grade Student (student@bearworks...)</span>
            </button>
          </div>

        </div>

        {/* Security & District Footnote */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Restricted to @bearworks.jackson.sparcc.org & @jackson.sparcc.org</span>
        </div>

      </div>
    </div>
  );
};
