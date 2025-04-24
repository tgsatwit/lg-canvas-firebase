import { User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type UserContextType = {
  user: User | null | undefined;
  loading: boolean;
  getUser: () => Promise<User | null>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

// Auth timeout reduced to 5 seconds (most modern auth flows complete faster)
const AUTH_TIMEOUT = 5000;

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Function to refresh the current user state
  const getUser = async (): Promise<User | null> => {
    try {
      // Get the current user first before trying to reload
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Only reload if we have a user to reload
        await currentUser.reload();
      }
      // Return the current user after reload attempt
      return auth.currentUser;
    } catch (error) {
      console.error("Error refreshing user:", error);
      return null;
    }
  };

  useEffect(() => {
    // Set a timeout to prevent long loading states
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Auth state change timed out, assuming not logged in");
        setUser(null);
        setLoading(false);
      }
    }, AUTH_TIMEOUT);

    // Use the persistent observer pattern from Firebase
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
        clearTimeout(timeoutId);
      },
      (error) => {
        console.error("Auth state change error:", error);
        setUser(null);
        setLoading(false);
        clearTimeout(timeoutId);
      }
    );

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const contextValue: UserContextType = {
    user,
    loading,
    getUser,
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
