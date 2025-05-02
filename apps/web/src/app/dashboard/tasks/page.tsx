"use client";

import { useState } from "react";
import { Plus, Search, Tags, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskBoard } from "./components/task-board";
import { TaskProvider } from "./context/task-context";
import { DashboardShell } from "@/components/dashboard/shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <TaskProvider>
      <DashboardShell>
        <div className="relative min-h-screen">
          {/* Purple Header Section */}
          <div className="bg-purple-600 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Task Library</h1>
                <p className="text-purple-100 mt-2">
                  Manage and organize your team's tasks
                </p>
              </div>
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-white text-purple-600 hover:bg-purple-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="bg-white rounded-lg p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Status
                </Button>
                
                <Button variant="outline" size="sm">
                  <Tags className="h-4 w-4 mr-1" />
                  Tags
                </Button>

                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  Columns
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <TaskBoard searchQuery={searchQuery} />
          </div>
        </div>
      </DashboardShell>
    </TaskProvider>
  );
} 