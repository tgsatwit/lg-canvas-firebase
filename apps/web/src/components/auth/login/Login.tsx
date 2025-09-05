import { UserAuthForm } from "./user-auth-form-login";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import NextImage from "next/image";

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
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Firebase Studio Style */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(236, 72, 153, 1) 0%,
                rgba(139, 92, 246, 1) 100%
              )
            `,
          }}
        />
        
        {/* Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 35px,
                rgba(255,255,255,.1) 35px,
                rgba(255,255,255,.1) 70px
              )
            `,
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="max-w-md">
            {/* Logo/Brand */}
            <div className="mb-8">
              <div className="w-16 h-16 rounded-2xl backdrop-blur-sm flex items-center justify-center mb-6 overflow-hidden">
                <NextImage src="/Sqr_logo.png" alt="Logo" width={64} height={64} className="rounded-2xl" />
              </div>
              <h1 className="text-4xl font-bold mb-3">Welcome back</h1>
              <p className="text-white/80 text-lg">
                Sign in to continue to your AI-powered educational platform
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 overflow-hidden">
              <NextImage src="/Sqr_logo.png" alt="Logo" width={64} height={64} className="rounded-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-600 mt-1">Sign in to your account</p>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign in</h2>
            <p className="text-gray-600">to continue to PBL.ai</p>
          </div>
          
          {/* Form Container */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <UserAuthForm />
            
            {isError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm">{errorMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}