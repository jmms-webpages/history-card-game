import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HISTORICAL_AVATARS } from '../data/avatars';
import { Shield, Sparkles, BookOpen, User, GraduationCap, AlertCircle, ArrowRight } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { loginWithGoogle, loginAsStudent, loginAsTeacher, error, clearError, loading } = useAuth();
  
  const [tab, setTab] = useState<'student' | 'google' | 'teacher'>('student');
  const [studentName, setStudentName] = useState('');
  const [classroomCode, setClassroomCode] = useState('OHIO-8A');
  const [selectedAvatarId, setSelectedAvatarId] = useState('franklin');
  
  const [teacherName, setTeacherName] = useState('Ohio History Teacher');
  const [teacherEmail, setTeacherEmail] = useState('jaf2jc@bearworks.jackson.sparcc.org');

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    loginAsStudent(studentName, classroomCode, selectedAvatarId);
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsTeacher(teacherName, teacherEmail);
  };

  const selectedAvatar = HISTORICAL_AVATARS.find(a => a.id === selectedAvatarId) || HISTORICAL_AVATARS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Subtle historic background atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-950/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl mx-auto">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Ohio 8th Grade Social Studies
          </div>
          <h1 className="text-4xl sm:text-5xl font-black font-serif tracking-tight text-slate-100 drop-shadow-sm">
            History Card <span className="text-amber-400">Quest</span>
          </h1>
          <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-md mx-auto">
            Answer daily trivia, earn classroom coins, unlock historic card packs, and build your American history collection!
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Sign-in Notice</p>
              <p className="text-rose-300 text-xs mt-0.5">{error}</p>
            </div>
            <button 
              onClick={clearError}
              className="text-xs text-rose-400 hover:text-white underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          
          {/* Sign-in Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              id="auth-tab-student"
              onClick={() => setTab('student')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                tab === 'student'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Student</span>
            </button>
            <button
              id="auth-tab-google"
              onClick={() => setTab('google')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                tab === 'google'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Google</span>
            </button>
            <button
              id="auth-tab-teacher"
              onClick={() => setTab('teacher')}
              className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                tab === 'teacher'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Teacher</span>
            </button>
          </div>

          {/* Student Classroom Sign-In Tab */}
          {tab === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Student Name (e.g. First Name + Last Initial)
                </label>
                <input
                  id="student-name-input"
                  type="text"
                  required
                  placeholder="e.g. Marcus T."
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Classroom Code
                </label>
                <input
                  id="student-classcode-input"
                  type="text"
                  required
                  value={classroomCode}
                  onChange={(e) => setClassroomCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm font-mono"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Choose Your Historical Avatar: <span className="text-amber-400 font-serif normal-case">{selectedAvatar.name}</span>
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
                  {HISTORICAL_AVATARS.map((avatar) => {
                    const isSelected = selectedAvatarId === avatar.id;
                    return (
                      <button
                        type="button"
                        key={avatar.id}
                        onClick={() => setSelectedAvatarId(avatar.id)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/20 scale-105 shadow-md'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                        }`}
                        title={`${avatar.name} - ${avatar.title}`}
                      >
                        <span className="text-xl mb-1">{avatar.badge}</span>
                        <span className="text-[10px] font-mono text-slate-400 truncate w-full text-center">
                          {avatar.initials}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Selected: {selectedAvatar.title} ({selectedAvatar.era})
                </p>
              </div>

              <button
                id="student-login-submit"
                type="submit"
                disabled={loading || !studentName.trim()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Starting Quest...' : 'Enter History Card Quest'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Google Sign-In Tab */}
          {tab === 'google' && (
            <div className="space-y-5 text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">School Google Account</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Sign in with your district Google account. Your profile and cards will automatically sync across devices.
                </p>
              </div>

              <button
                id="google-signin-button"
                type="button"
                onClick={loginWithGoogle}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-sm transition-all shadow flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span>{loading ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>

              <p className="text-[11px] text-slate-500">
                Note: In iframe previews, if your browser blocks popups, use the Student or Teacher tab directly.
              </p>
            </div>
          )}

          {/* Teacher Sign-In Tab */}
          {tab === 'teacher' && (
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                <GraduationCap className="w-5 h-5 shrink-0" />
                <span>Teacher & Administrator Portal Access. Grants question & curriculum editing tools.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Teacher Name / Title
                </label>
                <input
                  id="teacher-name-input"
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Teacher Email (Admin Authorization)
                </label>
                <input
                  id="teacher-email-input"
                  type="email"
                  required
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                id="teacher-login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Enter Teacher Dashboard</span>
              </button>
            </form>
          )}

        </div>

        {/* School Privacy Notice */}
        <div className="mt-6 text-center text-xs text-slate-500 max-w-md mx-auto flex items-center justify-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Student Privacy Protected: No email addresses or public academic grades are ever shared between students.
          </span>
        </div>

      </div>
    </div>
  );
};
