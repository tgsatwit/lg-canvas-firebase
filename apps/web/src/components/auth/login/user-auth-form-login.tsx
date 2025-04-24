"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Icons } from "../../ui/icons";
import { Label } from "../../ui/label";
import { LoginWithEmailInput } from "./Login";
import { useState } from "react";
import { PasswordInput } from "../../ui/password-input";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  onLoginWithEmail: (input: LoginWithEmailInput) => Promise<void>;
}

export function UserAuthForm({
  className,
  onLoginWithEmail,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      console.log("Submitting login form with email:", email);
      await onLoginWithEmail({ email, password });
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <div className="pt-1 pb-[2px] px-1">
              <Label className="sr-only" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (!showPasswordField) {
                    setShowPasswordField(true);
                  }
                }}
              />
            </div>

            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out pt-[2px] pb-1 px-1",
                showPasswordField ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <Label className="sr-only" htmlFor="password">
                Password
              </Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                autoCorrect="off"
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {formError && (
            <p className="text-sm text-red-500 mt-1">{formError}</p>
          )}
          <Button disabled={isLoading} type="submit" className="mt-4 bg-indigo-700 text-white hover:bg-indigo-800">
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Login with Email
          </Button>
        </div>
      </form>
    </div>
  );
}
