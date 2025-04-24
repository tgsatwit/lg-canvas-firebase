import { cn } from "@/lib/utils";
import Link from "next/link";
import { buttonVariants } from "../../ui/button";
import { UserAuthForm } from "./user-auth-form-login";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export interface LoginWithEmailInput {
  email: string;
  password: string;
}

export function Login() {
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setIsError(true);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("error");
      router.replace(
        `${window.location.pathname}?${newSearchParams.toString()}`,
        { scroll: false }
      );
    }
  }, [searchParams, router]);

  const createSession = async (idToken: string) => {
    console.log("Creating session with ID token");
    try {
      const response = await fetch("/api/auth/sessionLogin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Session creation failed:", response.status, errorData);
        return false;
      }
      
      console.log("Session created successfully");
      return true;
    } catch (error) {
      console.error("Error creating session:", error);
      return false;
    }
  };

  const onLoginWithEmail = async (
    input: LoginWithEmailInput
  ): Promise<void> => {
    setIsError(false);
    setErrorMessage("");
    
    try {
      console.log("Attempting email login for:", input.email);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        input.email,
        input.password
      );
      
      console.log("Email login successful, getting ID token");
      const idToken = await userCredential.user.getIdToken();
      const success = await createSession(idToken);
      
      if (success) {
        console.log("Redirecting to dashboard page");
        // Force full page navigation to ensure middleware processes the request
        window.location.href = "/dashboard";
      } else {
        throw new Error("Failed to create session.");
      }
    } catch (error: any) {
      console.error("Email/Password login error:", error);
      setIsError(true);
      setErrorMessage(error.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="relative min-h-screen w-full flex">
      {/* Full-width background with grid and gradient */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-zinc-900 to-blue-900" 
             style={{
               backgroundImage: 'radial-gradient(circle at top right, rgba(67, 56, 202, 0.7), transparent 60%), radial-gradient(circle at bottom left, rgba(63, 0, 237, 0.8), transparent 60%)'
             }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            opacity: 1,
          }}
        />
      </div>
      {/* Left column: Centered logo */}
      <div className="relative flex flex-col justify-center items-center w-1/2 z-10 pr-16">
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="flex gap-2 items-center text-7xl font-extrabold tracking-tight drop-shadow-xl mb-8">
            <span className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-700/50 bg-clip-text text-transparent">Riskalytics.</span>
          </div>
        </div>
      </div>
      {/* Right column: Login overlay */}
      <div className="relative flex flex-col justify-center items-center w-1/2 z-20">
        <div 
          className="rounded-xl w-full max-w-md px-10 py-12 mx-auto flex flex-col gap-6" 
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)'
          }}>
          <div className="flex flex-col space-y-6 text-center">
            <h1 className="text-3xl font-semibold text-indigo-700">Login</h1>
          </div>
          <div className="flex flex-col gap-5">
            <UserAuthForm
              onLoginWithEmail={onLoginWithEmail}
            />
            {isError && (
              <p className="text-red-500 text-sm text-center mt-2">
                {errorMessage || "There was an error signing into your account. Please try again."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
