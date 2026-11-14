import { isFirebaseConfigured, db, doc, getDoc, setDoc } from '../firebase/config';
import { ClassInfo } from '../types';

// Codes that mean "this student hasn't joined a real class yet". 'OHIO-8A' and
// 'JMMS-8TH-2026' were old placeholder defaults, so existing accounts that
// still carry them count as unassigned.
const UNASSIGNED_CODES = ['', 'OHIO-8A', 'JMMS-8TH-2026'];

export const isUnassignedClass = (code?: string | null): boolean =>
  UNASSIGNED_CODES.includes((code || '').trim().toUpperCase());

export const classLabel = (classes: ClassInfo[] | undefined, code?: string | null): string => {
  if (isUnassignedClass(code)) return 'No class yet';
  const found = (classes || []).find(c => c.code === (code || '').trim().toUpperCase());
  return found ? `${found.teacher} — ${found.name}` : (code || '').trim().toUpperCase();
};

const slug = (text: string) => text.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '');

export const makeClassCode = (teacher: string, name: string): string => `${slug(teacher)}-${slug(name)}`;

const normalizePassword = (password: string) => password.trim().toLowerCase();

// Salted with the class code so two classes with the same password don't share
// a hash. The student's browser sends only this hash; firestore.rules compares
// it to the teacher-only copy, so the password itself never needs to be public.
export const hashClassPassword = async (classCode: string, password: string): Promise<string> => {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Your browser cannot check class passwords. Try a different browser.');
  }
  const data = new TextEncoder().encode(`${classCode}:${normalizePassword(password)}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const WORDS = [
  'eagle', 'river', 'liberty', 'compass', 'bell', 'anchor', 'torch', 'canoe', 'maple', 'falcon',
  'quill', 'drum', 'harbor', 'summit', 'cedar', 'lantern', 'pioneer', 'trail', 'meadow', 'banner',
  'patriot', 'frontier', 'beacon', 'ember', 'granite', 'willow', 'voyage', 'stallion', 'bison', 'orchard'
];

export const generateClassPassword = (): string =>
  `${WORDS[Math.floor(Math.random() * WORDS.length)]}${10 + Math.floor(Math.random() * 90)}`;

// Teacher-only doc (adminData/* is admin-read-only in firestore.rules).
export interface ClassKeys {
  hashes: Record<string, string>;
  passwords: Record<string, string>;
}

export const loadClassKeys = async (): Promise<ClassKeys> => {
  if (!isFirebaseConfigured || !db || !doc || !getDoc) return { hashes: {}, passwords: {} };
  const snap = await getDoc(doc(db, 'adminData', 'classKeys'));
  const data: any = snap && snap.exists() ? snap.data() : {};
  return { hashes: data?.hashes || {}, passwords: data?.passwords || {} };
};

export const saveClassKeys = async (keys: ClassKeys): Promise<void> => {
  if (!isFirebaseConfigured || !db || !doc || !setDoc) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'adminData', 'classKeys'), keys);
};
