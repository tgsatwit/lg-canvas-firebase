"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import { cn } from "@/lib/utils";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Icons } from "../../ui/icons";
import { Label } from "../../ui/label";
import { PasswordInput } from "../../ui/password-input";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setFormError(null);
    
    if (!email) {
      setFormError("Email is required");
      return;
    }
    
    if (!password) {
      setFormError("Password is required");
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Signing in with email:", email);
      
      await signIn(email, password);
      
      // Redirect to dashboard on success
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Handle Firebase Auth errors
      let errorMessage = "An error occurred during sign in.";
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = "Invalid email or password. Please try again.";
            break;
          case 'auth/user-disabled':
            errorMessage = "This account has been disabled. Please contact support.";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Too many failed attempts. Please try again later.";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your connection and try again.";
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function onGoogleSignIn() {
    try {
      setIsLoading(true);
      setFormError(null);
      
      await signInWithGoogle();
      
      // Redirect to dashboard on success
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      console.error("Google sign in error:", error);
      
      let errorMessage = "Failed to sign in with Google.";
      if (error.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = "Sign in was cancelled.";
            break;
          case 'auth/popup-blocked':
            errorMessage = "Popup was blocked. Please allow popups and try again.";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your connection and try again.";
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      <form onSubmit={onSubmit} className="space-y-10">
        <div className="space-y-8">
          <div className="space-y-4">
            <Label 
              htmlFor="email" 
              className="text-left text-base font-medium"
              style={{
                color: 'rgba(0, 0, 0, 0.8)',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.1)'
              }}
            >
              Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-16 px-6 text-base w-full border-0 rounded-2xl transition-all duration-300 focus:scale-[1.02]"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.3) 0%,
                      rgba(255, 255, 255, 0.15) 100%
                    )
                  `,
                  backdropFilter: 'blur(10px) saturate(150%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: `
                    0 4px 16px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4),
                    inset 0 -1px 0 rgba(255, 255, 255, 0.1)
                  `,
                }}
              />
              {/* Specular highlight for input */}
              <div 
                className="absolute top-0 left-0 right-0 h-px opacity-50 rounded-t-2xl"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)'
                }}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <Label 
              htmlFor="password" 
              className="text-left text-base font-medium"
              style={{
                color: 'rgba(0, 0, 0, 0.8)',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.1)'
              }}
            >
              Password
            </Label>
            <div className="relative">
              <PasswordInput
                id="password"
                placeholder="Password"
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-16 px-6 text-base w-full border-0 rounded-2xl transition-all duration-300 focus:scale-[1.02]"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.3) 0%,
                      rgba(255, 255, 255, 0.15) 100%
                    )
                  `,
                  backdropFilter: 'blur(10px) saturate(150%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: `
                    0 4px 16px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4),
                    inset 0 -1px 0 rgba(255, 255, 255, 0.1)
                  `,
                }}
              />
              {/* Specular highlight for input */}
              <div 
                className="absolute top-0 left-0 right-0 h-px opacity-50 rounded-t-2xl"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)'
                }}
              />
            </div>
          </div>
        </div>
        
        {formError && (
          <div 
            className="text-sm text-center py-3 px-4 rounded-xl"
            style={{
              color: 'rgba(220, 38, 38, 0.9)',
              background: `
                linear-gradient(135deg, 
                  rgba(254, 226, 226, 0.8) 0%,
                  rgba(254, 226, 226, 0.4) 100%
                )
              `,
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
            }}
          >
            {formError}
          </div>
        )}
        
        <div className="space-y-4">
          <Button 
            disabled={isLoading} 
            type="submit" 
            className="h-16 text-lg font-semibold w-full rounded-2xl border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(0, 0, 0, 0.9) 0%,
                  rgba(0, 0, 0, 0.8) 50%,
                  rgba(0, 0, 0, 0.9) 100%
                )
              `,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: `
                0 8px 24px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `,
            }}
          >
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign In
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span 
                className="bg-transparent px-2 text-white/60"
                style={{ backdropFilter: 'blur(10px)' }}
              >
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onGoogleSignIn}
            className="h-16 text-lg font-semibold w-full rounded-2xl border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.2) 0%,
                  rgba(255, 255, 255, 0.1) 100%
                )
              `,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'rgba(0, 0, 0, 0.8)',
              boxShadow: `
                0 4px 16px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Icons.google className="mr-2 h-4 w-4" />
            Google
          </Button>
        </div>
      </form>
    </div>
  );
}
