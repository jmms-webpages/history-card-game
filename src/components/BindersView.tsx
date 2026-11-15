import React, { useState } from 'react';
import { Library, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { useCards } from '../context/CardsContext';
import { CollectionView } from './CollectionView';
import { ClassBinderView } from './ClassBinderView';

interface BindersViewProps {
  onNavigate?: (tab: any) => void;
  initialOpen?: 'mine' | 'class';
}

// One page for both binders. Both start closed; each opens on its own and shows
// one unit at a time. The class binder only loads from Firestore when opened.
export const BindersView: React.FC<BindersViewProps> = ({ onNavigate, initialOpen }) => {
  const { stats } = useCards();
  const [mineOpen, setMineOpen] = useState(initialOpen === 'mine');
  const [classOpen, setClassOpen] = useState(initialOpen === 'class');

  const section = (
    open: boolean,
    setOpen: (v: boolean) => void,
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    body: React.ReactNode
  ) => (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-5 sm:p-6 text-left cursor-pointer hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="font-serif font-black text-slate-100 text-lg">{title}</h2>
            <p className="text-xs text-slate-400 truncate">{subtitle}</p>
          </div>
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />}
      </button>
      {open && <div className="p-4 sm:p-6 pt-0 sm:pt-0 border-t border-slate-800">{body}</div>}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-20 animate-fadeIn">
      <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100">Binders</h1>
      {section(
        mineOpen,
        setMineOpen,
        <Library className="w-5 h-5" />,
        'My Cards',
        `${stats.uniqueCards} of ${stats.totalInSet} unique cards collected`,
        <div className="pt-5"><CollectionView onNavigate={onNavigate} embedded /></div>
      )}
      {section(
        classOpen,
        setClassOpen,
        <Users className="w-5 h-5" />,
        'Class Binder',
        'Donate spares and build one shared collection with your class',
        <div className="pt-5"><ClassBinderView onNavigate={onNavigate} embedded /></div>
      )}
    </div>
  );
};
