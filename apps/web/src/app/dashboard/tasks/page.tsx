"use client";

import { useState } from "react";
import { Search, Users, CheckCheck, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaskBoard } from "./components/task-board";
import { TaskProvider } from "./context/task-context";
import { DashboardShell } from "@/components/dashboard/shell";
import { TaskFilters } from "./components/task-filters";
import { useTaskContext } from "./context/task-context";





function TaskManagementContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const { board, assignTasksToSelf, completeAllTasks, loading } = useTaskContext();
  
  // Get all task IDs that are currently visible
  const getAllVisibleTaskIds = () => {
    const allTaskIds: string[] = [];
    Object.values(board.columns).forEach(column => {
      allTaskIds.push(...column.taskIds);
    });
    return allTaskIds;
  };

  // Get all incomplete task IDs
  const getIncompleteTaskIds = () => {
    return getAllVisibleTaskIds().filter(taskId => {
      const task = board.tasks[taskId];
      return task && task.status !== "done";
    });
  };

  const handleAssignAllToSelf = async () => {
    const taskIds = getIncompleteTaskIds();
    if (taskIds.length > 0) {
      await assignTasksToSelf(taskIds);
    }
  };

  const handleCompleteAll = async () => {
    const taskIds = getIncompleteTaskIds();
    if (taskIds.length > 0) {
      await completeAllTasks(taskIds);
    }
  };

  const incompleteCount = getIncompleteTaskIds().length;

  return (
    <DashboardShell>
      <div 
        className="relative min-h-screen"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(236, 72, 153, 0.05) 0%,
              rgba(139, 92, 246, 0.05) 100%
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
                radial-gradient(circle at 35% 25%, rgba(236, 72, 153, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 65% 75%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 50% 10%, rgba(219, 39, 119, 0.06) 0%, transparent 40%)
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
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Team Task Management
                </h1>
                <p className="text-gray-600 mt-1">Collaborate with your team to organize and track tasks across all projects.</p>
              </div>
              
              {/* Bulk Actions */}
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500 mr-2">
                  {incompleteCount} tasks remaining
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAssignAllToSelf}
                  disabled={loading || incompleteCount === 0}
                  className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 hover:from-pink-100 hover:to-purple-100 text-pink-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign All to Me
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCompleteAll}
                  disabled={loading || incompleteCount === 0}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 text-green-700"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Complete All
                </Button>
              </div>
            </div>
          </div>

          {/* Search & Filters Section */}
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
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-400" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-12 h-12 border-0 text-base rounded-xl focus:ring-2 focus:ring-pink-500"
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
              
              <div>
                <TaskFilters />
              </div>
            </div>
          </div>
          
          <TaskBoard searchQuery={searchQuery} />
        </div>
      </div>
    </DashboardShell>
  );
}

export default function TasksPage() {
  return (
    <TaskProvider>
      <TaskManagementContent />
    </TaskProvider>
  );
} 