import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCards } from '../context/CardsContext';
import { useQuestions } from '../context/QuestionsContext';
import { HISTORICAL_ACHIEVEMENTS } from '../data/achievements';
import { INITIAL_CLASSROOM_STUDENTS } from '../data/roster';
import { getAvatarById } from '../data/avatars';
import { Achievement, ClassroomStudent, Card } from '../types';
import { sounds } from '../utils/audio';
import { 
  Trophy, 
  Award, 
  Medal, 
  Coins, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Flame, 
  Crown,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';

interface LeaderboardViewProps {
  onNavigateTab?: (tab: any) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onNavigateTab }) => {
  const { userProfile, updateUserProfile, updateCoins } = useAuth();
  const { inventoryCards, stats } = useCards();
  const { dailyActivity } = useQuestions();

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements'>('leaderboard');
  const [rankingMetric, setRankingMetric] = useState<'cards' | 'trivia'>('cards');
  const [achievementCategory, setAchievementCategory] = useState<string>('all');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [justClaimedReward, setJustClaimedReward] = useState<{ id: string; reward: number } | null>(null);

  // Student stats for current user

  const currentUserStudent: ClassroomStudent = useMemo(() => {
    return {
      uid: userProfile?.uid || 'current-user',
      displayName: userProfile?.displayName || 'You',
      avatar: userProfile?.avatar || 'pioneer',
      classroomCode: userProfile?.classroomCode || 'JMMS-8TH-2026',
      coins: userProfile?.coins || 0,
      uniqueCards: stats.uniqueCards,
      totalCards: inventoryCards.length,
      questionsAnswered: dailyActivity?.questionsAnswered || 0,
      correctAnswers: dailyActivity?.correctAnswers || 0,
      lastActive: 'Just now'
    };
  }, [userProfile, stats.uniqueCards, inventoryCards.length, dailyActivity]);

  // Combined sorted roster
  const sortedStudents = useMemo(() => {
    // Combine roster with current user if not already in roster
    const rosterList = [...INITIAL_CLASSROOM_STUDENTS];
    const existingIdx = rosterList.findIndex(s => s.uid === currentUserStudent.uid);
    if (existingIdx >= 0) {
      rosterList[existingIdx] = currentUserStudent;
    } else {
      rosterList.push(currentUserStudent);
    }

    return rosterList.sort((a, b) => {
      if (rankingMetric === 'cards') {
        if (b.uniqueCards !== a.uniqueCards) return b.uniqueCards - a.uniqueCards;
        return b.totalCards - a.totalCards;
      }
      if (rankingMetric === 'trivia') {
        if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
        return (b.questionsAnswered > 0 ? b.correctAnswers / b.questionsAnswered : 0) -
               (a.questionsAnswered > 0 ? a.correctAnswers / a.questionsAnswered : 0);
      }
      return 0;
    });
  }, [currentUserStudent, rankingMetric]);

  // Check progress and unlocked status for each achievement
  const userClaimedList = userProfile?.claimedAchievements || [];

  const checkAchievementProgress = (ach: Achievement): { current: number; max: number; isCompleted: boolean; isClaimed: boolean } => {
    const isClaimed = userClaimedList.includes(ach.id);
    let current = 0;
    const max = ach.requirement.target;

    switch (ach.requirement.type) {
      case 'questions_answered':
        current = dailyActivity?.questionsAnswered || 0;
        break;
      case 'correct_questions':
        current = dailyActivity?.correctAnswers || 0;
        break;
      case 'unique_cards':
        current = stats.uniqueCards;
        break;
      case 'total_cards':
        current = inventoryCards.length;
        break;
      case 'unit_cards': {
        const unitId = ach.requirement.unitId;
        const ownedUnitCards = new Set(
          inventoryCards
            .filter(item => item.card?.unitId === unitId)
            .map(item => item.cardId)
        );
        current = ownedUnitCards.size;
        break;
      }
      case 'mythical_pulled': {
        const hasMythical = inventoryCards.some(
          item => item.card?.rarity === 'Legendary' || item.card?.rarity === 'Mythical'
        );
        current = hasMythical ? 1 : 0;
        break;
      }
    }

    const isCompleted = current >= max;
    return {
      current: Math.min(current, max),
      max,
      isCompleted,
      isClaimed
    };
  };

  const handleClaimAchievement = async (ach: Achievement) => {
    if (claimingId) return;
    setClaimingId(ach.id);
    sounds.playAchievement();

    const updatedClaimed = [...userClaimedList, ach.id];
    await updateUserProfile({ claimedAchievements: updatedClaimed });
    await updateCoins(ach.coinReward);

    setJustClaimedReward({ id: ach.id, reward: ach.coinReward });
    setTimeout(() => {
      setJustClaimedReward(null);
      setClaimingId(null);
    }, 2500);
  };

  const completedAchievementsCount = useMemo(() => {
    return HISTORICAL_ACHIEVEMENTS.filter(a => checkAchievementProgress(a).isCompleted).length;
  }, [userClaimedList, stats.uniqueCards, inventoryCards, dailyActivity]);

  const filteredAchievements = useMemo(() => {
    if (achievementCategory === 'all') return HISTORICAL_ACHIEVEMENTS;
    return HISTORICAL_ACHIEVEMENTS.filter(a => a.category === achievementCategory);
  }, [achievementCategory]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Classroom Honor Roll
              </span>
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                Code: {userProfile?.classroomCode || 'JMMS-8TH-2026'}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-100">
              Rankings & Historical Milestones
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Track classroom standing across trivia accuracy and card collecting. Unlock historical achievements to earn bonus coin grants!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3 shadow-inner">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Badges Unlocked</div>
                <div className="text-base font-black font-mono text-slate-100">
                  {completedAchievementsCount} <span className="text-xs text-slate-500 font-normal">/ {HISTORICAL_ACHIEVEMENTS.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex gap-2 mt-6 pt-5 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Classroom Leaderboard</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'achievements'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Historical Milestones ({completedAchievementsCount}/{HISTORICAL_ACHIEVEMENTS.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Metric Selector Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>Sort Rankings By:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRankingMetric('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  rankingMetric === 'cards'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Card Binder Completion</span>
              </button>

              <button
                type="button"
                onClick={() => setRankingMetric('trivia')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  rankingMetric === 'trivia'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Trivia Accuracy</span>
              </button>
            </div>
          </div>

          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {sortedStudents.slice(0, 3).map((student, idx) => {
              const avatar = getAvatarById(student.avatar);
              const isCurrentUser = student.uid === currentUserStudent.uid;
              const placeStyles = [
                {
                  rank: 1,
                  badge: '1st Place',
                  badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                  cardBorder: 'border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-slate-900',
                  crown: 'text-amber-400'
                },
                {
                  rank: 2,
                  badge: '2nd Place',
                  badgeColor: 'bg-slate-300/20 text-slate-200 border-slate-400/40',
                  cardBorder: 'border-slate-500/40 bg-gradient-to-b from-slate-400/10 to-slate-900',
                  crown: 'text-slate-300'
                },
                {
                  rank: 3,
                  badge: '3rd Place',
                  badgeColor: 'bg-amber-700/20 text-amber-600 border-amber-700/40',
                  cardBorder: 'border-amber-700/40 bg-gradient-to-b from-amber-700/10 to-slate-900',
                  crown: 'text-amber-600'
                }
              ][idx];

              return (
                <div
                  key={student.uid}
                  className={`rounded-2xl border p-5 relative shadow-xl flex flex-col items-center text-center ${placeStyles.cardBorder}`}
                >
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${placeStyles.badgeColor}`}>
                      {placeStyles.badge}
                    </span>
                  </div>

                  <div className="relative mt-2 mb-3">
                    <Crown className={`w-6 h-6 absolute -top-4 left-1/2 -translate-x-1/2 ${placeStyles.crown}`} />
                    <div className={`w-16 h-16 rounded-2xl ${avatar.color} flex items-center justify-center text-3xl shadow-lg border-2 border-slate-700`}>
                      {avatar.badge}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="font-bold text-slate-100 text-sm">{student.displayName}</h3>
                    {isCurrentUser && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">{avatar.name} Persona</p>

                  <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-1 text-center">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Cards</div>
                      <div className="text-xs font-black font-mono text-amber-300">{student.uniqueCards}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">Trivia</div>
                      <div className="text-xs font-black font-mono text-indigo-300">{student.correctAnswers}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Classroom Rankings Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Medal className="w-4 h-4 text-amber-400" />
                <span>Classroom Roster Rankings ({sortedStudents.length} Scholars)</span>
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {userProfile?.classroomCode}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Rank</th>
                    <th className="py-3 px-4">Student & Persona</th>
                    <th className="py-3 px-4 text-center">Binder Progress</th>
                    <th className="py-3 px-4 text-center">Trivia Accuracy</th>
                    <th className="py-3 px-4 text-right">Coins</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedStudents.map((student, index) => {
                    const avatar = getAvatarById(student.avatar);
                    const isCurrentUser = student.uid === currentUserStudent.uid;
                    const binderPercent = Math.min(100, Math.round((student.uniqueCards / stats.totalInSet) * 100));
                    const accuracyPercent = student.questionsAnswered > 0
                      ? Math.round((student.correctAnswers / student.questionsAnswered) * 100)
                      : 0;

                    return (
                      <tr
                        key={student.uid}
                        className={`transition-colors ${
                          isCurrentUser 
                            ? 'bg-amber-500/10 hover:bg-amber-500/15' 
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                          {index === 0 ? '🥇 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : `#${index + 1}`}
                        </td>
                        
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${avatar.color} flex items-center justify-center text-base shrink-0 shadow`}>
                              {avatar.badge}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-100">{student.displayName}</span>
                                {isCurrentUser && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1 py-0.2 rounded font-mono font-bold">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">{avatar.name}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-slate-200">
                              {student.uniqueCards} <span className="text-slate-500 font-normal">/ {stats.totalInSet}</span>
                            </span>
                            <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className="bg-amber-400 h-full rounded-full transition-all"
                                style={{ width: `${binderPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-bold text-indigo-300">
                            {student.correctAnswers} <span className="text-slate-500 font-normal">({accuracyPercent}%)</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-300">
                            <Coins className="w-3.5 h-3.5" />
                            {student.coins}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACHIEVEMENTS & BADGES */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <span className="text-xs text-slate-400 mr-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filter Category:
            </span>
            {[
              { id: 'all', label: 'All Achievements' },
              { id: 'trivia', label: 'Trivia Scholars' },
              { id: 'collection', label: 'Card Collection' },
              { id: 'general', label: 'Rarity Milestones' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setAchievementCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  achievementCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAchievements.map((ach) => {
              const progress = checkAchievementProgress(ach);
              const percent = Math.min(100, Math.round((progress.current / progress.max) * 100));
              const isClaiming = claimingId === ach.id;
              const justClaimed = justClaimedReward?.id === ach.id;

              return (
                <div
                  key={ach.id}
                  className={`rounded-2xl border p-5 transition-all relative overflow-hidden shadow-lg ${
                    progress.isClaimed
                      ? 'bg-slate-900/60 border-emerald-900/50'
                      : progress.isCompleted
                      ? 'bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/60 ring-1 ring-amber-500/30'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Badge Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow ${
                      progress.isCompleted
                        ? 'bg-amber-500/20 border border-amber-500/40'
                        : 'bg-slate-800 border border-slate-700 opacity-60'
                    }`}>
                      {ach.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-sm text-slate-100 truncate">
                          {ach.title}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 shrink-0">
                          <Coins className="w-3.5 h-3.5" />
                          +{ach.coinReward}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {ach.description}
                      </p>

                      {/* Progress Bar & Status */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400">
                            {progress.isCompleted ? 'Completed' : 'Progress'}
                          </span>
                          <span className="text-slate-300 font-bold">
                            {progress.current} / {progress.max}
                          </span>
                        </div>

                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              progress.isCompleted ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Claim Button / Status Badge */}
                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                        {progress.isClaimed ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            Claimed
                          </span>
                        ) : progress.isCompleted ? (
                          <button
                            type="button"
                            onClick={() => handleClaimAchievement(ach)}
                            disabled={isClaiming}
                            className="w-full py-2 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {isClaiming ? 'Claiming...' : `Claim +${ach.coinReward} Coins`}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                            <Lock className="w-3.5 h-3.5" />
                            Locked
                          </span>
                        )}

                        {justClaimed && (
                          <span className="text-xs font-bold text-amber-300 animate-bounce">
                            +{justClaimedReward.reward} Coins Granted!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
