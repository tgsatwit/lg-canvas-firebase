"use client";

import { SidebarProvider, DesktopSidebar } from "@/components/ui/sidebar";
import { SidebarToggle } from "@/components/ui/sidebar-toggle";
import { DashboardSidebar } from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen relative">
        {/* Full-width background with grid and gradient */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-zinc-900 to-blue-900" 
               style={{
                 backgroundImage: 'radial-gradient(circle at top right, rgba(67, 56, 202, 0.7), transparent 60%), radial-gradient(circle at bottom left, rgba(63, 0, 237, 0.8), transparent 60%)'
               }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
              opacity: 1,
            }}
          />
        </div>

        <DesktopSidebar>
          <DashboardSidebar />
        </DesktopSidebar>
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <header className="flex items-center h-16 px-4 border-b bg-white/80 backdrop-blur-md">
            <SidebarToggle />
            <div className="flex-1" />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
} 