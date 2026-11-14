import React, { useEffect, useState } from 'react';
import { PenLine, Send, CheckCircle2, Clock, XCircle, Gift, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { INITIAL_UNITS } from '../data/initialCurriculum';
import {
  QuestionSubmission,
  Approvals,
  MAX_SUBMISSIONS,
  SUBMISSION_REWARD_COINS,
  loadMySubmissions,
  saveMySubmissions
} from '../utils/submissions';

export const ContributeView: React.FC = () => {
  const { userProfile, updateUserProfile, updateCoins } = useAuth();

  const [items, setItems] = useState<QuestionSubmission[]>([]);
  const [approvals, setApprovals] = useState<Approvals>({ approved: [], rejected: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [unitId, setUnitId] = useState(INITIAL_UNITS[0]?.unitId || 'unit-1');
  const [questionText, setQuestionText] = useState('');
  const [answers, setAnswers] = useState(['', '', '', '']);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [explanation, setExplanation] = useState('');

  const uid = userProfile?.uid;

  // Two reads, only when this page is opened (never in the background).
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    loadMySubmissions(uid)
      .then(res => {
        if (cancelled) return;
        setItems(res.items);
        setApprovals(res.approvals);
      })
      .catch(e => console.warn('Submissions load notice:', e))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [uid]);

  if (!userProfile) return null;

  const claimedIds = userProfile.claimedSubmissionIds || [];
  const flash = (t: string) => {
    setNotice(t);
    setTimeout(() => setNotice(null), 4000);
  };

  const canSubmit =
    questionText.trim().length >= 10 &&
    answers.every(a => a.trim().length > 0) &&
    items.length < MAX_SUBMISSIONS &&
    !busy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    const next: QuestionSubmission[] = [
      ...items,
      {
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        questionText: questionText.trim().slice(0, 300),
        answers: answers.map(a => a.trim().slice(0, 120)),
        correctAnswer: correctIdx,
        explanation: explanation.trim().slice(0, 400),
        unitId,
        createdAt: new Date().toISOString()
      }
    ];
    try {
      await saveMySubmissions(userProfile.uid, userProfile.displayName, next);
      setItems(next);
      setQuestionText('');
      setAnswers(['', '', '', '']);
      setCorrectIdx(0);
      setExplanation('');
      flash('Sent to your teacher! If it is approved, you earn coins and it joins the game.');
    } catch (err: any) {
      flash(err?.message || 'Could not send your question. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id: string) => {
    const next = items.filter(i => i.id !== id);
    try {
      await saveMySubmissions(userProfile.uid, userProfile.displayName, next);
      setItems(next);
    } catch {
      flash('Could not remove that question. Please try again.');
    }
  };

  const handleClaim = async (id: string) => {
    if (claimedIds.includes(id)) return;
    await updateUserProfile({ claimedSubmissionIds: [...claimedIds, id] });
    await updateCoins(SUBMISSION_REWARD_COINS);
    flash(`Nice work! +${SUBMISSION_REWARD_COINS} coins for your approved question.`);
  };

  const statusOf = (id: string): 'approved' | 'rejected' | 'pending' =>
    approvals.approved.includes(id) ? 'approved' : approvals.rejected.includes(id) ? 'rejected' : 'pending';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
          <PenLine className="w-3.5 h-3.5" />
          <span>Write a Question</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100">Be the Quiz Master</h1>
        <p className="text-sm text-slate-400 mt-1">
          Writing a good question is one of the best ways to learn a topic. If your teacher approves it, it joins the daily trivia and you earn +{SUBMISSION_REWARD_COINS} coins.
        </p>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs font-bold">{notice}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Unit</label>
          <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2">
            {INITIAL_UNITS.map(u => (
              <option key={u.unitId} value={u.unitId}>{u.unitName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Your question</label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Which document established..."
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">Answers — select the correct one</label>
          {answers.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={correctIdx === i} onChange={() => setCorrectIdx(i)} className="accent-amber-500" />
              <span className="w-5 text-xs font-mono text-slate-400">{String.fromCharCode(65 + i)}</span>
              <input
                type="text"
                value={a}
                maxLength={120}
                onChange={(e) => setAnswers(prev => prev.map((p, idx) => (idx === i ? e.target.value : p)))}
                className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Why is that the answer? (optional)</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            maxLength={400}
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          <span>{busy ? 'Sending...' : 'Send to Teacher'}</span>
        </button>
        {items.length >= MAX_SUBMISSIONS && (
          <p className="text-[11px] text-rose-300">You've reached the limit of {MAX_SUBMISSIONS} questions. Remove an old one to add another.</p>
        )}
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-slate-100 mb-3">Your Questions ({items.length})</h2>
        {loading ? (
          <p className="text-xs text-slate-500">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-slate-500">You haven't written any questions yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {[...items].reverse().map(item => {
              const status = statusOf(item.id);
              const claimed = claimedIds.includes(item.id);
              return (
                <li key={item.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-xs text-slate-200 leading-relaxed">{item.questionText}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        status === 'approved' ? 'text-emerald-400' : status === 'rejected' ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      {status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : status === 'rejected' ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {status === 'approved' ? 'Approved!' : status === 'rejected' ? 'Not used this time' : 'Waiting for your teacher'}
                    </span>
                    <div className="flex items-center gap-2">
                      {status === 'approved' && !claimed && (
                        <button type="button" onClick={() => handleClaim(item.id)} className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5" /> Claim +{SUBMISSION_REWARD_COINS}
                        </button>
                      )}
                      {status === 'approved' && claimed && <span className="text-slate-500">Reward claimed</span>}
                      {status !== 'approved' && (
                        <button type="button" onClick={() => handleRemove(item.id)} className="text-slate-500 hover:text-rose-400 cursor-pointer" title="Remove">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
