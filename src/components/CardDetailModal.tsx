import React, { useState } from 'react';
import { Card } from '../types';
import { RARITY_COLORS } from '../data/cards';
import { useCards } from '../context/CardsContext';
import { 
  X, 
  Sparkles, 
  Coins, 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  Trash2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
  isOwned: boolean;
  copiesCount: number;
  onNavigateToPacks?: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  onClose,
  isOwned,
  copiesCount,
  onNavigateToPacks
}) => {
  const { inventory, sellDuplicate } = useCards();
  const [selling, setSelling] = useState(false);
  const [sellMessage, setSellMessage] = useState<string | null>(null);

  if (!card) return null;

  const colors = RARITY_COLORS[card.rarity] || RARITY_COLORS.Common;
  const isHighTier = ['Rare', 'Legendary', 'Mythical'].includes(card.rarity);

  // Find an instance of this card in inventory to sell if user has duplicates
  const duplicateInstance = copiesCount > 1 
    ? inventory.find(i => i.cardId === card.cardId)
    : null;

  const handleSellOne = async () => {
    if (!duplicateInstance) return;
    try {
      setSelling(true);
      const earned = await sellDuplicate(duplicateInstance.instanceId);
      setSellMessage(`Sold 1 duplicate copy for +${earned} Coins!`);
      setTimeout(() => setSellMessage(null), 3500);
    } catch (e: any) {
      setSellMessage(e.message || 'Failed to sell duplicate');
    } finally {
      setSelling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl ${colors.bg} border-2 ${colors.border} flex items-center justify-center text-3xl shrink-0 shadow-lg`}>
            {card.symbol || '📜'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${colors.badge} flex items-center gap-1`}>
                {isHighTier && <Sparkles className="w-3 h-3" />}
                {card.rarity}
              </span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {card.standardId}
              </span>
              <span className="text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {card.packTheme}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-serif text-slate-100">
              {card.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{card.historicalEra}</p>
          </div>
        </div>

        {/* Status Notice if Sold */}
        {sellMessage && (
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{sellMessage}</span>
          </div>
        )}

        {/* Card Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card Summary Card */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Historical Overview</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {card.description}
            </p>
            {card.flavorQuote && (
              <blockquote className="text-xs italic text-amber-300/90 border-l-2 border-amber-500/60 pl-3 py-1 font-serif">
                "{card.flavorQuote}"
              </blockquote>
            )}
          </div>

          {/* Collection Status */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Binder Status</span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ownership:</span>
                  <span className={`font-bold ${isOwned ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isOwned ? `Collected (${copiesCount} ${copiesCount === 1 ? 'copy' : 'copies'})` : 'Not Yet Collected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Card Category:</span>
                  <span className="font-mono text-slate-200 capitalize">{card.category || 'Historical Entry'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Duplicate Protection:</span>
                  <span className="text-slate-300">1st copy is locked safely</span>
                </div>
              </div>
            </div>

            {/* Sell duplicate action if copies > 1 */}
            {copiesCount > 1 ? (
              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSellOne}
                  disabled={selling}
                  className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow"
                >
                  <Coins className="w-4 h-4" />
                  <span>Sell 1 Duplicate for Coins</span>
                </button>
                <p className="text-[10px] text-slate-500 text-center mt-1">
                  You keep 1 copy for your binder completion.
                </p>
              </div>
            ) : !isOwned && onNavigateToPacks ? (
              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToPacks();
                  }}
                  className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Open Packs to Discover</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Detailed Historical Significance */}
        <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Ohio Social Studies Curriculum Significance</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {card.historicalSignificance}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800 font-mono">
          <span>Standard: {card.standardId}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans font-bold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
