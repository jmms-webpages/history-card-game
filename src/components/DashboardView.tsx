import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavigationTab } from '../types';
import { getAvatarById } from '../data/avatars';
import { INITIAL_UNITS } from '../data/initialCurriculum';
import { 
  Coins, 
  HelpCircle, 
  Package, 
  Library, 
  Repeat, 
  CheckCircle2, 
  Flame, 
  BookOpen, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Calendar
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { userProfile, isTeacher } = useAuth();

  if (!userProfile) return null;

  const currentAvatar = getAvatarById(userProfile.avatar);
  const dailyAnswered = 0; // Ready for Phase 2 Firestore dailyActivity integration
  const dailyLimit = 25;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/40 border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${currentAvatar.color} flex items-center justify-center text-3xl shadow-lg border border-amber-400/30`}>
              {currentAvatar.badge}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                  {userProfile.classroomCode} • {userProfile.role === 'teacher' ? 'Educator' : '8th Grade Historian'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100">
                Welcome back, {userProfile.displayName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Avatar: <span className="text-amber-300 font-medium">{currentAvatar.name}</span> — {currentAvatar.title}
              </p>
            </div>
          </div>

          {/* Daily Question Progress Card */}
          <div className="bg-slate-950/80 border border-slate-700 rounded-xl p-4 w-full md:w-auto min-w-[240px]">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1 font-medium text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Daily Question Limit
              </span>
              <span className="font-mono text-amber-400 font-bold">
                {dailyAnswered} / {dailyLimit}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${(dailyAnswered / dailyLimit) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
              <span>Earn 10 coins / correct answer</span>
              <span className="text-amber-400 font-medium">{dailyLimit - dailyAnswered} left today</span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Action: Questions */}
        <div 
          onClick={() => onNavigate('questions')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
              Daily Trivia
            </h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30">
              Phase 2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Answer 8th Grade Ohio Social Studies trivia to earn classroom coins.
          </p>
        </div>

        {/* Action: Packs */}
        <div 
          onClick={() => onNavigate('packs')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
            <Package className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
              Card Packs
            </h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Phase 3
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Spend 100 coins to open 5-card historical packs with guaranteed rare slots.
          </p>
        </div>

        {/* Action: Collection */}
        <div 
          onClick={() => onNavigate('collection')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
            <Library className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
              My Collection
            </h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Phase 3
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track cards, view historical significance, complete sets, and sell duplicates.
          </p>
        </div>

        {/* Action: Trading */}
        <div 
          onClick={() => onNavigate('trading')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 cursor-pointer transition-all hover:-translate-y-1 shadow-lg group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
            <Repeat className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
              Student Trading
            </h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Phase 4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Exchange duplicate cards safely with classmates using secure atomic transactions.
          </p>
        </div>

      </div>

      {/* Curriculum Roadmap (Ohio 8th Grade Social Studies Units) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Ohio 8th Grade Social Studies Curriculum Units
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Updated 2026 Standards Aligned
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Every question, card, and pack in History Card Quest maps directly to the classroom curriculum units:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {INITIAL_UNITS.map((unit) => (
            <div 
              key={unit.unitId}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                {unit.order}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  {unit.unitName}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {unit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 1 Verification Guide for the Teacher */}
      <div className="bg-slate-900/70 border border-amber-500/40 rounded-2xl p-6 shadow-lg relative">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Phase 1 Foundation Completed & Ready to Test
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                We have established the React + TypeScript app, Firebase configuration, user authentication (Google + Student fast sign-in + Teacher verification), safe student profile management with historical avatars, and primary navigation.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <p className="font-semibold text-amber-400 uppercase tracking-wider">
                What to test in your browser now:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                <li>
                  <strong className="text-white">Student Profile:</strong> Click on your avatar or go to the <strong>Profile</strong> tab to choose between 9 historical avatars (e.g. Tecumseh, Abigail Adams, Harriet Tubman) and update your display name.
                </li>
                <li>
                  <strong className="text-white">Teacher Mode:</strong> If you sign out and click the <strong>Teacher</strong> tab on the login screen, you can sign in with your verified teacher email to unlock the <strong>Teacher Portal</strong> in the top navigation.
                </li>
                <li>
                  <strong className="text-white">Navigation:</strong> Click through Dashboard, Questions, Packs, Collection, Trading, and Profile to verify smooth switching.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
