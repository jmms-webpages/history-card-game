import React, { useState } from 'react';
import { Star, CalendarClock, CheckCircle2, Trash2 } from 'lucide-react';
import { useQuestions } from '../context/QuestionsContext';
import { INITIAL_UNITS } from '../data/initialCurriculum';
import { UpcomingTest } from '../types';
import { classLabel } from '../utils/classes';

// Teacher controls for focus units and class-specific test reminders.
// The class goal and weekly competition live on the Honor Roll tab.
export const AdminEngagementPanel: React.FC = () => {
  const { gameSettings, updateGameSettings } = useQuestions();
  const classes = gameSettings.classes || [];
  const teachers = Array.from(new Set(classes.map(c => c.teacher)));

  const [testLabel, setTestLabel] = useState('');
  const [testDate, setTestDate] = useState('');
  const [targetCodes, setTargetCodes] = useState<string[]>([]); // empty = all classes
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const flash = (t: string) => {
    setSavedMsg(t);
    setTimeout(() => setSavedMsg(null), 3000);
  };

  // The old single reminder still shows until you delete it here.
  const reminders: UpcomingTest[] = [
    ...(gameSettings.upcomingTests || []),
    ...(gameSettings.upcomingTest ? [{ ...gameSettings.upcomingTest, id: 'legacy' }] : [])
  ].sort((a, b) => a.date.localeCompare(b.date));

  const toggleCode = (code: string) =>
    setTargetCodes(prev => (prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]));

  const toggleTeacher = (teacher: string) => {
    const codes = classes.filter(c => c.teacher === teacher).map(c => c.code);
    const all = codes.every(c => targetCodes.includes(c));
    setTargetCodes(prev => (all ? prev.filter(c => !codes.includes(c)) : Array.from(new Set([...prev, ...codes]))));
  };

  const addReminder = () => {
    if (!testLabel.trim() || !testDate) return;
    const next: UpcomingTest = {
      id: `test-${Date.now()}`,
      label: testLabel.trim(),
      date: testDate,
      classCodes: targetCodes
    };
    updateGameSettings({ upcomingTests: [...(gameSettings.upcomingTests || []), next] });
    setTestLabel('');
    setTestDate('');
    setTargetCodes([]);
    flash('Reminder added.');
  };

  const removeReminder = (r: UpcomingTest) => {
    if (!window.confirm(`Remove the reminder "${r.label}"?`)) return;
    if (r.id === 'legacy') {
      updateGameSettings({ upcomingTest: null });
    } else {
      updateGameSettings({ upcomingTests: (gameSettings.upcomingTests || []).filter(t => t.id !== r.id) });
    }
    flash('Reminder removed.');
  };

  const card = 'bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-3';
  const input = 'bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:border-amber-400 focus:outline-none';
  const btn = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer disabled:opacity-50';

  return (
    <div className="space-y-4 animate-fadeIn">
      {savedMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {savedMsg}
        </div>
      )}

      <div className={card}>
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Unit Focus &amp; Review Bonus</h3>
        <p className="text-xs text-slate-400">Boost the coins for correct answers in the unit you're teaching (those questions show in gold), and pay a small bonus for clearing missed questions in Review.</p>
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
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><CalendarClock className="w-4 h-4 text-rose-300" /> Test Reminders</h3>
        <p className="text-xs text-slate-400">
          Each reminder shows on the dashboard of the classes you pick, for the 3 weeks before its date. Leave every class unchecked to send it to all classes.
        </p>

        {reminders.length > 0 && (
          <div className="space-y-1.5">
            {reminders.map(r => (
              <div key={r.id || `${r.label}-${r.date}`} className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <div className="min-w-0">
                  <span className="font-bold text-slate-100">{r.label}</span>
                  <span className="ml-2 font-mono text-slate-400">{r.date}</span>
                  <p className="text-[11px] text-slate-500 truncate">
                    {r.classCodes && r.classCodes.length > 0
                      ? r.classCodes.map(c => classLabel(classes, c)).join(', ')
                      : 'All classes'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeReminder(r)}
                  title="Remove reminder"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap pt-1">
          <input className={`${input} flex-1 min-w-[180px]`} value={testLabel} onChange={(e) => setTestLabel(e.target.value)} placeholder="Unit 3 Test" />
          <input className={input} type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
        </div>

        {classes.length > 0 && (
          <div className="space-y-2">
            {teachers.map(t => {
              const codes = classes.filter(c => c.teacher === t);
              const allOn = codes.every(c => targetCodes.includes(c.code));
              return (
                <div key={t} className="text-xs">
                  <label className="flex items-center gap-1.5 font-bold text-slate-200 cursor-pointer">
                    <input type="checkbox" checked={allOn} onChange={() => toggleTeacher(t)} />
                    <span>{t}</span>
                  </label>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 ml-5">
                    {codes.map(c => (
                      <label key={c.code} className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={targetCodes.includes(c.code)} onChange={() => toggleCode(c.code)} />
                        <span>{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button type="button" className={btn} onClick={addReminder} disabled={!testLabel.trim() || !testDate}>
          Add Reminder {targetCodes.length > 0 ? `(${targetCodes.length} class${targetCodes.length === 1 ? '' : 'es'})` : '(all classes)'}
        </button>
      </div>
    </div>
  );
};
