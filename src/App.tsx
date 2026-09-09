/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QuestionsProvider } from './context/QuestionsContext';
import { NavigationTab } from './types';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { QuestionsView } from './components/QuestionsView';
import { PacksView } from './components/PacksView';
import { CollectionView } from './components/CollectionView';
import { TradingView } from './components/TradingView';
import { ProfileView } from './components/ProfileView';
import { TeacherDashboardView } from './components/TeacherDashboardView';

const MainAppContent: React.FC = () => {
  const { userProfile, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [timedOut, setTimedOut] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading && !userProfile && !timedOut) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-3xl animate-bounce shadow-xl">
          ⚔️
        </div>
        <p className="mt-4 font-serif text-lg font-bold text-amber-400">
          History Card Quest
        </p>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Loading Ohio 8th Grade Social Studies Archive...
        </p>
      </div>
    );
  }

  if (!userProfile) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {(currentTab === 'dashboard' || currentTab === 'student-view') && <DashboardView onNavigate={setCurrentTab} />}
        {currentTab === 'questions' && <QuestionsView />}
        {currentTab === 'packs' && <PacksView />}
        {currentTab === 'collection' && <CollectionView />}
        {currentTab === 'trading' && <TradingView />}
        {currentTab === 'profile' && <ProfileView />}
        {currentTab === 'teacher' && <TeacherDashboardView />}
      </main>

      {/* Classroom Safe Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            History Card Quest • Built for Ohio 8th Grade Social Studies (2026 Standards Transition)
          </p>
          <p className="text-[11px] font-mono text-slate-600">
            Firebase Spark Architecture • Zero Student PII Exposed
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <QuestionsProvider>
        <MainAppContent />
      </QuestionsProvider>
    </AuthProvider>
  );
}
