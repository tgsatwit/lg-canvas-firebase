"use client";

import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, DesktopSidebar } from "@/components/ui/sidebar";
import { SidebarToggle } from "@/components/ui/sidebar-toggle";
import { DashboardSidebar } from "./DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Calendar, Tags } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  
  // Handle button actions
  const handleAction = (action: string) => {
    switch (action) {
      case 'add-task':
        // Navigate to tasks page with add task modal
        router.push('/dashboard/tasks?action=add');
        break;
      case 'generate-replies':
        toast({
          title: "Generate Replies",
        });
        break;
      case 'upload-video':
        // Navigate to videos page (the upload button is now in the table itself)
        router.push('/dashboard/videos');
        break;
      case 'create-playlist':
        // Navigate to playlists page with create modal
        router.push('/dashboard/playlists?action=create');
        break;
      default:
        break;
    }
  };
  
  // Get page info based on current route
  const getPageInfo = () => {
    if (pathname.includes('/tasks')) {
      return {
        title: 'Task Library',
        actions: (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleAction('add-task')}>
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
          </div>
        )
      };
    }
    
    if (pathname.includes('/social-monitor')) {
      return {
        title: 'Social Media Monitor',
        actions: (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleAction('generate-replies')}>
              <Plus className="h-4 w-4 mr-1" />
              Generate Replies
            </Button>
          </div>
        )
      };
    }
    
    if (pathname.includes('/videos')) {
      return {
        title: 'Video Library',
        actions: (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleAction('upload-video')}>
              <Plus className="h-4 w-4 mr-1" />
              Upload Video
            </Button>
          </div>
        )
      };
    }
    
    if (pathname.includes('/playlists')) {
      return {
        title: 'Create Playlists',
        actions: (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Calendar className="h-4 w-4 mr-1" />
              Schedule
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleAction('create-playlist')}>
              <Plus className="h-4 w-4 mr-1" />
              Create Playlist
            </Button>
          </div>
        )
      };
    }
    
    if (pathname.includes('/canvas')) {
      return {
        title: 'Canvas',
        actions: null
      };
    }
    
    // Default dashboard
    return {
      title: 'Dashboard',
      actions: null
    };
  };
  
  const pageInfo = getPageInfo();
  
  return (
    <SidebarProvider>
      <div className="flex h-screen relative">
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100/50"/>
        </div>

        <DesktopSidebar>
          <DashboardSidebar />
        </DesktopSidebar>
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <header className="border-b bg-white/80 backdrop-blur-md">
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center gap-4">
                <SidebarToggle />
                <div className="hidden sm:block">
                  <h1 className="text-xl font-semibold text-gray-900">{pageInfo.title}</h1>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-lg font-semibold text-gray-900">{pageInfo.title}</h1>
                </div>
              </div>
              
              {pageInfo.actions && (
                <div className="flex items-center">
                  {pageInfo.actions}
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
} 