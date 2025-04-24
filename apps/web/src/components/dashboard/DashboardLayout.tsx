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
      <div className="flex h-screen">
        <DesktopSidebar>
          <DashboardSidebar />
        </DesktopSidebar>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center h-16 px-4 border-b bg-background">
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