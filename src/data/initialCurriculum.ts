import { Unit, Standard, GameSettings } from '../types';

export const INITIAL_UNITS: Unit[] = [
  {
    unitId: 'unit-1',
    unitName: 'Unit 1: First Peoples, Exploration & Early Colonies',
    description: 'Indigenous cultures of North America, European maritime expansion, and early colonial settlements.',
    order: 1,
    active: true
  },
  {
    unitId: 'unit-2',
    unitName: 'Unit 2: Colonial Society, Economics & Transatlantic Slavery',
    description: 'Colonial regional differences, mercantilism, and the forced migration and labor of enslaved Africans.',
    order: 2,
    active: true
  },
  {
    unitId: 'unit-3',
    unitName: 'Unit 3: Enlightenment Ideas & The American Revolution',
    description: 'Enlightenment philosophy, escalating colonial resistance, Declaration of Independence, and the Revolutionary War.',
    order: 3,
    active: true
  },
  {
    unitId: 'unit-4',
    unitName: 'Unit 4: Creating a Government: Constitution & Bill of Rights',
    description: 'The Articles of Confederation, Constitutional Convention debates, checks and balances, and the Bill of Rights.',
    order: 4,
    active: true
  },
  {
    unitId: 'unit-5',
    unitName: 'Unit 5: The Early Republic & Ohio Valley Frontier',
    description: 'Washington’s presidency, political parties, War of 1812, Northwest Territory, and early Ohio statehood.',
    order: 5,
    active: true
  },
  {
    unitId: 'unit-6',
    unitName: 'Unit 6: Westward Expansion & Native American Displacement',
    description: 'Territorial acquisitions, Indian Removal policies, Indigenous resistance, Manifest Destiny, and regional changes.',
    order: 6,
    active: true
  },
  {
    unitId: 'unit-7',
    unitName: 'Unit 7: Sectionalism, Slavery & The Abolitionist Movement',
    description: 'Economic divergence between North and South, defense of slavery vs. abolitionism, and the Underground Railroad in Ohio.',
    order: 7,
    active: true
  },
  {
    unitId: 'unit-8',
    unitName: 'Unit 8: The Civil War & Reconstruction',
    description: 'Causes of secession, military turning points, Emancipation Proclamation, Reconstruction amendments, and legacies.',
    order: 8,
    active: true
  }
];

export const INITIAL_STANDARDS: Standard[] = [
  {
    standardId: 'OH-SS8-2026.1',
    standardDescription: 'Analyze the diverse cultures, governance, and environmental adaptations of Indigenous nations prior to European contact.',
    unitId: 'unit-1',
    topic: 'Indigenous North America',
    grade: 8,
    active: true
  },
  {
    standardId: 'OH-SS8-2026.2',
    standardDescription: 'Explain economic, religious, and political motivations for European voyages of exploration and early colonization.',
    unitId: 'unit-1',
    topic: 'European Exploration & Colonization',
    grade: 8,
    active: true
  },
  {
    standardId: 'OH-SS8-2026.3',
    standardDescription: 'Examine the Middle Passage, the development of chattel slavery in the Americas, and African cultural endurance and resistance.',
    unitId: 'unit-2',
    topic: 'Forced Migration & Slavery',
    grade: 8,
    active: true
  },
  {
    standardId: 'OH-SS8-2026.4',
    standardDescription: 'Analyze how Enlightenment philosophies (natural rights, social contract) influenced the Declaration of Independence and colonial resistance.',
    unitId: 'unit-3',
    topic: 'Enlightenment & Revolution',
    grade: 8,
    active: true
  },
  {
    standardId: 'OH-SS8-2026.5',
    standardDescription: 'Evaluate the weaknesses of the Articles of Confederation and the compromises that forged the U.S. Constitution and Bill of Rights.',
    unitId: 'unit-4',
    topic: 'Founding Documents',
    grade: 8,
    active: true
  },
  {
    standardId: 'OH-SS8-2026.6',
    standardDescription: 'Describe the establishment of the Northwest Territory, the Northwest Ordinance of 1787, and Ohio Valley developments.',
    unitId: 'unit-5',
    topic: 'Northwest Territory & Ohio',
    grade: 8,
    active: true
  },
  {
    standardId: 'OH-SS8-2026.7',
    standardDescription: 'Analyze government policies of forced relocation (including the Indian Removal Act) and Indigenous efforts to defend sovereignty.',
    unitId: 'unit-6',
    topic: 'Displacement & Sovereignty',
    grade: 8,
    active: true
  },
  {
    standardId: 'OH-SS8-2026.8',
    standardDescription: 'Examine sectional tensions over the expansion of slavery, the abolition movement, and key events leading to the Civil War.',
    unitId: 'unit-7',
    topic: 'Sectional Conflict & Abolition',
    grade: 8,
    active: true
  },
  {
    standardId: 'OH-SS8-2026.9',
    standardDescription: 'Assess the significance of the Emancipation Proclamation, Civil War milestones, and the 13th, 14th, and 15th Amendments during Reconstruction.',
    unitId: 'unit-8',
    topic: 'Civil War & Reconstruction',
    grade: 8,
    active: true
  }
];

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  dailyQuestionLimit: 25,
  correctCoinReward: 10,
  incorrectCoinReward: 3,
  standardPackCost: 100,
  duplicateSellValues: {
    Common: 5,
    Uncommon: 15,
    Rare: 40,
    Legendary: 150,
    Mythical: 500
  },
  rarityProbabilities: {
    Common: 0.65,
    Uncommon: 0.22,
    Rare: 0.09,
    Legendary: 0.035,
    Mythical: 0.005
  },
  guaranteedSlotProbabilities: {
    Common: 0.0,
    Uncommon: 0.62857,
    Rare: 0.25714,
    Legendary: 0.10,
    Mythical: 0.01429
  },
  adminUids: ['jaf2jc@bearworks.jackson.sparcc.org'],
  classroomTimezone: 'America/New_York' // Ohio Eastern Time
};
