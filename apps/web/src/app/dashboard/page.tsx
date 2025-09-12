"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTaskContext } from "./tasks/context/task-context";
import { useVideos } from "@/hooks/use-videos";
import { useSocialApi } from "@/hooks/use-social-api";
import { useUserContext } from "@/contexts/UserContext";
import { useCustomerStats } from "@/hooks/use-customer-stats";
import { useInvoiceStats } from "@/hooks/use-invoice-stats";
import { useEmailStats } from "@/hooks/use-email-stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { board } = useTaskContext();
  const { videos, loading: videosLoading } = useVideos();
  const { getStats } = useSocialApi();
  const { user } = useUserContext();
  const customerStats = useCustomerStats();
  const invoiceStats = useInvoiceStats();
  const emailStats = useEmailStats();
  const stats = getStats();
  const [searchQuery, setSearchQuery] = useState("");

  // Get open tasks (todo and in-progress)
  const openTasks = Object.values(board.tasks).filter(
    task => task.status === "todo" || task.status === "in-progress"
  );

  // Get task ownership breakdown
  const taskStats = React.useMemo(() => {
    const allTasks = Object.values(board.tasks);
    const ownedTasks = allTasks.filter(task => task.createdBy === user?.id);
    const assignedTasks = allTasks.filter(task => task.assignedTo === user?.id);
    const openOwnedTasks = ownedTasks.filter(task => task.status === "todo" || task.status === "in-progress");
    const openAssignedTasks = assignedTasks.filter(task => task.status === "todo" || task.status === "in-progress");
    
    return {
      total: allTasks.length,
      owned: ownedTasks.length,
      assigned: assignedTasks.length,
      openOwned: openOwnedTasks.length,
      openAssigned: openAssignedTasks.length,
      highPriorityOwned: openOwnedTasks.filter(t => t.priority === "high").length,
      highPriorityAssigned: openAssignedTasks.filter(t => t.priority === "high").length,
    };
  }, [board.tasks, user?.id]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/chat?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-6">
        <div className="w-full max-w-none">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {getGreeting()}, {user?.displayName || user?.name || user?.email?.split('@')[0] || 'User'}! 👋
              </h1>
              <p className="text-gray-600">Here's what's happening with your content today</p>
            </div>
            
            {/* Global Search */}
            <div className="w-96">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search or ask AI anything..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 bg-white border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 pl-4"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white px-4 rounded-xl"
                    style={{
                      background: `
                        linear-gradient(135deg, 
                          rgba(236, 72, 153, 0.9) 0%,
                          rgba(139, 92, 246, 0.9) 100%
                        )
                      `,
                    }}
                  >
                    AI
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-5 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-lg text-gray-600">
                  {openTasks.length}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{openTasks.length}</p>
                  <p className="text-sm text-gray-600">Active Tasks</p>
                </div>
              </div>
              {(taskStats.highPriorityOwned + taskStats.highPriorityAssigned) > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <Badge className="text-xs bg-pink-100 text-pink-700 border-pink-200">
                    {taskStats.highPriorityOwned + taskStats.highPriorityAssigned} high priority
                  </Badge>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-lg text-gray-600">
                  {totalUnansweredComments}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalUnansweredComments}</p>
                  <p className="text-sm text-gray-600">Pending Replies</p>
                </div>
              </div>
              {totalUnansweredComments > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                  onClick={() => router.push("/dashboard/social-monitor")}
                >
                  Review Comments
                </Button>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-lg text-gray-600">
                  {videos.length}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{videos.length}</p>
                  <p className="text-sm text-gray-600">Total Videos</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{videoStatusBreakdown.published} Published</span>
                  <span className="text-gray-600">{videoStatusBreakdown.draft} Drafts</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-lg text-gray-600">
                  {customerStats.loading ? '...' : customerStats.totalMembers}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {customerStats.loading ? 'Loading...' : customerStats.totalMembers.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total Customers</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">
                    {customerStats.loading ? '...' : customerStats.vimeoActiveMembers} Active
                  </span>
                  <span className="text-gray-600">
                    {customerStats.loading ? '...' : customerStats.newThisMonth} New This Month
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-lg text-gray-600">
                  {emailStats.loading ? '...' : emailStats.totalDrafts}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {emailStats.loading ? 'Loading...' : emailStats.totalDrafts}
                  </p>
                  <p className="text-sm text-gray-600">Email Campaigns</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {emailStats.loading ? '...' : emailStats.completedCampaigns} Completed
                  </span>
                  <span className="text-gray-600">
                    {emailStats.loading ? '...' : `${(emailStats.avgOpenRate * 100).toFixed(0)}%`} Open Rate
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-lg text-gray-600">
                  {invoiceStats.loading ? '...' : '$'}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {invoiceStats.loading ? 'Loading...' : `$${invoiceStats.currentMonthAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
                  </p>
                  <p className="text-sm text-gray-600">This Month Expenses</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {invoiceStats.loading ? '...' : invoiceStats.totalInvoices} Total Items
                  </span>
                  <span className="text-green-600 font-medium">
                    {invoiceStats.loading ? '...' : `$${invoiceStats.currentMonthClaimable.toLocaleString(undefined, {maximumFractionDigits: 0})}`} Claimable
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-8">
          {/* Left Column - Today's Priority */}
          <div className="col-span-1 space-y-6">
            {/* Priority Tasks */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(236, 72, 153, 0.9) 0%,
                        rgba(139, 92, 246, 0.9) 100%
                      )
                    `,
                  }}
                >
                  !
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Priority Today</h2>
              </div>
              
              <div className="space-y-4">
                {openTasks.slice(0, 3).map(task => (
                  <div 
                    key={task.id}
                    className="p-4 bg-gray-50 rounded-xl hover:bg-pink-50 cursor-pointer transition-colors"
                    onClick={() => router.push("/dashboard/tasks")}
                  >
                    <h3 className="font-medium text-gray-900 mb-2">{task.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={cn(
                          "text-xs",
                          task.priority === 'high' 
                            ? 'bg-pink-100 text-pink-700 border-pink-200' 
                            : 'bg-purple-100 text-purple-700 border-purple-200'
                        )}
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
                ))}
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-pink-200 text-pink-700 hover:bg-pink-50"
                  onClick={() => router.push("/dashboard/tasks")}
                >
                  View All Tasks →
                </Button>
              </div>
            </div>

            {/* AI Assistant */}
            <div 
              className="rounded-2xl p-6 border border-pink-100"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(236, 72, 153, 0.05) 0%,
                    rgba(139, 92, 246, 0.05) 100%
                  )
                `,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(236, 72, 153, 0.9) 0%,
                        rgba(139, 92, 246, 0.9) 100%
                      )
                    `,
                  }}
                >
                  AI
                </div>
                <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
              </div>
              
              <div className="space-y-3">
                <div className="p-4 bg-white/60 rounded-xl">
                  <h3 className="font-medium text-gray-900 mb-2">Content Ideas</h3>
                  <p className="text-sm text-gray-700 mb-3">Get fresh ideas for your next video</p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    onClick={() => router.push("/dashboard/chat?prompt=generate content ideas")}
                  >
                    Generate Ideas
                  </Button>
                </div>
                
                <div className="p-4 bg-white/60 rounded-xl">
                  <h3 className="font-medium text-gray-900 mb-2">Customer Overview</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    {customerStats.loading ? 'Loading...' : `${customerStats.vimeoActiveMembers} active, ${customerStats.mailchimpSubscribers} subscribers`}
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    onClick={() => router.push("/dashboard/customers")}
                  >
                    Manage Customers
                  </Button>
                </div>
                
                <div className="p-4 bg-white/60 rounded-xl">
                  <h3 className="font-medium text-gray-900 mb-2">Financial Summary</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    {invoiceStats.loading ? 'Loading...' : `$${invoiceStats.totalAmount.toLocaleString()} total expenses`}
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    onClick={() => router.push("/dashboard/invoices")}
                  >
                    View Invoices
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Content Pipeline */}
          <div className="col-span-2 space-y-6">
            {/* Content Pipeline */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{
                      background: `
                        linear-gradient(135deg, 
                          rgba(139, 92, 246, 0.9) 0%,
                          rgba(236, 72, 153, 0.9) 100%
                        )
                      `,
                    }}
                  >
                    P
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Email Campaigns</h2>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                  onClick={() => router.push("/dashboard/email-marketing")}
                >
                  + New Campaign
                </Button>
              </div>

              {/* Email Campaign Stages */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-2 font-bold text-gray-600">
                    D
                  </div>
                  <p className="font-medium text-gray-900">Drafts</p>
                  <p className="text-sm text-gray-500">
                    {emailStats.loading ? '...' : `${emailStats.totalDrafts - emailStats.completedCampaigns}`} drafts
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-2 font-bold text-gray-600">
                    R
                  </div>
                  <p className="font-medium text-gray-900">Ready</p>
                  <p className="text-sm text-gray-500">
                    {emailStats.loading ? '...' : emailStats.completedCampaigns} completed
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-2 font-bold text-gray-600">
                    S
                  </div>
                  <p className="font-medium text-gray-900">Sent</p>
                  <p className="text-sm text-gray-500">
                    {emailStats.loading ? '...' : emailStats.sentCampaigns} sent
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-2 font-bold text-gray-600">
                    📊
                  </div>
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-sm text-gray-500">
                    {emailStats.loading ? '...' : `${(emailStats.avgOpenRate * 100).toFixed(0)}%`} avg open
                  </p>
                </div>
              </div>

              {/* Recent Email Campaigns */}
              <div className="space-y-3">
                {emailStats.recentDrafts.length > 0 ? (
                  emailStats.recentDrafts.slice(0, 2).map((draft) => (
                    <div key={draft.id} className="p-4 border border-gray-100 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{draft.title}</h3>
                          <p className="text-sm text-gray-600">
                            {draft.status} • {new Date(draft.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn(
                            "text-xs",
                            draft.status === 'completed' 
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : draft.status === 'sent'
                              ? 'bg-blue-100 text-blue-700 border-blue-200' 
                              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          )}>
                            {draft.status}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-gray-200 hover:bg-gray-50"
                            onClick={() => router.push("/dashboard/email-marketing")}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 border border-gray-100 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">No Recent Email Campaigns</h3>
                        <p className="text-sm text-gray-600">Create your first email campaign</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-gray-200 hover:bg-gray-50"
                          onClick={() => router.push("/dashboard/email-marketing")}
                        >
                          Create
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button variant="ghost" className="w-full mt-4 text-purple-700 hover:bg-purple-50" onClick={() => router.push("/dashboard/email-marketing")}>
                View All Campaigns →
              </Button>
            </div>

            {/* Weekly Schedule */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{
                      background: `
                        linear-gradient(135deg, 
                          rgba(236, 72, 153, 0.9) 0%,
                          rgba(139, 92, 246, 0.9) 100%
                        )
                      `,
                    }}
                  >
                    W
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">This Week</h2>
                </div>
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">
                  Filter
                </Button>
              </div>

              <div className="space-y-3">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, index) => {
                  const today = new Date().getDay();
                  const isToday = today === index + 1;
                  
                  return (
                    <div key={day} className={cn(
                      "p-4 rounded-xl border transition-colors",
                      isToday ? "border-pink-200" : "bg-gray-50 border-gray-100"
                    )} style={isToday ? {
                      background: `
                        linear-gradient(135deg, 
                          rgba(236, 72, 153, 0.05) 0%,
                          rgba(139, 92, 246, 0.05) 100%
                        )
                      `
                    } : {}}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "font-medium",
                            isToday ? "text-pink-900" : "text-gray-900"
                          )}>
                            {day}
                          </span>
                          {isToday && <Badge className="bg-pink-100 text-pink-700 border-pink-200">Today</Badge>}
                        </div>
                        <span className="text-sm text-gray-500">2 items</span>
                      </div>
                      
                      <div className="space-y-2">
                        {day === "Monday" && (
                          <>
                            <div className="text-sm text-gray-700">• Weekly email campaign planning</div>
                            <div className="text-sm text-gray-700">• Review customer feedback</div>
                          </>
                        )}
                        {day === "Tuesday" && (
                          <>
                            <div className="text-sm text-gray-700">• Process invoice receipts</div>
                            <div className="text-sm text-gray-700">• Update customer database</div>
                          </>
                        )}
                        {day === "Wednesday" && (
                          <>
                            <div className="text-sm text-gray-700">• Email marketing campaign review</div>
                            <div className="text-sm text-gray-700">• Financial report preparation</div>
                          </>
                        )}
                        {day === "Thursday" && (
                          <>
                            <div className="text-sm text-gray-700">• Tax document organization</div>
                            <div className="text-sm text-gray-700">• Customer outreach calls</div>
                          </>
                        )}
                        {day === "Friday" && (
                          <>
                            <div className="text-sm text-gray-700">• Weekly business review</div>
                            <div className="text-sm text-gray-700">• Send newsletter campaign</div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}