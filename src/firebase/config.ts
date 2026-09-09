import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  signInAnonymously,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { UserProfile, GameSettings } from '../types';

// Default configuration with environment fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "history-card-quest-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "history-card-quest-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "history-card-quest-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "276960982650",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:276960982650:web:mock-app-id"
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let dbInstance: Firestore;
try {
  dbInstance = getFirestore(app);
} catch (err) {
  console.warn("Firestore initialization notice:", err);
  dbInstance = {} as Firestore;
}
export const db = dbInstance;

export {
  signInWithPopup,
  fbSignOut,
  signInAnonymously,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
};
export type { FirebaseUser };
