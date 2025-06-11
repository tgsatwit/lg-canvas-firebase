"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle2, MessageSquare, Video, Grid3x3, Search, ChevronRight, Clock, AlertCircle, Plus } from "lucide-react";
import { useTaskContext } from "./tasks/context/task-context";
import { useVideos } from "@/hooks/use-videos";
import { useSocialApi } from "@/hooks/use-social-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DashboardCalendar, type CalendarData } from "@/components/dashboard/calendar";

export default function DashboardPage() {
  const router = useRouter();
  const { board } = useTaskContext();
  const { videos, loading: videosLoading } = useVideos();
  const { getStats } = useSocialApi();
  const stats = getStats();
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarView, setCalendarView] = useState<"schedule" | "calendar">("schedule");

  // Get open tasks (todo and in-progress)
  const openTasks = Object.values(board.tasks).filter(
    task => task.status === "todo" || task.status === "in-progress"
  );

  // Get tasks with due dates for calendar
  const tasksWithDueDates = Object.values(board.tasks).filter(
    task => task.dueDate && new Date(task.dueDate) >= new Date()
  );

  // Get upcoming videos (assuming they have uploadDate in the future)
  const upcomingVideos = videos.filter(
    video => video.uploadDate && new Date(video.uploadDate) >= new Date()
  );

  // Calculate total unanswered comments
  const totalUnansweredComments = stats.data?.data 
    ? Object.values(stats.data.data).reduce((sum, platform) => sum + platform.unanswered, 0)
    : 0;

  // Get video status breakdown
  const videoStatusBreakdown = {
    published: videos.filter(v => v.status === "Published").length,
    draft: videos.filter(v => v.status === "Draft").length,
    processing: videos.filter(v => v.status === "Processing").length,
  };

  // Prepare calendar data
  const calendarData: CalendarData[] = React.useMemo(() => {
    const eventMap = new Map<string, CalendarData>();

    // Add tasks to calendar
    tasksWithDueDates.forEach(task => {
      if (task.dueDate) {
        const dateKey = task.dueDate.split('T')[0];
        const date = new Date(task.dueDate);
        
        if (!eventMap.has(dateKey)) {
          eventMap.set(dateKey, {
            day: date,
            events: []
          });
        }
        
        eventMap.get(dateKey)!.events.push({
          id: parseInt(task.id),
          name: task.title,
          time: new Date(task.dueDate).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          datetime: task.dueDate,
          type: 'task'
        });
      }
    });

    // Add videos to calendar
    upcomingVideos.forEach(video => {
      if (video.uploadDate) {
        const dateKey = video.uploadDate.split('T')[0];
        const date = new Date(video.uploadDate);
        
        if (!eventMap.has(dateKey)) {
          eventMap.set(dateKey, {
            day: date,
            events: []
          });
        }
        
        eventMap.get(dateKey)!.events.push({
          id: parseInt(video.id),
          name: video.title,
          time: new Date(video.uploadDate).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          datetime: video.uploadDate,
          type: 'event'
        });
      }
    });

    return Array.from(eventMap.values());
  }, [tasksWithDueDates, upcomingVideos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/chat?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleAddTask = (date?: Date) => {
    const params = new URLSearchParams();
    params.set('action', 'add');
    if (date) {
      params.set('dueDate', date.toISOString());
    }
    router.push(`/dashboard/tasks?${params.toString()}`);
  };

  const handleAddEvent = (date: Date) => {
    // For now, just log the event. You can implement event storage later
    console.log("Adding event for date:", date);
  };

  const priorityColors = {
    high: "text-red-600 bg-red-50 border-red-200",
    medium: "text-amber-600 bg-amber-50 border-amber-200",
    low: "text-emerald-600 bg-emerald-50 border-emerald-200",
  };

  const getNextSevenDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  return (
    <div 
      className="min-h-screen relative"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(236, 72, 153, 0.1) 0%,
            rgba(147, 51, 234, 0.05) 50%,
            rgba(219, 39, 119, 0.1) 100%
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
              radial-gradient(circle at 20% 30%, rgba(236, 72, 153, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 space-y-6 p-6">
        {/* Header */}
        <div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(255, 255, 255, 0.25) 0%,
                rgba(255, 255, 255, 0.1) 100%
              )
            `,
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.4)
            `,
          }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what needs your attention today.</p>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Ask a question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-12 border-0 rounded-xl"
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
          </form>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Open Tasks */}
          <div 
            className="p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-[1.02]" 
            onClick={() => router.push("/dashboard/tasks")}
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="p-3 rounded-xl"
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(59, 130, 246, 0.2) 0%,
                        rgba(59, 130, 246, 0.1) 100%
                      )
                    `,
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                  }}
                >
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-base font-medium text-gray-800">Open Tasks</h3>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{openTasks.length}</div>
            <p className="text-sm text-gray-600">
              {openTasks.filter(t => t.priority === "high").length} high priority
            </p>
          </div>

          {/* Unactioned Comments */}
          <div 
            className={cn(
              "p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-[1.02]",
              totalUnansweredComments > 0 && "ring-2 ring-amber-200"
            )} 
            onClick={() => router.push("/dashboard/social-monitor")}
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="p-3 rounded-xl"
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        ${totalUnansweredComments > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(107, 114, 128, 0.2)'} 0%,
                        ${totalUnansweredComments > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(107, 114, 128, 0.1)'} 100%
                      )
                    `,
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${totalUnansweredComments > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`,
                  }}
                >
                  <MessageSquare className={cn(
                    "h-6 w-6",
                    totalUnansweredComments > 0 ? "text-amber-600" : "text-gray-600"
                  )} />
                </div>
                <h3 className="text-base font-medium text-gray-800">Unactioned Comments</h3>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalUnansweredComments}</div>
            <p className="text-sm text-gray-600">Awaiting response</p>
          </div>

          {/* Video Library */}
          <div 
            className="p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-[1.02]" 
            onClick={() => router.push("/dashboard/videos")}
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="p-3 rounded-xl"
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(147, 51, 234, 0.2) 0%,
                        rgba(147, 51, 234, 0.1) 100%
                      )
                    `,
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(147, 51, 234, 0.2)',
                  }}
                >
                  <Video className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-base font-medium text-gray-800">Video Library</h3>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{videos.length}</div>
            <div className="flex gap-3">
              <span className="text-sm text-gray-600">{videoStatusBreakdown.published} published</span>
              <span className="text-sm text-gray-600">{videoStatusBreakdown.draft} drafts</span>
            </div>
          </div>

          {/* Canvas */}
          <div 
            className="p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-[1.02]" 
            onClick={() => router.push("/dashboard/canvas")}
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="p-3 rounded-xl"
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(16, 185, 129, 0.2) 0%,
                        rgba(16, 185, 129, 0.1) 100%
                      )
                    `,
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <Grid3x3 className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-base font-medium text-gray-800">Canvas</h3>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-sm text-gray-700">Create & manage projects</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar/Schedule Section */}
          <div 
            className="lg:col-span-2 p-6 rounded-2xl border"
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">Schedule & Calendar</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={calendarView === "schedule" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCalendarView("schedule")}
                  className="rounded-xl"
                >
                  Schedule
                </Button>
                <Button
                  variant={calendarView === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCalendarView("calendar")}
                  className="rounded-xl"
                >
                  Calendar
                </Button>
              </div>
            </div>
            
            {calendarView === "schedule" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">Next 7 days</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddTask()}
                    className="text-xs rounded-xl"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Task
                  </Button>
                </div>
                {getNextSevenDays().map((date, index) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const dayTasks = tasksWithDueDates.filter(
                    task => task.dueDate?.startsWith(dateStr)
                  );
                  const dayVideos = upcomingVideos.filter(
                    video => video.uploadDate?.startsWith(dateStr)
                  );
                  
                  const isToday = index === 0;
                  const hasItems = dayTasks.length > 0 || dayVideos.length > 0;

                  return (
                    <div 
                      key={dateStr} 
                      className={cn(
                        "border rounded-xl p-4 transition-all duration-300",
                        isToday ? "ring-2 ring-blue-200" : "",
                        !hasItems && "opacity-60"
                      )}
                      style={{
                        background: `
                          linear-gradient(135deg, 
                            ${isToday ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.1)'} 0%,
                            ${isToday ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.05)'} 100%
                          )
                        `,
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${isToday ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.2)'}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          {isToday && <Badge variant="secondary" className="text-xs rounded-lg">Today</Badge>}
                        </div>
                        {hasItems && (
                          <span className="text-xs text-gray-600">
                            {dayTasks.length + dayVideos.length} items
                          </span>
                        )}
                      </div>
                      
                      {hasItems ? (
                        <div className="space-y-2">
                          {dayTasks.slice(0, 2).map(task => (
                            <div key={task.id} className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", {
                                "bg-red-500": task.priority === "high",
                                "bg-amber-500": task.priority === "medium",
                                "bg-emerald-500": task.priority === "low"
                              })} />
                              <span className="text-sm text-gray-700 truncate">{task.title}</span>
                            </div>
                          ))}
                          {dayVideos.slice(0, 2).map(video => (
                            <div key={video.id} className="flex items-center gap-2">
                              <Video className="h-3 w-3 text-purple-500" />
                              <span className="text-sm text-gray-700 truncate">{video.title}</span>
                            </div>
                          ))}
                          {(dayTasks.length + dayVideos.length) > 4 && (
                            <p className="text-xs text-gray-500 pl-4">
                              +{(dayTasks.length + dayVideos.length) - 4} more items
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No scheduled items</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-96">
                <DashboardCalendar 
                  data={calendarData}
                  onAddEvent={handleAddEvent}
                  onAddTask={handleAddTask}
                />
              </div>
            )}
          </div>

          {/* Open Tasks Section */}
          <div 
            className="p-6 rounded-2xl border"
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">Open Tasks</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleAddTask()}
                  className="text-gray-700 hover:bg-white/20 rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push("/dashboard/tasks")}
                  className="text-gray-700 hover:bg-white/20 rounded-xl"
                >
                  View all
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {openTasks.slice(0, 5).map(task => (
                <div 
                  key={task.id} 
                  className="p-4 border rounded-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer"
                  onClick={() => router.push("/dashboard/tasks")}
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(255, 255, 255, 0.2) 0%,
                        rgba(255, 255, 255, 0.1) 100%
                      )
                    `,
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs border rounded-lg", priorityColors[task.priority])}
                        >
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-xs text-gray-600">
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.status === "in-progress" && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                        <span className="text-xs">In Progress</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {openTasks.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No open tasks</p>
                </div>
              )}
              
              {openTasks.length > 5 && (
                <p className="text-xs text-center text-gray-600 pt-2">
                  +{openTasks.length - 5} more tasks
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 