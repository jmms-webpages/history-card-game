import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuestions } from '../context/QuestionsContext';
import { useCards } from '../context/CardsContext';
import { NavigationTab, Card } from '../types';
import { getAvatarById } from '../data/avatars';
import { INITIAL_UNITS } from '../data/initialCurriculum';
import { MASTERY_TARGET_POINTS } from '../context/AuthContext';
import { getTodayKey } from '../context/QuestionsContext';
import { CardDetailModal } from './CardDetailModal';
import { RARITY_COLORS } from '../data/cards';
import { 
  Coins, 
  HelpCircle, 
  Package, 
  Library, 
  CheckCircle2, 
  Flame, 
  BookOpen, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  Award,
  Trophy
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const { dailyActivity, gameSettings } = useQuestions();
  const { stats, inventoryCards, isCardOwned, getCardCopies, cards } = useCards();

  // Same card for the whole class each day -- a deterministic pick from
  // data already loaded, so this costs zero extra Firestore reads.
  const spotlightCard = React.useMemo(() => {
    const activeCards = cards.filter(c => c.active);
    if (activeCards.length === 0) return null;
    let h = 0;
    const seedStr = getTodayKey();
    for (let i = 0; i < seedStr.length; i++) {
      h = (Math.imul(31, h) + seedStr.charCodeAt(i)) | 0;
    }
    return activeCards[Math.abs(h) % activeCards.length];
  }, [cards]);

  const spotlightColors = spotlightCard ? RARITY_COLORS[spotlightCard.rarity] : null;

  const [inspectCard, setInspectCard] = useState<Card | null>(null);

  if (!userProfile) return null;

  const currentAvatar = getAvatarById(userProfile.avatar);
  const dailyAnswered = dailyActivity?.questionsAnswered ?? 0;
  const dailyLimit = gameSettings?.dailyQuestionLimit ?? 10;
  const recentPulls = [...inventoryCards].reverse().slice(0, 5);

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/40 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className={`w-16 h-16 rounded-2xl ${currentAvatar.color} flex items-center justify-center text-3xl shadow-lg border border-amber-400/30 shrink-0`}>
              {currentAvatar.badge}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono truncate">
                  {userProfile.classroomCode} • {userProfile.role === 'admin' ? 'Teacher & Director' : '8th Grade Historian'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100 truncate break-words">
                Welcome back, {userProfile.displayName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 truncate">
                Avatar: <span className="text-amber-300 font-medium">{currentAvatar.name}</span> — {currentAvatar.title}
              </p>
            </div>
          </div>

          {/* Quick Metrics (Coins & Daily Limit) */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            {/* Coins Balance */}
            <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-4 flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Balance</span>
                <span className="text-xl font-black font-mono text-amber-400">
                  {(userProfile.coins || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Daily Question Progress Card */}
            <div className="bg-slate-950/80 border border-slate-700 rounded-2xl p-4 w-full sm:w-auto min-w-[200px]">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="flex items-center gap-1 font-medium text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Daily Limit
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {dailyAnswered} / {dailyLimit}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (dailyAnswered / dailyLimit) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>10 coins / correct</span>
                <span className="text-amber-400 font-medium">{dailyLimit - dailyAnswered} left</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Binder Progress Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-slate-100 text-lg">
                  History Collection Binder
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Official Set
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {stats.uniqueCards} of {stats.totalInSet} unique curriculum cards collected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('packs')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow"
            >
              <Package className="w-4 h-4" />
              <span>Open Packs</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('collection')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View Binder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="bg-gradient-to-r from-amber-500 via-emerald-400 to-indigo-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(0, stats.completionPercentage))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{stats.completionPercentage}% of Ohio 8th Grade Set Archived</span>
            <span>{stats.duplicatesCount} Duplicates Available to Sell</span>
          </div>
        </div>
      </div>

      {/* Daily Spotlight Card -- pure flavor, gives a reason to check in
          even after hitting today's question cap. Full description shown,
          horizontal layout: art on the left, everything to read on the right. */}
      {spotlightCard && spotlightColors && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Today's Spotlight Card</h2>
          </div>
          <p className="text-xs text-slate-400 mb-5">
            A different card is featured every day.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
            <div
              onClick={() => setInspectCard(spotlightCard)}
              className={`w-full sm:w-52 h-44 sm:h-56 shrink-0 rounded-2xl bg-gradient-to-br ${spotlightColors.sheen} border ${spotlightColors.border} flex items-center justify-center text-7xl shadow-lg cursor-pointer transition-transform hover:scale-[1.02]`}
            >
              <span>{(spotlightCard as any).symbol || '📜'}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${spotlightColors.badge}`}>
                  {spotlightCard.rarity}
                </span>
                <span className="text-[11px] font-mono text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {spotlightCard.standardId}
                </span>
                <span className="text-[11px] text-slate-400">{spotlightCard.packTheme}</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black font-serif text-slate-100">
                {spotlightCard.name}
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed mt-3">
                {spotlightCard.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                {isCardOwned(spotlightCard.cardId) ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Already in your binder ({getCardCopies(spotlightCard.cardId)} {getCardCopies(spotlightCard.cardId) === 1 ? 'copy' : 'copies'})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Package className="w-4 h-4" />
                    Not in your binder yet — keep earning packs to track it down!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unit Mastery -- consistency-building tracker, private to this student */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-slate-100">Unit Mastery</h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Every correct answer builds mastery in that unit; a miss only costs half as much. Keep answering consistently to fill each bar.
        </p>
        <div className="space-y-4">
          {INITIAL_UNITS.map((unit) => {
            const points = userProfile.unitMastery?.[unit.unitId] || 0;
            const percent = Math.min(100, Math.round((points / MASTERY_TARGET_POINTS) * 100));
            const tierLabel =
              percent >= 100 ? 'Mastered!' :
              percent >= 90 ? 'Nearly Mastered' :
              percent >= 60 ? 'Locked In' :
              percent >= 25 ? 'Getting Consistent' :
              'Building Foundations';
            const tierColor =
              percent >= 100 ? 'text-emerald-400' :
              percent >= 60 ? 'text-amber-400' :
              'text-slate-400';

            return (
              <div key={unit.unitId}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-200">{unit.unitName}</span>
                  <span className={`font-mono font-bold ${tierColor}`}>{tierLabel} · {percent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      percent >= 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Curriculum Roadmap (Ohio 8th Grade Social Studies Units) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
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
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
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

      {/* Card Detail Inspection Modal */}
      {inspectCard && (
        <CardDetailModal
          card={inspectCard}
          isOwned={isCardOwned(inspectCard.cardId)}
          copiesCount={getCardCopies(inspectCard.cardId)}
          onClose={() => setInspectCard(null)}
          onNavigateToPacks={() => onNavigate('packs')}
        />
      )}

    </div>
  );
};
