import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

/**
 * Firebase client configuration
 * These keys are safe to expose client-side
 */
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional: add if using Analytics
};

/**
 * Initialize Firebase Client App (Singleton Pattern)
 */
const firebaseApp = getApps().length === 0 
    ? initializeApp(firebaseConfig) 
    : getApp();

/**
 * Initialize Firebase services
 */
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

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
    
    // Connect to Storage emulator
    connectStorageEmulator(storage, emulatorHost, 9199);

    console.log('Firebase emulators connected');
}

// Export the Firebase services
export { firebaseApp, auth, firestore, storage }; 