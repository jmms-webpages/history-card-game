import React, { useState } from 'react';
import { Card, Pack } from '../types';
import { CardItem } from './CardItem';
import { sounds } from '../utils/audio';
import { 
  X, 
  Sparkles, 
  Package, 
  Coins, 
  ArrowRight, 
  Check, 
  RotateCcw,
  Library
} from 'lucide-react';

interface PackOpeningModalProps {
  pack: Pack;
  pulledCards: Card[];
  newCardsCount: number;
  duplicateCardsCount: number;
  onClose: () => void;
  onOpenAnother?: () => void;
  onGoToBinder?: () => void;
  userCoins: number;
}

export const PackOpeningModal: React.FC<PackOpeningModalProps> = ({
  pack,
  pulledCards,
  newCardsCount,
  duplicateCardsCount,
  onClose,
  onOpenAnother,
  onGoToBinder,
  userCoins
}) => {
  // Track which cards are flipped (indices 0..4)
  const [flippedCards, setFlippedCards] = useState<boolean[]>([false, false, false, false, false]);
  const [allRevealed, setAllRevealed] = useState(false);

  const handleFlipCard = (index: number) => {
    if (flippedCards[index]) return;
    const next = [...flippedCards];
    next[index] = true;
    setFlippedCards(next);

    const card = pulledCards[index];
    if (card) {
      if (card.rarity === 'Mythical') sounds.playFanfare('Mythical');
      else if (card.rarity === 'Legendary') sounds.playFanfare('Legendary');
      else if (card.rarity === 'Rare') sounds.playFanfare('Rare');
      else sounds.playCardFlip();
    }

    if (next.every(f => f)) {
      setAllRevealed(true);
    }
  };

  const handleRevealAll = () => {
    setFlippedCards([true, true, true, true, true]);
    setAllRevealed(true);
    sounds.playFanfare('Legendary');
  };

  const canAffordAnother = userCoins >= pack.cost;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative my-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pack.coverColor} flex items-center justify-center text-xl shadow`}>
              📜
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Booster Pack Opened
                </span>
                <span className="text-xs text-slate-300 font-mono font-semibold bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                  5 Cards Pulled • Pool: {pack.cardCount} Cards
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black font-serif text-slate-100">
                {pack.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pull Outcome Summary Banner if all revealed */}
        {allRevealed ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-950 to-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300">
                  Pack Opening Complete!
                </p>
                <p className="text-[11px] text-slate-300">
                  Unlocked <strong className="text-emerald-400">{newCardsCount} new {newCardsCount === 1 ? 'card' : 'cards'}</strong> for your binder, with <strong className="text-amber-400">{duplicateCardsCount} duplicates</strong> available to sell or trade.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRevealAll}
                className="hidden" // hidden helper
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-1">
            <p className="text-xs font-medium text-slate-400">
              Click each card to flip and reveal your historical discoveries!
            </p>
          </div>
        )}

        {/* 5 Cards Deal Area */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 py-2">
          {pulledCards.map((card, idx) => {
            const isFlipped = flippedCards[idx];
            return (
              <div key={idx} className="relative">
                <CardItem
                  card={card}
                  isOwned={true}
                  isRevealed={isFlipped}
                  isHolo={(card as any).isHolo}
                  onClick={() => handleFlipCard(idx)}
                />
                {/* Reveal Hint Button if not flipped */}
                {!isFlipped && (
                  <button
                    type="button"
                    onClick={() => handleFlipCard(idx)}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold shadow-lg cursor-pointer whitespace-nowrap transition-transform hover:scale-105"
                  >
                    Flip #{idx + 1}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          {!allRevealed ? (
            <button
              type="button"
              onClick={handleRevealAll}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Flip All 5 Cards
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onGoToBinder && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToBinder();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Library className="w-4 h-4 text-amber-400" />
                  <span>View in Collection Binder</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onOpenAnother && canAffordAnother && (
              <button
                type="button"
                onClick={onOpenAnother}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Open Another ({pack.cost} Coins)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
