"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle2, MessageSquare, Video, Grid3x3, Search, ChevronRight, Clock, Plus } from "lucide-react";
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
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-green-50 text-green-700 border-green-200",
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
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</h1>
        <p className="text-muted-foreground text-lg">Here's what needs your attention today.</p>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ask anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="apple-input pl-12 pr-4 text-base"
          />
        </form>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Tasks */}
        <Card className="apple-card hover:scale-[1.02] cursor-pointer" onClick={() => router.push("/dashboard/tasks")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-semibold">{openTasks.length}</p>
            <p className="text-sm text-muted-foreground">Open Tasks</p>
            {openTasks.filter(t => t.priority === "high").length > 0 && (
              <p className="text-xs text-red-600 font-medium">
                {openTasks.filter(t => t.priority === "high").length} high priority
              </p>
            )}
          </CardContent>
        </Card>

        {/* Unactioned Comments */}
        <Card 
          className={cn(
            "apple-card hover:scale-[1.02] cursor-pointer",
            totalUnansweredComments > 0 && "ring-2 ring-amber-200"
          )} 
          onClick={() => router.push("/dashboard/social-monitor")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                totalUnansweredComments > 0 ? "bg-amber-100" : "bg-gray-100"
              )}>
                <MessageSquare className={cn(
                  "h-6 w-6",
                  totalUnansweredComments > 0 ? "text-amber-600" : "text-gray-600"
                )} />
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-semibold">{totalUnansweredComments}</p>
            <p className="text-sm text-muted-foreground">Unactioned Comments</p>
          </CardContent>
        </Card>

        {/* Video Library */}
        <Card className="apple-card hover:scale-[1.02] cursor-pointer" onClick={() => router.push("/dashboard/videos")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-semibold">{videos.length}</p>
            <p className="text-sm text-muted-foreground">Total Videos</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{videoStatusBreakdown.published} published</span>
              <span>{videoStatusBreakdown.draft} drafts</span>
            </div>
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card className="apple-card hover:scale-[1.02] cursor-pointer" onClick={() => router.push("/dashboard/canvas")}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                <Grid3x3 className="h-6 w-6 text-green-600" />
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-lg font-semibold">Canvas</p>
            <p className="text-sm text-muted-foreground">Create & manage projects</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar/Schedule Section */}
        <Card className="apple-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Schedule & Calendar</CardTitle>
              </div>
              <div className="flex gap-1 p-1 bg-muted rounded-full">
                <Button
                  variant={calendarView === "schedule" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCalendarView("schedule")}
                  className={cn(
                    "rounded-full px-4 py-1 text-sm font-medium transition-all",
                    calendarView === "schedule" 
                      ? "bg-background shadow-sm" 
                      : "hover:bg-background/50"
                  )}
                >
                  Schedule
                </Button>
                <Button
                  variant={calendarView === "calendar" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCalendarView("calendar")}
                  className={cn(
                    "rounded-full px-4 py-1 text-sm font-medium transition-all",
                    calendarView === "calendar" 
                      ? "bg-background shadow-sm" 
                      : "hover:bg-background/50"
                  )}
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
                  <p className="text-sm font-medium text-muted-foreground">Next 7 days</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddTask()}
                    className="text-xs hover:bg-muted"
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
                        "rounded-xl p-4 transition-all",
                        isToday ? "bg-blue-50 border border-blue-200" : "bg-muted/50",
                        !hasItems && "opacity-60"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          {isToday && <Badge variant="secondary" className="text-xs px-2 py-0">Today</Badge>}
                        </div>
                        {hasItems && (
                          <span className="text-xs text-muted-foreground">
                            {dayTasks.length + dayVideos.length} items
                          </span>
                        )}
                      </div>
                      
                      {hasItems ? (
                        <div className="space-y-2">
                          {dayTasks.slice(0, 2).map(task => (
                            <div key={task.id} className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", {
                                "bg-red-500": task.priority === "high",
                                "bg-amber-500": task.priority === "medium",
                                "bg-green-500": task.priority === "low"
                              })} />
                              <span className="text-sm text-foreground/80 truncate">{task.title}</span>
                            </div>
                          ))}
                          {dayVideos.slice(0, 2).map(video => (
                            <div key={video.id} className="flex items-center gap-2">
                              <Video className="h-3 w-3 text-purple-500 flex-shrink-0" />
                              <span className="text-sm text-foreground/80 truncate">{video.title}</span>
                            </div>
                          ))}
                          {(dayTasks.length + dayVideos.length) > 4 && (
                            <p className="text-xs text-muted-foreground pl-5">
                              +{(dayTasks.length + dayVideos.length) - 4} more
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No scheduled items</p>
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
        <Card className="apple-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Open Tasks</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleAddTask()}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push("/dashboard/tasks")}
                  className="text-xs hover:bg-muted"
                >
                  View all
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {openTasks.slice(0, 5).map(task => (
                <div 
                  key={task.id} 
                  className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => router.push("/dashboard/tasks")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-sm font-medium truncate">{task.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs border", priorityColors[task.priority])}
                        >
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.status === "in-progress" && (
                      <div className="flex items-center gap-1.5 text-blue-600 text-xs">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                        <span>In Progress</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {openTasks.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No open tasks</p>
                </div>
              )}
              
              {openTasks.length > 5 && (
                <p className="text-xs text-center text-muted-foreground pt-2">
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