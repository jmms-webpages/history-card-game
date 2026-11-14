import React, { useEffect, useMemo, useState } from 'react';
import { Users, Plus, Trash2, KeyRound, RefreshCw, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { isFirebaseConfigured, db, doc, updateDoc } from '../firebase/config';
import { useQuestions } from '../context/QuestionsContext';
import { ClassInfo, UserProfile } from '../types';
import {
  ClassKeys,
  classLabel,
  generateClassPassword,
  hashClassPassword,
  isUnassignedClass,
  loadClassKeys,
  makeClassCode,
  saveClassKeys
} from '../utils/classes';

interface Props {
  students: UserProfile[];
  onStudentMoved: (uid: string, classCode: string) => void;
}

export const AdminClassesPanel: React.FC<Props> = ({ students, onStudentMoved }) => {
  const { gameSettings, updateGameSettings } = useQuestions();
  const classes: ClassInfo[] = gameSettings.classes || [];

  const [keys, setKeys] = useState<ClassKeys>({ hashes: {}, passwords: {} });
  const [keysLoaded, setKeysLoaded] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [teacher, setTeacher] = useState('');
  const [periodsText, setPeriodsText] = useState('1, 2, 3, 4, 5, 6');
  const [studentSearch, setStudentSearch] = useState('');
  const [openClass, setOpenClass] = useState<string | null>(null);
  const [moveTargets, setMoveTargets] = useState<Record<string, string>>({});

  // One read of the teacher-only passwords doc when this tab opens.
  useEffect(() => {
    let cancelled = false;
    loadClassKeys()
      .then(k => { if (!cancelled) { setKeys(k); setKeysLoaded(true); } })
      .catch(e => { if (!cancelled) setMsg(e?.message || 'Could not load class passwords.'); });
    return () => { cancelled = true; };
  }, []);

  const flash = (t: string) => {
    setMsg(t);
    setTimeout(() => setMsg(null), 4000);
  };

  const studentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(s => {
      const code = (s.classroomCode || '').trim().toUpperCase();
      counts[code] = (counts[code] || 0) + 1;
    });
    return counts;
  }, [students]);

  const grouped = useMemo(() => {
    const map: Record<string, ClassInfo[]> = {};
    classes.forEach(c => { (map[c.teacher] = map[c.teacher] || []).push(c); });
    return map;
  }, [classes]);

  const persist = async (nextClasses: ClassInfo[], nextKeys: ClassKeys) => {
    // Passwords first: a class should never exist without its password.
    await saveClassKeys(nextKeys);
    updateGameSettings({ classes: nextClasses });
    setKeys(nextKeys);
  };

  const handleAdd = async () => {
    const teacherName = teacher.trim();
    const periods = Array.from(new Set(periodsText.split(',').map(p => p.trim()).filter(Boolean)));
    if (!teacherName || periods.length === 0) return;
    try {
      const nextClasses = [...classes];
      const nextKeys: ClassKeys = { hashes: { ...keys.hashes }, passwords: { ...keys.passwords } };
      let added = 0;
      for (const p of periods) {
        const name = /^\d+$/.test(p) ? `Period ${p}` : p;
        const code = makeClassCode(teacherName, p);
        if (nextClasses.some(c => c.code === code)) continue;
        const password = generateClassPassword();
        nextClasses.push({ code, teacher: teacherName, name });
        nextKeys.passwords[code] = password;
        nextKeys.hashes[code] = await hashClassPassword(code, password);
        added += 1;
      }
      if (added === 0) {
        flash('Those classes already exist.');
        return;
      }
      await persist(nextClasses, nextKeys);
      setTeacher('');
      flash(`Added ${added} class${added === 1 ? '' : 'es'} with auto-generated passwords.`);
    } catch (e: any) {
      flash(e?.message || 'Could not add classes.');
    }
  };

  const handleNewPassword = async (cls: ClassInfo) => {
    const entered = window.prompt(`New password for ${cls.teacher} — ${cls.name}?\n(Leave blank for a random one.)`, '');
    if (entered === null) return;
    const password = entered.trim() || generateClassPassword();
    try {
      const nextKeys: ClassKeys = {
        hashes: { ...keys.hashes, [cls.code]: await hashClassPassword(cls.code, password) },
        passwords: { ...keys.passwords, [cls.code]: password.toLowerCase() }
      };
      await saveClassKeys(nextKeys);
      setKeys(nextKeys);
      flash('Password updated. Students already in the class are not affected.');
    } catch (e: any) {
      flash(e?.message || 'Could not update the password.');
    }
  };

  const handleDelete = async (cls: ClassInfo) => {
    const n = studentCounts[cls.code] || 0;
    if (!window.confirm(`Delete ${cls.teacher} — ${cls.name}?${n ? `\n\n${n} students are in it. They will show as having no class until you move them.` : ''}`)) return;
    try {
      const nextKeys: ClassKeys = { hashes: { ...keys.hashes }, passwords: { ...keys.passwords } };
      delete nextKeys.hashes[cls.code];
      delete nextKeys.passwords[cls.code];
      await persist(classes.filter(c => c.code !== cls.code), nextKeys);
    } catch (e: any) {
      flash(e?.message || 'Could not delete the class.');
    }
  };

  const handleMove = async (student: UserProfile) => {
    const target = moveTargets[student.uid];
    if (!target || !isFirebaseConfigured || !db || !doc || !updateDoc) return;
    try {
      // Admin writes skip the password check (see firestore.rules).
      await updateDoc(doc(db, 'users', student.uid), { classroomCode: target });
      onStudentMoved(student.uid, target);
      flash(`${student.displayName} moved to ${classLabel(classes, target)}.`);
    } catch (e: any) {
      flash(e?.message || 'Could not move that student.');
    }
  };

  const matches = students
    .filter(s => {
      const q = studentSearch.trim().toLowerCase();
      if (q) return s.displayName.toLowerCase().includes(q);
      return isUnassignedClass(s.classroomCode);
    })
    .slice(0, 25);

  const card = 'bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-3';
  const input = 'bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:border-amber-400 focus:outline-none';
  const btn = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer';

  return (
    <div className="space-y-4 animate-fadeIn">
      {msg && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs font-bold">{msg}</div>}

      <div className={card}>
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><Plus className="w-4 h-4 text-amber-400" /> Add Classes</h3>
        <p className="text-xs text-slate-400">
          Enter a teacher name and that teacher's periods, separated by commas. Each class gets a random join password you can change below.
          Every teacher can add their own, or one person can add all three.
        </p>
        <div className="flex flex-wrap gap-2">
          <input className={`${input} w-40`} value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Teacher (e.g. Jorden)" />
          <input className={`${input} flex-1 min-w-[200px] font-mono`} value={periodsText} onChange={(e) => setPeriodsText(e.target.value)} placeholder="1, 2, 3, 4, 5, 6" />
          <button type="button" className={btn} onClick={handleAdd} disabled={!teacher.trim()}>Add Classes</button>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><Users className="w-4 h-4 text-indigo-300" /> Your Classes ({classes.length})</h3>
        {!keysLoaded && <p className="text-xs text-slate-500">Loading passwords...</p>}
        {classes.length === 0 && <p className="text-xs text-slate-500">No classes yet. Add some above.</p>}
        {Object.entries(grouped).map(([teacherName, list]) => (
          <div key={teacherName}>
            <p className="text-[11px] uppercase tracking-wider font-mono text-slate-500 mb-1.5">{teacherName}</p>
            <div className="space-y-1.5">
              {list.map(cls => (
                <div key={cls.code} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button type="button" onClick={() => setOpenClass(openClass === cls.code ? null : cls.code)} className="min-w-0 text-left cursor-pointer flex items-center gap-1.5" title="Show students">
                    {openClass === cls.code ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    <span className="font-bold text-slate-100">{cls.name}</span>
                    <span className="ml-2 font-mono text-slate-500">{cls.code}</span>
                    <span className="ml-2 text-slate-500">{studentCounts[cls.code] || 0} students</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-300 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                      {keys.passwords[cls.code] || '—'}
                    </span>
                    <button type="button" onClick={() => handleNewPassword(cls)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer" title="Change password">
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDelete(cls)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-300 cursor-pointer" title="Delete class">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {openClass === cls.code && (
                  <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                    {students
                      .filter(s => (s.classroomCode || '').trim().toUpperCase() === cls.code)
                      .sort((a, b) => a.displayName.localeCompare(b.displayName))
                      .map(s => (
                        <div key={s.uid} className="flex items-center justify-between text-[11px] text-slate-300">
                          <span>{s.displayName}</span>
                          <span className="font-mono text-slate-500">{s.uniqueCardsCollected ?? 0} cards · {s.coins ?? 0} coins</span>
                        </div>
                      ))}
                    {(studentCounts[cls.code] || 0) === 0 && <p className="text-[11px] text-slate-500">No students in this class yet.</p>}
                  </div>
                )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={card}>
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4 text-emerald-400" /> Move Students Between Classes</h3>
        <p className="text-xs text-slate-400">
          Students can't change class themselves. Showing students with no class yet; search by name to find anyone else.
          Uses your loaded roster (refresh it on the Students tab for newer sign-ups).
        </p>
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input className={`${input} flex-1 max-w-xs`} value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search students..." />
        </div>
        {matches.length === 0 ? (
          <p className="text-xs text-slate-500">{studentSearch ? 'No matching students.' : 'Everyone loaded has a class.'}</p>
        ) : (
          <div className="space-y-1.5">
            {matches.map(s => (
              <div key={s.uid} className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <div className="min-w-0">
                  <span className="font-bold text-slate-100">{s.displayName}</span>
                  <span className="ml-2 text-slate-500">{classLabel(classes, s.classroomCode)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select className={input} value={moveTargets[s.uid] || ''} onChange={(e) => setMoveTargets(prev => ({ ...prev, [s.uid]: e.target.value }))}>
                    <option value="">Move to...</option>
                    {classes.map(c => <option key={c.code} value={c.code}>{c.teacher} — {c.name}</option>)}
                  </select>
                  <button type="button" className={btn} disabled={!moveTargets[s.uid]} onClick={() => handleMove(s)}>Move</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
