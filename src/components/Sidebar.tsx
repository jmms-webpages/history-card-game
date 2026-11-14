import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavigationTab, AdminSubTab } from '../types';
import { useQuestions } from '../context/QuestionsContext';
import { useCards } from '../context/CardsContext';
import { INITIAL_UNITS } from '../data/initialCurriculum';
import { getAvatarById } from '../data/avatars';
import { Compass, HelpCircle, Package, Library, User, LogOut, Coins, Menu, X, ShieldCheck, Eye, Trophy, Settings, ChevronRight, Users, Pencil, LayoutDashboard, BookOpen, Sliders, Award, MessageSquare, ArrowLeft } from 'lucide-react';
import { AvatarFace } from './AvatarFace';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  adminTab: AdminSubTab;
  onSelectAdminTab: (tab: AdminSubTab) => void;
  studentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, adminTab, onSelectAdminTab, studentCount }) => {
  const { 
    userProfile, 
    logout,  
    isAdmin, 
    isStudentViewMode, 
    setStudentViewMode, 
    toggleStudentViewMode 
  } = useAuth();
  const { questions } = useQuestions();
  const { cards } = useCards();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!userProfile) return null;

  // Teachers get the admin menu; Student View swaps back to the student menu.
  const adminMode = isAdmin && !isStudentViewMode;
  const adminNavItems: { id: AdminSubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'System Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'classes', label: `Classes & Students (${studentCount})`, icon: <Users className="w-4 h-4" /> },
    { id: 'honor', label: 'Honor Roll & Goals', icon: <Trophy className="w-4 h-4" /> },
    { id: 'submissions', label: 'Student Questions', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'questions', label: `Question Bank (${questions.length})`, icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'cards', label: `Card Catalog & Rarity (${cards.length})`, icon: <Library className="w-4 h-4" /> },
    { id: 'packs', label: 'Packs & Economy', icon: <Package className="w-4 h-4" /> }
  ];

  const currentAvatar = getAvatarById(userProfile.avatar);

  const mainNavItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Compass className="w-4 h-4" /> },
    { id: 'questions', label: 'Daily Trivia', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'packs', label: 'Card Packs', icon: <Package className="w-4 h-4" /> },
    { id: 'collection', label: 'Card Binder', icon: <Library className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Honor Roll', icon: <Trophy className="w-4 h-4" /> },
    { id: 'classbinder', label: 'Class Binder', icon: <Users className="w-4 h-4" /> },
    { id: 'contribute', label: 'Write a Question', icon: <Pencil className="w-4 h-4" /> },
    { id: 'profile', label: 'My Scholar Profile', icon: <User className="w-4 h-4" /> }
  ];

  const handleTabClick = (tab: NavigationTab) => {
    if (tab === 'student-view') {
      setStudentViewMode(true);
      onSelectTab('dashboard');
    } else {
      if (tab === 'teacher' || tab === 'admin') {
        setStudentViewMode(false);
      }
      onSelectTab(tab);
    }
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Part: Branding & Currency & Navigation */}
      <div className="space-y-5">
        
        {/* Logo & School Header */}
        <div 
          className="flex items-center gap-3 px-2 py-1 cursor-pointer group"
          onClick={() => handleTabClick('dashboard')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xl font-black text-slate-950 shadow-md group-hover:scale-105 transition-transform shrink-0">
            ⚔️
          </div>
          <div className="min-w-0">
            <h1 className="font-serif font-black text-base text-amber-400 tracking-tight leading-tight truncate group-hover:text-amber-300 transition-colors">
              History Card Quest
            </h1>
            <p className="text-[11px] font-medium text-slate-400 truncate">
              Ohio 8th Grade Social Studies
            </p>
          </div>
        </div>

        {adminMode ? (
          <div>
            <p className="px-2.5 mb-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-400/80 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Admin Console</span>
            </p>
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const isActive = adminTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-admin-${item.id}`}
                    type="button"
                    onClick={() => { onSelectAdminTab(item.id); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-950/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <span className={isActive ? 'text-slate-950' : 'text-slate-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <button
              id="sidebar-toggle-student-view"
              type="button"
              onClick={() => { toggleStudentViewMode(); onSelectTab('dashboard'); setMobileOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer mt-3 bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Student View</span>
              </div>
            </button>
          </div>
        ) : (
          <>
        {/* Currency & Quick Pack Launcher Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Classroom Coins
                </p>
                <p className="text-base font-black font-mono text-amber-300 leading-none mt-0.5">
                  {userProfile.coins ?? 0}
                </p>
              </div>
            </div>
            <button
              id="sidebar-quick-packs-button"
              type="button"
              onClick={() => handleTabClick('packs')}
              className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
            >
              Get Packs
            </button>
          </div>
        </div>

        {/* Primary Navigation Menu */}
        <div>
          <p className="px-2.5 mb-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Main Quest
          </p>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = (currentTab === item.id) && !(isStudentViewMode && (item.id === 'teacher' || item.id === 'admin'));
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-950/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-slate-950' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

          </>
        )}
        {isAdmin && isStudentViewMode && (
          <div className="pt-2 border-t border-slate-800/80">
            <button
              id="sidebar-toggle-student-view"
              type="button"
              onClick={() => { toggleStudentViewMode(); setMobileOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-emerald-950/80 border-emerald-700 text-emerald-300 hover:bg-emerald-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin Console</span>
            </button>
          </div>
        )}

      </div>

      {/* Bottom Part: User Profile & Logout */}
      <div className="pt-4 border-t border-slate-800 mt-6 space-y-2">
        <div 
          onClick={() => { if (!adminMode) handleTabClick('profile'); }}
          className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition-colors cursor-pointer group"
        >
          <div className={`w-8 h-8 rounded-full ${currentAvatar.color} overflow-hidden flex items-center justify-center text-xs font-bold text-white shadow shrink-0`}>
            <AvatarFace avatar={currentAvatar} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-200 truncate group-hover:text-amber-300 transition-colors">
              {userProfile.displayName}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {isAdmin ? 'Teacher & Director' : '8th Grade Scholar'}
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
        </div>

        <button
          id="sidebar-sign-out-button"
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-900/50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header (< lg) */}
      <header className="lg:hidden sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="mobile-sidebar-toggle-button"
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleTabClick('dashboard')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-base font-black text-slate-950 shadow-sm">
              ⚔️
            </div>
            <span className="font-serif font-black text-sm text-amber-400 tracking-tight">
              History Card Quest
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Coin Counter */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-amber-500/30 px-2.5 py-1 rounded-full text-amber-300 font-mono font-bold text-xs">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{userProfile.coins ?? 0}</span>
          </div>

          {/* Quick User Avatar */}
          <button
            type="button"
            onClick={() => { if (!adminMode) handleTabClick('profile'); }}
            className={`w-7 h-7 rounded-full ${currentAvatar.color} overflow-hidden flex items-center justify-center text-xs font-bold text-white shadow`}
          >
            <AvatarFace avatar={currentAvatar} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 p-4 z-50 lg:hidden transform transition-transform duration-200 ease-in-out shadow-2xl flex flex-col ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          {navContent}
        </div>
      </aside>

      {/* Desktop Sticky Sidebar (lg and up) */}
      <aside className="hidden lg:flex w-64 xl:w-72 h-screen sticky top-0 bg-slate-900 border-r border-slate-800 flex-col p-4 shrink-0 overflow-y-auto shadow-xl z-30">
        {navContent}
      </aside>
    </>
  );
};
