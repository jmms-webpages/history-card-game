import React, { useState, useMemo } from 'react';
import { 
  Library, 
  Sparkles, 
  Filter, 
  Search, 
  Coins, 
  Trash2, 
  Layers, 
  Package, 
  ArrowUpDown,
  CheckCircle2,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useCards } from '../context/CardsContext';
import { CardItem } from './CardItem';
import { CardDetailModal } from './CardDetailModal';
import { Card, CardRarity } from '../types';
import { RARITY_COLORS } from '../data/cards';

interface CollectionViewProps {
  onNavigate?: (tab: any) => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({ onNavigate }) => {
  const { 
    cards, 
    inventory, 
    isCardOwned, 
    getCardCopies, 
    hasHoloCopy,
    getHoloCopies,
    stats, 
    sellAllDuplicates 
  } = useCards();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'owned' | 'missing'>('all');
  const [sortBy, setSortBy] = useState<'curriculum' | 'rarity' | 'name' | 'copies'>('curriculum');
  
  // Modal & Actions State
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [sellingAll, setSellingAll] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Rarity priority mapping for sorting
  const rarityPriority: Record<CardRarity, number> = {
    Mythical: 5,
    Legendary: 4,
    Rare: 3,
    Uncommon: 2,
    Common: 1
  };

  // Units list for filter
  const unitList = useMemo(() => {
    const set = new Set<string>();
    cards.forEach(c => {
      if (c.unitId) set.add(c.unitId);
    });
    return Array.from(set).sort();
  }, [cards]);

  // Filtered and Sorted Cards
  const filteredCards = useMemo(() => {
    return cards
      .filter(card => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = card.name.toLowerCase().includes(q);
          const matchDesc = card.description.toLowerCase().includes(q);
          const matchEra = card.historicalEra.toLowerCase().includes(q);
          const matchStd = card.standardId.toLowerCase().includes(q);
          const matchTheme = card.packTheme.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchEra && !matchStd && !matchTheme) return false;
        }

        // Unit filter
        if (selectedUnit !== 'all' && card.unitId !== selectedUnit) {
          return false;
        }

        // Rarity filter
        if (selectedRarity !== 'all' && card.rarity !== selectedRarity) {
          return false;
        }

        // Ownership filter
        const owned = isCardOwned(card.cardId);
        if (ownershipFilter === 'owned' && !owned) return false;
        if (ownershipFilter === 'missing' && owned) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'curriculum') {
          return a.standardId.localeCompare(b.standardId);
        }
        if (sortBy === 'rarity') {
          return rarityPriority[b.rarity] - rarityPriority[a.rarity];
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'copies') {
          const copiesA = getCardCopies(a.cardId);
          const copiesB = getCardCopies(b.cardId);
          return copiesB - copiesA;
        }
        return 0;
      });
  }, [cards, searchQuery, selectedUnit, selectedRarity, ownershipFilter, sortBy, isCardOwned, getCardCopies]);

  // Handle Sell All Duplicates
  const handleSellAllDuplicates = async () => {
    if (stats.duplicatesCount === 0) return;
    try {
      setSellingAll(true);
      const res = await sellAllDuplicates();
      setToastMessage(`Sold ${res.soldCount} duplicates for +${res.coinsEarned} Coins!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e: any) {
      setToastMessage(e.message || 'Failed to sell duplicates');
    } finally {
      setSellingAll(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Binder Header & Completion Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold mb-2">
              <Library className="w-3.5 h-3.5" />
              <span>Ohio 8th Grade Social Studies Archive</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100">
              History Collection Binder
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Discover and archive key historical figures, seminal primary source documents, pivotal battles, and enduring artifacts from Ohio and United States history.
            </p>
          </div>

          {/* Duplicates Sell Action Hub */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 shadow-inner w-full md:w-auto">
            <div className="text-center sm:text-left">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Duplicate Vault
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                <span className="text-lg font-black font-mono text-amber-400">
                  {stats.duplicatesCount} {stats.duplicatesCount === 1 ? 'card' : 'cards'}
                </span>
                {stats.potentialDuplicateSellValue > 0 && (
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    +{stats.potentialDuplicateSellValue} Coins
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSellAllDuplicates}
              disabled={stats.duplicatesCount === 0 || sellingAll}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                stats.duplicatesCount > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              {sellingAll ? (
                <span>Cashing out...</span>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  <span>Sell All Duplicates</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar & Completion Stats */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300 font-sans">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>{stats.uniqueCards}</strong> of <strong>{stats.totalInSet}</strong> Unique Cards Collected
              </span>
            </div>
            <span className="font-bold text-amber-400">{stats.completionPercentage}% Complete</span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-400 to-indigo-500 transition-all duration-700 shadow-sm"
              style={{ width: `${Math.min(100, Math.max(0, stats.completionPercentage))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>First copy of every unique card is permanently protected from being sold.</span>
            </span>
            <span className="font-mono">{stats.totalCards} total cards in inventory</span>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search historical figures, documents, standards (e.g. OH-SS8-2026.4)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer font-sans"
            >
              <option value="curriculum">Sort by Standard / Unit</option>
              <option value="rarity">Sort by Rarity (Highest First)</option>
              <option value="name">Sort by Name (A-Z)</option>
              <option value="copies">Sort by Owned Copies</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
          {/* Ownership Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setOwnershipFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                ownershipFilter === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Cards ({cards.length})
            </button>
            <button
              type="button"
              onClick={() => setOwnershipFilter('owned')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                ownershipFilter === 'owned' ? 'bg-slate-800 text-emerald-300 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Owned ({stats.uniqueCards})
            </button>
            <button
              type="button"
              onClick={() => setOwnershipFilter('missing')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                ownershipFilter === 'missing' ? 'bg-slate-800 text-amber-300 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Missing ({Math.max(0, stats.totalInSet - stats.uniqueCards)})
            </button>
          </div>

          {/* Rarity Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-mono">Rarity:</span>
            {['all', 'Common', 'Uncommon', 'Rare', 'Legendary', 'Mythical'].map((rarity) => (
              <button
                key={rarity}
                type="button"
                onClick={() => setSelectedRarity(rarity)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-colors cursor-pointer border ${
                  selectedRarity === rarity
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {rarity === 'all' ? 'ALL' : rarity}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredCards.map((card) => {
            const owned = isCardOwned(card.cardId);
            const copies = getCardCopies(card.cardId);
            const ownsHolo = owned && hasHoloCopy(card.cardId);

            return (
              <React.Fragment key={card.cardId}>
                <CardItem
                  card={card}
                  isOwned={owned}
                  copiesCount={copies}
                  onClick={owned ? () => setSelectedCard(card) : () => {
                    setToastMessage("This card slot is locked! Open booster packs to reveal and discover it.");
                    setTimeout(() => setToastMessage(null), 3500);
                  }}
                />
                {ownsHolo && (
                  <CardItem
                    card={card}
                    isOwned={true}
                    isHolo={true}
                    copiesCount={getHoloCopies(card.cardId)}
                    onClick={() => setSelectedCard(card)}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
            <Filter className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-200">No Cards Match Filters</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search query, rarity selection, or ownership filters.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedUnit('all');
              setSelectedRarity('all');
              setOwnershipFilter('all');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Empty Collection Quick-Start Banner if user has 0 cards */}
      {stats.totalCards === 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0">
              🎁
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Your Binder is Ready for Its First Cards!
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Visit the Card Pack Depot to open booster packs and begin assembling Ohio 8th Grade Social Studies history.
              </p>
            </div>
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('packs')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow"
            >
              <Package className="w-4 h-4" />
              <span>Go to Pack Depot</span>
            </button>
          )}
        </div>
      )}

      {/* Card Inspection / Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          isOwned={isCardOwned(selectedCard.cardId)}
          copiesCount={getCardCopies(selectedCard.cardId)}
          onClose={() => setSelectedCard(null)}
          onNavigateToPacks={onNavigate ? () => onNavigate('packs') : undefined}
        />
      )}
    </div>
  );
};
