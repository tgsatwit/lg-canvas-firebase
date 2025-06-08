"use client";

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  SwatchIcon,
  ChatBubbleLeftRightIcon,
  FilmIcon,
  QueueListIcon,
  ClipboardDocumentListIcon
} from "@heroicons/react/24/outline";
import { MessageSquare } from "lucide-react";
import { ProfileMenu } from "@/components/ui/profile-menu";
import { useUserContext } from "@/contexts/UserContext";
import Image from "next/image";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, loading } = useUserContext();

  return (
    <Sidebar className="border-r border-gray-200 shadow-lg bg-white">
      <div className="flex flex-col h-full">
        <SidebarBody>
          <div className="mb-6 flex items-center gap-3 px-3">
            <Image 
              src="/Sqr_logo.png" 
              alt="PBL.ai Logo" 
              width={32} 
              height={32}
              className="rounded-lg shadow-sm"
            />
            <h2 className="text-2xl font-bold text-black">PBL.ai</h2>
          </div>
          <SidebarLink 
            href="/dashboard" 
            icon={HomeIcon}
            isActive={pathname === "/dashboard"}
          >
            Dashboard
          </SidebarLink>
          <SidebarLink 
            href="/dashboard/videos" 
            icon={FilmIcon}
            isActive={pathname === "/dashboard/videos"}
          >
            Video Library
          </SidebarLink>
          <SidebarLink 
            href="/dashboard/tasks" 
            icon={ClipboardDocumentListIcon}
            isActive={pathname === "/dashboard/tasks"}
          >
            Tasks
          </SidebarLink>
          <SidebarLink 
            href="/dashboard/social-monitor" 
            icon={ChatBubbleLeftRightIcon}
            isActive={pathname === "/dashboard/social-monitor"}
          >
            Social Monitor
          </SidebarLink>
          <SidebarLink 
            href="/dashboard/chat" 
            icon={MessageSquare}
            isActive={pathname === "/dashboard/chat"}
          >
            Chat
          </SidebarLink>
          <SidebarLink 
            href="/dashboard/playlists" 
            icon={QueueListIcon}
            isActive={pathname === "/dashboard/playlists"}
          >
            Create Playlists
          </SidebarLink>
          <SidebarLink 
            href="/dashboard/canvas" 
            icon={SwatchIcon}
            isActive={pathname === "/dashboard/canvas"}
          >
            Canvas
          </SidebarLink>
        </SidebarBody>
        
        {/* Profile menu at bottom of sidebar with more padding */}
        <div className="mt-auto pt-4 border-t border-gray-200 px-4 pb-6">
          <div 
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-200"
          >
            {!loading && user ? (
              <>
                <ProfileMenu user={user} />
                <span className="text-sm text-gray-700 font-medium">
                  Profile
                </span>
              </>
            ) : (
              <a href="/auth/login" className="text-sm text-gray-700 hover:text-gray-900 hover:underline">
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
} 