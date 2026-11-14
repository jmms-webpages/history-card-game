/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QuestionsProvider } from './context/QuestionsContext';
import { CardsProvider } from './context/CardsContext';
import { NavigationTab, AdminSubTab } from './types';
import { Sidebar } from './components/Sidebar';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { QuestionsView } from './components/QuestionsView';
import { PacksView } from './components/PacksView';
import { CollectionView } from './components/CollectionView';
import { ProfileView } from './components/ProfileView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { LeaderboardView } from './components/LeaderboardView';
import { ClassBinderView } from './components/ClassBinderView';
import { ContributeView } from './components/ContributeView';
import { SetupView } from './components/SetupView';
import { isUnassignedClass } from './utils/classes';
import { Eye } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { userProfile, loading, isStudentViewMode, setStudentViewMode, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [adminTab, setAdminTab] = useState<AdminSubTab>('overview');
  const [studentCount, setStudentCount] = useState(0);
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
          Loading...
        </p>
      </div>
    );
  }

  if (!userProfile) {
    return <AuthView />;
  }

  // Students finish setup (avatar, real name, class) before seeing the dashboard.
  if (!isAdmin && (!userProfile.nameSet || isUnassignedClass(userProfile.classroomCode))) {
    return <SetupView />;
  }

  // Teachers see the admin console; Student View shows the student screens.
  const showAdmin = isAdmin && !isStudentViewMode;
  const tab: NavigationTab = showAdmin ? 'admin' : currentTab === 'admin' ? 'dashboard' : currentTab;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row selection:bg-amber-500 selection:text-slate-950">
      {/* Left-Side Navigation Bar */}
      <Sidebar
        currentTab={tab}
        onSelectTab={setCurrentTab}
        adminTab={adminTab}
        onSelectAdminTab={setAdminTab}
        studentCount={studentCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Student View Banner across main window */}
        {isStudentViewMode && isAdmin && (
          <div className="bg-emerald-950/90 border-b border-emerald-700/60 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-200 sticky top-0 z-20 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-emerald-100">Student View Active:</strong> Experiencing History Card Quest as an 8th-grade scholar.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setStudentViewMode(false);
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
          {(tab === 'dashboard' || tab === 'student-view') && <DashboardView onNavigate={setCurrentTab} />}
          {tab === 'questions' && <QuestionsView />}
          {tab === 'packs' && <PacksView onNavigate={setCurrentTab} />}
          {tab === 'collection' && <CollectionView onNavigate={setCurrentTab} />}
          {tab === 'leaderboard' && <LeaderboardView onNavigateTab={setCurrentTab} />}
          {tab === 'classbinder' && <ClassBinderView onNavigate={setCurrentTab} />}
          {tab === 'contribute' && <ContributeView />}
          {tab === 'profile' && <ProfileView />}
          {tab === 'admin' && (
            <AdminDashboardView
              onNavigate={setCurrentTab}
              subTab={adminTab}
              onSubTabChange={setAdminTab}
              onStudentCount={setStudentCount}
            />
          )}
        </main>

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
