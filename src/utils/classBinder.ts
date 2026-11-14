import { isFirebaseConfigured, db, doc, getDoc, setDoc } from '../firebase/config';

// One small doc per class period: classBinders/{classroomCode}. It only ever
// grows (rules enforce add-only). Viewing it costs 1 read, cached for a few
// minutes; each donation is 1 write and no reads.
export interface ClassBinderCard {
  by: string;
  uid: string;
  at: string;
}

export interface ClassBinderData {
  cards: Record<string, ClassBinderCard>;
}

// Everyone in the class gets a bonus as the shared binder fills up.
// Reward amounts must stay in firestore.rules' isAllowedCoinDelta list.
export const CLASS_BINDER_MILESTONES = [
  { id: 'cb-25', percent: 25, coins: 50 },
  { id: 'cb-50', percent: 50, coins: 50 },
  { id: 'cb-75', percent: 75, coins: 100 },
  { id: 'cb-100', percent: 100, coins: 100 }
];

const TTL_MS = 3 * 60 * 1000;
const memory: Record<string, { at: number; data: ClassBinderData }> = {};

const empty = (): ClassBinderData => ({ cards: {} });

export const fetchClassBinder = async (code: string, force: boolean = false): Promise<ClassBinderData> => {
  const key = code.trim().toUpperCase();
  const hit = memory[key];
  if (hit && Date.now() - hit.at < (force ? 15 * 1000 : TTL_MS)) return hit.data;

  if (!isFirebaseConfigured || !db || !doc || !getDoc) return hit?.data ?? empty();

  try {
    const snap = await getDoc(doc(db, 'classBinders', key));
    const data: ClassBinderData =
      snap && typeof snap.exists === 'function' && snap.exists()
        ? { cards: ((snap.data() as any)?.cards || {}) as Record<string, ClassBinderCard> }
        : empty();
    memory[key] = { at: Date.now(), data };
    return data;
  } catch (e) {
    console.warn('Class binder fetch notice:', e);
    return hit?.data ?? empty();
  }
};

// Resolves only once the server has accepted the donation, so a card is never
// removed from a student's binder unless the class binder really got it.
export const donateToClassBinder = async (
  code: string,
  cardId: string,
  uid: string,
  displayName: string
): Promise<void> => {
  const key = code.trim().toUpperCase();
  if (!isFirebaseConfigured || !db || !doc || !setDoc) {
    throw new Error('The class binder is not available right now.');
  }
  const entry: ClassBinderCard = { by: displayName, uid, at: new Date().toISOString() };
  const write = setDoc(doc(db, 'classBinders', key), { cards: { [cardId]: entry } }, { merge: true });
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('That took too long. Check your connection and try again.')), 8000)
  );
  await Promise.race([write, timeout]);

  const hit = memory[key];
  memory[key] = {
    at: hit?.at ?? Date.now(),
    data: { cards: { ...(hit?.data.cards || {}), [cardId]: entry } }
  };
};
