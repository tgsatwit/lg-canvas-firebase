import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFunctions, Functions } from 'firebase/functions';

// Your Firebase configuration
// Replace with actual config from Firebase console
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Database configuration - this should match your FIREBASE_VIDEOS_DB environment variable
export const CHAT_DATABASE_ID = 'pbl-backend';

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore; // Default database (legacy - prefer chatDb)
let chatDb: Firestore; // Specific database for ALL functionality (pbl-backend)
let auth: Auth;
let functions: Functions;

if (typeof window !== 'undefined' && getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app); // Default database (legacy)
  chatDb = getFirestore(app, CHAT_DATABASE_ID); // ALL operations should use this database
  auth = getAuth(app);
  functions = getFunctions(app);
} else if (typeof window !== 'undefined') {
  // Use existing app if already initialized
  app = getApps()[0];
  db = getFirestore(app); // Default database (legacy)
  chatDb = getFirestore(app, CHAT_DATABASE_ID); // ALL operations should use this database
  auth = getAuth(app);
  functions = getFunctions(app);
}

// Helper function to ensure Firebase is initialized
export const ensureFirebaseInitialized = () => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase client can only be used in browser environment');
  }
  if (!chatDb) {
    throw new Error('Firebase chatDb is not initialized');
  }
  return { chatDb, auth };
};

// Function to ensure Firebase client authentication is properly set up
export const ensureFirebaseAuth = async (userToken?: string) => {
  if (typeof window === 'undefined') return; // Only run on client
  
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
    } else {
      // Wait for auth state to be determined
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    }
  });
};

// Function to debug auth state
export const debugAuthState = () => {
  if (typeof window === 'undefined') return;
  
  console.log('Firebase Auth State:', {
    currentUser: auth?.currentUser?.uid,
    email: auth?.currentUser?.email,
    isAuthenticated: !!auth?.currentUser
  });
};

// NOTE: Use chatDb for ALL database operations - it connects to the pbl-backend database
// The db export is kept for legacy compatibility but should be avoided
export { app, db, chatDb, auth, functions }; 