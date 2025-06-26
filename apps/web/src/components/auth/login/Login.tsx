import { UserAuthForm } from "./user-auth-form-login";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

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
      {/* Enhanced background with Liquid Glass inspiration */}
      <div className="absolute inset-0">
        {/* Primary gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900" />
        
        {/* Liquid Glass ambient layers */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(236, 72, 153, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 40% 70%, rgba(219, 39, 119, 0.3) 0%, transparent 50%)
            `,
          }}
        />
        
        {/* Subtle grid pattern for depth */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>
      
      {/* Liquid Glass login container */}
      <div className="w-full flex flex-col justify-center items-center p-8 relative z-10">
        <div className="w-full max-w-lg relative">
          {/* Outer glow effect */}
          <div 
            className="absolute inset-0 rounded-3xl opacity-60 blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
            }}
          />
          
          {/* Main Liquid Glass container */}
          <div 
            className="relative rounded-3xl px-12 py-12 mx-auto flex flex-col gap-6 border shadow-2xl" 
            style={{ 
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.25) 0%,
                  rgba(255, 255, 255, 0.1) 50%,
                  rgba(255, 255, 255, 0.05) 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.4),
                inset 0 -1px 0 rgba(255, 255, 255, 0.1)
              `,
            }}>
            
            {/* Specular highlight overlay */}
            <div 
              className="absolute top-0 left-0 right-0 h-px opacity-60"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)'
              }}
            />
            
            {/* Logo */}
            <div className="flex justify-center relative">
              <Image
                src="/Sqr_logo.png"
                alt="PBL.ai Logo"
                width={80}
                height={80}
                className="rounded-xl"
              />
            </div>
        
            
            {/* Form container */}
            <div className="w-full max-w-sm mx-auto">
              <UserAuthForm />
              {isError && (
                <p className="text-red-500 text-sm text-center mt-4">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
