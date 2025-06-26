"use client";

import { useEffect, useState } from 'react';
import { auth, firebaseApp, ensureFirebaseInitialized, debugAuthState } from '@/lib/firebase/client';

interface DebugInfo {
  timestamp: string;
  windowExists: boolean;
  firebaseApp: boolean;
  auth: boolean;
  authType: string;
  firebaseAppName: string;
  envVars: {
    NEXT_PUBLIC_FIREBASE_API_KEY: boolean;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: string | undefined;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string | undefined;
  };
  initializationCheck?: string;
  chatDb?: boolean;
  authFromCheck?: boolean;
  initError?: string;
}

export default function FirebaseDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test Firebase initialization
    try {
      console.log('🧪 Testing Firebase initialization...');
      
      const info: DebugInfo = {
        timestamp: new Date().toISOString(),
        windowExists: typeof window !== 'undefined',
        firebaseApp: !!firebaseApp,
        auth: !!auth,
        authType: typeof auth,
        firebaseAppName: firebaseApp?.name || 'not available',
        
        // Test environment variables on client side
        envVars: {
          NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        }
      };
      
      setDebugInfo(info);
      
      // Try to ensure Firebase is initialized
      try {
        const { chatDb, auth: authFromCheck } = ensureFirebaseInitialized();
        console.log('✅ Firebase initialization check passed');
        
        // Debug auth state
        debugAuthState();
        
        setDebugInfo(prev => ({
          ...prev!,
          initializationCheck: 'PASSED',
          chatDb: !!chatDb,
          authFromCheck: !!authFromCheck
        }));
        
      } catch (initError) {
        console.error('❌ Firebase initialization check failed:', initError);
        setError(initError instanceof Error ? initError.message : 'Unknown error');
        
        setDebugInfo(prev => ({
          ...prev!,
          initializationCheck: 'FAILED',
          initError: initError instanceof Error ? initError.message : 'Unknown error'
        }));
      }
      
    } catch (e) {
      console.error('❌ Debug page error:', e);
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Firebase Debug Page</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Debug Information:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Console Output:</h2>
        <p className="text-sm text-gray-600">
          Check the browser console for detailed Firebase initialization logs.
        </p>
      </div>
    </div>
  );
} 