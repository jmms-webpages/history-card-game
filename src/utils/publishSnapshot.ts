import { isFirebaseConfigured, db, doc, getDoc, setDoc, collection, getDocs } from '../firebase/config';
import { UserProfile, ClassInfo } from '../types';
import { isUnassignedClass } from './classes';
import { INITIAL_UNITS } from '../data/initialCurriculum';
import { MASTERY_TARGET_POINTS } from '../context/AuthContext';
import { Snapshot, WeeklyEntry, PeriodStat, TeacherStat } from './snapshot';

// Teacher-only helpers. Everything here runs when YOU click a button, never
// automatically, so student traffic never triggers these reads.
interface WeekBaseline {
  startedAt: string;
  byUid: Record<string, { c: number; u: number; m: number }>;
}

const masterySum = (s: UserProfile): number =>
  Object.values(s.unitMastery || {}).reduce((sum, v) => sum + (Number(v) || 0), 0);

const round1 = (n: number) => Math.round(n * 10) / 10;

export const startNewWeek = async (students: UserProfile[]): Promise<string> => {
  if (!isFirebaseConfigured || !db || !doc || !setDoc) throw new Error('Firebase is not configured.');
  const startedAt = new Date().toISOString();
  const byUid: WeekBaseline['byUid'] = {};
  students.forEach(s => {
    byUid[s.uid] = {
      c: s.totalCorrectAnswersLifetime || 0,
      u: s.uniqueCardsCollected || 0,
      m: round1(masterySum(s))
    };
  });
  await setDoc(doc(db, 'adminData', 'weekBaseline'), { startedAt, byUid });
  return startedAt;
};

export const publishSnapshot = async (
  students: UserProfile[],
  totalCardsInSet: number,
  classes: ClassInfo[]
): Promise<Snapshot> => {
  if (!isFirebaseConfigured || !db || !doc || !setDoc || !getDoc || !collection || !getDocs) {
    throw new Error('Firebase is not configured.');
  }

  // 1 read: the weekly baseline. A handful of reads: one per class period binder.
  const [baselineSnap, binderSnap] = await Promise.all([
    getDoc(doc(db, 'adminData', 'weekBaseline')),
    getDocs(collection(db, 'classBinders'))
  ]);
  const baseline: WeekBaseline | null = baselineSnap && baselineSnap.exists() ? (baselineSnap.data() as any) : null;

  const binderCounts: Record<string, number> = {};
  binderSnap.docs.forEach((d: any) => {
    binderCounts[String(d.id).toUpperCase()] = Object.keys(d.data()?.cards || {}).length;
  });

  const entries = [...students]
    .sort((a, b) =>
      (b.uniqueCardsCollected || 0) - (a.uniqueCardsCollected || 0) ||
      (b.totalCardsCollected || 0) - (a.totalCardsCollected || 0)
    )
    .slice(0, 50)
    .map(s => ({
      uid: s.uid,
      displayName: s.displayName,
      avatar: s.avatar,
      classroomCode: s.classroomCode,
      coins: s.coins,
      uniqueCardsCollected: s.uniqueCardsCollected || 0,
      totalCardsCollected: s.totalCardsCollected || 0
    }));

  // Standings use AVERAGES per student, so a bigger class or teacher group has
  // no edge. Students who haven't joined a real class yet are left out.
  const masteryPct = (s: UserProfile) => (masterySum(s) / (Math.max(1, INITIAL_UNITS.length) * MASTERY_TARGET_POINTS)) * 100;
  const binderPct = (s: UserProfile) => (totalCardsInSet > 0 ? ((s.uniqueCardsCollected || 0) / totalCardsInSet) * 100 : 0);
  const mean = (list: UserProfile[], f: (s: UserProfile) => number) =>
    list.length ? list.reduce((sum, s) => sum + f(s), 0) / list.length : 0;
  const binderPctFor = (code: string) =>
    totalCardsInSet > 0 ? Math.round(((binderCounts[code] || 0) / totalCardsInSet) * 100) : 0;

  const periods: PeriodStat[] = classes
    .map(cls => {
      const list = students.filter(s => (s.classroomCode || '').trim().toUpperCase() === cls.code);
      return {
        code: cls.code,
        teacher: cls.teacher,
        name: cls.name,
        students: list.length,
        avgMasteryPct: Math.round(mean(list, masteryPct)),
        avgBinderPct: Math.round(mean(list, binderPct)),
        avgCorrect: Math.round(mean(list, s => s.totalCorrectAnswersLifetime || 0)),
        classBinderPct: binderPctFor(cls.code)
      };
    })
    .filter(p => p.students > 0)
    .sort((x, y) => y.avgMasteryPct - x.avgMasteryPct);

  const teacherNames = Array.from(new Set(classes.map(c => c.teacher)));
  const teachers: TeacherStat[] = teacherNames
    .map(name => {
      const codes = classes.filter(c => c.teacher === name).map(c => c.code);
      const list = students.filter(s => codes.includes((s.classroomCode || '').trim().toUpperCase()));
      const binderAvg = codes.length ? codes.reduce((sum, c) => sum + binderPctFor(c), 0) / codes.length : 0;
      return {
        teacher: name,
        students: list.length,
        avgMasteryPct: Math.round(mean(list, masteryPct)),
        avgBinderPct: Math.round(mean(list, binderPct)),
        classBinderPct: Math.round(binderAvg)
      };
    })
    .filter(t => t.students > 0)
    .sort((x, y) => y.avgMasteryPct - x.avgMasteryPct);

  // Weekly boards: gain since the baseline you set with "Start New Week".
  // Students with no baseline (joined mid-week) count from zero gain.
  const top = (gainOf: (s: UserProfile, b: { c: number; u: number; m: number }) => number): WeeklyEntry[] =>
    students
      .map(s => {
        const b = baseline?.byUid?.[s.uid] || { c: s.totalCorrectAnswersLifetime || 0, u: s.uniqueCardsCollected || 0, m: round1(masterySum(s)) };
        return { uid: s.uid, displayName: s.displayName, avatar: s.avatar, gain: round1(gainOf(s, b)) };
      })
      .filter(e => e.gain > 0)
      .sort((a, b) => b.gain - a.gain)
      .slice(0, 10);

  const weekly = baseline
    ? {
        startedAt: baseline.startedAt as string | null,
        correct: top((s, b) => (s.totalCorrectAnswersLifetime || 0) - b.c),
        newCards: top((s, b) => (s.uniqueCardsCollected || 0) - b.u),
        mastery: top((s, b) => masterySum(s) - b.m)
      }
    : { startedAt: null as string | null, correct: [], newCards: [], mastery: [] };

  const totals = {
    questions: students.reduce((sum, s) => sum + (s.totalQuestionsAnsweredLifetime || 0), 0),
    correct: students.reduce((sum, s) => sum + (s.totalCorrectAnswersLifetime || 0), 0),
    cards: students.reduce((sum, s) => sum + (s.uniqueCardsCollected || 0), 0)
  };

  const snapshot: Snapshot = { entries, periods, teachers, weekly, totals, generatedAt: new Date().toISOString() };
  await setDoc(doc(db, 'leaderboard', 'snapshot'), snapshot);
  return snapshot;
};
