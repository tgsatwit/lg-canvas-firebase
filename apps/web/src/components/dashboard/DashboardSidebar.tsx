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
import { ProfileMenu } from "@/components/ui/profile-menu";
import { useUserContext } from "@/contexts/UserContext";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, loading } = useUserContext();

  return (
    <Sidebar className="border-r border-indigo-200/70 shadow-lg">
      <div className="flex flex-col h-full">
        <SidebarBody>
          <div className="mb-6">
            <h2 className="text-2xl font-bold px-3 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-700/50 bg-clip-text text-transparent">PBL.ai</h2>
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
            href="/dashboard/videos" 
            icon={FilmIcon}
            isActive={pathname === "/dashboard/videos"}
          >
            Video Library
          </SidebarLink>
          <SidebarLink 
            href="/dashboard/playlists" 
            icon={QueueListIcon}
            isActive={pathname === "/dashboard/playlists"}
          >
            Create Playlists
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