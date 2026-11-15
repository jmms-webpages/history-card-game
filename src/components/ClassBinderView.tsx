import React, { useEffect, useMemo, useState } from 'react';
import { Users, Gift, CheckCircle2, Lock, RefreshCw, Heart, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCards } from '../context/CardsContext';
import { useQuestions } from '../context/QuestionsContext';
import { isUnassignedClass, classLabel } from '../utils/classes';
import { INITIAL_UNITS } from '../data/initialCurriculum';
import { Card } from '../types';
import {
  ClassBinderData,
  CLASS_BINDER_MILESTONES,
  fetchClassBinder,
  donateToClassBinder
} from '../utils/classBinder';

const RARITY_TEXT: Record<string, string> = {
  Common: 'text-slate-300',
  Uncommon: 'text-emerald-400',
  Rare: 'text-blue-400',
  Legendary: 'text-amber-400',
  Mythical: 'text-purple-400'
};

export const ClassBinderView: React.FC<{ onNavigate?: (tab: any) => void; embedded?: boolean }> = ({ onNavigate, embedded = false }) => {
  const { userProfile, updateUserProfile, updateCoins } = useAuth();
  const { cards, getCardCopies, donateDuplicate } = useCards();
  const { gameSettings } = useQuestions();

  const [data, setData] = useState<ClassBinderData>({ cards: {} });
  const [loading, setLoading] = useState(true);
  const [donatingId, setDonatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [unitFilter, setUnitFilter] = useState<string>(embedded ? INITIAL_UNITS[0].unitId : 'all');

  const classCode = (userProfile?.classroomCode || '').trim().toUpperCase();

  const load = async (force: boolean = false) => {
    if (isUnassignedClass(classCode)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setData(await fetchClassBinder(classCode, force));
    setLoading(false);
  };

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classCode]);

  const activeCards = useMemo(() => cards.filter(c => c.active), [cards]);
  const filledCount = activeCards.filter(c => data.cards[c.cardId]).length;
  const percent = activeCards.length > 0 ? Math.round((filledCount / activeCards.length) * 100) : 0;

  // Spare copies (beyond the first) of cards the class doesn't have yet.
  const allDonatable: Card[] = activeCards.filter(c => !data.cards[c.cardId] && getCardCopies(c.cardId) >= 2);
  const donatable: Card[] = unitFilter === 'all' ? allDonatable : allDonatable.filter(c => c.unitId === unitFilter);

  const topContributors = useMemo(() => {
    const tally: Record<string, { name: string; count: number }> = {};
    Object.values(data.cards).forEach(entry => {
      const key = entry.uid || entry.by;
      tally[key] = tally[key] || { name: entry.by, count: 0 };
      tally[key].count += 1;
    });
    return Object.values(tally).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [data]);

  if (!userProfile) return null;

  const claimed = userProfile.claimedClassMilestones || [];

  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleDonate = async (card: Card) => {
    if (donatingId) return;
    setDonatingId(card.cardId);
    try {
      // 1) The class binder must accept it first. 2) Only then does the spare
      // copy leave the student's binder -- a failed donation never costs a card.
      await donateToClassBinder(classCode, card.cardId, userProfile.uid, userProfile.displayName);
      const coins = await donateDuplicate(card.cardId);
      await updateUserProfile({ classDonations: (userProfile.classDonations || 0) + 1 });
      setData(prev => ({
        cards: {
          ...prev.cards,
          [card.cardId]: { by: userProfile.displayName, uid: userProfile.uid, at: new Date().toISOString() }
        }
      }));
      flash(`Thanks! ${card.name} is now in the class binder (+${coins} coins).`);
    } catch (e: any) {
      flash(e?.message || 'Could not donate that card. Please try again.');
    } finally {
      setDonatingId(null);
    }
  };

  const handleClaimMilestone = async (id: string, coins: number) => {
    if (claimed.includes(id)) return;
    await updateUserProfile({ claimedClassMilestones: [...claimed, id] });
    await updateCoins(coins);
    flash(`Milestone reward claimed: +${coins} coins!`);
  };

  const shownCards = unitFilter === 'all' ? activeCards : activeCards.filter(c => c.unitId === unitFilter);

  if (isUnassignedClass(classCode)) {
    return (
      <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
        <Lock className="w-8 h-8 text-amber-400 mx-auto" />
        <h1 className="text-xl font-black font-serif text-slate-100">Join your class first</h1>
        <p className="text-sm text-slate-400">Enter your class password in your Profile to use the Class Binder.</p>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm cursor-pointer"
          >
            Go to Profile
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>{classLabel(gameSettings.classes || [], classCode)}</span>
            </div>
            {!embedded && <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100">Class Binder</h1>}
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Donate your spare duplicates to build one shared collection for your whole class. Your first copy of every card always stays in your own binder.
            </p>
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
            <span>{filledCount} / {activeCards.length} cards donated</span>
            <span className="text-amber-300 font-bold">{percent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${percent}%` }} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {CLASS_BINDER_MILESTONES.map(m => {
              const reached = percent >= m.percent;
              const isClaimed = claimed.includes(m.id);
              return (
                <div key={m.id} className={`rounded-xl border p-3 text-center text-xs ${reached ? 'border-amber-500/40 bg-amber-500/10' : 'border-slate-800 bg-slate-950/60 opacity-70'}`}>
                  <div className="font-bold text-slate-100">{m.percent}% full</div>
                  <div className="text-[11px] text-amber-300 font-mono">+{m.coins} coins each</div>
                  {isClaimed ? (
                    <div className="mt-1.5 text-emerald-400 font-bold flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Claimed</div>
                  ) : reached ? (
                    <button type="button" onClick={() => handleClaimMilestone(m.id, m.coins)} className="mt-1.5 w-full py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer">
                      Claim
                    </button>
                  ) : (
                    <div className="mt-1.5 text-slate-500 flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> Locked</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {message && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs font-bold">{message}</div>
        )}
      </div>

      {/* Unit buttons: browse one unit at a time */}
      <div className="flex flex-wrap gap-2">
        {INITIAL_UNITS.map((u, i) => (
          <button
            key={u.unitId}
            type="button"
            title={u.unitName}
            onClick={() => setUnitFilter(u.unitId)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              unitFilter === u.unitId ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
            }`}
          >
            Unit {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setUnitFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
            unitFilter === 'all' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
          }`}
        >
          All
        </button>
      </div>

      {/* Donate */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-slate-100">Your spares the class needs ({donatable.length})</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">Donating pays the same coins as selling the card, and helps everyone in your period.</p>
        {donatable.length === 0 ? (
          <p className="text-xs text-slate-500">
            {filledCount === activeCards.length && activeCards.length > 0
              ? 'Your class binder is complete — amazing work!'
              : 'None of your duplicates match what the class still needs right now. Open more packs to find some!'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {donatable.map(card => (
              <div key={card.cardId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-2xl w-10 h-10 flex items-center justify-center bg-slate-900 rounded-lg shrink-0">{card.symbol || '📜'}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-100 truncate">{card.name}</div>
                  <div className={`text-[11px] font-mono ${RARITY_TEXT[card.rarity] || 'text-slate-400'}`}>{card.rarity} · you have {getCardCopies(card.cardId)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDonate(card)}
                  disabled={!!donatingId}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <Heart className="w-3.5 h-3.5" />
                  {donatingId === card.cardId ? '...' : 'Donate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top contributors */}
      {topContributors.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">Top Contributors</h2>
          </div>
          <ol className="space-y-1.5 text-xs">
            {topContributors.map((c, i) => (
              <li key={c.name + i} className="flex items-center justify-between bg-slate-950 rounded-lg px-3 py-2 border border-slate-800">
                <span className="font-bold text-slate-100">{i + 1}. {c.name}</span>
                <span className="font-mono text-amber-300">{c.count} card{c.count === 1 ? '' : 's'}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* The book itself */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-bold text-slate-100">The Class Book</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {shownCards.map(card => {
            const donated = data.cards[card.cardId];
            return (
              <div
                key={card.cardId}
                className={`rounded-xl border p-3 text-center ${donated ? 'bg-slate-950 border-emerald-500/30' : 'bg-slate-950/40 border-slate-800/60 opacity-50'}`}
              >
                <div className="text-2xl">{donated ? card.symbol || '📜' : '❔'}</div>
                <div className="text-[11px] font-bold text-slate-100 mt-1 line-clamp-2">{donated ? card.name : 'Not yet donated'}</div>
                {donated ? (
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">from {donated.by}</div>
                ) : (
                  <div className={`text-[10px] mt-0.5 ${RARITY_TEXT[card.rarity] || 'text-slate-500'}`}>{card.rarity}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
