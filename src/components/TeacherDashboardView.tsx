import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { INITIAL_UNITS, INITIAL_STANDARDS, DEFAULT_GAME_SETTINGS } from '../data/initialCurriculum';
import { 
  GraduationCap, 
  ShieldCheck, 
  Settings, 
  BookOpen, 
  Coins, 
  Sparkles, 
  HelpCircle, 
  Plus, 
  Check, 
  Sliders,
  Users,
  Eye
} from 'lucide-react';

export const TeacherDashboardView: React.FC = () => {
  const { userProfile, isTeacher, isAdmin, setStudentViewMode } = useAuth();
  
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'units' | 'standards' | 'economy'>('overview');
  const [dailyLimit, setDailyLimit] = useState(DEFAULT_GAME_SETTINGS.dailyQuestionLimit);
  const [correctReward, setCorrectReward] = useState(DEFAULT_GAME_SETTINGS.correctCoinReward);
  const [incorrectReward, setIncorrectReward] = useState(DEFAULT_GAME_SETTINGS.incorrectCoinReward);
  const [packCost, setPackCost] = useState(DEFAULT_GAME_SETTINGS.standardPackCost);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveEconomy = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  if (!isTeacher) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <GraduationCap className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-100">Teacher Portal Protected</h2>
        <p className="text-xs text-slate-400">
          This portal is reserved for Ohio Social Studies educators and administrators. Sign in with your designated teacher credentials to manage classroom questions, units, and economy.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Teacher Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-serif text-slate-100">
                  Ohio 8th Grade {isAdmin ? 'Master Admin' : 'Educator'} Portal
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isAdmin ? 'Master Administrator' : 'Teacher Verified'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage curriculum units, Ohio 2026 standards, question banks, and classroom coin economy.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="admin-launch-student-view"
              onClick={() => setStudentViewMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300 hover:bg-emerald-900/90 transition-all cursor-pointer shadow-sm"
              title="Switch directly into student view mode"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Launch Student View</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{userProfile?.email || `UID: ${userProfile?.uid.substring(0, 10)}...`}</span>
            </div>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'overview' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Overview & Stats
          </button>
          <button
            onClick={() => setActiveSubTab('units')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'units' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Curriculum Units ({INITIAL_UNITS.length})
          </button>
          <button
            onClick={() => setActiveSubTab('standards')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'standards' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Ohio Standards ({INITIAL_STANDARDS.length})
          </button>
          <button
            onClick={() => setActiveSubTab('economy')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'economy' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Coin Economy & Daily Limits
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Ohio Curriculum Units</span>
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-slate-100 font-mono">{INITIAL_UNITS.length}</p>
            <p className="text-xs text-slate-400 mt-1">Pre-colonial to Reconstruction</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Updated 2026 Standards</span>
              <HelpCircle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-slate-100 font-mono">{INITIAL_STANDARDS.length}</p>
            <p className="text-xs text-slate-400 mt-1">Ready for transition year 2026–2027</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Classroom Safety</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-emerald-400 font-mono">FERPA Safe</p>
            <p className="text-xs text-slate-400 mt-1">No public academic rank lists or student emails</p>
          </div>
        </div>
      )}

      {/* Units Tab */}
      {activeSubTab === 'units' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-base">Classroom Curriculum Units</h3>
            <span className="text-xs text-slate-400 font-mono">Editable in Phase 5</span>
          </div>
          <div className="space-y-2.5">
            {INITIAL_UNITS.map((unit) => (
              <div key={unit.unitId} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                  {unit.order}
                </span>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-200">{unit.unitName}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{unit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standards Tab */}
      {activeSubTab === 'standards' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-base">2026 Ohio 8th Grade Social Studies Standards</h3>
              <p className="text-xs text-slate-400 mt-0.5">Every trivia question and card links to these standards.</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {INITIAL_STANDARDS.map((std) => (
              <div key={std.standardId} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-amber-400 font-mono font-bold mb-1">
                  <span>{std.standardId}</span>
                  <span className="text-slate-400 font-sans">{std.topic}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{std.standardDescription}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Economy Tab */}
      {activeSubTab === 'economy' && (
        <form onSubmit={handleSaveEconomy} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-base">Configurable Game Economy & Daily Limits</h3>
              <p className="text-xs text-slate-400 mt-0.5">Control question caps and coin values for your classroom.</p>
            </div>
            {savedNotice && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Daily Question Limit per Student
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: 25 questions per day.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Pack Cost (Coins)
              </label>
              <input
                type="number"
                min={20}
                max={500}
                value={packCost}
                onChange={(e) => setPackCost(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: 100 coins for a 5-card booster pack.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Correct Answer Reward
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={correctReward}
                onChange={(e) => setCorrectReward(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono text-emerald-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: +10 coins.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Incorrect Answer Reward (Encouragement)
              </label>
              <input
                type="number"
                min={0}
                max={25}
                value={incorrectReward}
                onChange={(e) => setIncorrectReward(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono text-amber-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: +3 coins (coins are never deducted).</p>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Apply Economy Settings</span>
          </button>
        </form>
      )}

    </div>
  );
};
