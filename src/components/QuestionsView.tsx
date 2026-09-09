import React from 'react';
import { HelpCircle, Calendar, Sparkles, CheckCircle, Award } from 'lucide-react';
import { INITIAL_STANDARDS } from '../data/initialCurriculum';

export const QuestionsView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Phase 2 Preview: Daily Question System
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100">
              Daily History Trivia Quest
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Answer up to 25 multiple-choice questions per calendar day to earn classroom coins.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Daily Cap</span>
            <span className="text-amber-400 font-bold text-base">25 Questions</span>
          </div>
        </div>
      </div>

      {/* Rules & Rewards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
            <CheckCircle className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Correct Answer</h3>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">+10 Coins</p>
          <p className="text-xs text-slate-400 mt-1">Rewarding mastery of historical concepts.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
            <Award className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Incorrect Answer</h3>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">+3 Coins</p>
          <p className="text-xs text-slate-400 mt-1">Effort is always rewarded; coins are never lost.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Daily Activity Tracking</h3>
          <p className="text-2xl font-black text-indigo-300 font-mono mt-1">Spark-Optimized</p>
          <p className="text-xs text-slate-400 mt-1">Saved under compact <code className="text-[11px] bg-slate-950 px-1 py-0.5 rounded">users/&#123;id&#125;/dailyActivity/YYYY-MM-DD</code> docs.</p>
        </div>
      </div>

      {/* Curriculum Standards alignment */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Upcoming 8th Grade Ohio Question Bank Standards</span>
        </h3>
        <div className="space-y-2.5">
          {INITIAL_STANDARDS.slice(0, 5).map(std => (
            <div key={std.standardId} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between text-amber-400 font-mono font-bold mb-1">
                <span>{std.standardId}</span>
                <span className="text-slate-500">{std.topic}</span>
              </div>
              <p className="text-slate-300">{std.standardDescription}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
