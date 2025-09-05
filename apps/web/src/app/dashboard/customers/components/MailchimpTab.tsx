"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MailchimpList, MailchimpMember, MailchimpSyncStatus } from '@opencanvas/shared';

interface MailchimpTabProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function MailchimpTab({ searchQuery, onSearchChange }: MailchimpTabProps) {
  // Data state
  const [lists, setLists] = useState<MailchimpList[]>([]);
  const [members, setMembers] = useState<MailchimpMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalMembers, setTotalMembers] = useState(0);
  const [stats, setStats] = useState({ subscribed: 0, unsubscribed: 0, cleaned: 0, pending: 0 });
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'all'>('all');
  const [listFilter, setListFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Sync status
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<MailchimpSyncStatus | null>(null);

  // Get unique tags from current members
  const uniqueTags = [...new Set(members.flatMap(m => m.tags || []))].sort();

  // Fetch data from Firebase on mount
  useEffect(() => {
    fetchDataFromFirebase();
    fetchSyncStatus();
  }, []);

  // Refetch data when filters change
  useEffect(() => {
    if (lists.length > 0) { // Only refetch if we have initial data
      fetchDataFromFirebase();
    }
  }, [searchQuery, listFilter, statusFilter, tagFilter, currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [statusFilter, listFilter, tagFilter, searchQuery]);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/mailchimp/sync-status', {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.status);
        if (data.status?.lastSync) {
          setLastSyncTime(new Date(data.status.lastSync));
        }
      }
    } catch (err) {
      console.error('Error fetching sync status:', err);
    }
  };

  const fetchDataFromFirebase = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters for server-side filtering and pagination
      const params = new URLSearchParams({
        source: 'firebase',
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(listFilter !== 'all' && { list: listFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(tagFilter !== 'all' && { tag: tagFilter }),
      });

      const response = await fetch(`/api/mailchimp/lists?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setLists(data.lists || []);
        setMembers(data.members || []);
        setTotalMembers(data.total_members || 0);
        setStats(data.stats || { subscribed: 0, unsubscribed: 0, cleaned: 0, pending: 0 });
        
        // Update pagination state
        if (data.pagination) {
          setTotalPages(data.pagination.total_pages);
          setHasMore(data.pagination.has_more);
        }
        
        console.log(`🚀 Loaded ${data.members?.length || 0} members (page ${currentPage}/${data.pagination?.total_pages || 1})`);
        
        if (data.last_sync) {
          setLastSyncTime(new Date(data.last_sync));
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const syncWithMailchimp = async () => {
    try {
      setSyncing(true);
      setError(null);

      const response = await fetch('/api/mailchimp/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log('✅ Sync successful:', data.message);
        setLastSyncTime(new Date());
        // Refresh data after sync
        await fetchDataFromFirebase();
        await fetchSyncStatus();
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (err) {
      console.error('❌ Error syncing:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'subscribed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'unsubscribed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'cleaned':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'mixed':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading && members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin border-t-pink-500"></div>
        </div>
        <div className="text-gray-600">Loading Mailchimp audience data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Subscribed Tile */}
        <div 
          className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200",
            statusFilter === 'subscribed' ? "ring-2 ring-green-500/20 border-green-200" : "hover:shadow-md"
          )}
          onClick={() => setStatusFilter(statusFilter === 'subscribed' ? 'all' : 'subscribed')}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
              style={{
                background: `linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(21, 128, 61, 0.9) 100%)`
              }}
            >
              {stats.subscribed}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.subscribed.toLocaleString()}</p>
              <p className="text-sm text-gray-600 font-medium">Subscribed</p>
            </div>
          </div>
        </div>

        {/* Unsubscribed Tile */}
        <div 
          className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200",
            statusFilter === 'unsubscribed' ? "ring-2 ring-red-500/20 border-red-200" : "hover:shadow-md"
          )}
          onClick={() => setStatusFilter(statusFilter === 'unsubscribed' ? 'all' : 'unsubscribed')}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
              style={{
                background: `linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)`
              }}
            >
              {stats.unsubscribed}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.unsubscribed.toLocaleString()}</p>
              <p className="text-sm text-gray-600 font-medium">Unsubscribed</p>
            </div>
          </div>
        </div>

        {/* Total Members Tile */}
        <div 
          className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200",
            statusFilter === 'all' && listFilter === 'all' ? "ring-2 ring-gray-400/20 border-gray-300" : "hover:shadow-md"
          )}
          onClick={() => {
            setStatusFilter('all');
            setListFilter('all');
            setTagFilter('all');
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-lg text-gray-600">
              {totalMembers}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalMembers.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
          </div>
        </div>

        {/* Lists Tile */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
              style={{
                background: `linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)`
              }}
            >
              {lists.length}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{lists.length}</p>
              <p className="text-sm text-gray-600">Total Lists</p>
            </div>
          </div>
        </div>

        {/* Sync Status Tile */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-lg text-gray-600">
              ⟲
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">Sync Status</p>
              <p className="text-xs text-gray-500">
                {lastSyncTime ? (
                  <>Last: {lastSyncTime.toLocaleDateString()}</>
                ) : (
                  <>No sync data</>
                )}
              </p>
            </div>
          </div>
          <Button 
            onClick={syncWithMailchimp}
            disabled={syncing}
            size="sm"
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 text-xs"
          >
            {syncing ? 'Syncing...' : 'Sync Mailchimp'}
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6">
          {/* Search - Always Visible */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search by name, email, or tag..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-12 bg-white border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            />
          </div>
          
          {/* Filters Toggle */}
          <div 
            className="cursor-pointer flex items-center justify-between py-2"
            onClick={() => setFiltersCollapsed(!filtersCollapsed)}
          >
            <div className="text-sm font-medium text-gray-700">Advanced Filters</div>
            <div className="text-gray-500 font-mono text-sm">
              {filtersCollapsed ? '+' : '−'}
            </div>
          </div>
        </div>
        
        {!filtersCollapsed && (
          <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className={cn(
                    "rounded-xl transition-all duration-200",
                    statusFilter === 'all'
                      ? "text-white shadow-sm"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                  style={statusFilter === 'all' ? {
                    background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                  } : {}}
                >
                  All Status
                </Button>
                <Button
                  variant={statusFilter === 'subscribed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('subscribed')}
                  className={cn(
                    "rounded-xl",
                    statusFilter === 'subscribed' ? "bg-green-500 text-white" : "border-gray-200"
                  )}
                >
                  Subscribed
                </Button>
                <Button
                  variant={statusFilter === 'unsubscribed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('unsubscribed')}
                  className={cn(
                    "rounded-xl",
                    statusFilter === 'unsubscribed' ? "bg-red-500 text-white" : "border-gray-200"
                  )}
                >
                  Unsubscribed
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                  className={cn(
                    "rounded-xl",
                    statusFilter === 'pending' ? "bg-yellow-500 text-white" : "border-gray-200"
                  )}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'cleaned' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('cleaned')}
                  className={cn(
                    "rounded-xl",
                    statusFilter === 'cleaned' ? "bg-orange-500 text-white" : "border-gray-200"
                  )}
                >
                  Cleaned
                </Button>
              </div>
            </div>

            {/* List Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">List</label>
              <select
                value={listFilter}
                onChange={(e) => setListFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm w-full max-w-xs"
              >
                <option value="all">All Lists</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.stats.member_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            {uniqueTags.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm w-full max-w-xs"
                >
                  <option value="all">All Tags</option>
                  {uniqueTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {members.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? 'No members found matching your search.' : 'No members found with selected filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lists
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.email_address} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0 mr-3">
                          {member.full_name ? 
                            member.full_name.charAt(0).toUpperCase() : 
                            member.email_address.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.full_name || member.first_name || member.email_address.split('@')[0]}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email_address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {member.list_details && member.list_details.length > 0 ? (
                          <div className="space-y-1">
                            {member.list_details.slice(0, 2).map((list, idx) => (
                              <div key={idx} className="text-xs text-gray-600">
                                {list.list_name}
                              </div>
                            ))}
                            {member.list_details.length > 2 && (
                              <div className="text-xs text-gray-400">
                                +{member.list_details.length - 2} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {member.tags && member.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.tags.slice(0, 3).map((tag, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 border-purple-200"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {member.tags.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border-gray-200"
                            >
                              +{member.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={cn("text-xs", getStatusBadgeColor(member.overall_status))}>
                        {member.overall_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(member.last_activity_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-900">
                          {member.avg_member_rating ? member.avg_member_rating.toFixed(1) : '0'} ⭐
                        </div>
                        {member.is_vip && (
                          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                            VIP
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Previous
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-8 h-8 p-0",
                        currentPage === pageNum
                          ? "text-white"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      )}
                      style={currentPage === pageNum ? {
                        background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                      } : {}}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || loading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-pink-500 rounded-full animate-spin"></div>
            Loading...
          </div>
        </div>
      )}
    </div>
  );
}