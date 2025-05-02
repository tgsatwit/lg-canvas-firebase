import { cn } from "@/lib/utils";
import Link from "next/link";
import { buttonVariants } from "../../ui/button";
import { UserAuthForm } from "./user-auth-form-login";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function Login() {
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setIsError(true);
      setErrorMessage(getErrorMessage(error));
      
      // Remove the error parameter from the URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("error");
      router.replace(
        `${window.location.pathname}?${newSearchParams.toString()}`,
        { scroll: false }
      );
    }
  }, [searchParams, router]);

  // Helper function to translate error codes into user-friendly messages
  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "CredentialsSignin":
        return "Invalid email or password. Please try again.";
      case "AccessDenied":
        return "Access denied. You don't have permission to access this resource.";
      case "OAuthAccountNotLinked":
        return "To confirm your identity, sign in with the same account you used originally.";
      default:
        return "An error occurred during sign in. Please try again.";
    }
  };

  return (
    <div className="flex h-screen relative overflow-hidden">
      {/* Background design - abstract shapes or gradient */}
      <div className="absolute inset-0">
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
      
      {/* Left side - illustration or brand messaging */}
      <div className="w-1/2 flex flex-col justify-center items-center p-12 relative z-10 hidden md:flex">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-7xl font-bold px-3 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-700/50 bg-clip-text text-transparent">PBL.ai</h1>
        </div>
      </div>
      
      {/* Right side - login form */}
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
            <UserAuthForm />
            {isError && (
              <p className="text-red-500 text-sm text-center mt-2">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
