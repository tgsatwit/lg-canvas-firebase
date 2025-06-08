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

          {/* Search Section */}
          <div className="bg-white rounded-lg p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tasks..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <TaskBoard searchQuery={searchQuery} />
        </div>
      </DashboardShell>
    </TaskProvider>
  );
} 