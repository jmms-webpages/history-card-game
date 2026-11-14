import React, { useState } from 'react';
import { Flame, Library, TrendingUp, Users } from 'lucide-react';
import { getAvatarById } from '../data/avatars';
import { Snapshot, WeeklyEntry } from '../utils/snapshot';
import { ClassGoalCard } from './EngagementBanners';
import { useQuestions } from '../context/QuestionsContext';
import { classLabel } from '../utils/classes';

type BoardView = 'week' | 'periods' | 'teachers';
type PeriodMetric = 'mastery' | 'binder' | 'classBinder';

const WeeklyList: React.FC<{
  title: string;
  unit: string;
  icon: React.ReactNode;
  rows: WeeklyEntry[];
  currentUid: string;
}> = ({ title, unit, icon, rows, currentUid }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
    <div className="p-4 border-b border-slate-800 flex items-center gap-2 text-sm font-bold text-slate-100">
      {icon}
      <span>{title}</span>
    </div>
    {rows.length === 0 ? (
      <p className="p-5 text-xs text-slate-500 text-center">No one on the board yet — be the first!</p>
    ) : (
      <ol className="divide-y divide-slate-800/60">
        {rows.map((row, i) => {
          const avatar = getAvatarById(row.avatar);
          const isMe = row.uid === currentUid;
          return (
            <li key={row.uid} className={`flex items-center gap-3 px-4 py-2.5 text-xs ${isMe ? 'bg-amber-500/10' : ''}`}>
              <span className="w-6 text-center font-mono font-bold text-slate-400">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
              <span className={`w-7 h-7 rounded-lg ${avatar.color} flex items-center justify-center text-sm shrink-0`}>{avatar.badge}</span>
              <span className="flex-1 font-bold text-slate-100 truncate">
                {row.displayName}
                {isMe && <span className="ml-1.5 text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1 rounded font-mono">YOU</span>}
              </span>
              <span className="font-mono font-bold text-amber-300">+{row.gain} <span className="text-slate-500 font-normal">{unit}</span></span>
            </li>
          );
        })}
      </ol>
    )}
  </div>
);

export const CompetitionBoards: React.FC<{ snapshot: Snapshot | null; currentUid: string; myPeriod: string }> = ({
  snapshot,
  currentUid,
  myPeriod
}) => {
  const { gameSettings } = useQuestions();
  const classes = gameSettings.classes || [];
  const [view, setView] = useState<BoardView>('week');
  const [metric, setMetric] = useState<PeriodMetric>('mastery');

  const periods = [...(snapshot?.periods || [])].sort((a, b) => {
    const key = metric === 'mastery' ? 'avgMasteryPct' : metric === 'binder' ? 'avgBinderPct' : 'classBinderPct';
    return (b as any)[key] - (a as any)[key];
  });
  const valueOf = (p: (typeof periods)[number]) =>
    metric === 'mastery' ? p.avgMasteryPct : metric === 'binder' ? p.avgBinderPct : p.classBinderPct;

  return (
    <div className="space-y-6">
      <ClassGoalCard snapshot={snapshot} />

      <div className="flex gap-2">
        {([['week', 'This Week'], ['periods', 'Classes'], ['teachers', 'Teacher Teams']] as [BoardView, string][]).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              view === id ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!snapshot && (
        <p className="text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
          Standings haven't been published yet. Check back soon!
        </p>
      )}

      {snapshot && view === 'week' && (
        <>
          <p className="text-xs text-slate-400">
            {snapshot.weekly.startedAt
              ? `Standings since ${new Date(snapshot.weekly.startedAt).toLocaleDateString()}. A fresh week means everyone starts even!`
              : 'The weekly competition starts soon.'}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <WeeklyList title="Most Correct Answers" unit="correct" icon={<Flame className="w-4 h-4 text-amber-400" />} rows={snapshot.weekly.correct} currentUid={currentUid} />
            <WeeklyList title="Most New Cards" unit="cards" icon={<Library className="w-4 h-4 text-indigo-400" />} rows={snapshot.weekly.newCards} currentUid={currentUid} />
            <WeeklyList title="Most Improved Mastery" unit="pts" icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} rows={snapshot.weekly.mastery} currentUid={currentUid} />
          </div>
        </>
      )}

      {snapshot && view === 'teachers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2 text-sm font-bold text-slate-100">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Teacher Team Standings</span>
          </div>
          <p className="px-4 pt-3 text-[11px] text-slate-500">Average mastery across every period a teacher has.</p>
          {(snapshot.teachers || []).length === 0 ? (
            <p className="p-5 text-xs text-slate-500 text-center">No team data yet.</p>
          ) : (
            <ol className="divide-y divide-slate-800/60 mt-2">
              {snapshot.teachers.map((t, i) => (
                <li key={t.teacher} className="px-4 py-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-mono font-bold text-slate-400">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <span className="flex-1 font-bold text-slate-100">
                      Team {t.teacher}
                      <span className="ml-2 text-slate-500 font-normal">{t.students} students</span>
                    </span>
                    <span className="font-mono font-bold text-amber-300">{t.avgMasteryPct}%</span>
                  </div>
                  <div className="mt-1.5 ml-9 bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full" style={{ width: `${Math.min(100, t.avgMasteryPct)}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {snapshot && view === 'periods' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Class Period Standings</span>
            </div>
            <div className="flex gap-1.5 text-[11px]">
              {([['mastery', 'Avg Mastery'], ['binder', 'Avg Binder'], ['classBinder', 'Class Binder']] as [PeriodMetric, string][]).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMetric(id)}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                    metric === id ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="px-4 pt-3 text-[11px] text-slate-500">
            Averages per student, so every period competes fairly no matter how big it is.
          </p>
          {periods.length === 0 ? (
            <p className="p-5 text-xs text-slate-500 text-center">No period data yet.</p>
          ) : (
            <ol className="divide-y divide-slate-800/60 mt-2">
              {periods.map((p, i) => {
                const isMine = p.code === myPeriod.trim().toUpperCase();
                return (
                  <li key={p.code} className={`px-4 py-3 text-xs ${isMine ? 'bg-amber-500/10' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-mono font-bold text-slate-400">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                      <span className="flex-1 font-bold text-slate-100">
                        {classLabel(classes, p.code)}
                        {isMine && <span className="ml-1.5 text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1 rounded font-mono">YOUR PERIOD</span>}
                        <span className="ml-2 text-slate-500 font-normal">{p.students} students</span>
                      </span>
                      <span className="font-mono font-bold text-amber-300">{valueOf(p)}%</span>
                    </div>
                    <div className="mt-1.5 ml-9 w-auto bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full" style={{ width: `${Math.min(100, valueOf(p))}%` }} />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
};
