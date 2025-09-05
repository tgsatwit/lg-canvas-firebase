"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'inactive' | 'cancelled';
  created_at: string;
  updated_at: string;
  plan: string;
  product: {
    name: string;
    id: string;
  };
}

interface MemberStats {
  total: number;
  active: number;
  cancelled: number;
  thisWeek: {
    joined: number;
    cancelled: number;
  };
}

interface MembersResponse {
  customers: Member[];
  stats: MemberStats;
  pagination: {
    size: number;
    number: number;
    total: number;
  };
}

interface MembersTabProps {
  searchQuery: string;
}

export function MembersTab({ searchQuery }: MembersTabProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<MemberStats>({
    total: 0,
    active: 0,
    cancelled: 0,
    thisWeek: { joined: 0, cancelled: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'cancelled' | 'expired' | 'disabled' | 'paused' | 'refunded'>('enabled');
  const [timeFilter, setTimeFilter] = useState<'all' | 'joined7days' | 'cancelled7days'>('all');
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [isCachedData, setIsCachedData] = useState(false);
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchMembers();
  }, [statusFilter, searchQuery, timeFilter]);

  useEffect(() => {
    fetchStatusBreakdown();
  }, []); // Only fetch breakdown once on mount

  const fetchStatusBreakdown = async () => {
    try {
      const response = await fetch('/api/vimeo-ott/status-breakdown', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatusBreakdown(data.breakdown);
      }
    } catch (err) {
      console.warn('Failed to fetch status breakdown:', err);
    }
  };

  const fetchMembers = async (clearCache = false) => {
    try {
      setLoading(true);
      setError(null);

      // Clear cache if requested
      if (clearCache) {
        try {
          await fetch('/api/vimeo-ott/members/cache', { method: 'DELETE' });
          console.log('Cache cleared successfully');
          // Also refresh status breakdown when force refreshing
          fetchStatusBreakdown();
        } catch (cacheError) {
          console.warn('Failed to clear cache:', cacheError);
        }
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (timeFilter !== 'all') params.append('timeFilter', timeFilter);
      if (searchQuery.trim()) params.append('query', searchQuery);

      const fetchStartTime = Date.now();
      const response = await fetch(`/api/vimeo-ott/members?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.status} ${response.statusText}`);
      }

      const data: MembersResponse = await response.json();
      const fetchEndTime = Date.now();
      
      // Determine if this was likely cached data (very fast response < 100ms)
      const responseTime = fetchEndTime - fetchStartTime;
      setIsCachedData(responseTime < 100);
      setLastFetchTime(new Date());
      
      setMembers(data.customers);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin border-t-pink-500"></div>
        </div>
        <div className="text-gray-600">Loading PBL Online Subscription members...</div>
        <div className="text-sm text-gray-500">Filtering from all customer pages</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="text-red-600 font-medium mb-2">Error loading members</div>
        <div className="text-red-600 text-sm mb-4">{error}</div>
        <Button 
          onClick={() => fetchMembers()}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Tiles */}
      <div className="grid grid-cols-4 gap-6">
        <div 
          className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200",
            timeFilter === 'all' ? "ring-2 ring-pink-500/20 border-pink-200" : "hover:shadow-md"
          )}
          onClick={() => setTimeFilter('all')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-lg text-gray-600">
              {stats.total}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="text-xs text-gray-500">{stats.active} active</div>
          </div>
        </div>

        <div 
          className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200",
            timeFilter === 'joined7days' ? "ring-2 ring-green-500/20 border-green-200" : "hover:shadow-md"
          )}
          onClick={() => setTimeFilter('joined7days')}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
              style={{
                background: `linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(21, 128, 61, 0.9) 100%)`
              }}
            >
              {stats.thisWeek.joined}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeek.joined}</p>
              <p className="text-sm text-gray-600">Joined This Week</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
              New subscribers
            </Badge>
          </div>
        </div>

        <div 
          className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200",
            timeFilter === 'cancelled7days' ? "ring-2 ring-red-500/20 border-red-200" : "hover:shadow-md"
          )}
          onClick={() => setTimeFilter('cancelled7days')}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
              style={{
                background: `linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)`
              }}
            >
              {stats.thisWeek.cancelled}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeek.cancelled}</p>
              <p className="text-sm text-gray-600">Cancelled This Week</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
              Churned users
            </Badge>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
              style={{
                background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
              }}
            >
              %
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-600">Active Rate</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full"
                style={{ 
                  width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%`,
                  background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Member Filters</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => fetchMembers(false)}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => fetchMembers(true)}
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
              title="Clear cache and refresh from API"
            >
              Force Refresh
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
            {(['enabled', 'cancelled', 'expired', 'disabled', 'paused', 'refunded'] as const).map((filter) => (
              <Button
                key={filter}
                variant={statusFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  "rounded-xl transition-all duration-200",
                  statusFilter === filter
                    ? "text-white shadow-sm"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
                style={statusFilter === filter ? {
                  background: filter === 'enabled' 
                    ? `linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(21, 128, 61, 0.9) 100%)`
                    : filter === 'cancelled' || filter === 'expired' || filter === 'disabled'
                    ? `linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)`
                    : `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                } : {}}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                {statusBreakdown[filter] ? ` (${statusBreakdown[filter]})` : ''}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Time Period:</span>
            {(['all', 'joined7days', 'cancelled7days'] as const).map((filter) => (
              <Button
                key={filter}
                variant={timeFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter(filter)}
                className={cn(
                  "rounded-xl transition-all duration-200",
                  timeFilter === filter
                    ? "text-white shadow-sm"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
                style={timeFilter === filter ? {
                  background: filter === 'joined7days' 
                    ? `linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(21, 128, 61, 0.9) 100%)`
                    : filter === 'cancelled7days'
                    ? `linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)`
                    : `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                } : {}}
              >
                {filter === 'all' ? 'All Time' : 
                 filter === 'joined7days' ? 'Joined This Week' : 
                 'Cancelled This Week'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {timeFilter === 'joined7days' ? 'Members Joined This Week' : 
               timeFilter === 'cancelled7days' ? 'Members Cancelled This Week' : 
               `PBL Online Subscription - ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`} ({members.length})
            </h3>
            <div className="flex items-center gap-3">
              {members.length > 50 && (
                <div className="text-sm text-gray-500">
                  Filtered from all customers
                </div>
              )}
              {lastFetchTime && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {isCachedData ? (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      Cached data
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      Fresh from API
                    </div>
                  )}
                  <span>•</span>
                  <span>{lastFetchTime.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {members.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? 'No members found matching your search.' : 'No members found.'}
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0 mr-3">
                          {member.name ? member.name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {member.name || member.email.split('@')[0]}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate max-w-xs">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(member.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 capitalize">{member.plan}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={cn("text-xs", getStatusBadgeColor(member.status))}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="outline" size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50 text-xs px-3 py-1">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}