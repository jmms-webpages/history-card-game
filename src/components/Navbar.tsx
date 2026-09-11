import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavigationTab } from '../types';
import { getAvatarById } from '../data/avatars';
import { 
  Compass, 
  HelpCircle, 
  Package, 
  Library, 
  User, 
  GraduationCap, 
  LogOut, 
  Coins, 
  Menu, 
  X,
  ShieldCheck,
  Eye,
  Trophy,
  Settings
} from 'lucide-react';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { 
    userProfile, 
    logout, 
    isTeacher, 
    isAdmin, 
    isStudentViewMode, 
    setStudentViewMode, 
    toggleStudentViewMode 
  } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!userProfile) return null;

  const currentAvatar = getAvatarById(userProfile.avatar);

  // Define regular tabs available to all players
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'questions', label: 'Trivia', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { id: 'packs', label: 'Packs', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'collection', label: 'Binder', icon: <Library className="w-3.5 h-3.5" /> },
    { id: 'leaderboard', label: 'Honor Roll', icon: <Trophy className="w-3.5 h-3.5" /> }
  ];

  // Teacher Portal Tab (Available to both teachers and admins)
  if (isTeacher || isAdmin) {
    navItems.push({
      id: 'teacher',
      label: 'Teacher Portal',
      icon: <GraduationCap className="w-3.5 h-3.5 text-amber-300" />,
      badge: 'Roster'
    });
  }

  // Admin Console Tab (Dedicated to program runner/admin)
  if (isAdmin) {
    navItems.push({
      id: 'admin',
      label: 'Admin Console',
      icon: <Settings className="w-3.5 h-3.5 text-amber-400" />,
      badge: 'Program'
    });
  }

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
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      
      {/* Student View Notification Banner when Educator/Admin is previewing */}
      {isStudentViewMode && (isAdmin || isTeacher) && (
        <div className="bg-emerald-950/90 border-b border-emerald-700/60 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-200">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-emerald-100">Student View Active:</strong> You are experiencing the app exactly as an 8th-grade student sees it.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="exit-student-view-to-teacher-button"
              onClick={() => {
                setStudentViewMode(false);
                onSelectTab('teacher');
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Teacher Dashboard
            </button>
            {isAdmin && (
              <button
                id="exit-student-view-to-admin-button"
                onClick={() => {
                  setStudentViewMode(false);
                  onSelectTab('admin');
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Admin Console
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Grade 8 Badge */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer shrink-0" 
            onClick={() => handleTabClick('dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-lg font-black text-slate-950 shadow-inner shrink-0">
              ⚔️
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-amber-400 font-serif whitespace-nowrap">
                  History Card Quest
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 whitespace-nowrap">
                  Ohio 8th
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 shrink-0">
            {navItems.map((item) => {
              const isActive = (currentTab === item.id) && !(isStudentViewMode && (item.id === 'teacher' || item.id === 'admin'));
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? item.id === 'admin'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : item.id === 'teacher'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-bold'
                        : 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                      isActive && item.id === 'admin' 
                        ? 'bg-slate-950 text-amber-300'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side: Coins, Student View Toggle, User Avatar Pill, Logout, Mobile Menu */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Quick Student View Toggle for Admin/Teacher */}
            {(isAdmin || isTeacher) && (
              <button
                id="quick-student-view-toggle"
                onClick={toggleStudentViewMode}
                className={`hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                  isStudentViewMode
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
                title={isStudentViewMode ? "Currently previewing as student. Click to exit." : "Preview game as an 8th grade student"}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden 2xl:inline">{isStudentViewMode ? 'Student View: ON' : 'Student View'}</span>
              </button>
            )}

            {/* Coins Counter */}
            <div 
              id="user-coin-badge"
              className="flex items-center gap-1.5 bg-slate-800/90 border border-amber-500/30 px-2.5 py-1 rounded-full text-amber-300 font-mono font-bold text-xs shadow-sm shrink-0"
              title="Classroom Coins - Earn by answering daily history questions"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{userProfile.coins ?? 0}</span>
            </div>

            {/* Profile Avatar Pill */}
            <button
              id="profile-avatar-button"
              onClick={() => handleTabClick('profile')}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-2 py-1 rounded-full transition-colors cursor-pointer shrink-0"
            >
              <div className={`w-6 h-6 rounded-full ${currentAvatar.color} flex items-center justify-center text-[10px] font-bold text-white shadow shrink-0`}>
                {currentAvatar.badge}
              </div>
              <span className="text-xs font-medium text-slate-200 hidden sm:inline max-w-[100px] truncate">
                {userProfile.displayName}
              </span>
              {isAdmin && (
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Admin
                </span>
              )}
            </button>

            {/* Logout button */}
            <button
              id="nav-logout-button"
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu hamburger (shown on < xl screens) */}
            <button
              id="nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = (currentTab === item.id) && !(isStudentViewMode && (item.id === 'teacher' || item.id === 'admin'));
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer ${
                  isActive
                    ? item.id === 'admin'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-800 text-slate-400 border-slate-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Mobile Student View toggle for teachers & admins */}
          {(isAdmin || isTeacher) && (
            <button
              onClick={() => {
                toggleStudentViewMode();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium bg-emerald-950/40 border border-emerald-800 text-emerald-300 hover:bg-emerald-900/40 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Student View Mode</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-900 text-emerald-200">
                {isStudentViewMode ? 'Active' : 'Off'}
              </span>
            </button>
          )}

          <button
            onClick={() => handleTabClick('profile')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Profile & Scholar Settings</span>
          </button>
        </div>
      )}
    </header>
  );
};

