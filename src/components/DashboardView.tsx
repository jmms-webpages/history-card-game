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
import { DashboardGoal, DashboardReminders } from './EngagementBanners';
import { accuracyColor } from '../utils/adminStats';
import { RARITY_COLORS } from '../data/cards';
import { Coins, Package, Library, CheckCircle2, Sparkles, ArrowRight, Calendar, CalendarDays, TrendingDown } from 'lucide-react';
import { AvatarFace } from './AvatarFace';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const { dailyActivity, gameSettings, setPracticeUnitIds, activityTally } = useQuestions();
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

  // Today / this week (Mon-Sun): every answer counts (daily, review and practice).
  const todayQ = activityTally.todayQuestions;
  const todayC = activityTally.todayCorrect;
  const weekQ = activityTally.weekQuestions;
  const weekC = activityTally.weekCorrect;

  const split = (right: number, total: number) => {
    const pct = total > 0 ? Math.round((right / total) * 100) : null;
    return (
      <div>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-950 border border-slate-800">
          {total > 0 && (
            <>
              <div className="bg-emerald-500" style={{ width: `${(right / total) * 100}%` }} />
              <div className="bg-rose-500" style={{ width: `${((total - right) / total) * 100}%` }} />
            </>
          )}
        </div>
        <div className="flex justify-between text-[11px] font-mono mt-1">
          <span className="text-emerald-300">{right} right</span>
          <span className={`font-bold ${accuracyColor(pct)}`}>{pct === null ? '—' : `${pct}%`}</span>
          <span className="text-rose-300">{total - right} wrong</span>
        </div>
      </div>
    );
  };

  // Every unit's mastery in one place, each with a one-click practice button.
  const masteryRows = INITIAL_UNITS.map((unit, i) => {
    const points = userProfile.unitMastery?.[unit.unitId] || 0;
    return { unit, num: i + 1, percent: Math.min(100, Math.round((points / MASTERY_TARGET_POINTS) * 100)) };
  });
  const lowestPercent = Math.min(...masteryRows.map(r => r.percent));
  const practiceUnit = (unitId: string) => {
    setPracticeUnitIds([unitId]);
    onNavigate('practice');
  };

  const cardCls = 'bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-3';

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/40 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className={`w-16 h-16 rounded-2xl ${currentAvatar.color} overflow-hidden flex items-center justify-center text-3xl shadow-lg border border-amber-400/30 shrink-0`}>
              <AvatarFace avatar={currentAvatar} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono truncate">
                  {userProfile.role === 'admin' ? 'Teacher & Director' : '8th Grade Historian'}
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

          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${gameSettings?.classGoal ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        <div className={cardCls}>
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-emerald-400" /> Today</h3>
          <p className="text-3xl font-black text-slate-100 font-mono">{dailyAnswered}<span className="text-xs text-slate-400 font-normal ml-2">/ {dailyLimit} daily questions</span></p>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (dailyAnswered / dailyLimit) * 100)}%` }} />
          </div>
          {split(todayC, todayQ)}
        </div>
        <div className={cardCls}>
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-sky-400" /> This Week</h3>
          <p className="text-3xl font-black text-slate-100 font-mono">{weekQ}<span className="text-xs text-slate-400 font-normal ml-2">questions</span></p>
          {split(weekC, weekQ)}
        </div>
        <DashboardGoal />
      </div>

      <DashboardReminders onNavigate={onNavigate} />

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
              </div>
              <p className="text-xs text-slate-400">
                {stats.uniqueCards} of {stats.totalInSet} unique cards collected
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
            <span>{stats.completionPercentage}% of the set collected</span>
            <span>{stats.duplicatesCount} Duplicates Available to Sell</span>
          </div>
        </div>
      </div>

      {/* Unit Mastery: every unit at a glance, with one-click practice */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="font-serif font-black text-slate-100 text-lg flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-amber-400" /> Unit Mastery
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Correct answers build mastery in a unit; a miss only costs half as much. Tap Practice to work on a unit.
          </p>
        </div>
        <div className="space-y-3">
          {masteryRows.map(({ unit, num, percent }) => (
            <div key={unit.unitId} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-200 truncate">
                    Unit {num}: {unit.unitName}
                    {percent === lowestPercent && percent < 100 && (
                      <span className="ml-2 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5">lowest</span>
                    )}
                  </span>
                  <span className={`font-mono font-bold ml-2 ${percent >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>{percent >= 100 ? 'Mastered!' : `${percent}%`}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${percent >= 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <button type="button" onClick={() => practiceUnit(unit.unitId)} className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-bold cursor-pointer whitespace-nowrap">
                Practice
              </button>
            </div>
          ))}
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
