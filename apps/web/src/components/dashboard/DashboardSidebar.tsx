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

  // Check if we're in the videos section (including YouTube)
  const isVideosSection = pathname === "/dashboard/videos" || pathname === "/dashboard/videos/library" || pathname.startsWith("/dashboard/videos/");

  return (
    <Sidebar className="border-r border-gray-200 bg-white">
      <div className="flex flex-col h-full">
        <SidebarBody>
          {/* Logo section - simplified */}
          <div className="mb-6 flex items-center gap-3 px-4 py-4 border-b border-gray-100">
            <Image 
              src="/Sqr_logo.png" 
              alt="PBL.ai Logo" 
              width={32} 
              height={32}
              className="rounded-lg"
            />
            <h2 className="text-xl font-semibold text-gray-900">
              PBL Studio
            </h2>
          </div>

          {/* Navigation links - neutral style */}
          <div className="space-y-1 px-2">
            <div className={`rounded-lg transition-colors duration-200 ${
              pathname === "/dashboard" 
                ? "bg-gray-100" 
                : "hover:bg-gray-50"
            }`}>
              <SidebarLink 
                href="/dashboard" 
                icon={HomeIcon}
                isActive={pathname === "/dashboard"}
              >
                <span className={`font-medium ${
                  pathname === "/dashboard" ? "text-gray-900" : "text-gray-700"
                }`}>
                  Dashboard
                </span>
              </SidebarLink>
            </div>

            {/* Video Library with sub-menu */}
            <div>
              <div className={`rounded-lg transition-colors duration-200 ${
                isVideosSection 
                  ? "bg-gray-100" 
                  : "hover:bg-gray-50"
              }`}>
                <SidebarLink 
                  href="/dashboard/videos" 
                  icon={FilmIcon}
                  isActive={isVideosSection}
                >
                  <span className={`font-medium ${
                    isVideosSection ? "text-gray-900" : "text-gray-700"
                  }`}>
                    Video Library
                  </span>
                </SidebarLink>
              </div>
            </div>

            <div className={`rounded-lg transition-colors duration-200 ${
              pathname === "/dashboard/tasks" 
                ? "bg-gray-100" 
                : "hover:bg-gray-50"
            }`}>
              <SidebarLink 
                href="/dashboard/tasks" 
                icon={ClipboardDocumentListIcon}
                isActive={pathname === "/dashboard/tasks"}
              >
                <span className={`font-medium ${
                  pathname === "/dashboard/tasks" ? "text-gray-900" : "text-gray-700"
                }`}>
                  Tasks
                </span>
              </SidebarLink>
            </div>

            <div className={`rounded-lg transition-colors duration-200 ${
              pathname === "/dashboard/social-monitor" 
                ? "bg-gray-100" 
                : "hover:bg-gray-50"
            }`}>
              <SidebarLink 
                href="/dashboard/social-monitor" 
                icon={ChatBubbleLeftRightIcon}
                isActive={pathname === "/dashboard/social-monitor"}
              >
                <span className={`font-medium ${
                  pathname === "/dashboard/social-monitor" ? "text-gray-900" : "text-gray-700"
                }`}>
                  Social Monitor
                </span>
              </SidebarLink>
            </div>

            <div className={`rounded-lg transition-colors duration-200 ${
              pathname === "/dashboard/chat" 
                ? "bg-gray-100" 
                : "hover:bg-gray-50"
            }`}>
              <SidebarLink 
                href="/dashboard/chat" 
                icon={MessageSquare}
                isActive={pathname === "/dashboard/chat"}
              >
                <span className={`font-medium ${
                  pathname === "/dashboard/chat" ? "text-gray-900" : "text-gray-700"
                }`}>
                  Chat
                </span>
              </SidebarLink>
            </div>

            <div className={`rounded-lg transition-colors duration-200 ${
              pathname === "/dashboard/canvas" 
                ? "bg-gray-100" 
                : "hover:bg-gray-50"
            }`}>
              <SidebarLink 
                href="/dashboard/canvas" 
                icon={SwatchIcon}
                isActive={pathname === "/dashboard/canvas"}
              >
                <span className={`font-medium ${
                  pathname === "/dashboard/canvas" ? "text-gray-900" : "text-gray-700"
                }`}>
                  Canvas
                </span>
              </SidebarLink>
            </div>
          </div>
        </SidebarBody>
        
        {/* Profile section - simplified */}
        <div className="mt-auto p-4 pr-8 border-t border-gray-100">
          <div className="flex items-center justify-between">
            {!loading && user ? (
              <>
                <ProfileMenu />
                <span className="text-sm text-gray-600 font-medium">
                  Profile
                </span>
              </>
            ) : (
              <a 
                href="/auth/login" 
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
} 