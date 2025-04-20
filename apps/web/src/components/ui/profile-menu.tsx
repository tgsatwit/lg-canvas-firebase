"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/firebase/client";
import { User } from "firebase/auth";
import { LogOut, User as UserIcon } from "lucide-react";

interface ProfileMenuProps {
  user: User | null | undefined;
}

export function ProfileMenu({ user }: ProfileMenuProps) {
  const router = useRouter();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      // Sign out from Firebase client
      await signOut(auth);
      
      // Clear the server-side session cookie
      await fetch("/api/auth/sessionLogout", { method: "POST" });
      
      // Redirect to login page
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user?.displayName) return "U";
    return user.displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium">{user.displayName || user.email}</p>
            {user.displayName && <p className="text-xs text-muted-foreground">{user.email}</p>}
          </div>
        </div>
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 