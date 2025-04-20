"use client";

import { useUserContext } from "@/contexts/UserContext";
import { ProfileMenu } from "@/components/ui/profile-menu";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function Header() {
  const { user, loading } = useUserContext();

  const handleSignIn = () => {
    window.location.href = "/auth/login";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white flex h-14 items-center justify-between px-4 py-2">
      <div className="flex items-center space-x-2">
        {/* Logo or app name can go here */}
        <span className="font-semibold">Canvas</span>
      </div>
      <div className="flex items-center space-x-4">
        {!loading && user && <ProfileMenu user={user} />}
        {!loading && !user && (
          <Button size="sm" className="flex items-center gap-2" onClick={handleSignIn}>
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </Button>
        )}
      </div>
    </header>
  );
} 