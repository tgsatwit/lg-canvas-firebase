"use client";

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  UserGroupIcon, 
  Cog6ToothIcon,
  SwatchIcon
} from "@heroicons/react/24/outline";
import { ProfileMenu } from "@/components/ui/profile-menu";
import { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";

export function DashboardSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Directly use auth to get the current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Sidebar className="border-r border-indigo-200/50">
      <div className="flex flex-col h-full">
        <SidebarBody>
          <div className="mb-6">
            <h2 className="text-2xl font-bold px-3 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-700/50 bg-clip-text text-transparent">Riskalytics</h2>
          </div>
          <SidebarLink 
            href="/dashboard" 
            icon={HomeIcon}
            isActive={pathname === "/dashboard"}
          >
            Dashboard
          </SidebarLink>
          <SidebarLink 
            href="/dashboard/canvas" 
            icon={SwatchIcon}
            isActive={pathname === "/dashboard/canvas"}
          >
            Canvas
          </SidebarLink>
          <SidebarLink 
            href="/users" 
            icon={UserGroupIcon}
            isActive={pathname === "/users"}
          >
            Users
          </SidebarLink>
          <SidebarLink 
            href="/settings" 
            icon={Cog6ToothIcon}
            isActive={pathname === "/settings"}
          >
            Settings
          </SidebarLink>
        </SidebarBody>
        
        {/* Profile menu at bottom of sidebar with more padding */}
        <div className="mt-auto pt-4 border-t border-indigo-200/50 px-4 pb-6">
          <div 
            className="flex items-center justify-between px-3 py-2 rounded-lg"
            style={{ 
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              border: '1px solid rgba(79, 70, 229, 0.2)'
            }}
          >
            {!loading && user ? (
              <>
                <ProfileMenu user={user} />
                <span className="text-sm text-slate-700 font-medium">
                  Profile
                </span>
              </>
            ) : (
              <a href="/auth/login" className="text-sm text-slate-700 hover:text-indigo-900 hover:underline">
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
} 