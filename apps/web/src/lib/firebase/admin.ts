// Only import firebase-admin when running in Node.js environment
// This file is structured to work in both Edge and Node.js environments

// Import types for proper typing
import type { Auth } from 'firebase-admin/auth';
import type { Storage } from 'firebase-admin/storage';

// Default empty implementations for Edge environment
let admin: any = null;
let adminAuth = (): Auth | null => null;
let adminFirestore = () => null;
let adminStorage = (): Storage | null => null;

// Track initialization state to prevent redundant logging
let initializationAttempted = false;

// Function to safely parse the service account JSON from environment variable
function getServiceAccount(): ServiceAccount | undefined {
  if (typeof process === 'undefined') return undefined;
  
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.warn(
      "FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Firebase Admin SDK will not be initialized."
    );
    return undefined;
  }
  try {
    return JSON.parse(serviceAccountJson) as ServiceAccount;
  } catch (error) {
    console.error(
      "Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON",
      error
    );
    return undefined;
  }
}

// Define the expected structure of the service account JSON
interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

// Dynamically import Firebase Admin in Node.js environment
async function loadFirebaseAdmin() {
  try {
    const adminModule = await import('firebase-admin');
    return adminModule.default || adminModule;
  } catch (error) {
    console.error("Failed to import firebase-admin:", error);
    return null;
  }
}

// Add TypeScript declarations for global variables
declare global {
  interface Window {
    __firebaseAdmin: any;
    __firebaseAdminInitialized: boolean;
  }
  
  // Extend NodeJS namespace properly
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      __firebaseAdmin: any;
      __firebaseAdminInitialized: boolean;
    }
  }
}

// Only execute this code in a Node.js environment
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node) {
  // Initialize Firebase Admin using dynamic import
  // Use a self-executing async function with proper initialization state tracking
  (async () => {
    // Only try to initialize once
    if (initializationAttempted) {
      return;
    }
    
    initializationAttempted = true;
    
    // Check if already initialized globally
    // @ts-expect-error - global may not have these properties but they're used safely
    if (global.__firebaseAdminInitialized) {
      // @ts-expect-error - using dynamically added property on global
      admin = global.__firebaseAdmin;
      adminAuth = () => admin.auth();
      adminFirestore = () => admin.firestore();
      adminStorage = () => admin.storage();
      return;
    }
    
    const adminModule = await loadFirebaseAdmin();
    
    if (!adminModule) {
      console.error("Failed to load Firebase Admin module");
      return;
    }
    
    // Check if any apps are already initialized
    if (adminModule.apps?.length) {
      admin = adminModule;
      adminAuth = () => admin.auth();
      adminFirestore = () => admin.firestore();
      adminStorage = () => admin.storage();
      
      // Store in global to prevent re-initialization
      // @ts-expect-error - global doesn't have this property by default
      global.__firebaseAdmin = admin;
      // @ts-expect-error - global doesn't have this property by default
      global.__firebaseAdminInitialized = true;
      return;
    }
    
    // No apps initialized yet, set up a new one
    admin = adminModule;
    const serviceAccount = getServiceAccount();
    
    if (serviceAccount) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        
        console.info("Firebase Admin SDK initialized successfully");
        
        // Update function implementations after successful initialization
        adminAuth = () => admin.auth();
        adminFirestore = () => admin.firestore();
        adminStorage = () => admin.storage();
        
        // Store in global to prevent re-initialization
        // @ts-expect-error - global doesn't have this property by default
        global.__firebaseAdmin = admin;
        // @ts-expect-error - global doesn't have this property by default
        global.__firebaseAdminInitialized = true;
      } catch (error) {
        console.error("Firebase Admin SDK initialization failed:", error);
      }
    } else {
      console.warn("Firebase Admin SDK could not be initialized due to missing or invalid service account");
    }
  })().catch(error => {
    console.error("Error during Firebase Admin initialization:", error);
  });
}

export {
  admin,
  adminAuth,
  adminFirestore,
  adminStorage,
}; 