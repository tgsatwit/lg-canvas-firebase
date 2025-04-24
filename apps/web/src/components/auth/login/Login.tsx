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
        console.log("Redirecting to home page");
        // Force full page navigation to ensure middleware processes the request
        window.location.href = "/";
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
    <div className="container relative h-full flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex gap-1 items-center text-lg font-medium">
          Open Canvas
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
          </div>
          <UserAuthForm
            onLoginWithEmail={onLoginWithEmail}
          />
          {isError && (
            <p className="text-red-500 text-sm text-center">
              {errorMessage || "There was an error signing into your account. Please try again."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
