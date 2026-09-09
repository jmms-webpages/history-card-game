import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Question, DailyActivity, GameSettings } from '../types';
import { INITIAL_QUESTIONS } from '../data/questions';
import { DEFAULT_GAME_SETTINGS, INITIAL_UNITS } from '../data/initialCurriculum';
import { useAuth } from './AuthContext';
import { sounds } from '../utils/audio';

interface AnswerResult {
  isCorrect: boolean;
  correctAnswerIndex: number;
  explanation: string;
  coinsAwarded: number;
  isDailyCapReached: boolean;
}

interface QuestionsContextType {
  questions: Question[];
  currentQuestion: Question | null;
  selectedUnitId: string | 'all';
  setSelectedUnitId: (unitId: string | 'all') => void;
  dailyActivity: DailyActivity;
  gameSettings: GameSettings;
  updateGameSettings: (settings: Partial<GameSettings>) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  // Game session
  hasAnsweredCurrent: boolean;
  lastResult: AnswerResult | null;
  submitAnswer: (answerIndex: number) => AnswerResult | null;
  nextQuestion: () => void;
  streak: number;
  isDailyLimitReached: boolean;
  practiceMode: boolean;
  setPracticeMode: (enabled: boolean) => void;
  // Question management
  addQuestion: (question: Omit<Question, 'questionId'>) => void;
  toggleQuestionActive: (questionId: string) => void;
  deleteQuestion: (questionId: string) => void;
  resetDailyActivity: () => void;
}

const QuestionsContext = createContext<QuestionsContextType | undefined>(undefined);

const LOCAL_STORAGE_QUESTIONS_KEY = 'ohio_history_questions_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'ohio_history_settings_v1';
const LOCAL_STORAGE_SOUND_KEY = 'ohio_history_sound_enabled';

export const getTodayKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const QuestionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, updateCoins } = useAuth();
  const todayKey = useMemo(() => getTodayKey(), []);

  // Audio mute preference
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

  // Game Settings (Daily limit 25, rewards, etc.)
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      return saved ? { ...DEFAULT_GAME_SETTINGS, ...JSON.parse(saved) } : DEFAULT_GAME_SETTINGS;
    } catch {
      return DEFAULT_GAME_SETTINGS;
    }
  });

  const updateGameSettings = (updates: Partial<GameSettings>) => {
    setGameSettings(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Questions bank
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_QUESTIONS_KEY);
      if (saved) {
        const parsed: Question[] = JSON.parse(saved);
        // Merge with any new initial questions
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

  // Daily Activity
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

  // Re-sync daily activity if user or date changes
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

  // Answered question IDs today
  const answeredIdsKey = `ohio_answered_qids_${userProfile?.uid || 'guest'}_${todayKey}`;
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(answeredIdsKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active question and filtering
  const [selectedUnitId, setSelectedUnitId] = useState<string | 'all'>('all');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [practiceMode, setPracticeMode] = useState<boolean>(false);

  // Available active questions matching unit filter
  const activeQuestions = useMemo(() => {
    return questions.filter(q => {
      if (!q.active) return false;
      if (selectedUnitId !== 'all' && q.unitId !== selectedUnitId) return false;
      return true;
    });
  }, [questions, selectedUnitId]);

  // Current question
  const currentQuestion = useMemo(() => {
    if (activeQuestions.length === 0) return null;
    const index = currentQuestionIndex % activeQuestions.length;
    return activeQuestions[index] || activeQuestions[0];
  }, [activeQuestions, currentQuestionIndex]);

  const isDailyLimitReached = useMemo(() => {
    return dailyActivity.questionsAnswered >= gameSettings.dailyQuestionLimit;
  }, [dailyActivity.questionsAnswered, gameSettings.dailyQuestionLimit]);

  // Submit Answer
  const submitAnswer = (answerIndex: number): AnswerResult | null => {
    if (!currentQuestion || hasAnsweredCurrent) return null;

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const willHitCap = !practiceMode && isDailyLimitReached;

    // Coins are awarded if not currently in post-cap practice mode
    let coinsAwarded = 0;
    if (!willHitCap) {
      coinsAwarded = isCorrect ? gameSettings.correctCoinReward : gameSettings.incorrectCoinReward;
    }

    // Sound effect
    if (isCorrect) {
      sounds.playCorrect();
      setStreak(s => s + 1);
    } else {
      sounds.playEffort();
      setStreak(0);
    }

    if (coinsAwarded > 0) {
      updateCoins(coinsAwarded);
    }

    // Update daily activity
    const now = new Date().toISOString();
    const updatedActivity: DailyActivity = {
      ...dailyActivity,
      questionsAnswered: dailyActivity.questionsAnswered + (practiceMode ? 0 : 1),
      correctAnswers: dailyActivity.correctAnswers + (isCorrect ? 1 : 0),
      coinsEarned: dailyActivity.coinsEarned + coinsAwarded,
      lastQuestionAt: now
    };

    setDailyActivity(updatedActivity);
    try {
      localStorage.setItem(activityStorageKey, JSON.stringify(updatedActivity));
    } catch {}

    // Record question ID
    const newAnsweredIds = [...answeredQuestionIds, currentQuestion.questionId];
    setAnsweredQuestionIds(newAnsweredIds);
    try {
      localStorage.setItem(answeredIdsKey, JSON.stringify(newAnsweredIds));
    } catch {}

    const result: AnswerResult = {
      isCorrect,
      correctAnswerIndex: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
      coinsAwarded,
      isDailyCapReached: updatedActivity.questionsAnswered >= gameSettings.dailyQuestionLimit
    };

    setLastResult(result);
    setHasAnsweredCurrent(true);
    return result;
  };

  // Next Question
  const nextQuestion = () => {
    setHasAnsweredCurrent(false);
    setLastResult(null);
    setCurrentQuestionIndex(prev => prev + 1);
  };

  // Question Management (Teacher/Admin)
  const addQuestion = (newQ: Omit<Question, 'questionId'>) => {
    const questionId = `q-custom-${Date.now()}`;
    const fullQuestion: Question = {
      ...newQ,
      questionId
    };
    saveQuestions([fullQuestion, ...questions]);
  };

  const toggleQuestionActive = (questionId: string) => {
    const updated = questions.map(q => 
      q.questionId === questionId ? { ...q, active: !q.active } : q
    );
    saveQuestions(updated);
  };

  const deleteQuestion = (questionId: string) => {
    const updated = questions.filter(q => q.questionId !== questionId);
    saveQuestions(updated);
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
        selectedUnitId,
        setSelectedUnitId,
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
        resetDailyActivity
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
