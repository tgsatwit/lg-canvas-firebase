"use client";

import {
  createContext,
  ReactNode,
  useContext,
} from "react";
import { useAuth } from "./AuthContext";

// Define a simplified user type that matches Firebase User
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
  const { user: firebaseUser, loading } = useAuth();

  // Map Firebase User to our UserInfo format
  const user: UserInfo | null = firebaseUser ? {
    id: firebaseUser.uid,
    name: firebaseUser.displayName,
    email: firebaseUser.email,
    image: firebaseUser.photoURL,
  } : null;

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
