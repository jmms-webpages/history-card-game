import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavigationTab } from '../types';
import { getAvatarById } from '../data/avatars';
import { 
  Compass, 
  HelpCircle, 
  Package, 
  Library, 
  Repeat, 
  User, 
  GraduationCap, 
  LogOut, 
  Coins, 
  Menu, 
  X,
  ShieldCheck,
  Eye
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
    { id: 'dashboard', label: 'Dashboard', icon: <Compass className="w-4 h-4" /> },
    { id: 'questions', label: 'Questions', icon: <HelpCircle className="w-4 h-4" />, badge: 'Phase 2' },
    { id: 'packs', label: 'Packs', icon: <Package className="w-4 h-4" />, badge: 'Phase 3' },
    { id: 'collection', label: 'Collection', icon: <Library className="w-4 h-4" />, badge: 'Phase 3' },
    { id: 'trading', label: 'Trading', icon: <Repeat className="w-4 h-4" />, badge: 'Phase 4' },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> }
  ];

  // Admin / Teacher Portal Tab
  if (isTeacher || isAdmin) {
    navItems.push({
      id: 'teacher',
      label: isAdmin ? 'Admin Portal' : 'Teacher Portal',
      icon: <GraduationCap className="w-4 h-4 text-amber-300" />,
      badge: isAdmin ? 'Admin' : 'Teacher'
    });

    // Dedicated "Student View" Tab for Admin
    navItems.push({
      id: 'student-view',
      label: 'Student View',
      icon: <Eye className={`w-4 h-4 ${isStudentViewMode ? 'text-emerald-400' : 'text-slate-400'}`} />,
      badge: isStudentViewMode ? 'Active' : 'Preview'
    });
  }

  const handleTabClick = (tab: NavigationTab) => {
    if (tab === 'student-view') {
      setStudentViewMode(true);
      onSelectTab('dashboard');
    } else {
      if (tab === 'teacher') {
        setStudentViewMode(false);
      }
      onSelectTab(tab);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      
      {/* Student View Notification Banner when Admin is previewing as student */}
      {isStudentViewMode && (isAdmin || isTeacher) && (
        <div className="bg-emerald-950/90 border-b border-emerald-700/60 px-4 py-2 text-xs flex items-center justify-between text-emerald-200">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-emerald-100">Student View Mode Active:</strong> You are experiencing History Card Quest exactly as an 8th-grade student sees it.
            </span>
          </div>
          <button
            id="exit-student-view-banner-button"
            onClick={() => {
              setStudentViewMode(false);
              onSelectTab('teacher');
            }}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer shrink-0 ml-3"
          >
            Return to Admin Portal
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Grade 8 Badge */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => handleTabClick('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xl font-black text-slate-950 shadow-inner">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-amber-400 font-serif">
                  History Card Quest
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  Ohio 8th Grade
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden md:block">
                Social Studies Standards Quest
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = (currentTab === item.id) || (item.id === 'student-view' && isStudentViewMode && currentTab === 'dashboard');
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? item.id === 'student-view'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${
                      item.id === 'student-view' && isStudentViewMode
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side: Coins, Quick Toggle, User Avatar Pill, Logout */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Quick Student View Toggle for Admin */}
            {(isAdmin || isTeacher) && (
              <button
                id="quick-student-view-toggle"
                onClick={toggleStudentViewMode}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isStudentViewMode
                    ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300 hover:bg-emerald-900/80'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
                title={isStudentViewMode ? "Currently previewing as student. Click to exit." : "Preview game as an 8th grade student"}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isStudentViewMode ? 'Student View: ON' : 'Student View'}</span>
              </button>
            )}

            {/* Coins Counter */}
            <div 
              id="user-coin-badge"
              className="flex items-center gap-1.5 bg-slate-800/90 border border-amber-500/30 px-3 py-1.5 rounded-full text-amber-300 font-mono font-bold text-sm shadow-sm"
              title="Classroom Coins - Earn by answering daily history questions"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{userProfile.coins ?? 0}</span>
            </div>

            {/* Profile Avatar Pill */}
            <button
              id="profile-avatar-button"
              onClick={() => handleTabClick('profile')}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            >
              <div className={`w-7 h-7 rounded-full ${currentAvatar.color} flex items-center justify-center text-xs font-bold text-white shadow`}>
                {currentAvatar.badge}
              </div>
              <span className="text-sm font-medium text-slate-200 hidden sm:inline max-w-[120px] truncate">
                {userProfile.displayName}
              </span>
              {isAdmin && (
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  Admin
                </span>
              )}
            </button>

            {/* Logout button */}
            <button
              id="nav-logout-button"
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu hamburger */}
            <button
              id="nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = (currentTab === item.id) || (item.id === 'student-view' && isStudentViewMode && currentTab === 'dashboard');
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                  isActive
                    ? item.id === 'student-view'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    item.id === 'student-view' && isStudentViewMode
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
