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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what needs your attention today.</p>
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
              className="pl-10 pr-4 h-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </form>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Tasks */}
        <Card className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/tasks")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-base font-medium text-gray-700">Open Tasks</CardTitle>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{openTasks.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {openTasks.filter(t => t.priority === "high").length} high priority
            </p>
          </CardContent>
        </Card>

        {/* Unactioned Comments */}
        <Card 
          className={cn(
            "border-gray-200 hover:shadow-md transition-shadow cursor-pointer",
            totalUnansweredComments > 0 && "border-amber-200 bg-amber-50/50"
          )} 
          onClick={() => router.push("/dashboard/social-monitor")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-lg",
                  totalUnansweredComments > 0 ? "bg-amber-100" : "bg-gray-50"
                )}>
                  <MessageSquare className={cn(
                    "h-5 w-5",
                    totalUnansweredComments > 0 ? "text-amber-600" : "text-gray-600"
                  )} />
                </div>
                <CardTitle className="text-base font-medium text-gray-700">Unactioned Comments</CardTitle>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalUnansweredComments}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
          </CardContent>
        </Card>

        {/* Video Library */}
        <Card className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/videos")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Video className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-base font-medium text-gray-700">Video Library</CardTitle>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{videos.length}</div>
            <div className="flex gap-3 mt-1">
              <span className="text-xs text-gray-500">{videoStatusBreakdown.published} published</span>
              <span className="text-xs text-gray-500">{videoStatusBreakdown.draft} drafts</span>
            </div>
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/canvas")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Grid3x3 className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-medium text-gray-700">Canvas</CardTitle>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">Create & manage projects</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar/Schedule Section */}
        <Card className="lg:col-span-2 border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-lg font-semibold text-gray-900">Schedule & Calendar</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={calendarView === "schedule" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCalendarView("schedule")}
                >
                  Schedule
                </Button>
                <Button
                  variant={calendarView === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCalendarView("calendar")}
                >
                  Calendar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {calendarView === "schedule" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">Next 7 days</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddTask()}
                    className="text-xs"
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
                        "border rounded-lg p-3 transition-colors",
                        isToday ? "border-blue-200 bg-blue-50/50" : "border-gray-100",
                        !hasItems && "opacity-60"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          {isToday && <Badge variant="secondary" className="text-xs">Today</Badge>}
                        </div>
                        {hasItems && (
                          <span className="text-xs text-gray-500">
                            {dayTasks.length + dayVideos.length} items
                          </span>
                        )}
                      </div>
                      
                      {hasItems ? (
                        <div className="space-y-1">
                          {dayTasks.slice(0, 2).map(task => (
                            <div key={task.id} className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", {
                                "bg-red-500": task.priority === "high",
                                "bg-amber-500": task.priority === "medium",
                                "bg-emerald-500": task.priority === "low"
                              })} />
                              <span className="text-sm text-gray-600 truncate">{task.title}</span>
                            </div>
                          ))}
                          {dayVideos.slice(0, 2).map(video => (
                            <div key={video.id} className="flex items-center gap-2">
                              <Video className="h-3 w-3 text-purple-500" />
                              <span className="text-sm text-gray-600 truncate">{video.title}</span>
                            </div>
                          ))}
                          {(dayTasks.length + dayVideos.length) > 4 && (
                            <p className="text-xs text-gray-400 pl-4">
                              +{(dayTasks.length + dayVideos.length) - 4} more items
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No scheduled items</p>
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
          </CardContent>
        </Card>

        {/* Open Tasks Section */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-lg font-semibold text-gray-900">Open Tasks</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleAddTask()}
                  className="text-gray-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push("/dashboard/tasks")}
                  className="text-gray-600"
                >
                  View all
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {openTasks.slice(0, 5).map(task => (
                <div 
                  key={task.id} 
                  className="p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors cursor-pointer"
                  onClick={() => router.push("/dashboard/tasks")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs border", priorityColors[task.priority])}
                        >
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
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
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No open tasks</p>
                </div>
              )}
              
              {openTasks.length > 5 && (
                <p className="text-xs text-center text-gray-500 pt-2">
                  +{openTasks.length - 5} more tasks
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 