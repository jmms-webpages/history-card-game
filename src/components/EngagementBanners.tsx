import React, { useEffect, useState } from 'react';
import { Target, CalendarClock, Star, Gift, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuestions } from '../context/QuestionsContext';
import { INITIAL_UNITS } from '../data/initialCurriculum';
import { NavigationTab } from '../types';
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

// Goal card with its own snapshot read (only when a goal exists; cached 10 min).
export const DashboardGoal: React.FC = () => {
  const { gameSettings } = useQuestions();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const goalId = gameSettings.classGoal?.goalId;
  useEffect(() => {
    if (!goalId) return;
    let cancelled = false;
    fetchSnapshot(false).then(s => { if (!cancelled) setSnapshot(s); });
    return () => { cancelled = true; };
  }, [goalId]);
  return <ClassGoalCard snapshot={snapshot} />;
};

// The major things a student should know right now. All from data already loaded.
export const DashboardReminders: React.FC<{ onNavigate: (tab: NavigationTab) => void }> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const { gameSettings, reviewQueueCount } = useQuestions();
  if (!userProfile) return null;

  const focusUnit = gameSettings.focusUnitId
    ? INITIAL_UNITS.find(u => u.unitId === gameSettings.focusUnitId)
    : null;

  // Reminders for this student's class (or for every class), within 3 weeks.
  const myCode = (userProfile.classroomCode || '').trim().toUpperCase();
  const allTests = [
    ...(gameSettings.upcomingTests || []),
    ...(gameSettings.upcomingTest ? [gameSettings.upcomingTest] : [])
  ];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const upcoming = allTests
    .filter(t => !t.classCodes || t.classCodes.length === 0 || t.classCodes.includes(myCode))
    .map(t => ({
      test: t,
      days: Math.round((new Date(`${t.date}T00:00:00`).getTime() - todayStart.getTime()) / 86400000)
    }))
    .filter(x => !Number.isNaN(x.days) && x.days >= 0 && x.days <= 21)
    .sort((x, y) => x.days - y.days)
    .slice(0, 3);

  const row = 'flex items-center justify-between gap-3 rounded-xl border p-3 text-xs';
  const items: React.ReactNode[] = [];

  upcoming.forEach(({ test, days }) => {
    items.push(
      <div key={test.id || `${test.label}-${test.date}`} className={`${row} bg-rose-500/10 border-rose-500/40 text-rose-100`}>
        <span className="flex items-center gap-2.5">
          <CalendarClock className="w-4 h-4 text-rose-300 shrink-0" />
          <span><strong>{test.label}</strong> {days === 0 ? 'is today!' : days === 1 ? 'is tomorrow.' : `is in ${days} days.`}</span>
        </span>
      </div>
    );
  });

  if (reviewQueueCount > 0) {
    items.push(
      <div key="review" className={`${row} bg-indigo-500/10 border-indigo-500/30 text-indigo-100`}>
        <span><strong>{reviewQueueCount}</strong> missed question{reviewQueueCount === 1 ? '' : 's'} to review</span>
        <button type="button" onClick={() => onNavigate('questions')} className="px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold cursor-pointer whitespace-nowrap flex items-center gap-1">
          Review <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  if (focusUnit) {
    items.push(
      <div key="focus" className={`${row} bg-amber-500/10 border-amber-500/40 text-amber-100`}>
        <span className="flex items-center gap-2.5">
          <Star className="w-4 h-4 text-amber-400 shrink-0" />
          <span><strong>Focus: {focusUnit.unitName}</strong> pays +{gameSettings.focusCorrectReward ?? gameSettings.correctCoinReward} coins per correct answer.</span>
        </span>
        <button type="button" onClick={() => onNavigate('questions')} className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer whitespace-nowrap">
          Answer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-3">
      <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
        <CalendarClock className="w-4 h-4 text-rose-300" /> Reminders
      </h3>
      {items.length > 0 ? (
        <div className="space-y-2">{items}</div>
      ) : (
        <p className="text-xs text-slate-500">Nothing urgent. You're all caught up!</p>
      )}
    </div>
  );
};
