"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client"; // Added Firebase client
import { signOut as firebaseSignOut } from "firebase/auth"; // Added Firebase signout function
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [errorOccurred, setErrorOccurred] = useState(false);
  const [message, setMessage] = useState("Signing out..."); // Add message state

  useEffect(() => {
    async function performSignOut() {
      try {
        setMessage("Signing out from Firebase...");
        await firebaseSignOut(auth); // Sign out from Firebase client

        setMessage("Clearing server session...");
        // Clear the server-side session cookie
        const response = await fetch("/api/auth/sessionLogout", { method: "POST" });

        if (!response.ok) {
            console.error("Failed to clear server session:", await response.text());
            // Decide if this constitutes an error for the user
            // setErrorOccurred(true);
            // setMessage("Partial sign out successful. Please close your browser.");
            // return;
        }

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
        <div>
          <h1>Sign out error</h1>
          <p>
            {message} Please refresh the page or manually clear your cookies.
          </p>
        </div>
      ) : (
        <p>{message}</p>
      )}
    </>
  );
}
