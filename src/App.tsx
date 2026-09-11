/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QuestionsProvider } from './context/QuestionsContext';
import { CardsProvider } from './context/CardsContext';
import { NavigationTab } from './types';
import { Sidebar } from './components/Sidebar';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { QuestionsView } from './components/QuestionsView';
import { PacksView } from './components/PacksView';
import { CollectionView } from './components/CollectionView';
import { ProfileView } from './components/ProfileView';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { LeaderboardView } from './components/LeaderboardView';
import { Eye } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { userProfile, loading, isStudentViewMode, setStudentViewMode, isTeacher, isAdmin } = useAuth();
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row selection:bg-amber-500 selection:text-slate-950">
      {/* Left-Side Navigation Bar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Student View Banner across main window */}
        {isStudentViewMode && (isAdmin || isTeacher) && (
          <div className="bg-emerald-950/90 border-b border-emerald-700/60 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-200 sticky top-0 z-20 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-emerald-100">Student View Active:</strong> Experiencing History Card Quest as an 8th-grade scholar.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStudentViewMode(false);
                  setCurrentTab('teacher');
                }}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Teacher Portal
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setStudentViewMode(false);
                    setCurrentTab('admin');
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Admin Console
                </button>
              )}
            </div>
          </div>
        )}

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {(currentTab === 'dashboard' || currentTab === 'student-view') && <DashboardView onNavigate={setCurrentTab} />}
          {currentTab === 'questions' && <QuestionsView />}
          {currentTab === 'packs' && <PacksView onNavigate={setCurrentTab} />}
          {currentTab === 'collection' && <CollectionView onNavigate={setCurrentTab} />}
          {currentTab === 'leaderboard' && <LeaderboardView onNavigateTab={setCurrentTab} />}
          {currentTab === 'profile' && <ProfileView />}
          {currentTab === 'teacher' && <TeacherDashboardView onNavigate={setCurrentTab} />}
          {currentTab === 'admin' && <AdminDashboardView onNavigate={setCurrentTab} />}
        </main>

        {/* Classroom Safe Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 mt-auto">
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
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <QuestionsProvider>
        <CardsProvider>
          <MainAppContent />
        </CardsProvider>
      </QuestionsProvider>
    </AuthProvider>
  );
}
