import React, { useState } from 'react';
import { Package, Sparkles, Coins, Info, Check, ArrowRight, Zap, Trophy, Shield, Layers, Eye, X, Lock } from 'lucide-react';
import { useCards } from '../context/CardsContext';
import { useAuth } from '../context/AuthContext';
import { PackOpeningModal } from './PackOpeningModal';
import { DEFAULT_GAME_SETTINGS } from '../data/initialCurriculum';
import { RARITY_COLORS } from '../data/cards';
import { Pack, Card, CardRarity } from '../types';

interface PacksViewProps {
  onNavigate?: (tab: any) => void;
}

export const PacksView: React.FC<PacksViewProps> = ({ onNavigate }) => {
  const { packs, openPack, getPackCardPool, isCardOwned, getCardCopies } = useCards();
  const { userProfile } = useAuth();
  
  const [openingPackId, setOpeningPackId] = useState<string | null>(null);
  const [activePackForModal, setActivePackForModal] = useState<Pack | null>(null);
  const [pulledCards, setPulledCards] = useState<Card[]>([]);
  const [newCardsCount, setNewCardsCount] = useState<number>(0);
  const [duplicateCardsCount, setDuplicateCardsCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOddsModal, setShowOddsModal] = useState<boolean>(false);
  const [selectedPackForChecklist, setSelectedPackForChecklist] = useState<Pack | null>(null);
  const [checklistFilter, setChecklistFilter] = useState<'all' | 'owned' | 'unowned'>('all');

  const userCoins = userProfile?.coins ?? 0;

  const handleOpenPack = async (pack: Pack) => {
    if (userCoins < pack.cost) {
      setErrorMessage(`You need ${pack.cost - userCoins} more coins to open this pack. Answer daily questions to earn coins!`);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    try {
      setOpeningPackId(pack.packId);
      setErrorMessage(null);

      const result = await openPack(pack.packId);
      
      setActivePackForModal(pack);
      setPulledCards(result.cards);
      setNewCardsCount(result.newCardsCount);
      setDuplicateCardsCount(result.duplicateCardsCount);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to open pack. Please try again.');
    } finally {
      setOpeningPackId(null);
    }
  };

  const handleCloseModal = () => {
    setActivePackForModal(null);
    setPulledCards([]);
  };

  const handleOpenAnother = () => {
    if (activePackForModal) {
      handleOpenPack(activePackForModal);
    }
  };

  const activeChecklistCards = selectedPackForChecklist
    ? getPackCardPool(selectedPackForChecklist)
    : [];

  const filteredChecklistCards = activeChecklistCards.filter(c => {
    if (checklistFilter === 'owned') return isCardOwned(c.cardId);
    if (checklistFilter === 'unowned') return !isCardOwned(c.cardId);
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Card Pack Depot</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100">
              Historical Booster Packs
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              Open booster packs containing 5 cards per rip from pools of up to 126 authentic curriculum cards. Each pack features 4 standard rolls plus 1 guaranteed Uncommon-or-better slot!
            </p>
          </div>

          {/* Student Coins Balance & Quick Stats */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-inner">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Available Coins
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                  {userCoins.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOddsModal(true)}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-amber-300 rounded-2xl transition-colors cursor-pointer flex flex-col items-center justify-center text-xs gap-1"
              title="View Drop Odds & Pack Counts"
            >
              <Info className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] font-mono font-bold">Odds</span>
            </button>
          </div>
        </div>

        {/* Error / Alert notice */}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn">
            <span>{errorMessage}</span>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('questions')}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap cursor-pointer"
              >
                Earn Coins Now
              </button>
            )}
          </div>
        )}
      </div>

      {/* Packs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {packs.map((pack) => {
          const canAfford = userCoins >= pack.cost;
          const isOpeningThis = openingPackId === pack.packId;
          const packCards = getPackCardPool(pack);
          const totalPossible = pack.cardCount;
          const ownedCount = packCards.filter(c => isCardOwned(c.cardId)).length;
          const completionPct = totalPossible > 0 ? Math.round((ownedCount / totalPossible) * 100) : 0;

          return (
            <div
              key={pack.packId}
              className={`bg-slate-900 border rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all duration-200 group relative overflow-hidden ${
                pack.active ? 'border-slate-800 hover:border-slate-700 hover:-translate-y-1 hover:shadow-xl' : 'border-slate-800/60 opacity-70'
              }`}
            >
              {!pack.active && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/90 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                  <Lock className="w-3 h-3" />
                  <span>Locked by Teacher</span>
                </div>
              )}
              {/* Booster Foil Art Wrapper */}
              <div>
                <div
                  className={`w-full aspect-[16/10] rounded-2xl bg-gradient-to-br ${pack.coverColor} p-4 flex flex-col justify-between relative overflow-hidden shadow-inner border border-white/10 group-hover:scale-[1.02] transition-transform duration-300`}
                >
                  <div className="flex items-center justify-between text-white/90">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-black/50 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/20 text-amber-300">
                      Pulls 5 Cards
                    </span>
                    <span className="text-xs font-mono font-bold bg-black/50 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/20 text-white flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{pack.cardCount} Possible Cards</span>
                    </span>
                  </div>

                  <div className="text-center py-2">
                    <div className="w-12 h-12 rounded-2xl bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto text-2xl shadow-lg group-hover:rotate-6 transition-transform">
                      📜
                    </div>
                    <h3 className="font-serif font-black text-white text-base mt-2 drop-shadow-md line-clamp-1">
                      {pack.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-white/80 font-mono">
                    <span className="truncate max-w-[150px]">{pack.theme}</span>
                    <span className="font-bold text-amber-300">1x Guaranteed Slot</span>
                  </div>
                </div>

                {/* Pack Meta */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">
                    {pack.description}
                  </p>

                  {/* Real-time Collection & Card Pool Counter */}
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>Possible Cards: <strong className="text-slate-200">{pack.cardCount}</strong></span>
                      </span>
                      <span className="text-amber-400 font-bold">
                        {ownedCount}/{pack.cardCount} ({completionPct}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, completionPct)}%` }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPackForChecklist(pack);
                        setChecklistFilter('all');
                      }}
                      className="w-full py-1 text-center text-[11px] text-amber-400 hover:text-amber-300 font-mono font-semibold hover:bg-slate-900 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View {pack.cardCount} Possible Cards</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Cost and Action Button */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-amber-400 font-mono font-black text-base">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>{pack.cost}</span>
                  <span className="text-[10px] text-slate-400 font-normal uppercase">Coins</span>
                </div>

                {pack.active ? (
                  <button
                    type="button"
                    onClick={() => handleOpenPack(pack)}
                    disabled={isOpeningThis}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isOpeningThis ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Ripping Pack...</span>
                      </>
                    ) : canAfford ? (
                      <>
                        <Package className="w-4 h-4" />
                        <span>Open Pack</span>
                      </>
                    ) : (
                      <>
                        <span>Need {pack.cost - userCoins} Coins</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 bg-slate-950 border border-slate-800 text-slate-500">
                    <Lock className="w-4 h-4" />
                    <span>Locked</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Possible Cards Checklist / Card Pool Modal */}
      {selectedPackForChecklist && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedPackForChecklist.coverColor} flex items-center justify-center text-2xl shadow-lg border border-white/20`}>
                  📜
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      Card Pool Checklist
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedPackForChecklist.cardCount} Possible Cards
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black font-serif text-slate-100">
                    {selectedPackForChecklist.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Theme: {selectedPackForChecklist.theme} • Each pack pulls 5 random cards from this pool
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPackForChecklist(null)}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Collection Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setChecklistFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    checklistFilter === 'all'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({activeChecklistCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => setChecklistFilter('owned')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    checklistFilter === 'owned'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Owned ({activeChecklistCards.filter(c => isCardOwned(c.cardId)).length})
                </button>
                <button
                  type="button"
                  onClick={() => setChecklistFilter('unowned')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    checklistFilter === 'unowned'
                      ? 'bg-rose-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Missing ({activeChecklistCards.filter(c => !isCardOwned(c.cardId)).length})
                </button>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Total Collection: <strong className="text-amber-400">{activeChecklistCards.filter(c => isCardOwned(c.cardId)).length} / {selectedPackForChecklist.cardCount}</strong> cards owned
              </div>
            </div>

            {/* Cards Scrollable Grid */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-2 max-h-[50vh]">
              {filteredChecklistCards.map((card) => {
                const owned = isCardOwned(card.cardId);
                const copies = getCardCopies(card.cardId);
                const rarityStyle = RARITY_COLORS[card.rarity] || RARITY_COLORS.Common;

                return (
                  <div
                    key={card.cardId}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                      owned
                        ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/30 border-slate-900 opacity-65'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0">
                        {card.category === 'Historical Figure' ? '👤' : card.category === 'Key Event' ? '⚡' : card.category === 'Sacred Artifact' ? '📜' : '🏛️'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 text-xs sm:text-sm">
                            {card.name}
                          </h4>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${rarityStyle.bg} ${rarityStyle.border} ${rarityStyle.text} font-bold`}>
                            {card.rarity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {card.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right font-mono text-xs">
                      {owned ? (
                        <div className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                          <Check className="w-3.5 h-3.5" />
                          <span>Owned ({copies}x)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-500 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Not Pulled</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Showing {filteredChecklistCards.length} of {selectedPackForChecklist.cardCount} possible cards
              </span>
              <button
                type="button"
                onClick={() => setSelectedPackForChecklist(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Checklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rarity & Drop Rate Information Modal */}
      {showOddsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-black text-slate-100 text-lg">
                  Curriculum Drop Rates & Possible Cards
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOddsModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Each 5-card pack draws from specific historical curriculum pools using authentic booster roll algorithms:
            </p>

            {/* Pack Pools Breakdown */}
            <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="text-amber-400 font-bold font-sans flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span>Curriculum Pack Pools</span>
                <span className="text-[10px] text-slate-400">Total Cards</span>
              </div>
              <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-300 max-h-36 overflow-y-auto pr-1">
                {packs.map((p) => (
                  <div key={p.packId} className="flex justify-between p-1 rounded bg-slate-900/70">
                    <span className="text-slate-300 truncate max-w-[240px]">{p.name}:</span>
                    <span className="font-bold text-amber-300">{p.cardCount} possible cards</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Standard Rolls */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="text-amber-400 font-bold font-sans flex items-center justify-between">
                  <span>Slots 1 through 4 (Standard Rolls)</span>
                  <span className="text-[10px] text-slate-400">4 Cards per Pack</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="flex justify-between p-1.5 rounded bg-slate-900">
                    <span className="text-slate-400">Common:</span>
                    <span className="font-bold">65.0%</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-slate-900">
                    <span className="text-emerald-400">Uncommon:</span>
                    <span className="font-bold">22.0%</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-slate-900">
                    <span className="text-blue-400">Rare:</span>
                    <span className="font-bold">9.0%</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-slate-900">
                    <span className="text-amber-400">Legendary:</span>
                    <span className="font-bold">3.5%</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-slate-900 col-span-2">
                    <span className="text-purple-400">Mythical:</span>
                    <span className="font-bold">0.5% (1 in 200)</span>
                  </div>
                </div>
              </div>

              {/* Guaranteed Slot */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="text-emerald-400 font-bold font-sans flex items-center justify-between">
                  <span>Slot 5 (Guaranteed Uncommon+)</span>
                  <span className="text-[10px] text-slate-400">1 Card per Pack</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="flex justify-between p-1.5 rounded bg-slate-900">
                    <span className="text-emerald-400">Uncommon:</span>
                    <span className="font-bold">~62.9%</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-slate-900">
                    <span className="text-blue-400">Rare:</span>
                    <span className="font-bold">~25.7%</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-slate-900">
                    <span className="text-amber-400">Legendary:</span>
                    <span className="font-bold">10.0%</span>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-slate-900">
                    <span className="text-purple-400">Mythical:</span>
                    <span className="font-bold">~1.43%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowOddsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Pack Opening Ceremony Modal */}
      {activePackForModal && pulledCards.length === 5 && (
        <PackOpeningModal
          pack={activePackForModal}
          pulledCards={pulledCards}
          newCardsCount={newCardsCount}
          duplicateCardsCount={duplicateCardsCount}
          onClose={handleCloseModal}
          onOpenAnother={handleOpenAnother}
          onGoToBinder={onNavigate ? () => onNavigate('collection') : undefined}
          userCoins={userCoins}
        />
      )}
    </div>
  );
};

