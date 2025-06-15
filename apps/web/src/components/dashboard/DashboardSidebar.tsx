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
  const isVideosSection = pathname === "/dashboard/videos" || pathname === "/dashboard/videos/youtube";

  return (
    <Sidebar className="border-r border-gray-200/60 relative overflow-hidden">
      {/* Enhanced background with light liquid glass effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/80 to-white"/>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/60 via-rose-25/30 to-purple-50/60"/>
        <div className="absolute inset-0 backdrop-blur-xl"/>
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/60 rounded-full blur-2xl"/>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-100/60 rounded-full blur-xl"/>
      </div>
      
      <div className="flex flex-col h-full relative z-10">
        <SidebarBody>
          {/* Enhanced logo section */}
          <div className="mb-8 flex items-center gap-3 px-4 py-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100/60 to-white/40 rounded-xl blur-sm"/>
              <Image 
                src="/Sqr_logo.png" 
                alt="PBL.ai Logo" 
                width={40} 
                height={40}
                className="relative rounded-xl shadow-lg"
              />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
              PBL.ai
            </h2>
          </div>

          {/* Simplified navigation links with clean liquid glass active states */}
          <div className="space-y-1 px-3">
            <div className={`rounded-xl transition-all duration-300 ${
              pathname === "/dashboard" 
                ? "bg-gradient-to-r from-pink-50/60 to-rose-50/40 backdrop-blur-sm border border-pink-200/40 shadow-sm text-pink-700" 
                : ""
            }`}>
              <SidebarLink 
                href="/dashboard" 
                icon={HomeIcon}
                isActive={pathname === "/dashboard"}
              >
                <span className={`py-2 font-medium transition-colors duration-200 ${
                  pathname === "/dashboard" 
                    ? "text-black" 
                    : "text-gray-700"
                }`}>
                  Dashboard
                </span>
              </SidebarLink>
            </div>

            {/* Video Library with sub-menu */}
            <div className={`rounded-xl transition-all duration-300 ${
              isVideosSection 
                ? "bg-gradient-to-r from-purple-50/60 to-pink-50/40 backdrop-blur-sm border border-purple-200/40 shadow-sm text-purple-700" 
                : ""
            }`}>
              <SidebarLink 
                href="/dashboard/videos" 
                icon={FilmIcon}
                isActive={isVideosSection}
              >
                <span className={`py-2 font-medium transition-colors duration-200 ${
                  isVideosSection 
                    ? "text-black" 
                    : "text-gray-700"
                }`}>
                  Video Library
                </span>
              </SidebarLink>
              
              {/* YouTube Upload sub-menu item */}
              {isVideosSection && (
                <div className="ml-8 mt-1 mb-2">
                  <a
                    href="/dashboard/videos/youtube"
                    className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 font-medium ${
                      pathname === "/dashboard/videos/youtube"
                        ? "bg-white/40 text-black"
                        : "text-gray-600"
                    }`}
                  >
                    <span className="text-sm">YouTube Upload</span>
                  </a>
                </div>
              )}
            </div>

            <div className={`rounded-xl transition-all duration-300 ${
              pathname === "/dashboard/tasks" 
                ? "bg-gradient-to-r from-emerald-50/60 to-teal-50/40 backdrop-blur-sm border border-emerald-200/40 shadow-sm text-emerald-700" 
                : ""
            }`}>
              <SidebarLink 
                href="/dashboard/tasks" 
                icon={ClipboardDocumentListIcon}
                isActive={pathname === "/dashboard/tasks"}
              >
                <span className={`py-2 font-medium transition-colors duration-200 ${
                  pathname === "/dashboard/tasks" 
                    ? "text-black" 
                    : "text-gray-700"
                }`}>
                  Tasks
                </span>
              </SidebarLink>
            </div>

            <div className={`rounded-xl transition-all duration-300 ${
              pathname === "/dashboard/social-monitor" 
                ? "bg-gradient-to-r from-orange-50/60 to-amber-50/40 backdrop-blur-sm border border-orange-200/40 shadow-sm text-orange-700" 
                : ""
            }`}>
              <SidebarLink 
                href="/dashboard/social-monitor" 
                icon={ChatBubbleLeftRightIcon}
                isActive={pathname === "/dashboard/social-monitor"}
              >
                <span className={`py-2 font-medium transition-colors duration-200 ${
                  pathname === "/dashboard/social-monitor" 
                    ? "text-black" 
                    : "text-gray-700"
                }`}>
                  Social Monitor
                </span>
              </SidebarLink>
            </div>

            <div className={`rounded-xl transition-all duration-300 ${
              pathname === "/dashboard/chat" 
                ? "bg-gradient-to-r from-pink-50/60 to-rose-50/40 backdrop-blur-sm border border-pink-200/40 shadow-sm text-pink-700" 
                : ""
            }`}>
              <SidebarLink 
                href="/dashboard/chat" 
                icon={MessageSquare}
                isActive={pathname === "/dashboard/chat"}
              >
                <span className={`py-2 font-medium transition-colors duration-200 ${
                  pathname === "/dashboard/chat" 
                    ? "text-black" 
                    : "text-gray-700"
                }`}>
                  Chat
                </span>
              </SidebarLink>
            </div>

            <div className={`rounded-xl transition-all duration-300 ${
              pathname === "/dashboard/playlists" 
                ? "bg-gradient-to-r from-violet-50/60 to-purple-50/40 backdrop-blur-sm border border-violet-200/40 shadow-sm text-violet-700" 
                : ""
            }`}>
              <SidebarLink 
                href="/dashboard/playlists" 
                icon={QueueListIcon}
                isActive={pathname === "/dashboard/playlists"}
              >
                <span className={`py-2 font-medium transition-colors duration-200 ${
                  pathname === "/dashboard/playlists" 
                    ? "text-black" 
                    : "text-gray-700"
                }`}>
                  Create Playlists
                </span>
              </SidebarLink>
            </div>

            <div className={`rounded-xl transition-all duration-300 ${
              pathname === "/dashboard/canvas" 
                ? "bg-gradient-to-r from-indigo-50/60 to-slate-50/40 backdrop-blur-sm border border-indigo-200/40 shadow-sm text-indigo-700" 
                : ""
            }`}>
              <SidebarLink 
                href="/dashboard/canvas" 
                icon={SwatchIcon}
                isActive={pathname === "/dashboard/canvas"}
              >
                <span className={`py-2 font-medium transition-colors duration-200 ${
                  pathname === "/dashboard/canvas" 
                    ? "text-black" 
                    : "text-gray-700"
                }`}>
                  Canvas
                </span>
              </SidebarLink>
            </div>
          </div>
        </SidebarBody>
        
        {/* Enhanced profile menu with light glass styling */}
        <div className="mt-auto pt-6 border-t border-gray-200/60 px-4 pb-6">
          <div className="relative group transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50/60 via-white/60 to-gray-50/60 rounded-xl backdrop-blur-sm border border-gray-200/60"/>
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent rounded-xl"/>
            <div className="relative flex items-center justify-between px-4 py-3">
              {!loading && user ? (
                <>
                  <ProfileMenu />
                  <span className="text-sm text-gray-600 font-medium transition-colors duration-300">
                    Profile
                  </span>
                </>
              ) : (
                <a 
                  href="/auth/login" 
                  className="text-sm text-gray-600 transition-colors duration-300 font-medium"
                >
                  Sign In
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
} 