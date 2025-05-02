import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createScopedLogger } from '@/utils/logger';

const logger = createScopedLogger('lib/firebase');

// Initialize Firebase Admin SDK
export function initFirebase() {
  try {
    if (!getApps().length) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
      );

      initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });

      logger.info('Firebase initialized successfully');
    }
  } catch (error) {
    logger.error('Error initializing Firebase', { error });
    throw error;
  }
}

// Get Firestore instance
export function getDb() {
  initFirebase();
  return getFirestore();
}

// Export Firestore field values
export { FieldValue }; 