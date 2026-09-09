import React from 'react';
import { Package, Sparkles, Coins } from 'lucide-react';
import { DEFAULT_GAME_SETTINGS } from '../data/initialCurriculum';

export const PacksView: React.FC = () => {
  const themes = [
    { title: '1. Exploration & Colonization', color: 'from-amber-600 to-amber-800' },
    { title: '2. Colonial America', color: 'from-emerald-600 to-emerald-800' },
    { title: '3. American Revolution', color: 'from-rose-600 to-rose-800' },
    { title: '4. Constitution & Early Republic', color: 'from-blue-600 to-blue-800' },
    { title: '5. Expansion & Sectionalism', color: 'from-purple-600 to-purple-800' },
    { title: '6. Civil War & Reconstruction', color: 'from-cyan-600 to-cyan-800' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Phase 3 Preview: Historical Card Packs
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100">
          Card Pack Depot
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Open 5-card booster packs with 4 standard rarity rolls and 1 guaranteed Uncommon-or-better slot!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow flex flex-col justify-between">
            <div>
              <div className={`w-full h-32 rounded-lg bg-gradient-to-br ${theme.color} flex items-center justify-center text-4xl shadow-inner mb-4`}>
                📜
              </div>
              <h3 className="font-bold text-slate-100 text-sm">{theme.title}</h3>
              <p className="text-xs text-slate-400 mt-1">5 Collectible Cards • 1 Guaranteed Rare Slot</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-amber-400 font-mono font-bold">
                <Coins className="w-3.5 h-3.5" />
                {DEFAULT_GAME_SETTINGS.standardPackCost} Coins
              </span>
              <span className="text-slate-500 font-mono">Unlocks in Phase 3</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
