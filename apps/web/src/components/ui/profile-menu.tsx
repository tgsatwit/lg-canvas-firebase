"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon } from "lucide-react";

export function ProfileMenu() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) return null;

  const userInitial = user.displayName?.charAt(0) || user.email?.charAt(0) || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-8 w-8">
            {user.photoURL ? (
              <AvatarImage src={user.photoURL} alt={user.displayName || "User"} />
            ) : (
              <AvatarFallback>{userInitial}</AvatarFallback>
            )}
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <span>{user.displayName || user.email || "User"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-500">
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 