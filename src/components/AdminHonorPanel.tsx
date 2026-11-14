import React, { useState } from 'react';
import { Award, Target, Flame, CheckCircle2, RefreshCw } from 'lucide-react';
import { useQuestions } from '../context/QuestionsContext';
import { UserProfile, ClassGoal } from '../types';
import { startNewWeek } from '../utils/publishSnapshot';
import { GOAL_METRIC_LABELS } from '../utils/snapshot';

interface Props {
  students: UserProfile[];
  busy: boolean;
  lastPublished: string | null;
  onRefreshAndPublish: () => Promise<UserProfile[] | void>;
}

// One place for everything that students only see after you publish:
// the Honor Roll, the class goal and the weekly competition.
export const AdminHonorPanel: React.FC<Props> = ({ students, busy, lastPublished, onRefreshAndPublish }) => {
  const { gameSettings, updateGameSettings } = useQuestions();

  const [goalTitle, setGoalTitle] = useState('');
  const [goalMetric, setGoalMetric] = useState<ClassGoal['metric']>('questions');
  const [goalTarget, setGoalTarget] = useState(5000);
  const [goalReward, setGoalReward] = useState(100);
  const [msg, setMsg] = useState<string | null>(null);

  const flash = (t: string) => {
    setMsg(t);
    setTimeout(() => setMsg(null), 4000);
  };

  const classTotal = (metric: ClassGoal['metric'], list: UserProfile[] = students) =>
    list.reduce(
      (sum, s) =>
        sum +
        (metric === 'questions'
          ? s.totalQuestionsAnsweredLifetime || 0
          : metric === 'correct'
          ? s.totalCorrectAnswersLifetime || 0
          : s.uniqueCardsCollected || 0),
      0
    );

  const goal = gameSettings.classGoal;
  const goalNow = goal ? Math.max(0, classTotal(goal.metric) - goal.baseline) : 0;

  const startGoal = () => {
    if (!goalTitle.trim() || goalTarget <= 0) return;
    updateGameSettings({
      classGoal: {
        goalId: `goal-${Date.now()}`,
        title: goalTitle.trim(),
        metric: goalMetric,
        target: Math.round(goalTarget),
        baseline: classTotal(goalMetric),
        rewardCoins: goalReward,
        startedAt: new Date().toISOString()
      }
    });
    setGoalTitle('');
    flash('Class goal started. Publish to show it to students.');
  };

  const handleNewWeek = async () => {
    if (students.length === 0) {
      flash('No students loaded yet. Click Refresh & Publish first.');
      return;
    }
    if (!window.confirm("Start a new weekly competition? Everyone's weekly totals reset to zero.")) return;
    try {
      await startNewWeek(students);
      flash('New week started. Publishing now so students see the fresh boards.');
      await onRefreshAndPublish();
    } catch (e: any) {
      flash(e?.message || 'Could not start a new week.');
    }
  };

  const card = 'bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-3';
  const input = 'bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:border-amber-400 focus:outline-none';
  const btn = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer disabled:opacity-50';

  return (
    <div className="space-y-4 animate-fadeIn">
      {msg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}

      <div className={card}>
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><Award className="w-4 h-4 text-amber-400" /> Publish Honor Roll</h3>
        <p className="text-xs text-slate-400">
          Students only see rankings, class and teacher standings, weekly boards and goal progress after you publish.
          This loads every student's latest numbers first, then publishes them.
        </p>
        <button type="button" className={`${btn} flex items-center gap-1.5`} onClick={() => onRefreshAndPublish()} disabled={busy}>
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          <span>{busy ? 'Working...' : 'Refresh & Publish'}</span>
        </button>
        <p className="text-[11px] text-slate-500">
          {lastPublished ? <>Last published this session: <span className="font-mono text-slate-300">{lastPublished}</span></> : 'Not published yet this session.'}
          {' '}· {students.length} students loaded
        </p>
      </div>

      <div className={card}>
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><Target className="w-4 h-4 text-indigo-300" /> Class Goal</h3>
        {goal ? (
          <div className="text-xs text-slate-300 space-y-2">
            <p>
              <strong>{goal.title}</strong> — {goal.target.toLocaleString()} {GOAL_METRIC_LABELS[goal.metric]}, reward +{goal.rewardCoins} coins each.
            </p>
            <p className="font-mono text-slate-400">
              Latest loaded numbers: {goalNow.toLocaleString()} / {goal.target.toLocaleString()}. Students see this after you publish.
            </p>
            <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer" onClick={() => { updateGameSettings({ classGoal: null }); flash('Class goal cleared.'); }}>
              End / Clear Goal
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400">Set one goal the whole school chases together. Click Refresh &amp; Publish first so the starting total is accurate.</p>
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
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-amber-400" /> Weekly Competition</h3>
        <p className="text-xs text-slate-400">
          Starting a new week records everyone's current totals; the weekly boards then show only what each student gains from here. Do this on Monday, then publish each day or two.
        </p>
        <button type="button" className={btn} onClick={handleNewWeek} disabled={busy}>Start New Week</button>
      </div>
    </div>
  );
};
