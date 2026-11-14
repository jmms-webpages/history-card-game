import React, { useState } from 'react';
import { Check, X, Inbox, RefreshCw } from 'lucide-react';
import { isFirebaseConfigured, db, doc, setDoc, collection, getDocs } from '../firebase/config';
import { useQuestions } from '../context/QuestionsContext';
import { INITIAL_UNITS, INITIAL_STANDARDS } from '../data/initialCurriculum';
import { QuestionSubmission, Approvals } from '../utils/submissions';

interface PendingItem extends QuestionSubmission {
  uid: string;
  authorName: string;
}

// Reads happen ONLY when you press "Load Submissions" (one read per student who
// has submitted, plus the matching decision docs) -- never automatically.
export const AdminSubmissionsPanel: React.FC = () => {
  const { addQuestion } = useQuestions();
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [decisions, setDecisions] = useState<Record<string, Approvals>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    if (!isFirebaseConfigured || !db || !collection || !getDocs) return;
    setLoading(true);
    try {
      const [subSnap, appSnap] = await Promise.all([
        getDocs(collection(db, 'submissions')),
        getDocs(collection(db, 'approvals'))
      ]);
      const map: Record<string, Approvals> = {};
      appSnap.docs.forEach((d: any) => {
        const data = d.data() || {};
        map[d.id] = {
          approved: Array.isArray(data.approved) ? data.approved : [],
          rejected: Array.isArray(data.rejected) ? data.rejected : []
        };
      });
      const list: PendingItem[] = [];
      subSnap.docs.forEach((d: any) => {
        const data = d.data() || {};
        const decided = map[d.id] || { approved: [], rejected: [] };
        (Array.isArray(data.items) ? data.items : []).forEach((item: QuestionSubmission) => {
          if (!decided.approved.includes(item.id) && !decided.rejected.includes(item.id)) {
            list.push({ ...item, uid: d.id, authorName: data.displayName || 'Student' });
          }
        });
      });
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      setDecisions(map);
      setPending(list);
      setLoaded(true);
    } catch (e: any) {
      setMsg(e?.message || 'Could not load submissions.');
    } finally {
      setLoading(false);
    }
  };

  const decide = async (item: PendingItem, approve: boolean) => {
    if (!isFirebaseConfigured || !db || !doc || !setDoc) return;
    const current = decisions[item.uid] || { approved: [], rejected: [] };
    const next: Approvals = approve
      ? { approved: [...current.approved, item.id], rejected: current.rejected }
      : { approved: current.approved, rejected: [...current.rejected, item.id] };
    try {
      // Record the decision FIRST: if this fails, no question gets added.
      await setDoc(doc(db, 'approvals', item.uid), next);
      if (approve) {
        const unit = INITIAL_UNITS.find(u => u.unitId === item.unitId);
        const standard = INITIAL_STANDARDS.find(s => s.unitId === item.unitId);
        addQuestion({
          questionText: item.questionText,
          answers: item.answers,
          correctAnswer: item.correctAnswer,
          explanation: item.explanation || 'Review your notes on this topic to learn more.',
          unitId: item.unitId,
          unitName: unit?.unitName || 'Custom Unit',
          standardId: standard?.standardId || 'OH-SS8-2026.1',
          standardDescription: standard?.standardDescription,
          topic: unit?.unitName || 'Student Question',
          historicalEra: 'Early America (1492–1877)',
          difficulty: 'medium',
          active: true,
          isOST: false
        });
      }
      setDecisions(prev => ({ ...prev, [item.uid]: next }));
      setPending(prev => prev.filter(p => p.id !== item.id));
      setMsg(approve ? 'Approved and added to the question bank.' : 'Declined.');
    } catch (e: any) {
      setMsg(e?.message || 'Could not save that decision.');
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow">
        <p className="text-xs text-slate-400 max-w-xl">
          Student-written questions waiting for review. Approving adds the question to the live bank and lets the student claim +20 coins. Edit anything odd afterwards in the Questions tab.
        </p>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loaded ? 'Reload Submissions' : 'Load Submissions'}</span>
        </button>
      </div>

      {msg && <p className="text-xs text-emerald-300">{msg}</p>}

      {loaded && pending.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
          <Inbox className="w-6 h-6 mx-auto mb-2 text-slate-600" />
          Nothing waiting. All caught up!
        </div>
      )}

      {pending.map(item => {
        const unit = INITIAL_UNITS.find(u => u.unitId === item.unitId);
        return (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>{item.authorName}</span>
              <span>{unit?.unitName || item.unitId}</span>
            </div>
            <p className="text-sm text-slate-100">{item.questionText}</p>
            <ul className="text-xs space-y-1">
              {item.answers.map((a, i) => (
                <li key={i} className={i === item.correctAnswer ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
                  {String.fromCharCode(65 + i)}. {a}{i === item.correctAnswer ? '  ✓' : ''}
                </li>
              ))}
            </ul>
            {item.explanation && <p className="text-xs text-slate-400 italic">Why: {item.explanation}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => decide(item, true)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer">
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button type="button" onClick={() => decide(item, false)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer">
                <X className="w-3.5 h-3.5" /> Decline
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
