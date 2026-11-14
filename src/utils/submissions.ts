import { isFirebaseConfigured, db, doc, getDoc, setDoc } from '../firebase/config';

// Student-written questions. A student's own doc (submissions/{uid}) holds what
// they wrote; the teacher's decisions live in a SEPARATE doc (approvals/{uid})
// that students can read but not write -- so nobody can approve themselves.
export interface QuestionSubmission {
  id: string;
  questionText: string;
  answers: string[];
  correctAnswer: number;
  explanation: string;
  unitId: string;
  createdAt: string;
}

export interface Approvals {
  approved: string[];
  rejected: string[];
}

export const MAX_SUBMISSIONS = 20;
// Must be in firestore.rules' isAllowedCoinDelta list.
export const SUBMISSION_REWARD_COINS = 20;

export const loadMySubmissions = async (uid: string): Promise<{ items: QuestionSubmission[]; approvals: Approvals }> => {
  if (!isFirebaseConfigured || !db || !doc || !getDoc) {
    return { items: [], approvals: { approved: [], rejected: [] } };
  }
  const [mine, decided] = await Promise.all([
    getDoc(doc(db, 'submissions', uid)),
    getDoc(doc(db, 'approvals', uid))
  ]);
  const items: QuestionSubmission[] =
    mine && mine.exists() && Array.isArray((mine.data() as any)?.items) ? (mine.data() as any).items : [];
  const d: any = decided && decided.exists() ? decided.data() : {};
  return {
    items,
    approvals: {
      approved: Array.isArray(d?.approved) ? d.approved : [],
      rejected: Array.isArray(d?.rejected) ? d.rejected : []
    }
  };
};

export const saveMySubmissions = async (uid: string, displayName: string, items: QuestionSubmission[]): Promise<void> => {
  if (!isFirebaseConfigured || !db || !doc || !setDoc) throw new Error('Submissions are not available right now.');
  await setDoc(doc(db, 'submissions', uid), { uid, displayName, items: items.slice(0, MAX_SUBMISSIONS) });
};
