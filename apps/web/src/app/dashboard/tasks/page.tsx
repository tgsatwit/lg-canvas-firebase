"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TaskBoard } from "./components/task-board";
import { TaskProvider } from "./context/task-context";
import { DashboardShell } from "@/components/dashboard/shell";

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <TaskProvider>
      <DashboardShell>
        <div className="relative min-h-screen bg-background">
          {/* Search Section */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-6 py-4">
            <div className="max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="apple-input pl-12 pr-4 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="px-6 py-6">
            <TaskBoard searchQuery={searchQuery} />
          </div>
        </div>
      </DashboardShell>
    </TaskProvider>
  );
} 