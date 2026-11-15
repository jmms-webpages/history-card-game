import React from 'react';
import { Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/** Shown to students while the teacher has maintenance mode on. */
export const MaintenanceView: React.FC = () => {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <Wrench className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-black font-serif text-amber-400">Under Maintenance</h1>
        <p className="text-sm text-slate-400">We're making updates. Your progress is saved. This page checks again on its own, so you can leave it open.</p>
        <button type="button" onClick={logout} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">
          Sign out
        </button>
      </div>
    </div>
  );
};
