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
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { userProfile, logout, isTeacher } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!userProfile) return null;

  const currentAvatar = getAvatarById(userProfile.avatar);

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Compass className="w-4 h-4" /> },
    { id: 'questions', label: 'Questions', icon: <HelpCircle className="w-4 h-4" />, badge: 'Phase 2' },
    { id: 'packs', label: 'Packs', icon: <Package className="w-4 h-4" />, badge: 'Phase 3' },
    { id: 'collection', label: 'Collection', icon: <Library className="w-4 h-4" />, badge: 'Phase 3' },
    { id: 'trading', label: 'Trading', icon: <Repeat className="w-4 h-4" />, badge: 'Phase 4' },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> }
  ];

  if (isTeacher) {
    navItems.push({
      id: 'teacher',
      label: 'Teacher Portal',
      icon: <GraduationCap className="w-4 h-4 text-amber-300" />,
      badge: 'Admin'
    });
  }

  const handleTabClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Grade 8 Badge */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleTabClick('dashboard')}>
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
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side: Coins, User Avatar Pill, Logout */}
          <div className="flex items-center gap-3">
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
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full transition-colors"
            >
              <div className={`w-7 h-7 rounded-full ${currentAvatar.color} flex items-center justify-center text-xs font-bold text-white shadow`}>
                {currentAvatar.badge}
              </div>
              <span className="text-sm font-medium text-slate-200 hidden sm:inline max-w-[120px] truncate">
                {userProfile.displayName}
              </span>
              {isTeacher && (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 hidden sm:inline" title="Teacher / Admin Verified" />
              )}
            </button>

            {/* Logout button */}
            <button
              id="nav-logout-button"
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
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
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
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
