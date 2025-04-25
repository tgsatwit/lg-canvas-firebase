"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";

// Define a simplified user type that matches both NextAuth and our needs
export type UserInfo = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type UserContextType = {
  user: UserInfo | null | undefined;
  loading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
    } else {
      setLoading(false);
      
      if (status === "authenticated" && session?.user) {
        // Map session user to our UserInfo format
        setUser(session.user as UserInfo);
      } else {
        setUser(null);
      }
    }
  }, [session, status]);

  const contextValue: UserContextType = {
    user,
    loading,
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
