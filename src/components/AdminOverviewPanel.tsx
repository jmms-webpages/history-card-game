import React, { useEffect, useState } from 'react';
import { CalendarDays, Calendar, Target, AlertTriangle, TrendingDown, RefreshCw, Award } from 'lucide-react';
import { useQuestions } from '../context/QuestionsContext';
import { UserProfile, AdminSubTab } from '../types';
import { INITIAL_UNITS } from '../data/initialCurriculum';
import { loadWeekBaseline, weeklyTotals, weekStatus, WeekBaseline } from '../utils/publishSnapshot';
import { accuracyColor, accuracyOf, masteryTone, todayTotals, unitMasteryPct } from '../utils/adminStats';
import { GOAL_METRIC_LABELS } from '../utils/snapshot';
import { isUnassignedClass } from '../utils/classes';

interface Props {
  students: UserProfile[];
  loading: boolean;
  publishing: boolean;
  lastPublished: string | null;
  onRefreshAndPublish: () => Promise<unknown>;
  onGo: (tab: AdminSubTab) => void;
}

const SplitBar: React.FC<{ right: number; wrong: number }> = ({ right, wrong }) => {
  const total = right + wrong;
  const pct = total > 0 ? Math.round((right / total) * 100) : 0;
  return (
    <div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-950 border border-slate-800">
        {total > 0 && (
          <>
            <div className="bg-emerald-500" style={{ width: `${(right / total) * 100}%` }} />
            <div className="bg-rose-500" style={{ width: `${(wrong / total) * 100}%` }} />
          </>
        )}
      </div>
      <div className="flex justify-between text-[11px] font-mono mt-1">
        <span className="text-emerald-300">{right.toLocaleString()} right</span>
        <span className={`font-bold ${total > 0 ? accuracyColor(pct) : 'text-slate-400'}`}>{total > 0 ? `${pct}%` : '—'}</span>
        <span className="text-rose-300">{wrong.toLocaleString()} wrong</span>
      </div>
    </div>
  );
};

export const AdminOverviewPanel: React.FC<Props> = ({ students, loading, publishing, lastPublished, onRefreshAndPublish, onGo }) => {
  const { gameSettings } = useQuestions();
  const [baseline, setBaseline] = useState<WeekBaseline | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadWeekBaseline().then(b => { if (!cancelled) setBaseline(b); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const today = todayTotals(students);
  const week = weeklyTotals(students, baseline);
  const status = weekStatus(baseline);
  const needsWeek = status.state === 'none' || status.state === 'due' || status.state === 'overdue';
  const goal = gameSettings.classGoal;
  const goalNow = goal
    ? Math.max(
        0,
        students.reduce(
          (sum, s) =>
            sum +
            (goal.metric === 'questions'
              ? s.totalQuestionsAnsweredLifetime || 0
              : goal.metric === 'correct'
              ? s.totalCorrectAnswersLifetime || 0
              : s.uniqueCardsCollected || 0),
          0
        ) - goal.baseline
      )
    : 0;
  const goalPct = goal && goal.target > 0 ? Math.min(100, Math.round((goalNow / goal.target) * 100)) : 0;

  const noClass = students.filter(s => isUnassignedClass(s.classroomCode) || !(gameSettings.classes || []).some(c => c.code === (s.classroomCode || '').trim().toUpperCase())).length;
  const weekAgo = Date.now() - 7 * 86400000;
  const inactive = students.filter(s => !s.lastLoginAt || new Date(s.lastLoginAt).getTime() < weekAgo);

  const unitRows = INITIAL_UNITS.map((u, i) => ({ label: `Unit ${i + 1}`, name: u.unitName, pct: unitMasteryPct(students, u.unitId) })).sort((a, b) => a.pct - b.pct);
  const schoolAcc = accuracyOf(students);

  const card = 'bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-3';
  const title = 'font-bold text-slate-100 text-sm flex items-center gap-2';

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
        <p className="text-xs text-slate-400">
          {students.length} students loaded
          {lastPublished ? <> · Honor Roll published <span className="font-mono text-slate-300">{lastPublished}</span></> : ' · Honor Roll not published this session'}
        </p>
        <button
          type="button"
          onClick={() => onRefreshAndPublish()}
          disabled={publishing || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${publishing || loading ? 'animate-spin' : ''}`} />
          <span>{publishing || loading ? 'Working...' : 'Refresh & Publish'}</span>
        </button>
      </div>

      {needsWeek && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 shadow">
          <p className="text-xs text-amber-200 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            {status.state === 'none' ? 'No weekly competition running. Start a new week to begin tracking weekly totals.' : `${status.label}. Start a new week to reset the weekly boards.`}
          </p>
          <button type="button" onClick={() => onGo('honor')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer">
            Go to Start New Week
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={card}>
          <h3 className={title}><CalendarDays className="w-4 h-4 text-emerald-400" /> Today</h3>
          <p className="text-3xl font-black text-slate-100 font-mono">{today.questions.toLocaleString()}<span className="text-xs text-slate-400 font-normal ml-2">questions</span></p>
          <SplitBar right={today.correct} wrong={today.wrong} />
          <p className="text-[11px] text-slate-500">{today.activeStudents} of {students.length} students answered today</p>
        </div>

        <div className={card}>
          <h3 className={title}><Calendar className="w-4 h-4 text-sky-400" /> This Week</h3>
          {!week ? (
            <p className="text-xs text-slate-400">No week started yet. Start one on the Honor Roll &amp; Goals tab.</p>
          ) : week.questions === null ? (
            <>
              <p className="text-3xl font-black text-slate-100 font-mono">{week.correct.toLocaleString()}<span className="text-xs text-slate-400 font-normal ml-2">correct answers</span></p>
              <p className="text-[11px] text-slate-500">Start a new week to also track total questions and wrong answers.</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-black text-slate-100 font-mono">{week.questions.toLocaleString()}<span className="text-xs text-slate-400 font-normal ml-2">questions</span></p>
              <SplitBar right={week.correct} wrong={Math.max(0, week.questions - week.correct)} />
              <p className="text-[11px] text-slate-500">Since {new Date(week.startedAt).toLocaleDateString()} · {status.label}</p>
            </>
          )}
        </div>

        <div className={card}>
          <h3 className={title}><Target className="w-4 h-4 text-indigo-300" /> Class Goal</h3>
          {goal ? (
            <>
              <p className="text-xs text-slate-300"><strong>{goal.title}</strong></p>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full" style={{ width: `${goalPct}%` }} />
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                {goalNow.toLocaleString()} / {goal.target.toLocaleString()} {GOAL_METRIC_LABELS[goal.metric]} ({goalPct}%)
              </p>
              <p className="text-[11px] text-slate-500">Students see this after you publish.</p>
            </>
          ) : (
            <p className="text-xs text-slate-400">
              No goal set. <button type="button" className="text-amber-400 hover:text-amber-300 cursor-pointer" onClick={() => onGo('honor')}>Set one</button>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={card}>
          <h3 className={title}><AlertTriangle className="w-4 h-4 text-amber-400" /> Needs Attention</h3>
          <ul className="text-xs text-slate-300 space-y-2">
            <li className="flex items-center justify-between gap-3">
              <span>Haven't joined a class</span>
              <button type="button" onClick={() => onGo('classes')} className={`font-mono font-bold cursor-pointer ${noClass > 0 ? 'text-amber-300' : 'text-slate-500'}`}>{noClass}</button>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Haven't signed in for 7+ days</span>
              <span className={`font-mono font-bold ${inactive.length > 0 ? 'text-amber-300' : 'text-slate-500'}`}>{inactive.length}</span>
            </li>
            {inactive.length > 0 && (
              <li className="text-[11px] text-slate-500">
                {inactive.slice(0, 6).map(s => s.displayName).join(', ')}{inactive.length > 6 ? `, +${inactive.length - 6} more` : ''}
              </li>
            )}
            <li className="flex items-center justify-between gap-3">
              <span>School-wide accuracy</span>
              <span className={`font-mono font-bold ${accuracyColor(schoolAcc.pct)}`}>{schoolAcc.pct === null ? '—' : `${schoolAcc.pct}%`}</span>
            </li>
          </ul>
        </div>

        <div className={card}>
          <h3 className={title}><TrendingDown className="w-4 h-4 text-rose-300" /> Weakest Units (school-wide mastery)</h3>
          <div className="space-y-1.5">
            {unitRows.slice(0, 4).map(u => (
              <div key={u.label} className="flex items-center justify-between gap-3 text-xs" title={u.name}>
                <span className="text-slate-300 truncate">{u.label}: {u.name.replace(/^Unit \d+:?\s*/i, '')}</span>
                <span className={`font-mono font-bold rounded-md px-2 py-0.5 ${masteryTone(u.pct)}`}>{u.pct}%</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => onGo('classes')} className="text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1">
            <Award className="w-3 h-3" /> See every class
          </button>
        </div>
      </div>
    </div>
  );
};
