import React, { useState } from 'react';
import { Target, Star, CalendarClock, Users, Flame, CheckCircle2 } from 'lucide-react';
import { useQuestions } from '../context/QuestionsContext';
import { INITIAL_UNITS } from '../data/initialCurriculum';
import { UserProfile, ClassGoal } from '../types';
import { startNewWeek } from '../utils/publishSnapshot';
import { GOAL_METRIC_LABELS } from '../utils/snapshot';

// Teacher controls for the engagement features. Nothing here reads Firestore
// on load -- the roster you already refreshed supplies the numbers.
export const AdminEngagementPanel: React.FC<{ students: UserProfile[] }> = ({ students }) => {
  const { gameSettings, updateGameSettings } = useQuestions();

  const [testLabel, setTestLabel] = useState(gameSettings.upcomingTest?.label || '');
  const [testDate, setTestDate] = useState(gameSettings.upcomingTest?.date || '');

  const [goalTitle, setGoalTitle] = useState('');
  const [goalMetric, setGoalMetric] = useState<ClassGoal['metric']>('questions');
  const [goalTarget, setGoalTarget] = useState(5000);
  const [goalReward, setGoalReward] = useState(100);

  const [weekMsg, setWeekMsg] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const flash = (t: string) => {
    setSavedMsg(t);
    setTimeout(() => setSavedMsg(null), 3000);
  };

  const classTotal = (metric: ClassGoal['metric']) =>
    students.reduce(
      (sum, s) =>
        sum +
        (metric === 'questions'
          ? s.totalQuestionsAnsweredLifetime || 0
          : metric === 'correct'
          ? s.totalCorrectAnswersLifetime || 0
          : s.uniqueCardsCollected || 0),
      0
    );

  const saveTest = () => {
    updateGameSettings({ upcomingTest: testLabel.trim() && testDate ? { label: testLabel.trim(), date: testDate } : null });
    flash(testLabel.trim() && testDate ? 'Test reminder saved.' : 'Test reminder cleared.');
  };

  const startGoal = () => {
    if (!goalTitle.trim() || goalTarget <= 0) return;
    const goal: ClassGoal = {
      goalId: `goal-${Date.now()}`,
      title: goalTitle.trim(),
      metric: goalMetric,
      target: Math.round(goalTarget),
      baseline: classTotal(goalMetric),
      rewardCoins: goalReward,
      startedAt: new Date().toISOString()
    };
    updateGameSettings({ classGoal: goal });
    setGoalTitle('');
    flash('Class goal started. Progress updates each time you publish the Honor Roll.');
  };

  const handleNewWeek = async () => {
    if (students.length === 0) {
      setWeekMsg('Refresh the student roster first (Students tab).');
      return;
    }
    if (!window.confirm('Start a new weekly competition? Everyone\'s weekly totals reset to zero.')) return;
    try {
      await startNewWeek(students);
      setWeekMsg('New week started! Publish the Honor Roll to show the fresh boards.');
    } catch (e: any) {
      setWeekMsg(e?.message || 'Could not start a new week.');
    }
  };

  const card = 'bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-3';
  const input = 'bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:border-amber-400 focus:outline-none';
  const btn = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer';

  const goal = gameSettings.classGoal;
  const goalNow = goal ? Math.max(0, classTotal(goal.metric) - goal.baseline) : 0;

  return (
    <div className="space-y-4 animate-fadeIn">
      {savedMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {savedMsg}
        </div>
      )}

      <div className={card}>
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><Target className="w-4 h-4 text-indigo-300" /> Class Goal</h3>
        {goal ? (
          <div className="text-xs text-slate-300 space-y-2">
            <p>
              <strong>{goal.title}</strong> — {goal.target.toLocaleString()} {GOAL_METRIC_LABELS[goal.metric]}, reward +{goal.rewardCoins} coins each.
            </p>
            <p className="font-mono text-slate-400">
              Right now (from your roster): {goalNow.toLocaleString()} / {goal.target.toLocaleString()}. Students see this after you publish the Honor Roll.
            </p>
            <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer" onClick={() => { updateGameSettings({ classGoal: null }); flash('Class goal cleared.'); }}>
              End / Clear Goal
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400">Set one goal the whole school chases together. Refresh your roster first so the starting total is accurate.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input className={input} value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Goal name, e.g. Road to Revolution" />
              <select className={input} value={goalMetric} onChange={(e) => setGoalMetric(e.target.value as ClassGoal['metric'])}>
                <option value="questions">Total questions answered</option>
                <option value="correct">Total correct answers</option>
                <option value="cards">Total unique cards collected</option>
              </select>
              <input className={input} type="number" min={1} value={goalTarget} onChange={(e) => setGoalTarget(Number(e.target.value))} placeholder="Target" />
              <select className={input} value={goalReward} onChange={(e) => setGoalReward(Number(e.target.value))}>
                <option value={50}>Reward: +50 coins each</option>
                <option value={100}>Reward: +100 coins each</option>
              </select>
            </div>
            <button type="button" className={btn} onClick={startGoal} disabled={!goalTitle.trim() || goalTarget <= 0}>Start Goal</button>
          </>
        )}
      </div>

      <div className={card}>
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Unit Focus &amp; Review Bonus</h3>
        <p className="text-xs text-slate-400">Boost the coins for correct answers in the unit you're teaching, and pay a small bonus for clearing missed questions in Review.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select className={input} value={gameSettings.focusUnitId || ''} onChange={(e) => updateGameSettings({ focusUnitId: e.target.value })}>
            <option value="">No focus unit</option>
            {INITIAL_UNITS.map(u => <option key={u.unitId} value={u.unitId}>{u.unitName}</option>)}
          </select>
          <select className={input} value={gameSettings.focusCorrectReward ?? 15} onChange={(e) => updateGameSettings({ focusCorrectReward: Number(e.target.value) })}>
            <option value={15}>Focus answers pay +15</option>
            <option value={20}>Focus answers pay +20</option>
          </select>
          <select className={input} value={gameSettings.reviewCoinReward ?? 3} onChange={(e) => updateGameSettings({ reviewCoinReward: Number(e.target.value) })}>
            <option value={0}>Review bonus: off</option>
            <option value={3}>Review bonus: +3</option>
          </select>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><CalendarClock className="w-4 h-4 text-rose-300" /> Upcoming Test Reminder</h3>
        <p className="text-xs text-slate-400">Shows on every student's dashboard for the 3 weeks before the date, with a shortcut to their review questions. Clear both fields and save to remove it.</p>
        <div className="flex gap-2 flex-wrap">
          <input className={`${input} flex-1 min-w-[180px]`} value={testLabel} onChange={(e) => setTestLabel(e.target.value)} placeholder="Unit 3 Test" />
          <input className={input} type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
          <button type="button" className={btn} onClick={saveTest}>Save</button>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-amber-400" /> Weekly Competition</h3>
        <p className="text-xs text-slate-400">
          Starting a new week records everyone's current totals; the weekly boards then show only what each student gains from here. Do this on Monday, then publish the Honor Roll each day or two.
        </p>
        <button type="button" className={btn} onClick={handleNewWeek}>Start New Week</button>
        {weekMsg && <p className="text-xs text-emerald-300">{weekMsg}</p>}
      </div>
    </div>
  );
};
