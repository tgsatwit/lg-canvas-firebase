"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

// Define a simplified user type that matches Firebase User and Firestore data
export type UserInfo = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  displayName?: string; // From Firestore profile
};

type UserContextType = {
  user: UserInfo | null | undefined;
  loading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const [firestoreProfile, setFirestoreProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch user profile from Firestore when Firebase user changes
  useEffect(() => {
    if (!firebaseUser) {
      setFirestoreProfile(null);
      return;
    }

    const fetchUserProfile = async () => {
      setProfileLoading(true);
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const users = await response.json();
          // Find current user in the users array
          const currentUserProfile = users.find((u: any) => u.id === firebaseUser.uid);
          setFirestoreProfile(currentUserProfile || null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [firebaseUser]);

  // Map Firebase User + Firestore data to our UserInfo format
  const user: UserInfo | null = firebaseUser ? {
    id: firebaseUser.uid,
    name: firebaseUser.displayName,
    email: firebaseUser.email,
    image: firebaseUser.photoURL,
    displayName: firestoreProfile?.displayName, // From Firestore
  } : null;

  const contextValue: UserContextType = {
    user,
    loading: authLoading || profileLoading,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
