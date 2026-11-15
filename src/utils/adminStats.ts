import { UserProfile } from '../types';
import { INITIAL_UNITS } from '../data/initialCurriculum';
import { MASTERY_TARGET_POINTS } from '../context/AuthContext';

// Pure calculations over the roster the admin has already loaded: no reads.

export const localDateKey = (d: Date = new Date()): string => d.toLocaleDateString('en-CA');

export const accuracyOf = (list: UserProfile[]) => {
  const questions = list.reduce((sum, s) => sum + (s.totalQuestionsAnsweredLifetime || 0), 0);
  const correct = list.reduce((sum, s) => sum + (s.totalCorrectAnswersLifetime || 0), 0);
  return { questions, correct, pct: questions > 0 ? Math.round((correct / questions) * 100) : null };
};

export const unitMasteryPct = (list: UserProfile[], unitId: string): number =>
  list.length === 0
    ? 0
    : Math.round(
        (list.reduce((sum, s) => sum + (s.unitMastery?.[unitId] || 0), 0) / list.length / MASTERY_TARGET_POINTS) * 100
      );

export const overallMasteryPct = (list: UserProfile[]): number =>
  list.length === 0
    ? 0
    : Math.round(
        (list.reduce(
          (sum, s) => sum + INITIAL_UNITS.reduce((u, unit) => u + (s.unitMastery?.[unit.unitId] || 0), 0),
          0
        ) /
          list.length /
          (INITIAL_UNITS.length * MASTERY_TARGET_POINTS)) *
          100
      );

// Accuracy colors: <=59 red, 60-69 orange, 70-79 yellow, 80-89 green, 90+ light blue.
export const accuracyColor = (pct: number | null | undefined): string => {
  if (pct === null || pct === undefined) return 'text-slate-500';
  if (pct <= 59) return 'text-red-400';
  if (pct <= 69) return 'text-orange-400';
  if (pct <= 79) return 'text-yellow-300';
  if (pct <= 89) return 'text-emerald-400';
  return 'text-sky-300';
};

export const masteryTone = (pct: number): string =>
  pct < 40 ? 'text-rose-300 bg-rose-500/10' : pct < 70 ? 'text-amber-300 bg-amber-500/10' : 'text-emerald-300 bg-emerald-500/10';

export const todayTotals = (list: UserProfile[]) => {
  const key = localDateKey();
  const mine = list.filter(s => s.todayDate === key);
  const questions = mine.reduce((sum, s) => sum + (s.todayQuestions || 0), 0);
  const correct = mine.reduce((sum, s) => sum + (s.todayCorrect || 0), 0);
  return { activeStudents: mine.length, questions, correct, wrong: Math.max(0, questions - correct) };
};
