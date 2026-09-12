import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HISTORICAL_AVATARS, getAvatarById } from '../data/avatars';
import { HISTORICAL_ACHIEVEMENTS } from '../data/achievements';
import { 
  User, 
  Shield, 
  Coins, 
  Check, 
  Save, 
  Sparkles, 
  Lock, 
  LogOut, 
  BookOpen, 
  BadgeCheck,
  Award
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { 
    userProfile, 
    updateUserProfile, 
    updateCoins, 
    logout,  
    isAdmin, 
    isStudentViewMode, 
    toggleStudentViewMode 
  } = useAuth();
  
  if (!userProfile) return null;

  const [classroomCode, setClassroomCode] = useState(userProfile.classroomCode);
  const [selectedAvatarId, setSelectedAvatarId] = useState(userProfile.avatar);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Note: displayName is intentionally NOT editable here. It is derived
    // automatically from the student's real Google account name and is
    // locked server-side (see firestore.rules) so it can never be spoofed.
    await updateUserProfile({
      classroomCode: classroomCode.trim().toUpperCase(),
      avatar: selectedAvatarId
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClaimBonusCoins = async () => {
    await updateCoins(25);
  };

  const currentAvatar = getAvatarById(selectedAvatarId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className={`w-24 h-24 rounded-3xl ${currentAvatar.color} flex items-center justify-center text-5xl shadow-2xl border-2 border-amber-400/40 shrink-0`}>
            {currentAvatar.badge}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100">
                {userProfile.displayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {isAdmin ? 'Master Administrator' : '8th Grade Student'}
              </span>
            </div>

            <p className="text-sm text-slate-300">
              Historical Persona: <span className="font-semibold text-amber-300">{currentAvatar.name}</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentAvatar.title} • {currentAvatar.era}
            </p>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 pt-4 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold">
                <Coins className="w-4 h-4" />
                <span>{userProfile.coins ?? 0} Coins</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                <span className="text-slate-500">Class:</span>
                <span className="text-slate-200">{userProfile.classroomCode}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                <span className="text-slate-500">Safe ID:</span>
                <span className="text-slate-200">#{userProfile.uid.substring(0, 8)}</span>
              </div>
            </div>
          </div>

          {/* Test Coins (admin/dev only -- never shown to students, to protect the coin economy) / Signout Actions */}
          <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
            {isAdmin && (
              <button
                onClick={handleClaimBonusCoins}
                className="py-2 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                title="Admin/testing only: not shown to students"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+25 Test Coins (Admin)</span>
              </button>
            )}
            <button
              onClick={logout}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Customize Your Student Profile
            </h2>
          </div>
          {savedSuccess && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full">
              <Check className="w-3.5 h-3.5" />
              Saved successfully!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Display Name
            </label>
            <div className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 text-sm flex items-center gap-2 cursor-not-allowed">
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{userProfile.displayName}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Your display name is set automatically from your school Google account and can't be changed here.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Classroom Code
            </label>
            <input
              type="text"
              required
              value={classroomCode}
              onChange={(e) => setClassroomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Your teacher's 8th Grade Social Studies period code.
            </p>
          </div>
        </div>

        {/* Historical Avatar Picker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Select Your 8th Grade Historical Persona
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {HISTORICAL_AVATARS.map((avatar) => {
              const isSelected = selectedAvatarId === avatar.id;
              return (
                <div
                  key={avatar.id}
                  onClick={() => setSelectedAvatarId(avatar.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/15 shadow-md ring-1 ring-amber-400/40'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${avatar.color} flex items-center justify-center text-xl shrink-0 shadow`}>
                    {avatar.badge}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-100 truncate">
                        {avatar.name}
                      </h4>
                      {isSelected && (
                        <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-amber-300/90 truncate font-medium">
                      {avatar.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {avatar.era}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </form>

      {/* Earned Badges & Milestones Showcase */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Claimed Historical Milestones ({userProfile.claimedAchievements?.length || 0})
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {HISTORICAL_ACHIEVEMENTS.length} Total Badges Available
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {HISTORICAL_ACHIEVEMENTS.map((ach) => {
            const isClaimed = userProfile.claimedAchievements?.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`p-3 rounded-xl border text-center flex flex-col items-center transition-all ${
                  isClaimed
                    ? 'bg-amber-500/10 border-amber-500/30 text-slate-100 shadow'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-40 text-slate-500'
                }`}
              >
                <div className="text-2xl mb-1">{ach.icon}</div>
                <div className="text-xs font-bold truncate w-full">{ach.title}</div>
                <div className="text-[10px] font-mono mt-0.5">
                  {isClaimed ? '✓ Claimed' : 'Locked'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy Guarantee Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Student Privacy & Classroom Safety
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              History Card Quest is built following strict student privacy standards:
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Your email address is confidential and is never displayed to other students.</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>No public academic leaderboards or test scores are exposed. The game celebrates historical collecting and curiosity.</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Only your display name, chosen historical avatar, and unique safe identifier ever appear on the classroom Honor Roll.</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Your display name is generated automatically from your school account and can't be changed to something else.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};
