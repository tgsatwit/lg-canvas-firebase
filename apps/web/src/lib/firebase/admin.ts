// Only import firebase-admin when running in Node.js environment
// This file is structured to work in both Edge and Node.js environments

// Import types for proper typing
import type { Auth } from 'firebase-admin/auth';
import type { Storage } from 'firebase-admin/storage';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Re-export types so they're available to consumers
import type { Firestore } from 'firebase-admin/firestore';

// Function to safely parse the service account JSON
function getServiceAccount() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.warn("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set");
    return undefined;
  }
  
  try {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON", error);
    return undefined;
  }
}

// Initialize service accessors with default null returns
let adminAuth = (): Auth | null => null;
let adminFirestore = (): Firestore | null => null;
let adminStorage = (): Storage | null => null;

// Only initialize in Node.js environment, not in the browser
if (typeof window === 'undefined') {
  try {
    // Get service account credentials
    const serviceAccount = getServiceAccount();
    
    // Initialize Firebase Admin if not already initialized
    if (serviceAccount && getApps().length === 0) {
      const app = initializeApp({
        credential: cert(serviceAccount)
      });
      
      // Set up service accessor functions that will return the services
      const databaseId = process.env.FIREBASE_VIDEOS_DB || '(default)';
      adminAuth = () => getAuth(app);
      adminFirestore = () => getFirestore(app, databaseId);
      adminStorage = () => getStorage(app);
      
      console.info("Firebase Admin SDK initialized successfully");
    } else if (getApps().length > 0) {
      // If already initialized, just set up the service accessors
      const app = getApps()[0];
      const databaseIdExisting = process.env.FIREBASE_VIDEOS_DB || '(default)';
      adminAuth = () => getAuth(app);
      adminFirestore = () => getFirestore(app, databaseIdExisting);
      adminStorage = () => getStorage(app);
    }
  } catch (error) {
    console.error("Firebase Admin SDK initialization failed:", error);
  }
}

export { adminAuth, adminFirestore, adminStorage }; 