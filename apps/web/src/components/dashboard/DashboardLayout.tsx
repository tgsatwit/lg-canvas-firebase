"use client";

import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, DesktopSidebar } from "@/components/ui/sidebar";
import { SidebarToggle } from "@/components/ui/sidebar-toggle";
import { DashboardSidebar } from "./DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Calendar } from "lucide-react";
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
    
    if (pathname.includes('/videos/library')) {
      return {
        title: 'YouTube Studio',
        actions: null // The refresh button is handled in the page itself
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
      <div className="flex h-screen bg-white dark:bg-gray-900">
        <DesktopSidebar>
          <DashboardSidebar />
        </DesktopSidebar>
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
} 