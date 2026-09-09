import React from 'react';
import { Library, Sparkles, Filter } from 'lucide-react';

export const CollectionView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Phase 3 Preview: Collection Binder
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100">
          History Card Binder
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Organize cards by Ohio Social Studies theme, inspect historical significance, and sell duplicate cards for coins.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-amber-400">
          <Library className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-200">Collection Binder Architected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Features upcoming in Phase 3: Rarity visual distinctions (Common 65%, Uncommon 22%, Rare 9%, Legendary 3.5%, Mythical 0.5%), theme completion bonuses, and duplicate selling.
          </p>
        </div>
      </div>
    </div>
  );
};
