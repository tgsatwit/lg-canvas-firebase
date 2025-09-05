"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  email: string;
  name?: string;
  status: 'enabled' | 'cancelled' | 'expired' | 'disabled' | 'paused' | 'refunded';
  created_at: string;
  updated_at: string;
  plan: string;
  product?: string;
  joinedThisWeek?: boolean;
  cancelledThisWeek?: boolean;
}

interface MembersTabProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function MembersTab({ searchQuery, onSearchChange }: MembersTabProps) {
  // Data state
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state - Default to PBL Online + enabled
  const [statusFilter, setStatusFilter] = useState<'enabled' | 'cancelled' | 'expired' | 'disabled' | 'paused' | 'refunded' | 'all'>('enabled');
  const [productFilter, setProductFilter] = useState<string>('PBL Online Subscription');
  const [timeFilter, setTimeFilter] = useState<'all' | 'joined7days' | 'cancelled7days'>('all');
  
  // Collapsible filters state
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  // Sync status
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  // Fetch members from Firebase on mount
  useEffect(() => {
    fetchMembersFromFirebase();
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/vimeo-ott/sync', {
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

  const fetchMembersFromFirebase = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/vimeo-ott/firebase-members', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.members) {
        setAllMembers(data.members);
        console.log(`Loaded ${data.members.length} members from Firebase`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const syncWithVimeoOtt = async () => {
    try {
      setSyncing(true);
      setError(null);

      const response = await fetch('/api/vimeo-ott/sync', {
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
        console.log('Sync successful:', data.message);
        setLastSyncTime(new Date());
        // Refresh members after sync
        await fetchMembersFromFirebase();
        await fetchSyncStatus();
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (err) {
      console.error('Error syncing:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  // Client-side filtering
  const filteredMembers = useMemo(() => {
    let filtered = allMembers;

    // Product filter
    if (productFilter && productFilter !== 'all') {
      filtered = filtered.filter(m => m.product === productFilter);
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    // Time filter
    if (timeFilter === 'joined7days') {
      filtered = filtered.filter(m => m.joinedThisWeek === true);
    } else if (timeFilter === 'cancelled7days') {
      filtered = filtered.filter(m => m.cancelledThisWeek === true);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.email.toLowerCase().includes(query) ||
        m.name?.toLowerCase().includes(query) ||
        m.plan.toLowerCase().includes(query) ||
        m.product?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allMembers, statusFilter, productFilter, timeFilter, searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, productFilter, timeFilter, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageMembers = filteredMembers.slice(startIndex, endIndex);

  // Calculate stats from actual data
  const stats = useMemo(() => {
    const pblOnlineMembers = allMembers.filter(m => m.product === 'PBL Online Subscription');
    const allProducts = [...new Set(allMembers.map(m => m.product).filter(Boolean))];
    
    return {
      total: allMembers.length,
      byStatus: {
        enabled: allMembers.filter(m => m.status === 'enabled').length,
        cancelled: allMembers.filter(m => m.status === 'cancelled').length,
        expired: allMembers.filter(m => m.status === 'expired').length,
        disabled: allMembers.filter(m => m.status === 'disabled').length,
        paused: allMembers.filter(m => m.status === 'paused').length,
        refunded: allMembers.filter(m => m.status === 'refunded').length,
      },
      byProduct: Object.fromEntries(
        allProducts.map(product => [
          product,
          {
            total: allMembers.filter(m => m.product === product).length,
            enabled: allMembers.filter(m => m.product === product && m.status === 'enabled').length
          }
        ])
      ),
      pblOnline: {
        total: pblOnlineMembers.length,
        enabled: pblOnlineMembers.filter(m => m.status === 'enabled').length
      },
      active: allMembers.filter(m => m.status === 'enabled').length,
      thisWeek: {
        joined: allMembers.filter(m => m.joinedThisWeek === true).length,
        cancelled: allMembers.filter(m => m.cancelledThisWeek === true).length
      },
      allProducts
    };
  }, [allMembers]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'enabled':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled':
      case 'expired':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'paused':
      case 'disabled':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'refunded':
        return 'bg-orange-100 text-orange-700 border-orange-200';
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
        <div className="text-gray-600">Loading members from Firebase...</div>
      </div>
    );
  }

  if (error && !allMembers.length) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="text-red-600 font-medium mb-2">Error loading members</div>
        <div className="text-red-600 text-sm mb-4">{error}</div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchMembersFromFirebase}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
          <Button 
            onClick={syncWithVimeoOtt}
            size="sm"
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            Sync from Vimeo OTT
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Tiles */}
      <div className="grid grid-cols-5 gap-4">
        {/* PBL Online Subscription - Persistent Tile */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 shadow-sm border-2 border-pink-200">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
              style={{
                background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
              }}
            >
              {stats.pblOnline.enabled}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pblOnline.enabled}</p>
              <p className="text-sm text-gray-600 font-medium">PBL Online Active</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-pink-100">
            <div className="text-xs text-pink-600 font-medium">{stats.pblOnline.total} total PBL Online</div>
          </div>
        </div>
        
        <div 
          className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200",
            timeFilter === 'all' && statusFilter === 'all' && productFilter === 'all' ? "ring-2 ring-gray-400/20 border-gray-300" : "hover:shadow-md"
          )}
          onClick={() => {
            setTimeFilter('all');
            setStatusFilter('all');
            setProductFilter('all');
          }}
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
            onClick={syncWithVimeoOtt}
            disabled={syncing}
            size="sm"
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 text-xs"
          >
            {syncing ? 'Syncing...' : 'Sync from OTT'}
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6">
          {/* Search - Always Visible */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search by name, email, plan, or product..."
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
          <div className="px-6 pb-6 space-y-4 border-t border-gray-100">
          {/* Product Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Product</label>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={productFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setProductFilter('all')}
                className={cn(
                  "rounded-xl transition-all duration-200",
                  productFilter === 'all'
                    ? "text-white shadow-sm"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
                style={productFilter === 'all' ? {
                  background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                } : {}}
              >
                All Products ({stats.total})
              </Button>
              {stats.allProducts.map((product) => (
                <Button
                  key={product}
                  variant={productFilter === product ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setProductFilter(product || '')}
                  className={cn(
                    "rounded-xl transition-all duration-200",
                    productFilter === product
                      ? "text-white shadow-sm"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                  style={productFilter === product ? {
                    background: product === 'PBL Online Subscription'
                      ? `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                      : `linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(147, 51, 234, 0.9) 100%)`
                  } : {}}
                >
                  {product || 'Unknown'} ({product ? stats.byProduct[product]?.total || 0 : 0})
                </Button>
              ))}
            </div>
          </div>
          
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
                All Statuses ({stats.total})
              </Button>
              {(['enabled', 'cancelled', 'expired', 'disabled', 'paused', 'refunded'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "rounded-xl transition-all duration-200",
                    statusFilter === status
                      ? "text-white shadow-sm"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                  style={statusFilter === status ? {
                    background: status === 'enabled' 
                      ? `linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(21, 128, 61, 0.9) 100%)`
                      : status === 'cancelled' || status === 'expired'
                      ? `linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)`
                      : `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                  } : {}}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {stats.byStatus[status] > 0 && ` (${stats.byStatus[status]})`}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Time Period</label>
            <div className="flex items-center gap-2">
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
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {timeFilter === 'joined7days' ? 'Members Joined This Week' : 
             timeFilter === 'cancelled7days' ? 'Members Cancelled This Week' : 
             productFilter === 'all' && statusFilter === 'all' ? 'All Members' :
             productFilter !== 'all' && statusFilter === 'all' ? `${productFilter} Members` :
             productFilter === 'all' && statusFilter !== 'all' ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Members` :
             `${productFilter} - ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Members`} ({filteredMembers.length})
          </h3>
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1}–{Math.min(endIndex, filteredMembers.length)} of {filteredMembers.length}
          </div>
        </div>
        
        {filteredMembers.length === 0 ? (
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
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPageMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0 mr-3">
                          {member.name ? member.name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.name || member.email.split('@')[0]}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(member.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.product || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 capitalize">{member.plan}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={cn("text-xs", getStatusBadgeColor(member.status))}>
                        {member.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {filteredMembers.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
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
                disabled={currentPage === totalPages}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}