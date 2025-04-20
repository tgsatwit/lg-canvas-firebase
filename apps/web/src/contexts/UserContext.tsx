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

type UserContentType = {
  user: User | null | undefined;
  loading: boolean;
  getUser: () => Promise<User | null>;
};

const UserContext = createContext<UserContentType | undefined>(undefined);

// Auth timeout in milliseconds (10 seconds)
const AUTH_TIMEOUT = 10000;

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Function to refresh the current user state
  const getUser = async (): Promise<User | null> => {
    try {
      // Force auth state refresh
      await auth.currentUser?.reload();
      // Get the current user after reload
      const currentUser = auth.currentUser;
      // Update state
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error("Error refreshing user:", error);
      return null;
    }
  };

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("Auth state change timed out, assuming not logged in");
        setUser(null);
        setLoading(false);
      }
    }, AUTH_TIMEOUT);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
        clearTimeout(timeoutId);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const contextValue: UserContentType = {
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
