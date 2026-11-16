import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Question, DailyActivity, GameSettings } from '../types';
import { INITIAL_QUESTIONS } from '../data/questions';
import { DEFAULT_GAME_SETTINGS } from '../data/initialCurriculum';
import { useAuth, MASTERY_CORRECT_GAIN, MASTERY_INCORRECT_PENALTY } from './AuthContext';
import { sounds } from '../utils/audio';
import { isFresh, markFetched } from '../utils/cache';
import {
  isFirebaseConfigured,
  db,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs
} from '../firebase/config';

// Today's OST-prep bonus question is worth more, but it's one shot only --
// no retry, no partial credit for a miss.
const OST_CORRECT_REWARD = 20;

interface AnswerResult {
  isCorrect: boolean;
  correctAnswerIndex: number;
  explanation: string;
  coinsAwarded: number;
  isDailyCapReached: boolean;
  masteryDelta: number;
  isReviewMode: boolean;
}

// Every answer the student gives (daily, review, practice, OST), for the dashboard's
// Today / This Week cards. Kept on the device so practice costs no Firestore writes.
export interface ActivityTally {
  todayQuestions: number;
  todayCorrect: number;
  weekQuestions: number;
  weekCorrect: number;
}

interface QuestionsContextType {
  questions: Question[];
  currentQuestion: Question | null;
  dailyActivity: DailyActivity;
  activityTally: ActivityTally;
  gameSettings: GameSettings;
  updateGameSettings: (settings: Partial<GameSettings>) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  hasAnsweredCurrent: boolean;
  lastResult: AnswerResult | null;
  submitAnswer: (answerIndex: number) => AnswerResult | null;
  nextQuestion: () => void;
  streak: number;
  isDailyLimitReached: boolean;
  practiceMode: boolean;
  setPracticeMode: (enabled: boolean) => void;
  // Units chosen for practice; empty means all units.
  practiceUnitIds: string[];
  setPracticeUnitIds: (ids: string[]) => void;
  addQuestion: (question: Omit<Question, 'questionId'>) => void;
  updateQuestion: (questionId: string, changes: Partial<Question>) => void;
  toggleQuestionActive: (questionId: string) => void;
  deleteQuestion: (questionId: string) => void;
  resetDailyActivity: () => void;
  reviewQueueCount: number;
  isReviewMode: boolean;
  startReviewMode: () => void;
  exitReviewMode: () => void;
  // Daily OST-prep bonus question -- same one question for the whole class,
  // whichever one the admin currently has marked active.
  todaysOSTQuestion: Question | null;
  hasAnsweredOST: boolean;
  lastOSTResult: AnswerResult | null;
  submitOSTAnswer: (answerIndex: number) => AnswerResult | null;
}

const QuestionsContext = createContext<QuestionsContextType | undefined>(undefined);

const LOCAL_STORAGE_QUESTIONS_KEY = 'ohio_history_questions_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'ohio_history_settings_v1';
const LOCAL_STORAGE_SOUND_KEY = 'ohio_history_sound_enabled';
const CUSTOM_QUESTION_PREFIX = 'q-custom-';

export const getTodayKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const mergeRemoteQuestions = (base: Question[], remoteDocs: any[]): Question[] => {
  const byId = new Map<string, Question>();
  base.forEach(q => byId.set(q.questionId, q));

  remoteDocs.forEach(data => {
    if (!data?.questionId) return;
    if (typeof data.questionText === 'string') {
      byId.set(data.questionId, data as Question);
    } else if (byId.has(data.questionId) && typeof data.active === 'boolean') {
      const existing = byId.get(data.questionId)!;
      byId.set(data.questionId, { ...existing, active: data.active });
    }
  });

  return Array.from(byId.values());
};

// Deterministic seeded shuffle: the same student on the same day always
// gets the same order (so it stays consistent within a session), but a
// different order than yesterday, and a different order than every other
// student -- which also closes an "answer-sharing" loophole, since nobody's
// question order matches anyone else's.
const hashSeed = (str: string): number => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
};

const mulberry32 = (seed: number) => {
  let t = seed;
  return () => {
    t |= 0;
    t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const seededShuffle = <T,>(arr: T[], seed: number): T[] => {
  const rand = mulberry32(seed);
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const QuestionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, recordQuestionOutcome } = useAuth();
  const todayKey = useMemo(() => getTodayKey(), []);

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_SOUND_KEY) !== 'false';
    } catch {
      return true;
    }
  });

  const setSoundEnabled = (val: boolean) => {
    setSoundEnabledState(val);
    sounds.enabled = val;
    try {
      localStorage.setItem(LOCAL_STORAGE_SOUND_KEY, val ? 'true' : 'false');
    } catch {}
  };

  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      return saved ? { ...DEFAULT_GAME_SETTINGS, ...JSON.parse(saved) } : DEFAULT_GAME_SETTINGS;
    } catch {
      return DEFAULT_GAME_SETTINGS;
    }
  });

  // Settings are one small document. Pulled when the app opens and then every
  // few minutes while the tab is visible, so a class goal, closed pack or
  // maintenance switch reaches students without a reload.
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !doc || !getDoc) return;
    const pull = async (ttlMs: number) => {
      if (isFresh('settings', ttlMs)) return;
      try {
        const settingsRef = doc(db, 'settings', 'gameSettings');
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
        const snap = await Promise.race([getDoc(settingsRef), timeout]) as any;
        if (snap && typeof snap.exists === 'function') markFetched('settings');
        if (snap && typeof snap.exists === 'function' && snap.exists()) {
          const merged = { ...DEFAULT_GAME_SETTINGS, ...(snap.data() as Partial<GameSettings>) };
          setGameSettings(merged);
          try {
            localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(merged));
          } catch {}
        }
      } catch (e) {
        console.warn('Game settings fetch notice (using cached settings):', e);
      }
    };
    pull(SETTINGS_OPEN_TTL_MS);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') pull(SETTINGS_POLL_MS - 15000);
    }, SETTINGS_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') pull(SETTINGS_OPEN_TTL_MS);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const updateGameSettings = (updates: Partial<GameSettings>) => {
    // Side effects (storage + Firestore write) live OUTSIDE the state updater,
    // which React may run more than once.
    const next = { ...gameSettings, ...updates };
    setGameSettings(next);
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(next));
    } catch {}
    if (isFirebaseConfigured && db && doc && setDoc) {
      const settingsRef = doc(db, 'settings', 'gameSettings');
      // Only the changed fields are written, so two teachers editing different
      // settings can't overwrite each other with stale copies.
      setDoc(settingsRef, updates, { merge: true }).catch(e => {
        console.warn('Game settings sync notice:', e);
      });
    }
  };

  const bumpCatalogVersion = () => updateGameSettings({ catalogVersion: Date.now() });

  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
      if (saved) {
        const parsed: Question[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map(q => q.questionId));
        const missingInitials = INITIAL_QUESTIONS.filter(q => !existingIds.has(q.questionId));
        return [...parsed, ...missingInitials];
      }
      return INITIAL_QUESTIONS;
    } catch {
      return INITIAL_QUESTIONS;
    }
  });

  const saveQuestions = (updated: Question[]) => {
    setQuestions(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(updated));
    } catch {}
  };

  // The question collection is only re-read when the teacher has changed the
  // catalog (catalogVersion) or after 12 hours, not on a timer.
  const catalogVersion = gameSettings.catalogVersion ?? 0;
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !collection || !getDocs) return;
    let seen = '';
    try {
      seen = localStorage.getItem('hcq_questions_version') || '';
    } catch {}
    if (seen === String(catalogVersion) && isFresh('questions', 12 * 60 * 60 * 1000)) return;
    (async () => {
      try {
        const questionsColl = collection(db, 'questions');
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
        const snap = await Promise.race([getDocs(questionsColl), timeout]) as any;
        if (snap && snap.docs) {
          markFetched('questions');
          try {
            localStorage.setItem('hcq_questions_version', String(catalogVersion));
          } catch {}
          const remoteDocs = snap.docs.map((d: any) => d.data());
          setQuestions(prev => {
            const merged = mergeRemoteQuestions(prev, remoteDocs);
            try {
              localStorage.setItem(LOCAL_STORAGE_QUESTIONS_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch (e) {
        console.warn('Question bank fetch notice (using cached questions):', e);
      }
    })();
  }, [catalogVersion]);

  const activityStorageKey = `ohio_daily_activity_${userProfile?.uid || 'guest'}_${todayKey}`;

  const [dailyActivity, setDailyActivity] = useState<DailyActivity>(() => {
    try {
      const saved = localStorage.getItem(activityStorageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      date: todayKey,
      questionsAnswered: 0,
      correctAnswers: 0,
      coinsEarned: 0,
      lastQuestionAt: new Date().toISOString(),
      ostAnsweredToday: false
    };
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(activityStorageKey);
      if (saved) {
        setDailyActivity(JSON.parse(saved));
      } else {
        setDailyActivity({
          date: todayKey,
          questionsAnswered: 0,
          correctAnswers: 0,
          coinsEarned: 0,
          lastQuestionAt: new Date().toISOString(),
          ostAnsweredToday: false
        });
      }
    } catch {}
  }, [activityStorageKey, todayKey]);

  // The profile (already loaded at login) is the source of truth for today's count,
  // so clearing browser storage or switching devices can't reset the daily limit.
  useEffect(() => {
    if (!userProfile || userProfile.todayDate !== todayKey) return;
    const serverQ = userProfile.todayQuestions || 0;
    const serverC = userProfile.todayCorrect || 0;
    setDailyActivity(prev => {
      if (serverQ <= prev.questionsAnswered) return prev;
      const next = { ...prev, questionsAnswered: serverQ, correctAnswers: Math.max(prev.correctAnswers, serverC) };
      try { localStorage.setItem(activityStorageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [userProfile?.todayDate, userProfile?.todayQuestions, userProfile?.todayCorrect, todayKey, activityStorageKey]);

  const answeredIdsKey = `ohio_answered_qids_${userProfile?.uid || 'guest'}_${todayKey}`;
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(answeredIdsKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const reviewQueueKey = `ohio_review_queue_${userProfile?.uid || 'guest'}`;
  const [reviewQueueIds, setReviewQueueIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(reviewQueueKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(reviewQueueKey);
      setReviewQueueIds(saved ? JSON.parse(saved) : []);
    } catch {
      setReviewQueueIds([]);
    }
  }, [reviewQueueKey]);

  const saveReviewQueue = (ids: string[]) => {
    setReviewQueueIds(ids);
    try {
      localStorage.setItem(reviewQueueKey, JSON.stringify(ids));
    } catch {}
  };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [reviewIndex, setReviewIndex] = useState<number>(0);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState<boolean>(false);
  // The question on screen is pinned once answered. Without this, a correct
  // review answer removes the question from the queue straight away and the
  // screen would swap to a different question mid-feedback.
  const [pinnedQuestion, setPinnedQuestion] = useState<Question | null>(null);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [practiceMode, setPracticeModeState] = useState<boolean>(false);
  const [practiceUnitIds, setPracticeUnitIdsState] = useState<string[]>([]);
  const [practiceIndex, setPracticeIndex] = useState<number>(0);

  const resetAnswerState = () => {
    setHasAnsweredCurrent(false);
    setPinnedQuestion(null);
    setLastResult(null);
    setPracticeIndex(0);
  };
  const setPracticeMode = (enabled: boolean) => {
    setPracticeModeState(enabled);
    resetAnswerState();
  };
  const setPracticeUnitIds = (ids: string[]) => {
    setPracticeUnitIdsState(ids);
    resetAnswerState();
  };
  // All-answers tally (device-local; see ActivityTally).
  const weekKeyNow = useMemo(() => {
    const d = new Date();
    const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;
  }, [todayKey]);
  const tallyStorageKey = `hcq_tally_${userProfile?.uid || 'guest'}`;
  interface StoredTally { day: string; dq: number; dc: number; week: string; wq: number; wc: number }
  const readTally = (): StoredTally => {
    let t: StoredTally = { day: todayKey, dq: 0, dc: 0, week: weekKeyNow, wq: 0, wc: 0 };
    try {
      const raw = localStorage.getItem(tallyStorageKey);
      if (raw) {
        const p = JSON.parse(raw) as StoredTally;
        t = {
          day: todayKey, dq: p.day === todayKey ? p.dq || 0 : 0, dc: p.day === todayKey ? p.dc || 0 : 0,
          week: weekKeyNow, wq: p.week === weekKeyNow ? p.wq || 0 : 0, wc: p.week === weekKeyNow ? p.wc || 0 : 0
        };
      }
    } catch {}
    return t;
  };
  const [tally, setTally] = useState<StoredTally>(readTally);
  useEffect(() => { setTally(readTally()); }, [tallyStorageKey, todayKey, weekKeyNow]);
  const bumpTally = (isCorrect: boolean) => {
    const t = readTally();
    const next: StoredTally = { ...t, dq: t.dq + 1, dc: t.dc + (isCorrect ? 1 : 0), wq: t.wq + 1, wc: t.wc + (isCorrect ? 1 : 0) };
    setTally(next);
    try { localStorage.setItem(tallyStorageKey, JSON.stringify(next)); } catch {}
  };
  const activityTally: ActivityTally = { todayQuestions: tally.dq, todayCorrect: tally.dc, weekQuestions: tally.wq, weekCorrect: tally.wc };

  const [lastOSTResult, setLastOSTResult] = useState<AnswerResult | null>(null);

  // Regular daily trivia pool excludes OST questions -- those live in their
  // own separate one-a-day flow.
  const disabledUnitIds = gameSettings.disabledUnitIds || [];
  const disabledKey = disabledUnitIds.join(',');
  const activeQuestions = useMemo(() => {
    return questions.filter(q => q.active && !q.isOST && !disabledUnitIds.includes(q.unitId));
  }, [questions, disabledKey]);

  const dailyShuffledQuestions = useMemo(() => {
    const seed = hashSeed(`${userProfile?.uid || 'guest'}_${todayKey}`);
    return seededShuffle(activeQuestions, seed);
  }, [activeQuestions, userProfile?.uid, todayKey]);

  // Practice pool: the chosen units (or all), shuffled once per day per choice.
  const practiceQuestions = useMemo(() => {
    const pool = practiceUnitIds.length > 0 ? activeQuestions.filter(q => practiceUnitIds.includes(q.unitId)) : activeQuestions;
    return seededShuffle(pool, hashSeed(`${userProfile?.uid || 'guest'}_${todayKey}_practice_${[...practiceUnitIds].sort().join(',')}`));
  }, [activeQuestions, practiceUnitIds, userProfile?.uid, todayKey]);

  const todaysOSTQuestion = useMemo(() => {
    return questions.find(q => q.isOST && q.active) || null;
  }, [questions]);

  const reviewQuestions = useMemo(() => {
    return reviewQueueIds
      .map(id => questions.find(q => q.questionId === id))
      .filter((q): q is Question => !!q && q.active && !disabledUnitIds.includes(q.unitId));
  }, [reviewQueueIds, questions, disabledKey]);

  const currentQuestion = useMemo(() => {
    if (hasAnsweredCurrent && pinnedQuestion) return pinnedQuestion;
    if (isReviewMode) {
      if (reviewQuestions.length === 0) return null;
      const idx = reviewIndex % reviewQuestions.length;
      return reviewQuestions[idx];
    }
    if (practiceMode) {
      if (practiceQuestions.length === 0) return null;
      return practiceQuestions[practiceIndex % practiceQuestions.length];
    }
    if (dailyShuffledQuestions.length === 0) return null;
    // Walk the student's shuffled list by how many daily questions they've already
    // answered today. That count comes from their profile, so reloading, switching
    // device or clearing the browser never replays questions they already answered.
    const index = dailyActivity.questionsAnswered % dailyShuffledQuestions.length;
    return dailyShuffledQuestions[index] || dailyShuffledQuestions[0];
  }, [isReviewMode, reviewQuestions, reviewIndex, dailyShuffledQuestions, dailyActivity.questionsAnswered, hasAnsweredCurrent, pinnedQuestion, practiceMode, practiceQuestions, practiceIndex]);

  const isDailyLimitReached = useMemo(() => {
    return dailyActivity.questionsAnswered >= gameSettings.dailyQuestionLimit;
  }, [dailyActivity.questionsAnswered, gameSettings.dailyQuestionLimit]);

  const startReviewMode = () => {
    if (reviewQuestions.length === 0) return;
    // If they already answered today's current question but hadn't
    // advanced past it yet, advance now -- otherwise it would sit waiting
    // and reappear (as if unanswered) the moment they exit review mode.
    if (hasAnsweredCurrent) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
    setIsReviewMode(true);
    setReviewIndex(0);
    setHasAnsweredCurrent(false);
    setPinnedQuestion(null);
    setLastResult(null);
  };

  const exitReviewMode = () => {
    setIsReviewMode(false);
    setHasAnsweredCurrent(false);
    setPinnedQuestion(null);
    setLastResult(null);
  };

  const submitAnswer = (answerIndex: number): AnswerResult | null => {
    if (!currentQuestion || hasAnsweredCurrent) return null;

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const unitId = currentQuestion.unitId;

    // Practice is for learning only: no coins, no mastery, no counters, and a
    // wrong answer is NOT added to Review. It just moves on.
    if (practiceMode && !isReviewMode) {
      bumpTally(isCorrect);
      if (isCorrect) {
        sounds.playCorrect();
        setStreak(s => s + 1);
      } else {
        sounds.playEffort();
        setStreak(0);
      }
      const practiceResult: AnswerResult = {
        isCorrect,
        correctAnswerIndex: currentQuestion.correctAnswer,
        explanation: currentQuestion.explanation,
        coinsAwarded: 0,
        isDailyCapReached: false,
        masteryDelta: 0,
        isReviewMode: false
      };
      setLastResult(practiceResult);
      setPinnedQuestion(currentQuestion);
      setHasAnsweredCurrent(true);
      return practiceResult;
    }

    bumpTally(isCorrect);
    let coinsAwarded = 0;
    let masteryDelta = 0;

    if (isReviewMode) {
      masteryDelta = isCorrect ? MASTERY_CORRECT_GAIN : 0;
      // Clearing a missed question earns a small bonus (teacher can set it to 0).
      coinsAwarded = isCorrect ? (gameSettings.reviewCoinReward ?? 0) : 0;
    } else {
      const willHitCap = !practiceMode && isDailyLimitReached;
      if (!willHitCap) {
        // Unit Focus: correct answers in the teacher's focus unit pay extra.
        const isFocusUnit = !!gameSettings.focusUnitId && unitId === gameSettings.focusUnitId;
        const correctReward = isFocusUnit
          ? Math.max(gameSettings.correctCoinReward, gameSettings.focusCorrectReward ?? gameSettings.correctCoinReward)
          : gameSettings.correctCoinReward;
        coinsAwarded = isCorrect ? correctReward : gameSettings.incorrectCoinReward;
      }
      masteryDelta = isCorrect ? MASTERY_CORRECT_GAIN : -MASTERY_INCORRECT_PENALTY;
    }

    if (isCorrect) {
      sounds.playCorrect();
      setStreak(s => s + 1);
    } else {
      sounds.playEffort();
      setStreak(0);
    }

    // Daily answers always get recorded (even with no coins/mastery change) so the profile count stays accurate.
    if (coinsAwarded !== 0 || masteryDelta !== 0 || !isReviewMode) {
      recordQuestionOutcome({
        coinsDelta: coinsAwarded,
        unitId,
        masteryDelta,
        isCorrect: isReviewMode ? undefined : isCorrect
      });
    }

    if (isCorrect) {
      if (reviewQueueIds.includes(currentQuestion.questionId)) {
        saveReviewQueue(reviewQueueIds.filter(id => id !== currentQuestion.questionId));
      }
    } else if (!isReviewMode && !reviewQueueIds.includes(currentQuestion.questionId)) {
      saveReviewQueue([...reviewQueueIds, currentQuestion.questionId]);
    }

    let dailyCapReached = false;
    if (!isReviewMode) {
      const now = new Date().toISOString();
      const updatedQuestionsAnswered = dailyActivity.questionsAnswered + (practiceMode ? 0 : 1);
      const updatedActivity: DailyActivity = {
        ...dailyActivity,
        questionsAnswered: updatedQuestionsAnswered,
        correctAnswers: dailyActivity.correctAnswers + (isCorrect ? 1 : 0),
        coinsEarned: dailyActivity.coinsEarned + coinsAwarded,
        lastQuestionAt: now
      };

      setDailyActivity(updatedActivity);
      try {
        localStorage.setItem(activityStorageKey, JSON.stringify(updatedActivity));
      } catch {}

      const newAnsweredIds = [...answeredQuestionIds, currentQuestion.questionId];
      setAnsweredQuestionIds(newAnsweredIds);
      try {
        localStorage.setItem(answeredIdsKey, JSON.stringify(newAnsweredIds));
      } catch {}

      dailyCapReached = updatedQuestionsAnswered >= gameSettings.dailyQuestionLimit;
    }

    const result: AnswerResult = {
      isCorrect,
      correctAnswerIndex: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
      coinsAwarded,
      isDailyCapReached: dailyCapReached,
      masteryDelta,
      isReviewMode
    };

    setLastResult(result);
    setPinnedQuestion(currentQuestion);
    setHasAnsweredCurrent(true);
    return result;
  };

  const submitOSTAnswer = (answerIndex: number): AnswerResult | null => {
    if (!todaysOSTQuestion || dailyActivity.ostAnsweredToday) return null;

    const isCorrect = answerIndex === todaysOSTQuestion.correctAnswer;
    const coinsAwarded = isCorrect ? OST_CORRECT_REWARD : 0;
    bumpTally(isCorrect);

    if (isCorrect) {
      sounds.playCorrect();
    } else {
      sounds.playEffort();
    }

    if (coinsAwarded !== 0) {
      recordQuestionOutcome({ coinsDelta: coinsAwarded });
    }

    const updatedActivity: DailyActivity = { ...dailyActivity, ostAnsweredToday: true };
    setDailyActivity(updatedActivity);
    try {
      localStorage.setItem(activityStorageKey, JSON.stringify(updatedActivity));
    } catch {}

    const result: AnswerResult = {
      isCorrect,
      correctAnswerIndex: todaysOSTQuestion.correctAnswer,
      explanation: todaysOSTQuestion.explanation,
      coinsAwarded,
      isDailyCapReached: false,
      masteryDelta: 0,
      isReviewMode: false
    };

    setLastOSTResult(result);
    return result;
  };

  const nextQuestion = () => {
    const graduated = isReviewMode && lastResult?.isCorrect === true;
    setHasAnsweredCurrent(false);
    setPinnedQuestion(null);
    setLastResult(null);
    if (isReviewMode) {
      // A graduated question already left the queue, so the next one now sits
      // at this same position; only step forward after a miss.
      if (!graduated) setReviewIndex(prev => prev + 1);
    } else if (practiceMode) {
      setPracticeIndex(prev => prev + 1);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const addQuestion = (newQ: Omit<Question, 'questionId'>) => {
    const questionId = `${CUSTOM_QUESTION_PREFIX}${Date.now()}`;
    const fullQuestion: Question = { ...newQ, questionId };
    saveQuestions([fullQuestion, ...questions]);

    if (isFirebaseConfigured && db && doc && setDoc) {
      const qRef = doc(db, 'questions', questionId);
      setDoc(qRef, fullQuestion).catch(e => console.warn('Question sync notice:', e));
    }
    bumpCatalogVersion();
  };

  // Edits any question (built-in or custom). The full edited question is
  // saved so every student's device picks the new wording up.
  const updateQuestion = (questionId: string, changes: Partial<Question>) => {
    const updated = questions.map(q => (q.questionId === questionId ? { ...q, ...changes, questionId } : q));
    saveQuestions(updated);
    const full = updated.find(q => q.questionId === questionId);
    if (full && isFirebaseConfigured && db && doc && setDoc) {
      setDoc(doc(db, 'questions', questionId), full, { merge: true }).catch(e => console.warn('Question sync notice:', e));
    }
    bumpCatalogVersion();
  };

  const toggleQuestionActive = (questionId: string) => {
    let newActive = true;
    const updated = questions.map(q => {
      if (q.questionId === questionId) {
        newActive = !q.active;
        return { ...q, active: newActive };
      }
      return q;
    });
    saveQuestions(updated);

    if (isFirebaseConfigured && db && doc && setDoc) {
      const qRef = doc(db, 'questions', questionId);
      const isCustom = questionId.startsWith(CUSTOM_QUESTION_PREFIX);
      const fullQuestion = updated.find(q => q.questionId === questionId);
      const payload = isCustom && fullQuestion ? fullQuestion : { questionId, active: newActive };
      setDoc(qRef, payload, { merge: true }).catch(e => console.warn('Question sync notice:', e));
    }
    bumpCatalogVersion();
  };

  const deleteQuestion = (questionId: string) => {
    if (!questionId.startsWith(CUSTOM_QUESTION_PREFIX)) {
      toggleQuestionActive(questionId);
      return;
    }
    const updated = questions.filter(q => q.questionId !== questionId);
    saveQuestions(updated);

    if (isFirebaseConfigured && db && doc && deleteDoc) {
      const qRef = doc(db, 'questions', questionId);
      deleteDoc(qRef).catch(e => console.warn('Question delete sync notice:', e));
    }
    bumpCatalogVersion();
  };

  const resetDailyActivity = () => {
    const resetAct: DailyActivity = {
      date: todayKey,
      questionsAnswered: 0,
      correctAnswers: 0,
      coinsEarned: 0,
      lastQuestionAt: new Date().toISOString(),
      ostAnsweredToday: false
    };
    setDailyActivity(resetAct);
    setAnsweredQuestionIds([]);
    setHasAnsweredCurrent(false);
    setLastResult(null);
    setLastOSTResult(null);
    setStreak(0);
    try {
      localStorage.removeItem(activityStorageKey);
      localStorage.removeItem(answeredIdsKey);
    } catch {}
  };

  return (
    <QuestionsContext.Provider
      value={{
        questions,
        currentQuestion,
        dailyActivity,
        activityTally,
        gameSettings,
        updateGameSettings,
        soundEnabled,
        setSoundEnabled,
        hasAnsweredCurrent,
        lastResult,
        submitAnswer,
        nextQuestion,
        streak,
        isDailyLimitReached,
        practiceMode,
        setPracticeMode,
        practiceUnitIds,
        setPracticeUnitIds,
        addQuestion,
        updateQuestion,
        toggleQuestionActive,
        deleteQuestion,
        resetDailyActivity,
        reviewQueueCount: reviewQuestions.length,
        isReviewMode,
        startReviewMode,
        exitReviewMode,
        todaysOSTQuestion,
        hasAnsweredOST: !!dailyActivity.ostAnsweredToday,
        lastOSTResult,
        submitOSTAnswer
      }}
    >
      {children}
    </QuestionsContext.Provider>
  );
};

// Short on purpose: class goals, closed packs and the focus unit should reach
// students within minutes. It is one document read per student per window.
const SETTINGS_POLL_MS = 4 * 60 * 1000;
const SETTINGS_OPEN_TTL_MS = 2 * 60 * 1000;

export const useQuestions = () => {
  const context = useContext(QuestionsContext);
  if (!context) {
    throw new Error('useQuestions must be used within a QuestionsProvider');
  }
  return context;
};