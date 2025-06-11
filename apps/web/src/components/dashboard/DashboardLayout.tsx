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
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex border-gray-300/60 bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80 hover:border-gray-400/60 transition-all duration-300"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border-0 shadow-lg shadow-emerald-500/25 backdrop-blur-sm transition-all duration-300 hover:scale-105" 
              onClick={() => handleAction('add-task')}
            >
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
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex border-gray-300/60 bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80 hover:border-gray-400/60 transition-all duration-300"
            >
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-400 hover:to-blue-400 text-white border-0 shadow-lg shadow-orange-500/25 backdrop-blur-sm transition-all duration-300 hover:scale-105" 
              onClick={() => handleAction('generate-replies')}
            >
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
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex border-gray-300/60 bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80 hover:border-gray-400/60 transition-all duration-300"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white border-0 shadow-lg shadow-purple-500/25 backdrop-blur-sm transition-all duration-300 hover:scale-105" 
              onClick={() => handleAction('upload-video')}
            >
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
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex border-gray-300/60 bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80 hover:border-gray-400/60 transition-all duration-300"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Schedule
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-purple-500 to-teal-500 hover:from-purple-400 hover:to-teal-400 text-white border-0 shadow-lg shadow-purple-500/25 backdrop-blur-sm transition-all duration-300 hover:scale-105" 
              onClick={() => handleAction('create-playlist')}
            >
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
      <div className="flex h-screen relative overflow-hidden">
        {/* Enhanced background with light liquid glass effect */}
        <div className="absolute inset-0 w-full h-full z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100"/>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/60 via-purple-50/40 to-pink-100/60"/>
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl"/>
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl"/>
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-pink-200/30 rounded-full blur-2xl"/>
        </div>

        <DesktopSidebar>
          <DashboardSidebar />
        </DesktopSidebar>
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          {/* Enhanced header with light liquid glass effect */}
          <header className="relative border-b border-gray-200/60">
            <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/80 to-white/70 backdrop-blur-xl"/>
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-transparent"/>
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-300/60 to-transparent"/>
            <div className="relative flex items-center justify-between h-16 px-6">
              <div className="flex items-center gap-4">
                <SidebarToggle />
                <div className="hidden sm:block">
                  <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {pageInfo.title}
                  </h1>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {pageInfo.title}
                  </h1>
                </div>
              </div>
              
              {pageInfo.actions && (
                <div className="flex items-center">
                  {pageInfo.actions}
                </div>
              )}
            </div>
          </header>
          {/* Enhanced main content area */}
          <main className="flex-1 overflow-auto relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30 pointer-events-none"/>
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
} 