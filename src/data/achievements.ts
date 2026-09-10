import { Achievement } from '../types';

export const HISTORICAL_ACHIEVEMENTS: Achievement[] = [
  // Trivia Scholars
  {
    id: 'first-trivia',
    title: 'First Step in History',
    description: 'Answer your first Ohio Social Studies daily question.',
    category: 'trivia',
    icon: '🎯',
    coinReward: 20,
    requirement: {
      type: 'questions_answered',
      target: 1
    }
  },
  {
    id: 'trivia-apprentice',
    title: 'Buckeye Scholar',
    description: 'Answer 10 daily trivia questions correctly.',
    category: 'trivia',
    icon: '📜',
    coinReward: 50,
    requirement: {
      type: 'correct_questions',
      target: 10
    }
  },
  {
    id: 'trivia-master',
    title: 'Grand Historian of 1877',
    description: 'Answer 25 daily trivia questions correctly.',
    category: 'trivia',
    icon: '🏛️',
    coinReward: 120,
    requirement: {
      type: 'correct_questions',
      target: 25
    }
  },

  // Collection & Card Binder
  {
    id: 'binder-starter',
    title: 'Curator Apprentice',
    description: 'Collect 5 unique historical cards in your binder.',
    category: 'collection',
    icon: '📖',
    coinReward: 35,
    requirement: {
      type: 'unique_cards',
      target: 5
    }
  },
  {
    id: 'binder-intermediate',
    title: 'Keeper of Archives',
    description: 'Collect 15 unique historical cards in your binder.',
    category: 'collection',
    icon: '🗂️',
    coinReward: 75,
    requirement: {
      type: 'unique_cards',
      target: 15
    }
  },
  {
    id: 'binder-advanced',
    title: 'National Archivist',
    description: 'Collect 30 unique historical cards in your binder.',
    category: 'collection',
    icon: '👑',
    coinReward: 150,
    requirement: {
      type: 'unique_cards',
      target: 30
    }
  },

  // Era Mastery
  {
    id: 'unit-1-mastery',
    title: 'Age of Exploration',
    description: 'Collect 4 or more cards from Unit 1 (First Peoples & Exploration).',
    category: 'collection',
    icon: '⛵',
    coinReward: 40,
    requirement: {
      type: 'unit_cards',
      target: 4,
      unitId: 'unit-1'
    }
  },
  {
    id: 'unit-2-mastery',
    title: 'Colonial Chronicle',
    description: 'Collect 4 or more cards from Unit 2 (Colonies & Revolution).',
    category: 'collection',
    icon: '🔔',
    coinReward: 40,
    requirement: {
      type: 'unit_cards',
      target: 4,
      unitId: 'unit-2'
    }
  },
  {
    id: 'unit-3-mastery',
    title: 'Constitutional Delegate',
    description: 'Collect 4 or more cards from Unit 3 (Constitution & New Republic).',
    category: 'collection',
    icon: '⚖️',
    coinReward: 40,
    requirement: {
      type: 'unit_cards',
      target: 4,
      unitId: 'unit-3'
    }
  },
  {
    id: 'unit-4-mastery',
    title: 'Union Defender',
    description: 'Collect 4 or more cards from Unit 4 (Civil War & Reconstruction).',
    category: 'collection',
    icon: '🦅',
    coinReward: 40,
    requirement: {
      type: 'unit_cards',
      target: 4,
      unitId: 'unit-4'
    }
  },

  // Classroom Trading
  {
    id: 'first-trade',
    title: 'Frontier Merchant',
    description: 'Complete your first successful card exchange with a classroom peer.',
    category: 'trading',
    icon: '🤝',
    coinReward: 45,
    requirement: {
      type: 'trades_completed',
      target: 1
    }
  },
  {
    id: 'master-trader',
    title: 'Silk Road Diplomat',
    description: 'Complete 3 successful card trades with classroom peers.',
    category: 'trading',
    icon: '🌐',
    coinReward: 90,
    requirement: {
      type: 'trades_completed',
      target: 3
    }
  },

  // Rarity Fortune
  {
    id: 'mythic-pull',
    title: 'National Treasure',
    description: 'Obtain at least 1 Legendary or Mythical rarity card from a booster pack.',
    category: 'general',
    icon: '✨',
    coinReward: 100,
    requirement: {
      type: 'mythical_pulled',
      target: 1
    }
  }
];
