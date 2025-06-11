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
        <div 
          className="relative min-h-screen"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(16, 185, 129, 0.1) 0%,
                rgba(59, 130, 246, 0.05) 50%,
                rgba(34, 197, 94, 0.1) 100%
              )
            `,
          }}
        >
          {/* Ambient background layers */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `
                  radial-gradient(circle at 35% 25%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
                  radial-gradient(circle at 65% 75%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)
                `,
              }}
            />
          </div>

          <div className="relative z-10 p-6">
            {/* Search Section */}
            <div 
              className="p-6 rounded-2xl border mb-6"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.25) 0%,
                    rgba(255, 255, 255, 0.1) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(150%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.4)
                `,
              }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-12 h-12 border-0 text-base rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(255, 255, 255, 0.3) 0%,
                        rgba(255, 255, 255, 0.15) 100%
                      )
                    `,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                  }}
                />
              </div>
            </div>
            
            <TaskBoard searchQuery={searchQuery} />
          </div>
        </div>
      </DashboardShell>
    </TaskProvider>
  );
} 