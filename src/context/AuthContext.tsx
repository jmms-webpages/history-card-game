import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  fbSignOut, 
  signInAnonymously, 
  onAuthStateChanged,
  FirebaseUser,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc
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
  loginAsAdminDirect: (email?: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'avatar' | 'classroomCode'>>) => Promise<void>;
  updateCoins: (deltaCoins: number) => Promise<number>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'history_card_quest_user';
const LOCAL_STORAGE_STUDENT_VIEW_KEY = 'history_card_quest_student_view';

export const isUserAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === 'jaf2jc@bearworks.jackson.sparcc.org') return true;
  return (DEFAULT_GAME_SETTINGS.adminUids || []).some(
    adminEmail => adminEmail.trim().toLowerCase() === normalized
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure master admin has admin role
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

  // Sync profile to local storage
  const saveProfileLocally = (profile: UserProfile | null) => {
    setUserProfile(profile);
    if (profile) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  };

  // Check if a user matches admin privileges
  const checkAdminPrivilege = (profile: UserProfile | null, fbUser: FirebaseUser | null): boolean => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    if (isUserAdminEmail(profile.email)) return true;
    if (fbUser && fbUser.email && isUserAdminEmail(fbUser.email)) return true;
    return false;
  };

  const isAdmin = checkAdminPrivilege(userProfile, currentUser);
  const isTeacher = isAdmin || userProfile?.role === 'teacher';

  // Helper: fetch or create Firestore user profile
  const syncFirestoreProfile = async (
    uid: string, 
    fallbackData: Partial<UserProfile>
  ): Promise<UserProfile> => {
    let existingData: Partial<UserProfile> = {};
    
    // Try reading from Firestore
    try {
      if (db && doc) {
        const userRef = doc(db, 'users', uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          existingData = snapshot.data() as Partial<UserProfile>;
        }
      }
    } catch (e) {
      console.warn("Firestore fetch notice (using cached profile):", e);
    }

    const now = new Date().toISOString();
    const emailToCheck = fallbackData.email || existingData.email || '';
    const isAdminUser = isUserAdminEmail(emailToCheck);
    
    let role: UserRole = 'student';
    if (isAdminUser) {
      role = 'admin';
    } else if (existingData.role) {
      role = existingData.role;
    } else if (fallbackData.role) {
      role = fallbackData.role;
    }

    const combinedProfile: UserProfile = {
      uid,
      displayName: existingData.displayName || fallbackData.displayName || (isAdminUser ? 'Admin (Ohio History)' : '8th Grade Historian'),
      avatar: existingData.avatar || fallbackData.avatar || (isAdminUser ? 'washington' : 'franklin'),
      classroomCode: existingData.classroomCode || fallbackData.classroomCode || 'OHIO-8A',
      role,
      coins: typeof existingData.coins === 'number' ? existingData.coins : (fallbackData.coins ?? (isAdminUser ? 500 : 50)),
      email: emailToCheck || undefined,
      createdAt: existingData.createdAt || now,
      lastLoginAt: now,
      totalCardsCollected: existingData.totalCardsCollected ?? 0,
      uniqueCardsCollected: existingData.uniqueCardsCollected ?? 0
    };

    // Try saving to Firestore
    try {
      if (db && doc) {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, combinedProfile, { merge: true });
      }
    } catch (e) {
      console.warn("Firestore write notice (saved to local cache):", e);
    }

    saveProfileLocally(combinedProfile);
    return combinedProfile;
  };

  // Firebase auth state listener
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        if (user) {
          const isUserAdmin = isUserAdminEmail(user.email);
          await syncFirestoreProfile(user.uid, {
            displayName: user.displayName || (isUserAdmin ? 'Admin (Ohio History)' : '8th Grade Student'),
            email: user.email || undefined,
            role: isUserAdmin ? 'admin' : 'student'
          });
        }
        setLoading(false);
      });
    } catch (err) {
      console.warn("Firebase Auth listener initialization notice:", err);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Google Sign In
  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      setCurrentUser(fbUser);
      const isUserAdmin = isUserAdminEmail(fbUser.email);
      await syncFirestoreProfile(fbUser.uid, {
        displayName: fbUser.displayName || (isUserAdmin ? 'Admin (Ohio History)' : '8th Grade Student'),
        email: fbUser.email || undefined,
        role: isUserAdmin ? 'admin' : 'student'
      });
    } catch (err: any) {
      console.error("Google sign in notice:", err);
      // If popup is blocked or preview domain is not authorized in Firebase Console yet
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        setError("Google Sign-In popup was blocked by your browser. Please allow popups or use the direct Admin sign-in below.");
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError("This domain is pending authorization in Firebase Console. You can sign in using direct Admin authentication below.");
      } else {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Direct Admin Login (Seamless one-click access for jaf2jc@bearworks.jackson.sparcc.org)
  const loginAsAdminDirect = async (email: string = 'jaf2jc@bearworks.jackson.sparcc.org', name: string = 'Master Administrator') => {
    try {
      setError(null);
      setLoading(true);
      let uid = 'admin_' + email.replace(/[^a-zA-Z0-9]/g, '_');
      try {
        const userCred = await signInAnonymously(auth);
        if (userCred && userCred.user) {
          uid = userCred.user.uid;
          setCurrentUser(userCred.user);
        }
      } catch (authErr) {
        console.warn("Anonymous auth notice for admin session:", authErr);
      }

      await syncFirestoreProfile(uid, {
        displayName: name,
        email: email,
        classroomCode: 'OHIO-8A',
        avatar: 'washington',
        role: 'admin',
        coins: 1000
      });
    } catch (err: any) {
      console.error("Direct admin sign-in error:", err);
      setError(err.message || "Failed to initialize administrator session.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn("Sign out notice:", e);
    }
    setCurrentUser(null);
    saveProfileLocally(null);
    setStudentViewMode(false);
  };

  const updateUserProfile = async (updates: Partial<Pick<UserProfile, 'displayName' | 'avatar' | 'classroomCode'>>) => {
    if (!userProfile) return;
    const updated: UserProfile = { ...userProfile, ...updates };
    saveProfileLocally(updated);

    try {
      if (db && doc && userProfile.uid) {
        const userRef = doc(db, 'users', userProfile.uid);
        await updateDoc(userRef, updates);
      }
    } catch (e) {
      console.warn("Firestore profile update notice:", e);
    }
  };

  const updateCoins = async (deltaCoins: number): Promise<number> => {
    if (!userProfile) return 0;
    const newCoins = Math.max(0, (userProfile.coins || 0) + deltaCoins);
    const updated: UserProfile = { ...userProfile, coins: newCoins };
    saveProfileLocally(updated);

    try {
      if (db && doc && userProfile.uid) {
        const userRef = doc(db, 'users', userProfile.uid);
        await updateDoc(userRef, { coins: newCoins });
      }
    } catch (e) {
      console.warn("Firestore coins update notice:", e);
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
      loginAsAdminDirect,
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
