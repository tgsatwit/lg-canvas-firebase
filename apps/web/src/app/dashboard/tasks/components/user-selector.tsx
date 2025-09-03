"use client";

import { useState, useEffect, useCallback } from "react";
import { User, UserCheck, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
}

interface UserSelectorProps {
  selectedUserId?: string;
  onUserSelect: (userId: string | undefined) => void;
  placeholder?: string;
}

export function UserSelector({
  selectedUserId,
  onUserSelect,
  placeholder = "Assign to user",
}: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const { user: currentUser } = useAuth();

  const selectedUser = users.find(user => user.id === selectedUserId);

  const fetchUsers = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const token = await currentUser?.getIdToken();
      if (!token) return;

      const url = new URL("/api/users", window.location.origin);
      if (search) {
        url.searchParams.set("search", search);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const fetchedUsers = await response.json();
        setUsers(fetchedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, fetchUsers]);

  useEffect(() => {
    if (searchTerm && open) {
      const debounceTimer = setTimeout(() => {
        fetchUsers(searchTerm);
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, open, fetchUsers]);

  const handleUserSelect = (userId: string | undefined) => {
    onUserSelect(userId);
    setOpen(false);
  };

  const getUserInitials = (user: User) => {
    if (user.name) {
      return user.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  const getUserDisplayName = (user: User) => {
    return user.name || user.email || "Unknown User";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
          type="button"
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selectedUser.image || undefined} />
                <AvatarFallback className="text-xs">
                  {getUserInitials(selectedUser)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{getUserDisplayName(selectedUser)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-muted-foreground">{placeholder}</span>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {/* Option to unassign */}
          <div
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 cursor-pointer"
            onClick={() => handleUserSelect(undefined)}
          >
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm">Unassigned</span>
            {!selectedUserId && (
              <UserCheck className="h-4 w-4 ml-auto text-green-600" />
            )}
          </div>
          
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No users found
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 cursor-pointer"
                onClick={() => handleUserSelect(user.id)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {getUserDisplayName(user)}
                  </div>
                  {user.email && user.name && (
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                  )}
                </div>
                {selectedUserId === user.id && (
                  <UserCheck className="h-4 w-4 text-green-600" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}