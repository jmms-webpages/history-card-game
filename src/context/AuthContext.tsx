import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  fbSignOut,
  onAuthStateChanged,
  FirebaseUser,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  isFirebaseConfigured
} from '../firebase/config';
import { UserProfile, UserRole } from '../types';
import { DEFAULT_GAME_SETTINGS } from '../data/initialCurriculum';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudentViewMode: boolean;
  setStudentViewMode: (enabled: boolean) => void;
  toggleStudentViewMode: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<UserProfile, 'avatar' | 'classroomCode'>>) => Promise<void>;
  updateCoins: (deltaCoins: number) => Promise<number>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'history_card_quest_user';
const LOCAL_STORAGE_STUDENT_VIEW_KEY = 'history_card_quest_student_view';

// Strict authorized school district email domains.
// These are the ONLY domains allowed to sign in.
export const ALLOWED_EMAIL_DOMAINS = [
  'bearworks.jackson.sparcc.org',
  'jackson.sparcc.org'
];

// The one designated administrator account(s). Only these exact addresses
// are ever auto-promoted to the admin role. This list intentionally uses
// exact string equality only -- no prefix/substring matching -- so an
// address like "jaf2jc@some-other-domain.com" can never match.
export const ADMIN_EMAILS = [
  'jaf2jc@bearworks.jackson.sparcc.org',
  'jaf2jc@jackson.sparcc.org'
];

export const isAllowedEmailDomain = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some(domain => normalized.endsWith(`@${domain}`));
};

export const isUserAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  // Defense in depth: an admin email must also be a real district account.
  if (!isAllowedEmailDomain(normalized)) return false;
  if (ADMIN_EMAILS.includes(normalized)) return true;
  return (DEFAULT_GAME_SETTINGS.adminUids || []).some(
    adminEmail => adminEmail.trim().toLowerCase() === normalized
  );
};

// Students never choose their own display name. It is always derived from
// the real name on their Google account: "First LastInitial."
export const deriveDisplayName = (
  googleFullName?: string | null,
  fallback: string = '8th Grade Student'
): string => {
  if (!googleFullName) return fallback;
  const parts = googleFullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Never trust a cached profile that doesn't belong to an authorized
        // district account -- if the domain check would now reject it,
        // discard it instead of letting it silently stay logged in.
        if (parsed.email && !isAllowedEmailDomain(parsed.email)) {
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
          return null;
        }
        if (isUserAdminEmail(parsed.email)) {
          parsed.role = 'admin';
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isStudentViewMode, setIsStudentViewModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_STUDENT_VIEW_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setStudentViewMode = (enabled: boolean) => {
    setIsStudentViewModeState(enabled);
    try {
      localStorage.setItem(LOCAL_STORAGE_STUDENT_VIEW_KEY, enabled ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  const toggleStudentViewMode = () => {
    setStudentViewMode(!isStudentViewMode);
  };

  const saveProfileLocally = (profile: UserProfile | null) => {
    setUserProfile(profile);
    if (profile) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  };

  const checkAdminPrivilege = (profile: UserProfile | null, fbUser: FirebaseUser | null): boolean => {
    if (!profile) return false;
    if (isUserAdminEmail(profile.email)) return true;
    if (fbUser?.email && isUserAdminEmail(fbUser.email)) return true;
    return profile.role === 'admin' && isUserAdminEmail(profile.email);
  };

  const isAdmin = checkAdminPrivilege(userProfile, currentUser);
  const isTeacher = isAdmin || userProfile?.role === 'teacher';

  // Fetch-or-create the Firestore profile for a VERIFIED Google account.
  // Role and displayName are always re-derived from the verified email /
  // Google name on every login -- they are never taken from client input.
  const syncFirestoreProfile = async (
    uid: string,
    verifiedEmail: string,
    googleDisplayName: string | null
  ): Promise<UserProfile> => {
    let existingData: Partial<UserProfile> = {};

    if (isFirebaseConfigured && db && doc) {
      try {
        const userRef = doc(db, 'users', uid);
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
        const snapshot = await Promise.race([getDoc(userRef), timeoutPromise]) as any;
        if (snapshot && typeof snapshot.exists === 'function' && snapshot.exists()) {
          existingData = snapshot.data() as Partial<UserProfile>;
        }
      } catch (e) {
        console.warn('Firestore fetch notice (using cached profile):', e);
      }
    }

    const now = new Date().toISOString();
    const isAdminUser = isUserAdminEmail(verifiedEmail);

    // A brand-new account is always a student unless it's the designated
    // admin email. A 'teacher' role can only ever be granted afterward by
    // an admin (via the Admin Console / Firestore) -- never by the user.
    const role: UserRole = isAdminUser
      ? 'admin'
      : existingData.role === 'teacher'
      ? 'teacher'
      : 'student';

    const displayName = deriveDisplayName(
      googleDisplayName,
      isAdminUser ? 'Teacher & Director' : '8th Grade Student'
    );

    const combinedProfile: UserProfile = {
      uid,
      displayName,
      avatar: existingData.avatar || (isAdminUser ? 'washington' : 'franklin'),
      classroomCode: existingData.classroomCode || 'OHIO-8A',
      role,
      coins: typeof existingData.coins === 'number' ? existingData.coins : (isAdminUser ? 1000 : 50),
      email: verifiedEmail,
      createdAt: existingData.createdAt || now,
      lastLoginAt: now,
      totalCardsCollected: existingData.totalCardsCollected ?? 0,
      uniqueCardsCollected: existingData.uniqueCardsCollected ?? 0,
      claimedAchievements: existingData.claimedAchievements ?? []
    };

    if (isFirebaseConfigured && db && doc) {
      const userRef = doc(db, 'users', uid);
      setDoc(userRef, combinedProfile, { merge: true }).catch(e => {
        console.warn('Async firestore write notice:', e);
      });
    }

    saveProfileLocally(combinedProfile);
    return combinedProfile;
  };

  // Firebase auth state listener -- the single source of truth for "who is
  // signed in." No code path outside this listener and loginWithGoogle()
  // may fabricate a session.
  useEffect(() => {
    let unsubscribe = () => {};
    if (isFirebaseConfigured) {
      try {
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            if (!user.email || !isAllowedEmailDomain(user.email)) {
              console.warn('Unauthorized domain blocked in auth listener:', user.email);
              await fbSignOut(auth);
              setCurrentUser(null);
              saveProfileLocally(null);
              setError(
                `Access Restricted: "${user.email ?? 'this account'}" is not authorized. You must sign in using your Jackson Local Schools account (@bearworks.jackson.sparcc.org or @jackson.sparcc.org).`
              );
              setLoading(false);
              return;
            }

            setCurrentUser(user);
            await syncFirestoreProfile(user.uid, user.email, user.displayName);
          } else {
            setCurrentUser(null);
          }
          setLoading(false);
        });
      } catch (err) {
        console.warn('Firebase Auth listener initialization notice:', err);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Sign in with a REAL Google popup only. There is no fallback path that
  // accepts a typed email or username -- identity always comes from
  // Firebase Auth's verified Google credential.
  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!isFirebaseConfigured) {
        setError('Google Sign-In is not configured for this deployment yet. Please contact your teacher or site administrator.');
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      if (!fbUser.email || !isAllowedEmailDomain(fbUser.email)) {
        await fbSignOut(auth);
        setCurrentUser(null);
        saveProfileLocally(null);
        setError(
          `Access Restricted: "${fbUser.email ?? 'this account'}" is not an authorized account. Only @bearworks.jackson.sparcc.org or @jackson.sparcc.org Google accounts may sign in.`
        );
        return;
      }

      setCurrentUser(fbUser);
      await syncFirestoreProfile(fbUser.uid, fbUser.email, fbUser.displayName);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        // User deliberately closed the popup -- not an error worth showing.
      } else {
        console.error('Google sign in error:', err);
        setError('Unable to complete Google sign-in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    setCurrentUser(null);
    saveProfileLocally(null);
    setStudentViewMode(false);
  };

  // Only avatar & classroomCode are user-editable. displayName, email, and
  // role are intentionally NOT accepted here -- see also firestore.rules,
  // which independently blocks any client attempt to write those fields.
  const updateUserProfile = async (updates: Partial<Pick<UserProfile, 'avatar' | 'classroomCode'>>) => {
    if (!userProfile) return;
    const updated: UserProfile = { ...userProfile, ...updates };
    saveProfileLocally(updated);

    try {
      if (isFirebaseConfigured && db && doc && userProfile.uid) {
        const userRef = doc(db, 'users', userProfile.uid);
        await updateDoc(userRef, updates);
      }
    } catch (e) {
      console.warn('Firestore profile update notice:', e);
    }
  };

  const updateCoins = async (deltaCoins: number): Promise<number> => {
    if (!userProfile) return 0;
    const newCoins = Math.max(0, (userProfile.coins || 0) + deltaCoins);
    const updated: UserProfile = { ...userProfile, coins: newCoins };
    saveProfileLocally(updated);

    try {
      if (isFirebaseConfigured && db && doc && userProfile.uid) {
        const userRef = doc(db, 'users', userProfile.uid);
        await updateDoc(userRef, { coins: newCoins });
      }
    } catch (e) {
      console.warn('Firestore coins update notice:', e);
    }
    return newCoins;
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      error,
      isAdmin,
      isTeacher,
      isStudentViewMode,
      setStudentViewMode,
      toggleStudentViewMode,
      loginWithGoogle,
      logout,
      updateUserProfile,
      updateCoins,
      clearError: () => setError(null)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
