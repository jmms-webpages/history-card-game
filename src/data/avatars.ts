export interface HistoricalAvatar {
  id: string;
  name: string;
  title: string;
  era: string;
  color: string;
  initials: string;
  badge: string;
}

export const HISTORICAL_AVATARS: HistoricalAvatar[] = [
  {
    id: 'franklin',
    name: 'Benjamin Franklin',
    title: 'Enlightenment Thinker & Diplomat',
    era: 'Revolutionary Era',
    color: 'bg-amber-600',
    initials: 'BF',
    badge: '📜'
  },
  {
    id: 'abigail_adams',
    name: 'Abigail Adams',
    title: 'Revolutionary Writer & Patriot',
    era: 'Revolutionary Era',
    color: 'bg-emerald-600',
    initials: 'AA',
    badge: '✍️'
  },
  {
    id: 'tecumseh',
    name: 'Tecumseh',
    title: 'Shawnee Leader & Confederation Organizer',
    era: 'Early Republic & Ohio Valley',
    color: 'bg-rose-700',
    initials: 'TC',
    badge: '🦅'
  },
  {
    id: 'harriet_tubman',
    name: 'Harriet Tubman',
    title: 'Underground Railroad Conductor',
    era: 'Abolition & Civil War',
    color: 'bg-indigo-700',
    initials: 'HT',
    badge: '⭐'
  },
  {
    id: 'washington',
    name: 'George Washington',
    title: 'Commander & 1st President',
    era: 'Founding Era',
    color: 'bg-blue-700',
    initials: 'GW',
    badge: '🏛️'
  },
  {
    id: 'frederick_douglass',
    name: 'Frederick Douglass',
    title: 'Abolitionist Orator & Statesman',
    era: 'Sectionalism & Reconstruction',
    color: 'bg-purple-700',
    initials: 'FD',
    badge: '📖'
  },
  {
    id: 'sacagawea',
    name: 'Sacagawea',
    title: 'Lemhi Shoshone Guide & Interpreter',
    era: 'Westward Expansion',
    color: 'bg-teal-700',
    initials: 'SG',
    badge: '🧭'
  },
  {
    id: 'hamilton',
    name: 'Alexander Hamilton',
    title: 'Constitutional Framer & Treasury Secretary',
    era: 'Early Republic',
    color: 'bg-cyan-700',
    initials: 'AH',
    badge: '⚖️'
  },
  {
    id: 'sojourner_truth',
    name: 'Sojourner Truth',
    title: 'Abolitionist & Women’s Rights Advocate',
    era: 'Antebellum & Civil War',
    color: 'bg-orange-700',
    initials: 'ST',
    badge: '🕊️'
  }
];

export const getAvatarById = (id: string): HistoricalAvatar => {
  return HISTORICAL_AVATARS.find(a => a.id === id) || HISTORICAL_AVATARS[0];
};
