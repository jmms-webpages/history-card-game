import React from 'react';
import { Repeat, ShieldCheck, Sparkles, Lock } from 'lucide-react';

export const TradingView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Phase 4 Preview: Student Card Trading
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100">
          Classroom Card Trading
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Propose fair trades with classmates using secure atomic transactions that prevent duplication or card theft.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Atomic Firestore Transactions</h3>
          <p className="text-xs text-slate-400 mt-1">
            Cards transfer simultaneously between inventories only when both students confirm. No client-side card assignment or exploits.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Student Privacy Protected</h3>
          <p className="text-xs text-slate-400 mt-1">
            Classmates see only the student's safe display name and historical avatar. Email addresses and student grades are never revealed.
          </p>
        </div>
      </div>
    </div>
  );
};
