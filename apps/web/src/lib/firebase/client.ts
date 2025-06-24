import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

/**
 * Firebase client configuration
 * These keys are safe to expose client-side
 */
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '' // Optional: add if using Analytics
};

// Check if we're in a browser environment and have valid config
const isValidConfig = typeof window !== 'undefined' && 
    firebaseConfig.apiKey && 
    firebaseConfig.authDomain && 
    firebaseConfig.projectId;

// Database configuration constant
export const CHAT_DATABASE_ID = 'pbl-backend';

/**
 * Initialize Firebase Client App (Singleton Pattern)
 * Only initialize if we have valid config and are in browser
 */
let firebaseApp: any = null;
let auth: any = null;
let firestore: any = null;
let storage: any = null;
let chatDb: any = null;

if (isValidConfig) {
    firebaseApp = getApps().length === 0 
        ? initializeApp(firebaseConfig) 
        : getApp();

    /**
     * Initialize Firebase services
     */
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
    storage = getStorage(firebaseApp);

    // Database configuration - this should match your FIREBASE_VIDEOS_DB environment variable
    chatDb = getFirestore(firebaseApp, CHAT_DATABASE_ID);
} else {
    // Provide mock objects for build time
    console.warn('Firebase not initialized - missing configuration or running in build environment');
}

/**
 * Connect to emulators in development mode if configured
 */
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true' && process.env.NODE_ENV === 'development') {
    // Define emulator host - typically localhost
    const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';
    
    // Connect to Auth emulator
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
    
    // Connect to Firestore emulator
    connectFirestoreEmulator(firestore, emulatorHost, 8080);
    connectFirestoreEmulator(chatDb, emulatorHost, 8080);
    
    // Connect to Storage emulator
    connectStorageEmulator(storage, emulatorHost, 9199);

    console.log('Firebase emulators connected');
}

// Helper function to ensure Firebase is initialized
export const ensureFirebaseInitialized = () => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase client can only be used in browser environment');
  }
  if (!chatDb || !auth) {
    throw new Error('Firebase is not initialized - missing configuration');
  }
  return { chatDb, auth };
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

// Export the Firebase services
export { firebaseApp, auth, firestore, storage, chatDb }; 