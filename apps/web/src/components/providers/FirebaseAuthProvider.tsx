"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { auth, debugAuthState } from '@/lib/firebase/config';
import { signInWithCustomToken, signOut } from 'firebase/auth';

interface FirebaseAuthProviderProps {
  children: React.ReactNode;
}

export function FirebaseAuthProvider({ children }: FirebaseAuthProviderProps) {
  const { data: session, status } = useSession();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const syncFirebaseAuth = async () => {
      if (status === 'loading' || isAuthenticating) return;

      try {
        if (session?.user?.id) {
          // Check if Firebase auth is already synchronized
          if (auth.currentUser?.uid !== session.user.id) {
            setIsAuthenticating(true);
            console.log('Synchronizing Firebase auth with session...');
            
            try {
              // Get a custom token from our API
              const response = await fetch('/api/auth/firebase-token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                const { token } = await response.json();
                
                // Sign in with the custom token
                await signInWithCustomToken(auth, token);
                console.log('Firebase authentication synchronized successfully');
              } else {
                console.error('Failed to get Firebase custom token:', response.statusText);
              }
            } catch (error) {
              console.error('Error authenticating with Firebase:', error);
            } finally {
              setIsAuthenticating(false);
            }
          }
        } else {
          // No session, ensure Firebase auth is signed out
          if (auth.currentUser) {
            console.log('Signing out from Firebase...');
            await signOut(auth);
          }
        }
      } catch (error) {
        console.error('Error synchronizing Firebase auth:', error);
        setIsAuthenticating(false);
      }
    };

    syncFirebaseAuth();
  }, [session, status, isAuthenticating]);

  return <>{children}</>;
} 