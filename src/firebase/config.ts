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
  deleteDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';
import { UserProfile, GameSettings } from '../types';

// Read configuration from environment or applet config
const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY || (appletConfig as any).apiKey || "";
export const isFirebaseConfigured = Boolean(
  rawApiKey && 
  rawApiKey !== "mock-api-key" && 
  !rawApiKey.includes("mock") &&
  rawApiKey.length > 10
);

const firebaseConfig = {
  apiKey: rawApiKey || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (appletConfig as any).authDomain || "history-card-quest-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (appletConfig as any).projectId || "history-card-quest-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (appletConfig as any).storageBucket || "history-card-quest-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (appletConfig as any).messagingSenderId || "276960982650",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (appletConfig as any).appId || "1:276960982650:web:mock-app-id"
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Force Google to show account selection picker (all Google accounts on device)
googleProvider.setCustomParameters({ prompt: 'select_account' });

let dbInstance: Firestore;
try {
  const databaseId = (appletConfig as any).firestoreDatabaseId;
  dbInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
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
  deleteDoc,
  serverTimestamp
};
export type { FirebaseUser };
