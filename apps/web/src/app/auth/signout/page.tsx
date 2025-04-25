"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [errorOccurred, setErrorOccurred] = useState(false);
  const [message, setMessage] = useState("Signing out..."); // Add message state

  useEffect(() => {
    async function performSignOut() {
      try {
        setMessage("Signing out...");
        
        // Use NextAuth signOut function
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
  }, []); // Run only once on mount

  return (
    <>
      {errorOccurred ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Sign out error</h1>
            <p className="text-gray-700 mb-4">
              {message} Please try again or close your browser.
            </p>
            <button 
              onClick={() => router.push("/auth/login")}
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
            >
              Return to Login
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <p className="text-gray-700">{message}</p>
          </div>
        </div>
      )}
    </>
  );
}
