export type UserRole = 'student' | 'admin';

export type CardRarity = 'Common' | 'Uncommon' | 'Rare' | 'Legendary' | 'Mythical';

export interface UserProfile {
  uid: string;
  displayName: string;
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
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  questionsAnswered: number;
  correctAnswers: number;
  coinsEarned: number;
  lastQuestionAt: string;
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
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'trivia' | 'collection' | 'general';
  icon: string;
  coinReward: number;
  requirement: {
    type: 'questions_answered' | 'correct_questions' | 'unique_cards' | 'total_cards' | 'unit_cards' | 'mythical_pulled';
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
  | 'profile'
  | 'admin'
  | 'student-view';
