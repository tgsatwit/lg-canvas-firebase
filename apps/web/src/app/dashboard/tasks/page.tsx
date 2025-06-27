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
        <div 
          className="relative min-h-screen"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(148, 163, 184, 0.08) 0%,
                rgba(203, 213, 225, 0.04) 50%,
                rgba(148, 163, 184, 0.08) 100%
              )
            `,
          }}
        >
          {/* Ambient background layers */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `
                  radial-gradient(circle at 35% 25%, rgba(148, 163, 184, 0.12) 0%, transparent 50%),
                  radial-gradient(circle at 65% 75%, rgba(203, 213, 225, 0.12) 0%, transparent 50%),
                  radial-gradient(circle at 50% 10%, rgba(156, 163, 175, 0.08) 0%, transparent 40%)
                `,
              }}
            />
          </div>

          <div className="relative z-10 p-6">
            {/* Header */}
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
                <p className="text-gray-600 mt-1">Organize and track your tasks with our powerful project management board.</p>
              </div>
            </div>

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