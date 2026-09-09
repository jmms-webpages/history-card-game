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
  loginWithGoogle: () => Promise<void>;
  loginAsStudent: (displayName: string, classroomCode: string, avatarId: string) => Promise<void>;
  loginAsTeacher: (name: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'avatar' | 'classroomCode'>>) => Promise<void>;
  updateCoins: (deltaCoins: number) => Promise<number>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'history_card_quest_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync profile to local storage for fast Spark-friendly offline cache
  const saveProfileLocally = (profile: UserProfile | null) => {
    setUserProfile(profile);
    if (profile) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  };

  // Check if a user UID or email matches admin privileges
  const checkAdminPrivilege = (profile: UserProfile | null, fbUser: FirebaseUser | null): boolean => {
    if (!profile) return false;
    if (profile.role === 'admin' || profile.role === 'teacher') return true;
    if (fbUser && fbUser.email && DEFAULT_GAME_SETTINGS.adminUids.includes(fbUser.email)) return true;
    if (profile.email && DEFAULT_GAME_SETTINGS.adminUids.includes(profile.email)) return true;
    return false;
  };

  const isTeacher = userProfile?.role === 'teacher' || userProfile?.role === 'admin';
  const isAdmin = checkAdminPrivilege(userProfile, currentUser);

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
    const isTeacherEmail = fallbackData.email && DEFAULT_GAME_SETTINGS.adminUids.includes(fallbackData.email);
    const role: UserRole = isTeacherEmail ? 'teacher' : (existingData.role || fallbackData.role || 'student');

    const combinedProfile: UserProfile = {
      uid,
      displayName: existingData.displayName || fallbackData.displayName || '8th Grade Historian',
      avatar: existingData.avatar || fallbackData.avatar || 'franklin',
      classroomCode: existingData.classroomCode || fallbackData.classroomCode || 'OHIO-8A',
      role,
      coins: typeof existingData.coins === 'number' ? existingData.coins : (fallbackData.coins ?? 50),
      email: fallbackData.email || existingData.email,
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
          await syncFirestoreProfile(user.uid, {
            displayName: user.displayName || '8th Grade Historian',
            email: user.email || undefined,
            role: (user.email && DEFAULT_GAME_SETTINGS.adminUids.includes(user.email)) ? 'teacher' : 'student'
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
      await syncFirestoreProfile(fbUser.uid, {
        displayName: fbUser.displayName || '8th Grade Student',
        email: fbUser.email || undefined
      });
    } catch (err: any) {
      console.error("Google sign in error:", err);
      // Helpful message for iframe sandboxes
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        setError("Sign-in popup was blocked by your browser. You can allow popups, open the app in a new tab, or use Classroom Student Sign-In below.");
      } else {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Classroom Student Login (Designed specifically for school Chromebooks and no-email student setups)
  const loginAsStudent = async (displayName: string, classroomCode: string, avatarId: string) => {
    try {
      setError(null);
      setLoading(true);
      
      let uid = 'student_' + Math.random().toString(36).substring(2, 9);
      
      // Try anonymous sign-in with Firebase Auth
      try {
        const userCred = await signInAnonymously(auth);
        if (userCred && userCred.user) {
          uid = userCred.user.uid;
          setCurrentUser(userCred.user);
        }
      } catch (authErr) {
        console.warn("Anonymous auth notice, creating student session:", authErr);
      }

      await syncFirestoreProfile(uid, {
        displayName: displayName.trim() || 'Ohio Explorer',
        classroomCode: classroomCode.trim().toUpperCase() || 'OHIO-8A',
        avatar: avatarId || 'franklin',
        role: 'student',
        coins: 50 // Welcome bonus for new historians
      });
    } catch (err: any) {
      console.error("Classroom login error:", err);
      setError(err.message || "Unable to start student quest session.");
    } finally {
      setLoading(false);
    }
  };

  // Teacher Login (Direct switch for the 8th grade teacher)
  const loginAsTeacher = async (name: string, email: string) => {
    try {
      setError(null);
      setLoading(true);
      let uid = 'teacher_ohio_8';
      try {
        const userCred = await signInAnonymously(auth);
        if (userCred && userCred.user) {
          uid = userCred.user.uid;
          setCurrentUser(userCred.user);
        }
      } catch (authErr) {
        console.warn("Anonymous auth notice for teacher session:", authErr);
      }

      await syncFirestoreProfile(uid, {
        displayName: name.trim() || 'Mr./Ms. Ohio History Teacher',
        email: email.trim() || 'jaf2jc@bearworks.jackson.sparcc.org',
        classroomCode: 'OHIO-8A',
        avatar: 'washington',
        role: 'teacher',
        coins: 500
      });
    } catch (err: any) {
      console.error("Teacher sign-in error:", err);
      setError(err.message || "Failed to initialize teacher session.");
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
      loginWithGoogle,
      loginAsStudent,
      loginAsTeacher,
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
