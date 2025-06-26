import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore as getFirestoreService, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage as getStorageService, connectStorageEmulator } from "firebase/storage";

/**
 * Firebase client configuration
 * These keys are safe to expose client-side
 */
const getFirebaseConfig = () => ({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '' // Optional: add if using Analytics
});

// Database configuration constant
export const CHAT_DATABASE_ID = 'pbl-backend';

/**
 * Lazy Firebase initialization - only initialize when actually needed
 * This prevents hydration mismatches and ensures environment variables are available
 */
let firebaseAppInstance: any = null;
let authInstance: any = null;
let firestoreInstance: any = null;
let storageInstance: any = null;
let chatDbInstance: any = null;
let initializationAttempted = false;

const initializeFirebase = () => {
  // Only initialize once
  if (initializationAttempted) {
    return { 
      firebaseApp: firebaseAppInstance, 
      auth: authInstance, 
      firestore: firestoreInstance, 
      storage: storageInstance, 
      chatDb: chatDbInstance 
    };
  }
  
  initializationAttempted = true;

  try {
    // Only initialize on client side
    if (typeof window === 'undefined') {
      console.log('🔧 Firebase initialization skipped - server side rendering');
      return { firebaseApp: null, auth: null, firestore: null, storage: null, chatDb: null };
    }

    const firebaseConfig = getFirebaseConfig();

    // Enhanced debug Firebase config loading
    console.log('🔧 Firebase Client Initialization Debug:', {
        timestamp: new Date().toISOString(),
        environment: {
            isClientSide: typeof window !== 'undefined',
            nodeEnv: process.env.NODE_ENV,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent.substring(0, 50) : 'server'
        },
        configStatus: {
            hasApiKey: !!firebaseConfig.apiKey,
            hasAuthDomain: !!firebaseConfig.authDomain,
            hasProjectId: !!firebaseConfig.projectId,
            hasStorageBucket: !!firebaseConfig.storageBucket,
            hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
            hasAppId: !!firebaseConfig.appId
        },
        configValues: {
            apiKeyPreview: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 10) + '...' : 'NOT_SET',
            projectId: firebaseConfig.projectId || 'NOT_SET',
            authDomain: firebaseConfig.authDomain || 'NOT_SET'
        },
        existingApps: getApps().length
    });

    // Check if we have valid Firebase configuration
    const isValidConfig = firebaseConfig.apiKey && 
        firebaseConfig.authDomain && 
        firebaseConfig.projectId;

    console.log('✅ Firebase Config Validation:', {
        isValidConfig,
        missingFields: {
            apiKey: !firebaseConfig.apiKey,
            authDomain: !firebaseConfig.authDomain,
            projectId: !firebaseConfig.projectId
        }
    });

    if (isValidConfig) {
        console.log('🚀 Initializing Firebase app...');
        
        firebaseAppInstance = getApps().length === 0 
            ? initializeApp(firebaseConfig) 
            : getApp();

        console.log('📱 Firebase app initialized:', {
            appName: firebaseAppInstance.name,
            appId: firebaseAppInstance.options.appId
        });

        /**
         * Initialize Firebase services
         */
        console.log('🔐 Initializing Firebase Auth...');
        authInstance = getAuth(firebaseAppInstance);
        
        console.log('💾 Initializing Firestore...');
        firestoreInstance = getFirestoreService(firebaseAppInstance);
        
        console.log('📁 Initializing Storage...');
        storageInstance = getStorageService(firebaseAppInstance);

        // Database configuration - this should match your FIREBASE_VIDEOS_DB environment variable
        console.log('💬 Initializing Chat Database...');
        chatDbInstance = getFirestoreService(firebaseAppInstance, CHAT_DATABASE_ID);
        
        console.log('✅ Firebase initialized successfully:', {
            hasApp: !!firebaseAppInstance,
            hasAuth: !!authInstance,
            hasFirestore: !!firestoreInstance,
            hasChatDb: !!chatDbInstance,
            hasStorage: !!storageInstance,
            authCurrentUser: authInstance?.currentUser?.uid || 'not_authenticated'
        });

        // Connect to emulators in development mode if configured
        if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true' && process.env.NODE_ENV === 'development' && authInstance) {
            console.log('🔧 Connecting to Firebase emulators...');
            
            // Define emulator host - typically localhost
            const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';
            
            // Connect to Auth emulator
            connectAuthEmulator(authInstance, `http://${emulatorHost}:9099`);
            
            // Connect to Firestore emulator
            connectFirestoreEmulator(firestoreInstance, emulatorHost, 8080);
            connectFirestoreEmulator(chatDbInstance, emulatorHost, 8080);
            
            // Connect to Storage emulator
            connectStorageEmulator(storageInstance, emulatorHost, 9199);

            console.log('✅ Firebase emulators connected');
        }

    } else {
        // Provide more detailed error information
        console.warn('⚠️ Firebase not initialized - missing configuration:', {
            hasApiKey: !!firebaseConfig.apiKey,
            hasAuthDomain: !!firebaseConfig.authDomain,
            hasProjectId: !!firebaseConfig.projectId,
            hasStorageBucket: !!firebaseConfig.storageBucket,
            hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
            hasAppId: !!firebaseConfig.appId,
            environment: typeof window !== 'undefined' ? 'client' : 'server',
            allEnvVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_FIREBASE'))
        });
    }

    return { 
      firebaseApp: firebaseAppInstance, 
      auth: authInstance, 
      firestore: firestoreInstance, 
      storage: storageInstance, 
      chatDb: chatDbInstance 
    };

  } catch (error) {
    console.error('❌ Firebase initialization error:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        config: {
            hasApiKey: !!getFirebaseConfig().apiKey,
            projectId: getFirebaseConfig().projectId
        }
    });
    
    return { firebaseApp: null, auth: null, firestore: null, storage: null, chatDb: null };
  }
};

// Getter functions that initialize Firebase lazily
const getFirebaseAuth = () => {
  const { auth } = initializeFirebase();
  return auth;
};

const getFirebaseApp = () => {
  const { firebaseApp } = initializeFirebase();
  return firebaseApp;
};

const getFirestore = () => {
  const { firestore } = initializeFirebase();
  return firestore;
};

const getStorage = () => {
  const { storage } = initializeFirebase();
  return storage;
};

const getChatDb = () => {
  const { chatDb } = initializeFirebase();
  return chatDb;
};

// Helper function to ensure Firebase is initialized
export const ensureFirebaseInitialized = () => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase client can only be used in browser environment');
  }
  
  const { auth, chatDb } = initializeFirebase();
  
  if (!chatDb || !auth) {
    console.error('❌ Firebase initialization check failed:', {
      hasAuth: !!auth,
      hasChatDb: !!chatDb,
      timestamp: new Date().toISOString(),
      config: getFirebaseConfig()
    });
    throw new Error('Firebase is not initialized - missing configuration');
  }
  return { chatDb, auth };
};

// Function to debug auth state
export const debugAuthState = () => {
  if (typeof window === 'undefined') return;
  
  const auth = getFirebaseAuth();
  
  console.log('🔍 Firebase Auth State Debug:', {
    currentUser: auth?.currentUser?.uid,
    email: auth?.currentUser?.email,
    isAuthenticated: !!auth?.currentUser,
    authObject: !!auth,
    timestamp: new Date().toISOString()
  });
};

// Export the Firebase services as getter functions for lazy initialization
export const firebaseApp = getFirebaseApp;
export const auth = getFirebaseAuth;
export const firestore = getFirestore;
export const storage = getStorage;
export const chatDb = getChatDb;

// For backward compatibility, also export as functions
export { getFirebaseAuth, getFirebaseApp, getFirestore, getStorage, getChatDb }; 