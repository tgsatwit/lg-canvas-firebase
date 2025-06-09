"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [errorOccurred, setErrorOccurred] = useState(false);
  const [message, setMessage] = useState("Signing out...");

  useEffect(() => {
    async function performSignOut() {
      try {
        setMessage("Signing out...");
        
        await signOut({ 
          redirect: false,
          callbackUrl: "/auth/login"
        });
        
        setMessage("Redirecting...");
        router.push("/auth/login");
      } catch (error) {
        console.error("Sign out error:", error);
        setErrorOccurred(true);
        setMessage("An error occurred during sign out.");
      }
    }
    performSignOut();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="apple-card max-w-sm w-full text-center space-y-6">
        {errorOccurred ? (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Sign Out Error</h1>
              <p className="text-muted-foreground">{message}</p>
            </div>
            <button 
              onClick={() => router.push("/auth/login")}
              className="apple-button w-full"
            >
              Return to Login
            </button>
          </>
        ) : (
          <>
            <div className="relative">
              <div className="w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
            </div>
            <p className="text-muted-foreground font-medium">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
