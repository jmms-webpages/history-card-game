export type UserRole = 'student' | 'admin';

export type CardRarity = 'Common' | 'Uncommon' | 'Rare' | 'Legendary' | 'Mythical';

export interface UserProfile {
  uid: string;
  displayName: string;
  // True once the student typed their real name in first-time setup; locked until a teacher resets it.
  nameSet?: boolean;
  avatar: string;
  classroomCode: string;
  role: UserRole;
  coins: number;
  email?: string; // Private, never exposed to other students
  createdAt: string;
  lastLoginAt: string;
  totalCardsCollected?: number;
  uniqueCardsCollected?: number;
  claimedAchievements?: string[];
  unitMastery?: Record<string, number>;
  totalQuestionsAnsweredLifetime?: number;
  totalCorrectAnswersLifetime?: number;
  // Engagement features -- all stored on the user doc so they ride along with
  // writes that already happen (no extra reads).
  claimedGoalIds?: string[];
  claimedClassMilestones?: string[];
  claimedSubmissionIds?: string[];
  classDonations?: number;
  // Hash proving the student entered the right class password when joining
  // (checked by firestore.rules). Never the password itself.
  joinProof?: string;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  questionsAnswered: number;
  correctAnswers: number;
  coinsEarned: number;
  lastQuestionAt: string;
  ostAnsweredToday?: boolean;
}

export interface Unit {
  unitId: string;
  unitName: string;
  description: string;
  order: number;
  active: boolean;
}

export interface Standard {
  standardId: string;
  standardDescription: string;
  unitId: string;
  topic?: string;
  grade: number;
  active: boolean;
}

export interface Question {
  questionId: string;
  questionText: string;
  answers: string[];
  correctAnswer: number; // 0-indexed
  explanation: string;
  standardId: string;
  standardDescription?: string;
  unitId: string;
  unitName?: string;
  topic: string;
  historicalEra: string;
  difficulty: 'easy' | 'medium' | 'hard';
  active: boolean;
  isOST?: boolean;
}

export interface Card {
  cardId: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: CardRarity;
  packTheme: string;
  unitId: string;
  standardId: string;
  historicalEra: string;
  historicalSignificance: string;
  active: boolean;
  category?: 'figure' | 'document' | 'event' | 'artifact';
  symbol?: string;
  flavorQuote?: string;
}

export interface Pack {
  packId: string;
  name: string;
  description: string;
  theme: string;
  cost: number;
  cardCount: number;
  active: boolean;
  coverColor: string;
}

export interface InventoryItem {
  instanceId: string;
  cardId: string;
  obtainedAt: string;
  isDuplicate: boolean;
  isHolo?: boolean;
  card?: Card;
}

export interface Trade {
  tradeId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  offeredCardIds: string[];
  requestedCardIds: string[];
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// A teacher-set goal the whole school works toward together.
export interface ClassGoal {
  goalId: string;
  title: string;
  metric: 'questions' | 'correct' | 'cards';
  target: number;
  baseline: number; // class total at the moment the goal started
  rewardCoins: number; // paid to every student who claims it (50 or 100)
  startedAt: string;
}

// A real class the teachers set up in Admin -> Classes. Students join one with
// a teacher-set password.
export interface ClassInfo {
  code: string; // e.g. JORDEN-3 (also the classBinders doc id)
  teacher: string; // e.g. Jorden
  name: string; // e.g. Period 3
}

export interface UpcomingTest {
  label: string;
  date: string; // YYYY-MM-DD
}

export interface GameSettings {
  dailyQuestionLimit: number;
  correctCoinReward: number;
  incorrectCoinReward: number;
  standardPackCost: number;
  duplicateSellValues: Record<CardRarity, number>;
  rarityProbabilities: Record<CardRarity, number>;
  guaranteedSlotProbabilities: Record<CardRarity, number>;
  adminUids: string[];
  classroomTimezone: string;
  // Teacher-controlled engagement settings (null / empty = off)
  classes?: ClassInfo[];
  focusUnitId?: string;
  focusCorrectReward?: number; // 15 or 20
  reviewCoinReward?: number; // 0 or 3
  classGoal?: ClassGoal | null;
  upcomingTest?: UpcomingTest | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'trivia' | 'collection' | 'general';
  icon: string;
  coinReward: number;
  requirement: {
    type: 'questions_answered' | 'correct_questions' | 'unique_cards' | 'total_cards' | 'unit_cards' | 'mythical_pulled' | 'donations';
    target: number;
    unitId?: string;
  };
}

export interface ClassroomStudent {
  uid: string;
  displayName: string;
  avatar: string;
  classroomCode: string;
  coins: number;
  uniqueCards: number;
  totalCards: number;
  questionsAnswered: number;
  correctAnswers: number;
  lastActive: string;
}

export type NavigationTab = 
  | 'dashboard'
  | 'questions'
  | 'packs'
  | 'collection'
  | 'leaderboard'
  | 'classbinder'
  | 'contribute'
  | 'profile'
  | 'admin'
  | 'student-view';

export type AdminSubTab =
  | 'overview'
  | 'students'
  | 'questions'
  | 'cards'
  | 'packs'
  | 'economy'
  | 'units'
  | 'standards'
  | 'engagement'
  | 'submissions'
  | 'classes';
