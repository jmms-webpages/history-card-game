import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Question, DailyActivity, GameSettings } from '../types';
import { INITIAL_QUESTIONS } from '../data/questions';
import { DEFAULT_GAME_SETTINGS } from '../data/initialCurriculum';
import { useAuth, MASTERY_CORRECT_GAIN, MASTERY_INCORRECT_PENALTY } from './AuthContext';
import { sounds } from '../utils/audio';
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

interface AnswerResult {
  isCorrect: boolean;
  correctAnswerIndex: number;
  explanation: string;
  coinsAwarded: number;
  isDailyCapReached: boolean;
  masteryDelta: number;
  isReviewMode: boolean;
}

interface QuestionsContextType {
  questions: Question[];
  currentQuestion: Question | null;
  dailyActivity: DailyActivity;
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
  addQuestion: (question: Omit<Question, 'questionId'>) => void;
  toggleQuestionActive: (questionId: string) => void;
  deleteQuestion: (questionId: string) => void;
  resetDailyActivity: () => void;
  // Review Mode -- re-practice previously-missed questions, no coins,
  // no daily-count impact, and mastery only ever goes up, never down.
  reviewQueueCount: number;
  isReviewMode: boolean;
  startReviewMode: () => void;
  exitReviewMode: () => void;
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

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !doc || !getDoc) return;
    (async () => {
      try {
        const settingsRef = doc(db, 'settings', 'gameSettings');
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
        const snap = await Promise.race([getDoc(settingsRef), timeout]) as any;
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
    })();
  }, []);

  const updateGameSettings = (updates: Partial<GameSettings>) => {
    setGameSettings(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(next));
      } catch {}
      if (isFirebaseConfigured && db && doc && setDoc) {
        const settingsRef = doc(db, 'settings', 'gameSettings');
        setDoc(settingsRef, next, { merge: true }).catch(e => {
          console.warn('Game settings sync notice:', e);
        });
      }
      return next;
    });
  };

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

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !collection || !getDocs) return;
    (async () => {
      try {
        const questionsColl = collection(db, 'questions');
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
        const snap = await Promise.race([getDocs(questionsColl), timeout]) as any;
        if (snap && snap.docs) {
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
  }, []);

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
      lastQuestionAt: new Date().toISOString()
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
          lastQuestionAt: new Date().toISOString()
        });
      }
    } catch {}
  }, [activityStorageKey, todayKey]);

  const answeredIdsKey = `ohio_answered_qids_${userProfile?.uid || 'guest'}_${todayKey}`;
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(answeredIdsKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Personal "missed questions" queue -- local to this browser, like the
  // daily counters above. A student re-practices these in Review Mode.
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
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [practiceMode, setPracticeMode] = useState<boolean>(false);

  const activeQuestions = useMemo(() => {
    return questions.filter(q => q.active);
  }, [questions]);

  const reviewQuestions = useMemo(() => {
    return reviewQueueIds
      .map(id => questions.find(q => q.questionId === id))
      .filter((q): q is Question => !!q && q.active);
  }, [reviewQueueIds, questions]);

  const currentQuestion = useMemo(() => {
    if (isReviewMode) {
      if (reviewQuestions.length === 0) return null;
      const idx = reviewIndex % reviewQuestions.length;
      return reviewQuestions[idx];
    }
    if (activeQuestions.length === 0) return null;
    const index = currentQuestionIndex % activeQuestions.length;
    return activeQuestions[index] || activeQuestions[0];
  }, [isReviewMode, reviewQuestions, reviewIndex, activeQuestions, currentQuestionIndex]);

  const isDailyLimitReached = useMemo(() => {
    return dailyActivity.questionsAnswered >= gameSettings.dailyQuestionLimit;
  }, [dailyActivity.questionsAnswered, gameSettings.dailyQuestionLimit]);

  const startReviewMode = () => {
    if (reviewQuestions.length === 0) return;
    setIsReviewMode(true);
    setReviewIndex(0);
    setHasAnsweredCurrent(false);
    setLastResult(null);
  };

  const exitReviewMode = () => {
    setIsReviewMode(false);
    setHasAnsweredCurrent(false);
    setLastResult(null);
  };

  const submitAnswer = (answerIndex: number): AnswerResult | null => {
    if (!currentQuestion || hasAnsweredCurrent) return null;

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const unitId = currentQuestion.unitId;

    let coinsAwarded = 0;
    let masteryDelta = 0;

    if (isReviewMode) {
      // Safe practice: never coins, never a mastery penalty for a miss --
      // only reward genuinely fixing a previously-missed question.
      masteryDelta = isCorrect ? MASTERY_CORRECT_GAIN : 0;
    } else {
      const willHitCap = !practiceMode && isDailyLimitReached;
      if (!willHitCap) {
        coinsAwarded = isCorrect ? gameSettings.correctCoinReward : gameSettings.incorrectCoinReward;
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

    if (coinsAwarded !== 0 || masteryDelta !== 0) {
      recordQuestionOutcome({ coinsDelta: coinsAwarded, unitId, masteryDelta });
    }

    // A question graduates out of the review queue the moment it's
    // answered correctly (whether that happens in Review Mode or just by
    // luck in the main flow); a miss in the main flow queues it up.
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
    setHasAnsweredCurrent(true);
    return result;
  };

  const nextQuestion = () => {
    setHasAnsweredCurrent(false);
    setLastResult(null);
    if (isReviewMode) {
      setReviewIndex(prev => prev + 1);
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
  };

  const resetDailyActivity = () => {
    const resetAct: DailyActivity = {
      date: todayKey,
      questionsAnswered: 0,
      correctAnswers: 0,
      coinsEarned: 0,
      lastQuestionAt: new Date().toISOString()
    };
    setDailyActivity(resetAct);
    setAnsweredQuestionIds([]);
    setHasAnsweredCurrent(false);
    setLastResult(null);
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
        addQuestion,
        toggleQuestionActive,
        deleteQuestion,
        resetDailyActivity,
        reviewQueueCount: reviewQuestions.length,
        isReviewMode,
        startReviewMode,
        exitReviewMode
      }}
    >
      {children}
    </QuestionsContext.Provider>
  );
};

export const useQuestions = () => {
  const context = useContext(QuestionsContext);
  if (!context) {
    throw new Error('useQuestions must be used within a QuestionsProvider');
  }
  return context;
};