import React, { useEffect, useState } from 'react';
import { Target, CalendarClock, Star, Users, Gift, Coins, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuestions } from '../context/QuestionsContext';
import { useCards } from '../context/CardsContext';
import { INITIAL_UNITS } from '../data/initialCurriculum';
import { NavigationTab } from '../types';
import { isUnassignedClass } from '../utils/classes';
import { Snapshot, fetchSnapshot, getGoalProgress, GOAL_METRIC_LABELS } from '../utils/snapshot';

// Shared goal the whole school works toward. Progress comes from the single
// teacher-published snapshot, so it costs no extra reads.
export const ClassGoalCard: React.FC<{ snapshot: Snapshot | null }> = ({ snapshot }) => {
  const { userProfile, updateUserProfile, updateCoins } = useAuth();
  const { gameSettings } = useQuestions();
  const [claiming, setClaiming] = useState(false);

  const goal = gameSettings.classGoal;
  if (!goal || !userProfile) return null;

  const progress = getGoalProgress(goal, snapshot);
  const claimedIds = userProfile.claimedGoalIds || [];
  const claimed = claimedIds.includes(goal.goalId);

  const handleClaim = async () => {
    if (claiming || claimed || !progress.reached) return;
    setClaiming(true);
    await updateUserProfile({ claimedGoalIds: [...claimedIds, goal.goalId] });
    await updateCoins(goal.rewardCoins);
    setClaiming(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-1">
        <Target className="w-5 h-5 text-indigo-300" />
        <h2 className="text-lg font-bold text-slate-100">Class Goal: {goal.title}</h2>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Everyone works together — reach {goal.target.toLocaleString()} {GOAL_METRIC_LABELS[goal.metric]} as a school and every student can claim +{goal.rewardCoins} coins.
      </p>

      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-700"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1.5">
        <span>{progress.current.toLocaleString()} / {goal.target.toLocaleString()}</span>
        <span>
          {progress.percent}%
          {snapshot?.generatedAt && ` · updated ${new Date(snapshot.generatedAt).toLocaleDateString()}`}
        </span>
      </div>

      {progress.reached && (
        <div className="mt-4">
          {claimed ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> Goal reached — reward claimed!
            </span>
          ) : (
            <button
              type="button"
              onClick={handleClaim}
              disabled={claiming}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Gift className="w-4 h-4" />
              {claiming ? 'Claiming...' : `We did it! Claim +${goal.rewardCoins} Coins`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const bannerBase = 'rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3';

export const DashboardEngagement: React.FC<{ onNavigate: (tab: NavigationTab) => void }> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const { gameSettings, reviewQueueCount } = useQuestions();
  const { cards, isCardOwned } = useCards();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  const goalId = gameSettings.classGoal?.goalId;
  useEffect(() => {
    // Only read the snapshot when there's a goal to show progress for.
    if (!goalId) return;
    let cancelled = false;
    fetchSnapshot(false).then(s => { if (!cancelled) setSnapshot(s); });
    return () => { cancelled = true; };
  }, [goalId]);

  if (!userProfile) return null;

  const needsPeriod = (gameSettings.classes || []).length > 0 && isUnassignedClass(userProfile.classroomCode);

  const focusUnit = gameSettings.focusUnitId
    ? INITIAL_UNITS.find(u => u.unitId === gameSettings.focusUnitId)
    : null;

  let testDays: number | null = null;
  const test = gameSettings.upcomingTest;
  if (test?.date) {
    const target = new Date(`${test.date}T00:00:00`).getTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((target - today.getTime()) / 86400000);
    if (!Number.isNaN(days) && days >= 0 && days <= 21) testDays = days;
  }

  // "So close!" nudge: the started unit that needs the fewest more cards.
  const activeCards = cards.filter(c => c.active);
  let nudge: { name: string; left: number } | null = null;
  for (const u of INITIAL_UNITS) {
    const unitCards = activeCards.filter(c => c.unitId === u.unitId);
    if (unitCards.length === 0) continue;
    const owned = unitCards.filter(c => isCardOwned(c.cardId)).length;
    const left = unitCards.length - owned;
    if (owned > 0 && left > 0 && (nudge === null || left < nudge.left)) nudge = { name: u.unitName, left };
  }

  return (
    <div className="space-y-4">
      {needsPeriod && (
        <div className={`${bannerBase} bg-amber-500/10 border-amber-500/40`}>
          <div className="flex items-center gap-3 text-xs text-amber-200">
            <Users className="w-5 h-5 text-amber-400 shrink-0" />
            <span><strong>Join your class</strong> with the password from your teacher so you can use the Class Binder and count on the Honor Roll.</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            Join Class
          </button>
        </div>
      )}

      {testDays !== null && test && (
        <div className={`${bannerBase} bg-rose-500/10 border-rose-500/40`}>
          <div className="flex items-center gap-3 text-xs text-rose-100">
            <CalendarClock className="w-5 h-5 text-rose-300 shrink-0" />
            <span>
              <strong>{test.label}</strong> {testDays === 0 ? 'is today!' : testDays === 1 ? 'is tomorrow.' : `is in ${testDays} days.`}{' '}
              {reviewQueueCount > 0
                ? `You have ${reviewQueueCount} missed question${reviewQueueCount === 1 ? '' : 's'} to review.`
                : 'Keep practicing to stay sharp.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('questions')}
            className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            {reviewQueueCount > 0 ? 'Review Now' : 'Practice'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {focusUnit && (
        <div className={`${bannerBase} bg-amber-500/10 border-amber-500/40`}>
          <div className="flex items-center gap-3 text-xs text-amber-100">
            <Star className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>Unit Focus: {focusUnit.unitName}.</strong> Correct answers in this unit pay{' '}
              <strong>+{gameSettings.focusCorrectReward ?? gameSettings.correctCoinReward} coins</strong> instead of +{gameSettings.correctCoinReward}.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('questions')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            Answer Questions
          </button>
        </div>
      )}

      <ClassGoalCard snapshot={snapshot} />

      {nudge && (
        <div className={`${bannerBase} bg-slate-900 border-slate-800`}>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <Coins className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              So close! You're only <strong className="text-emerald-300">{nudge.left} card{nudge.left === 1 ? '' : 's'}</strong> away from completing <strong>{nudge.name}</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('packs')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            Open Packs
          </button>
        </div>
      )}
    </div>
  );
};
