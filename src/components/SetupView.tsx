import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuestions } from '../context/QuestionsContext';
import { HISTORICAL_AVATARS } from '../data/avatars';
import { isUnassignedClass } from '../utils/classes';
import { BadgeCheck } from 'lucide-react';

const NAME_OK = /^[A-Za-z][A-Za-z'.\-]*(\s+[A-Za-z][A-Za-z'.\-]*)+$/;

/** First-time setup, shown before the dashboard: avatar, real name, class + password. */
export const SetupView: React.FC = () => {
  const { userProfile, joinClass, completeSetup, logout } = useAuth();
  const { gameSettings } = useQuestions();
  const classes = gameSettings.classes || [];
  const needsClass = classes.length > 0 && isUnassignedClass(userProfile?.classroomCode);
  const needsName = !userProfile?.nameSet;

  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [avatar, setAvatar] = useState(userProfile?.avatar || 'franklin');
  const [classCode, setClassCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const teachers = Array.from(new Set(classes.map(c => c.teacher)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const fullName = `${first.trim()} ${last.trim()}`.replace(/\s+/g, ' ');
    if (needsName && !NAME_OK.test(fullName)) {
      setError('Enter your real first and last name (letters only).');
      return;
    }
    setBusy(true);
    try {
      // Join first: a wrong password is the most likely failure and should stop here.
      if (needsClass) await joinClass(classCode, password);
      await completeSetup(needsName ? fullName : userProfile!.displayName, avatar);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-black font-serif text-amber-400">Welcome to History Card Quest</h1>
          <p className="text-sm text-slate-400 mt-1">
            {needsName ? 'Set up your scholar before you start.' : 'Your teacher asked you to update your name.'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Pick your persona</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {HISTORICAL_AVATARS.map(a => {
              const selected = avatar === a.id;
              return (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setAvatar(a.id)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                    selected ? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/40' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg ${a.color} flex items-center justify-center text-lg shrink-0`}>{a.badge}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-100 truncate">{a.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{a.title}</div>
                  </div>
                  {selected && <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {needsName && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Your real name</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className={input} required value={first} onChange={e => setFirst(e.target.value)} placeholder="First name" autoComplete="off" maxLength={20} />
              <input className={input} required value={last} onChange={e => setLast(e.target.value)} placeholder="Last name" autoComplete="off" maxLength={20} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Use your real name. Your teacher can see it, and you can't change it later.</p>
          </div>
        )}

        {needsClass && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Your class</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select className={input} required value={classCode} onChange={e => setClassCode(e.target.value)}>
                <option value="">Choose your class...</option>
                {teachers.map(t => (
                  <optgroup key={t} label={t}>
                    {classes.filter(c => c.teacher === t).map(c => (
                      <option key={c.code} value={c.code}>{c.teacher} — {c.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input className={input} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Class password" autoComplete="off" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Your teacher gives you the password. You can only join once.</p>
          </div>
        )}

        {error && <p className="text-xs text-rose-300">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            disabled={busy}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm disabled:opacity-60 cursor-pointer"
          >
            {busy ? 'Saving...' : 'Start Playing'}
          </button>
          <button type="button" onClick={logout} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">
            Sign out
          </button>
        </div>
      </form>
    </div>
  );
};
