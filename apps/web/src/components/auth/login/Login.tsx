import { cn } from "@/lib/utils";
import NextImage from "next/image";
import Link from "next/link";
import { buttonVariants } from "../../ui/button";
import { UserAuthForm } from "./user-auth-form-login";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export interface LoginWithEmailInput {
  email: string;
  password: string;
}

export function Login() {
  const [isError, setIsError] = useState(false);
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
    const response = await fetch("/api/auth/sessionLogin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });
    return response.ok;
  };

  const onLoginWithEmail = async (
    input: LoginWithEmailInput
  ): Promise<void> => {
    setIsError(false);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        input.email,
        input.password
      );
      const idToken = await userCredential.user.getIdToken();
      const success = await createSession(idToken);
      if (success) {
        router.push("/");
      } else {
        throw new Error("Failed to create session.");
      }
    } catch (error) {
      console.error("Email/Password login error:", error);
      setIsError(true);
    }
  };

  const onLoginWithOauth = async (
    providerName: "google" | "github"
  ): Promise<void> => {
    setIsError(false);
    const provider = providerName === "google"
      ? new GoogleAuthProvider()
      : new GithubAuthProvider();

    try {
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();
      const success = await createSession(idToken);
      if (success) {
        router.push("/");
      } else {
        throw new Error("Failed to create session.");
      }
    } catch (error) {
      console.error("OAuth login error:", error);
      setIsError(true);
    }
  };

  return (
    <div className="container relative h-full flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href="/auth/signup"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute md:flex hidden right-4 top-4 md:right-8 md:top-8"
        )}
      >
        Signup
      </Link>
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex gap-1 items-center text-lg font-medium">
          <NextImage
            src="/lc_logo.jpg"
            width={36}
            height={36}
            alt="LangChain Logo"
            className="rounded-full"
          />
          Open Canvas
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
            <Link
              href="/auth/signup"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "md:hidden flex"
              )}
            >
              Signup
            </Link>
          </div>
          <UserAuthForm
            onLoginWithEmail={onLoginWithEmail}
            onLoginWithOauth={onLoginWithOauth}
          />
          {isError && (
            <p className="text-red-500 text-sm text-center">
              There was an error signing into your account. Please try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
