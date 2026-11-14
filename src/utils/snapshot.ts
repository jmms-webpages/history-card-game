import { isFirebaseConfigured, db, doc, getDoc } from '../firebase/config';
import { ClassGoal } from '../types';

// ONE document holds everything students can see about rankings, period
// standings, weekly boards and class-goal totals. Every student reads the same
// doc, so cost is 1 read per visit no matter how many features hang off it --
// and it's cached, so most visits cost 0.
export interface SnapshotEntry {
  uid: string;
  displayName: string;
  avatar: string;
  classroomCode: string;
  coins: number;
  uniqueCardsCollected: number;
  totalCardsCollected: number;
}

export interface WeeklyEntry {
  uid: string;
  displayName: string;
  avatar: string;
  gain: number;
}

export interface PeriodStat {
  code: string;
  students: number;
  avgMasteryPct: number;
  avgBinderPct: number;
  avgCorrect: number;
  classBinderPct: number;
}

export interface Snapshot {
  entries: SnapshotEntry[];
  periods: PeriodStat[];
  weekly: {
    startedAt: string | null;
    correct: WeeklyEntry[];
    newCards: WeeklyEntry[];
    mastery: WeeklyEntry[];
  };
  totals: { questions: number; correct: number; cards: number };
  generatedAt: string | null;
}

const CACHE_KEY = 'hcq_leaderboard_snapshot';
const TTL_MS = 10 * 60 * 1000;
const FORCE_COOLDOWN_MS = 60 * 1000;

let lastFetchAt = 0;
let inflight: Promise<Snapshot | null> | null = null;

export const normalizeSnapshot = (raw: any): Snapshot => ({
  entries: Array.isArray(raw?.entries) ? raw.entries : [],
  periods: Array.isArray(raw?.periods) ? raw.periods : [],
  weekly: {
    startedAt: raw?.weekly?.startedAt ?? null,
    correct: raw?.weekly?.correct ?? [],
    newCards: raw?.weekly?.newCards ?? [],
    mastery: raw?.weekly?.mastery ?? []
  },
  totals: {
    questions: raw?.totals?.questions ?? 0,
    correct: raw?.totals?.correct ?? 0,
    cards: raw?.totals?.cards ?? 0
  },
  generatedAt: raw?.generatedAt ?? null
});

const readCache = (): { at: number; data: any | null } | null => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && typeof cached.at === 'number') return cached;
  } catch {
    // ignore
  }
  return null;
};

const writeCache = (data: any | null) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // ignore
  }
};

export const fetchSnapshot = async (force: boolean = false): Promise<Snapshot | null> => {
  const cached = readCache();
  const cachedSnapshot = cached?.data ? normalizeSnapshot(cached.data) : null;

  if (!isFirebaseConfigured || !db || !doc || !getDoc) return cachedSnapshot;

  if (force) {
    if (Date.now() - lastFetchAt < FORCE_COOLDOWN_MS) return cachedSnapshot;
  } else if (cached && Date.now() - cached.at < TTL_MS) {
    return cachedSnapshot;
  }

  if (inflight) return inflight;
  lastFetchAt = Date.now();

  inflight = (async () => {
    try {
      const snap = await getDoc(doc(db, 'leaderboard', 'snapshot'));
      if (snap && typeof snap.exists === 'function' && snap.exists()) {
        const raw = snap.data();
        writeCache(raw);
        return normalizeSnapshot(raw);
      }
      writeCache(null); // remember "nothing published yet" so we don't re-read
      return null;
    } catch (e) {
      console.warn('Leaderboard fetch notice:', e);
      return cachedSnapshot;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};

// How far the class has come on the current goal, based on the published totals.
export const getGoalProgress = (goal: ClassGoal, snapshot: Snapshot | null) => {
  const total = !snapshot
    ? goal.baseline
    : goal.metric === 'questions'
    ? snapshot.totals.questions
    : goal.metric === 'correct'
    ? snapshot.totals.correct
    : snapshot.totals.cards;
  const current = Math.max(0, total - goal.baseline);
  const percent = goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0;
  return { current: Math.min(current, goal.target), percent, reached: current >= goal.target };
};

export const GOAL_METRIC_LABELS: Record<ClassGoal['metric'], string> = {
  questions: 'questions answered',
  correct: 'correct answers',
  cards: 'cards collected'
};
