import React from 'react';
import { Card } from '../types';
import { RARITY_COLORS } from '../data/cards';
import { Sparkles, Lock, Shield, BookOpen } from 'lucide-react';

interface CardItemProps {
  card: Card;
  isOwned?: boolean;
  copiesCount?: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  isRevealed?: boolean;
  isNew?: boolean;
}

export const CardItem: React.FC<CardItemProps> = ({
  card,
  isOwned = true,
  copiesCount = 1,
  onClick,
  size = 'md',
  showDetails = true,
  isRevealed = true,
  isNew = false
}) => {
  const colors = RARITY_COLORS[card.rarity] || RARITY_COLORS.Common;
  const isHighTier = ['Rare', 'Legendary', 'Mythical'].includes(card.rarity);

  if (!isRevealed) {
    return (
      <div
        onClick={onClick}
        className={`relative aspect-[5/7] rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border-2 border-amber-500/40 shadow-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:scale-105 transition-all duration-300 select-none overflow-hidden group`}
      >
        {/* Card Back Pattern */}
        <div className="absolute inset-2 rounded-xl border border-amber-500/20 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-slate-950/80 border border-amber-500/40 flex items-center justify-center mx-auto shadow-inner group-hover:rotate-12 transition-transform">
              <span className="text-2xl">📜</span>
            </div>
            <p className="text-[11px] font-black font-serif uppercase tracking-widest text-amber-400">
              Ohio History
            </p>
            <p className="text-[9px] font-mono text-slate-400">Click to Flip</p>
          </div>
        </div>
      </div>
    );
  }

  // Unowned / Locked Card Silhouette in Binder
  if (!isOwned) {
    return (
      <div
        onClick={onClick}
        className="relative aspect-[5/7] rounded-2xl bg-slate-950/80 border border-slate-800/80 p-3.5 flex flex-col justify-between cursor-pointer hover:border-slate-700 transition-all opacity-60 hover:opacity-80 select-none"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500">{card.standardId}</span>
          <Lock className="w-3.5 h-3.5 text-slate-600" />
        </div>

        <div className="text-center py-4 space-y-1">
          <div className="w-10 h-10 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center mx-auto text-slate-600 text-lg">
            ?
          </div>
          <p className="text-xs font-bold text-slate-400 line-clamp-1">{card.name}</p>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block ${colors.badge}`}>
            {card.rarity}
          </span>
        </div>

        <div className="text-center border-t border-slate-900 pt-2">
          <span className="text-[9px] text-slate-600 font-mono">Undiscovered</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`group relative aspect-[5/7] rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-300 border-2 select-none overflow-hidden ${colors.bg} ${colors.border} ${colors.glow} hover:-translate-y-1 hover:shadow-2xl`}
    >
      {/* Holographic / Foil Sheen for high-tier rarities */}
      {isHighTier && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}

      {/* NEW pull badge */}
      {isNew && (
        <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg animate-bounce">
          New!
        </div>
      )}

      {/* Duplicate Count Badge */}
      {copiesCount > 1 && (
        <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-slate-950/90 border border-amber-400 text-amber-300 text-[11px] font-mono font-black shadow-md">
          x{copiesCount}
        </div>
      )}

      {/* Card Header: Name and Rarity Pill */}
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-black font-serif text-slate-100 leading-snug line-clamp-1 group-hover:text-amber-300 transition-colors">
              {card.name}
            </h4>
            <p className="text-[10px] text-slate-400 line-clamp-1">{card.historicalEra}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.badge} flex items-center gap-1`}>
            {card.rarity === 'Mythical' && <Sparkles className="w-2.5 h-2.5 text-purple-300" />}
            {card.rarity === 'Legendary' && <Sparkles className="w-2.5 h-2.5 text-amber-300" />}
            <span>{card.rarity}</span>
          </span>
          <span className="text-[9px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800">
            {card.standardId}
          </span>
        </div>
      </div>

      {/* Card Illustration / Symbol Emblem Frame */}
      <div className="relative z-10 my-auto py-2">
        <div className={`w-full aspect-[4/3] rounded-xl bg-gradient-to-b ${colors.sheen} border border-slate-700/60 flex flex-col items-center justify-center relative overflow-hidden shadow-inner`}>
          <div className="text-4xl sm:text-5xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">
            {card.symbol || '📜'}
          </div>
          {card.category && (
            <span className="absolute bottom-1 right-2 text-[9px] font-mono uppercase tracking-wider text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800/80">
              {card.category}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer: Short description and unit */}
      <div className="relative z-10 pt-1 space-y-1">
        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed font-sans">
          {card.description}
        </p>

        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-800/80">
          <span className="truncate max-w-[120px]">{card.packTheme}</span>
          <span className="font-mono text-amber-400 font-bold">Ohio SS8</span>
        </div>
      </div>
    </div>
  );
};
