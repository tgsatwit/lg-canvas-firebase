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
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-purple-50"/>
        </div>

        <DesktopSidebar>
          <DashboardSidebar />
        </DesktopSidebar>
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <header className="flex items-center h-16 px-1 border-b bg-white/80 backdrop-blur-md">
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