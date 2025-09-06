"use client";

import React from "react";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useUserContext } from "@/contexts/UserContext";
import { useTaskContext } from "../../app/dashboard/tasks/context/task-context";
import { useSocialApi } from "@/hooks/use-social-api";
import { useVideos } from "@/hooks/use-videos";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, loading } = useUserContext();
  const { isOpen, toggle } = useSidebar();
  const { board } = useTaskContext();
  const { getStats } = useSocialApi();
  const { videos } = useVideos();
  const stats = getStats();

  // Check if we're in the videos section (including YouTube)
  const isVideosSection = pathname === "/dashboard/videos" || pathname.startsWith("/dashboard/videos/");
  
  // Calculate badges/notifications
  const openTasks = Object.values(board.tasks).filter(
    task => task.status === "todo" || task.status === "in-progress"
  ).length;
  
  const totalUnansweredComments = stats.data?.data 
    ? Object.values(stats.data.data).reduce((sum, platform) => sum + platform.unanswered, 0)
    : 0;
  
  const draftVideos = videos.filter(v => v.status === "Draft").length;

  return (
    <Sidebar>
      <div className="flex flex-col h-full">
        <SidebarBody>
          {/* Header with logo and toggle */}
          <div className={cn(
            "flex items-center justify-between pb-6 border-b border-gray-100",
            !isOpen && "justify-center"
          )}>
            {isOpen ? (
              <div className="flex items-center gap-3">
                <Image 
                  src="/Sqr_logo.png" 
                  alt="PBL.ai Logo" 
                  width={32} 
                  height={32}
                  className="rounded-lg"
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    PBL Studio
                  </h2>
                  <p className="text-sm text-gray-600">AI Dashboard</p>
                </div>
              </div>
            ) : (
              <Image 
                src="/Sqr_logo.png" 
                alt="PBL.ai Logo" 
                width={32} 
                height={32}
                className="rounded-lg"
              />
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              className="p-2 rounded-xl hover:bg-pink-50 transition-all duration-200 text-gray-600 hover:text-pink-600"
            >
              {isOpen ? "←" : "→"}
            </Button>
          </div>

          {/* AI Assistant - First Item */}
          <div className="space-y-2">
            <SidebarLink 
              href="/dashboard/chat" 
              isActive={pathname === "/dashboard/chat"}
              className="border border-gray-200 hover:border-pink-300"
            >
              <span 
                className="w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold mr-2 text-white"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(236, 72, 153, 0.95) 0%,
                      rgba(139, 92, 246, 0.95) 100%
                    )
                  `
                }}
              >
                AI
              </span>
              AI Assistant
            </SidebarLink>

            <SidebarLink 
              href="/dashboard" 
              isActive={pathname === "/dashboard"}
            >
              Dashboard
            </SidebarLink>
          </div>

          {/* Admin Section */}
          {isOpen && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Admin</span>
              </div>
              
              <SidebarLink 
                href="/dashboard/tasks" 
                isActive={pathname === "/dashboard/tasks"}
                badge={openTasks > 0 ? openTasks : undefined}
              >
                Tasks
              </SidebarLink>

              <SidebarLink 
                href="/dashboard/customers" 
                isActive={pathname === "/dashboard/customers"}
              >
                Customers
              </SidebarLink>

              <SidebarLink 
                href="/dashboard/email-marketing" 
                isActive={pathname === "/dashboard/email-marketing"}
              >
                Email Marketing
              </SidebarLink>

              <SidebarLink 
                href="/dashboard/social-monitor" 
                isActive={pathname === "/dashboard/social-monitor"}
                badge={totalUnansweredComments > 0 ? totalUnansweredComments : undefined}
              >
                Social Monitor
              </SidebarLink>
            </div>
          )}

          {/* Content Section */}
          {isOpen && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Content</span>
              </div>
              
              <SidebarLink 
                href="/dashboard/videos" 
                isActive={isVideosSection}
                badge={draftVideos > 0 ? draftVideos : undefined}
              >
                Video Library
              </SidebarLink>
            </div>
          )}
        </SidebarBody>
        
        {/* User section (simplified) */}
        <div className={cn(
          "mt-auto pt-6 border-t border-gray-100",
          isOpen ? "px-6 pb-8" : "px-4 pb-8"
        )}>
          <div className={cn(
            "flex items-center",
            isOpen ? "justify-between" : "justify-center"
          )}>
            {!loading && user ? (
              <div className={cn(
                "flex items-center",
                isOpen ? "w-full" : "justify-center"
              )}>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-sm font-bold text-pink-700">
                  {user.displayName?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                {isOpen && (
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.displayName || user.name || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">Admin User</p>
                  </div>
                )}
              </div>
            ) : (
              <a 
                href="/auth/login" 
                className="text-sm text-gray-600 hover:text-pink-600 font-medium transition-colors"
              >
                {isOpen ? "Sign In" : "→"}
              </a>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}