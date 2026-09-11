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
  {
    id: 'binder-completionist',
    title: 'Keeper of All Ages',
    description: 'Collect 80 unique historical cards in your binder.',
    category: 'collection',
    icon: '🏆',
    coinReward: 300,
    requirement: {
      type: 'unique_cards',
      target: 80
    }
  },

  // Era Mastery (targets scaled to each unit's expanded ~15-17 card pool)
  {
    id: 'unit-1-mastery',
    title: 'Age of Exploration',
    description: 'Collect 8 or more cards from Unit 1 (First Peoples & Exploration).',
    category: 'collection',
    icon: '⛵',
    coinReward: 45,
    requirement: {
      type: 'unit_cards',
      target: 8,
      unitId: 'unit-1'
    }
  },
  {
    id: 'unit-2-mastery',
    title: 'Colonial Chronicle',
    description: 'Collect 8 or more cards from Unit 2 (Colonial America & Middle Passage).',
    category: 'collection',
    icon: '🔔',
    coinReward: 45,
    requirement: {
      type: 'unit_cards',
      target: 8,
      unitId: 'unit-2'
    }
  },
  {
    id: 'unit-3-mastery',
    title: 'Revolutionary Vanguard',
    description: 'Collect 9 or more cards from Unit 3 (Revolution & Enlightenment).',
    category: 'collection',
    icon: '🔥',
    coinReward: 45,
    requirement: {
      type: 'unit_cards',
      target: 9,
      unitId: 'unit-3'
    }
  },
  {
    id: 'unit-4-mastery',
    title: 'Constitutional Delegate',
    description: 'Collect 8 or more cards from Unit 4 (Constitution & Bill of Rights).',
    category: 'collection',
    icon: '⚖️',
    coinReward: 45,
    requirement: {
      type: 'unit_cards',
      target: 8,
      unitId: 'unit-4'
    }
  },
  {
    id: 'unit-5-mastery',
    title: 'Frontier Statesman',
    description: 'Collect 8 or more cards from Unit 5 (The Ohio Frontier & Early Republic).',
    category: 'collection',
    icon: '🗺️',
    coinReward: 45,
    requirement: {
      type: 'unit_cards',
      target: 8,
      unitId: 'unit-5'
    }
  },
  {
    id: 'unit-6-mastery',
    title: 'Trailblazer of the West',
    description: 'Collect 8 or more cards from Unit 6 (Westward Trails & Manifest Destiny).',
    category: 'collection',
    icon: '🐎',
    coinReward: 45,
    requirement: {
      type: 'unit_cards',
      target: 8,
      unitId: 'unit-6'
    }
  },
  {
    id: 'unit-7-mastery',
    title: 'Conductor of Freedom',
    description: "Collect 8 or more cards from Unit 7 (Abolition & Ohio's Underground Railroad).",
    category: 'collection',
    icon: '🕯️',
    coinReward: 45,
    requirement: {
      type: 'unit_cards',
      target: 8,
      unitId: 'unit-7'
    }
  },
  {
    id: 'unit-8-mastery',
    title: 'Union Defender',
    description: 'Collect 9 or more cards from Unit 8 (Civil War & Reconstruction).',
    category: 'collection',
    icon: '🦅',
    coinReward: 45,
    requirement: {
      type: 'unit_cards',
      target: 9,
      unitId: 'unit-8'
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
