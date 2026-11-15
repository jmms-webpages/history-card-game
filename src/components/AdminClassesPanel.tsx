import React, { useEffect, useMemo, useState } from 'react';
import { Users, Plus, Trash2, KeyRound, RefreshCw, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { isFirebaseConfigured, db, doc, updateDoc } from '../firebase/config';
import { useQuestions } from '../context/QuestionsContext';
import { ClassInfo, UserProfile } from '../types';
import { INITIAL_UNITS } from '../data/initialCurriculum';
import { accuracyOf, masteryTone, overallMasteryPct, unitMasteryPct } from '../utils/adminStats';
import {
  ClassKeys,
  classLabel,
  generateClassPassword,
  hashClassPassword,
  makeClassCode,
  saveClassKeys,
  loadClassKeys
} from '../utils/classes';

interface Props {
  students: UserProfile[];
  loading: boolean;
  onRefresh: () => void;
  onFullReload: () => void;
  promotingUid: string | null;
  onRename: (s: UserProfile) => void;
  onRemove: (s: UserProfile) => void;
  onPromote: (s: UserProfile) => void;
  onStudentMoved: (uid: string, classCode: string) => void;
}

type MasteryView = 'school' | 'teacher' | 'class';

export const AdminClassesPanel: React.FC<Props> = ({ students, loading, onRefresh, onFullReload, promotingUid, onRename, onRemove, onPromote, onStudentMoved }) => {
  const { gameSettings, updateGameSettings } = useQuestions();
  const classes: ClassInfo[] = gameSettings.classes || [];

  const [keys, setKeys] = useState<ClassKeys>({ hashes: {}, passwords: {} });
  const [keysLoaded, setKeysLoaded] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [teacher, setTeacher] = useState('');
  const [periodsText, setPeriodsText] = useState('1, 2, 3, 4, 5, 6');
  const [studentSearch, setStudentSearch] = useState('');
  const [openClass, setOpenClass] = useState<string | null>(null);
  const [view, setView] = useState<MasteryView>('teacher');
  const [showAdd, setShowAdd] = useState(false);

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

  const handleMove = async (student: UserProfile, target: string) => {
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

  const codeOf = (s: UserProfile) => (s.classroomCode || '').trim().toUpperCase();
  const known = new Set(classes.map(c => c.code));
  const inClass = (code: string) => students.filter(s => codeOf(s) === code);
  const unassigned = students.filter(s => !known.has(codeOf(s)));
  const assigned = students.filter(s => known.has(codeOf(s)));
  const q = studentSearch.trim().toLowerCase();
  const visible = (list: UserProfile[]) =>
    (q ? list.filter(s => s.displayName.toLowerCase().includes(q)) : list).slice().sort((a, b) => a.displayName.localeCompare(b.displayName));

  // Rows for the mastery table: school, each teacher, or each class.
  const teacherNames = Object.keys(grouped);
  const masteryRows: { label: string; list: UserProfile[] }[] =
    view === 'school'
      ? [{ label: 'All teachers', list: assigned }]
      : view === 'teacher'
      ? [
          { label: 'All teachers', list: assigned },
          ...teacherNames.map(t => ({ label: t, list: assigned.filter(s => grouped[t].some(c => c.code === codeOf(s))) }))
        ]
      : classes.map(c => ({ label: `${c.teacher} — ${c.name}`, list: inClass(c.code) }));

  const card = 'bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-3';
  const input = 'bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:border-amber-400 focus:outline-none';
  const btn = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer';
  const smallBtn = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 cursor-pointer';

  const accText = (list: UserProfile[]) => {
    const a = accuracyOf(list);
    return a.pct === null ? '—' : `${a.pct}%`;
  };

  const StudentRow: React.FC<{ s: UserProfile }> = ({ s }) => {
    const a = accuracyOf([s]);
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-[11px]">
        <div className="min-w-0 flex items-center gap-3">
          <span className="font-bold text-slate-100 text-xs">{s.displayName}</span>
          <span className="font-mono text-slate-400">
            {a.pct === null ? 'no answers yet' : `${a.pct}% accuracy (${a.questions})`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            className={`${input} !py-1 !text-[11px]`}
            value=""
            onChange={(e) => handleMove(s, e.target.value)}
          >
            <option value="">Move to...</option>
            {classes.filter(c => c.code !== codeOf(s)).map(c => (
              <option key={c.code} value={c.code}>{c.teacher} — {c.name}</option>
            ))}
          </select>
          <button type="button" className={smallBtn} onClick={() => onRename(s)}>Rename</button>
          <button type="button" className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 cursor-pointer" onClick={() => onRemove(s)}>Remove</button>
          <button
            type="button"
            disabled={promotingUid === s.uid}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 cursor-pointer disabled:opacity-50"
            onClick={() => onPromote(s)}
          >
            {promotingUid === s.uid ? 'Promoting...' : 'Promote Admin'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {msg && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs font-bold">{msg}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow">
        <div className="flex items-center gap-2 flex-1 w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input className={`${input} w-full`} value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search students..." />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">{students.length} students</span>
          <button type="button" onClick={onRefresh} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Roster</span>
          </button>
          <button
            type="button"
            onClick={() => { if (window.confirm(`Re-read every student profile (about ${students.length || 500} reads)? Only needed to catch removed students.`)) onFullReload(); }}
            disabled={loading}
            className="text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            Full reload
          </button>
        </div>
      </div>

      {/* Average mastery: school vs teacher vs class */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-slate-100 text-sm">Average Mastery by Unit</h3>
          <div className="flex rounded-xl overflow-hidden border border-slate-800 text-[11px] font-bold">
            {([['school', 'All Teachers'], ['teacher', 'By Teacher'], ['class', 'By Class']] as [MasteryView, string][]).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`px-3 py-1.5 cursor-pointer ${view === id ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-300 hover:bg-slate-800'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400">Average of each student's mastery. Red means reteach. Students without a class aren't counted.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="text-slate-500 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-1.5 pr-3">&nbsp;</th>
                <th className="py-1.5 px-2 text-center">Students</th>
                {INITIAL_UNITS.map((u, i) => (
                  <th key={u.unitId} className="py-1.5 px-2 text-center" title={u.unitName}>U{i + 1}</th>
                ))}
                <th className="py-1.5 px-2 text-center">Overall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {masteryRows.map(r => (
                <tr key={r.label}>
                  <td className="py-1.5 pr-3 font-bold text-slate-200 whitespace-nowrap">{r.label}</td>
                  <td className="py-1.5 px-2 text-center text-slate-400 font-mono">{r.list.length}</td>
                  {INITIAL_UNITS.map(u => {
                    const pct = unitMasteryPct(r.list, u.unitId);
                    return (
                      <td key={u.unitId} className="py-1 px-1 text-center">
                        <span className={`inline-block min-w-[2.6rem] rounded-md px-1.5 py-0.5 font-mono font-bold ${r.list.length ? masteryTone(pct) : 'text-slate-600'}`}>
                          {r.list.length ? `${pct}%` : '—'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-1 px-2 text-center">
                    <span className={`inline-block min-w-[2.6rem] rounded-md px-1.5 py-0.5 font-mono font-bold ${r.list.length ? masteryTone(overallMasteryPct(r.list)) : 'text-slate-600'}`}>
                      {r.list.length ? `${overallMasteryPct(r.list)}%` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
              {masteryRows.length === 0 && (
                <tr><td colSpan={INITIAL_UNITS.length + 3} className="py-4 text-center text-slate-500">Add classes below to see this.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {unassigned.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-5 shadow space-y-1">
          <h3 className="font-bold text-amber-200 text-sm">No class yet ({unassigned.length})</h3>
          <p className="text-xs text-slate-400 mb-1">These students can't get past setup until they join a class. You can place them directly.</p>
          <div className="divide-y divide-slate-800/60">
            {visible(unassigned).map(s => <StudentRow key={s.uid} s={s} />)}
            {visible(unassigned).length === 0 && <p className="text-xs text-slate-500 py-1">No matches.</p>}
          </div>
        </div>
      )}

      <div className={card}>
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2"><Users className="w-4 h-4 text-indigo-300" /> Classes &amp; Students ({classes.length} classes)</h3>
        {!keysLoaded && classes.length > 0 && <p className="text-xs text-slate-500">Loading passwords...</p>}
        {classes.length === 0 && <p className="text-xs text-slate-500">No classes yet. Add some below.</p>}
        {Object.entries(grouped).map(([teacherName, list]) => {
          const teacherStudents = list.flatMap(c => inClass(c.code));
          const ta = accuracyOf(teacherStudents);
          return (
            <div key={teacherName}>
              <p className="text-[11px] uppercase tracking-wider font-mono text-slate-500 mb-1.5">
                {teacherName} · {teacherStudents.length} students · {accText(teacherStudents)} accuracy · {ta.questions.toLocaleString()} questions
              </p>
              <div className="space-y-1.5">
                {list.map(cls => {
                  const members = inClass(cls.code);
                  const ca = accuracyOf(members);
                  const open = openClass === cls.code || (q !== '' && visible(members).length > 0);
                  return (
                    <div key={cls.code} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button type="button" onClick={() => setOpenClass(openClass === cls.code ? null : cls.code)} className="min-w-0 text-left cursor-pointer flex flex-wrap items-center gap-x-3 gap-y-0.5" title="Show students">
                          {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                          <span className="font-bold text-slate-100">{cls.name}</span>
                          <span className="text-slate-500">{members.length} students</span>
                          <span className="text-slate-400 font-mono">{accText(members)} accuracy</span>
                          <span className="text-slate-400 font-mono">{ca.questions.toLocaleString()} questions</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-300 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1" title="Join password">
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
                      {open && (
                        <div className="mt-2 pt-2 border-t border-slate-800 divide-y divide-slate-800/50">
                          {visible(members).map(s => <StudentRow key={s.uid} s={s} />)}
                          {members.length === 0 && <p className="text-[11px] text-slate-500 py-1">No students in this class yet.</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className={card}>
        <button type="button" onClick={() => setShowAdd(v => !v)} className="font-bold text-slate-100 text-sm flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4 text-amber-400" /> Add Classes {showAdd ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        {showAdd && (
          <>
            <p className="text-xs text-slate-400">
              Enter a teacher name and that teacher's periods, separated by commas. Each class gets a random join password you can change above.
            </p>
            <div className="flex flex-wrap gap-2">
              <input className={`${input} w-40`} value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Teacher (e.g. Jorden)" />
              <input className={`${input} flex-1 min-w-[200px] font-mono`} value={periodsText} onChange={(e) => setPeriodsText(e.target.value)} placeholder="1, 2, 3, 4, 5, 6" />
              <button type="button" className={btn} onClick={handleAdd} disabled={!teacher.trim()}>Add Classes</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
