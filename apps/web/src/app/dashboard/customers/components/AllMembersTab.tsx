"use client";

import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Consolidated member interface
interface ConsolidatedMember {
  email: string;
  name?: string;
  // Vimeo OTT status - null means not a member
  vimeoStatus: 'enabled' | 'cancelled' | 'expired' | 'disabled' | 'paused' | 'refunded' | 'never a member' | null;
  vimeoJoinDate?: string;
  vimeoPlan?: string;
  vimeoProduct?: string;
  // MailChimp status - null means not a subscriber  
  mailchimpStatus: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'never subscribed' | null;
  mailchimpLists?: string[];
  mailchimpTags?: string[];
  mailchimpRating?: number;
  lastActivity?: string;
  source: 'vimeo' | 'mailchimp' | 'both';
}

interface TagFixAction {
  email: string;
  action: 'add' | 'remove';
  tag: string;
  reason: string;
}

interface ListAddAction {
  email: string;
  listId: string;
  listName: string;
  reason: string;
}

interface AllMembersTabProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export interface AllMembersTabRef {
  handleSyncAndFixAll: () => Promise<void>;
  syncing: boolean;
  fixing: boolean;
}

export const AllMembersTab = forwardRef<AllMembersTabRef, AllMembersTabProps>(
  ({ searchQuery, onSearchChange }, ref) => {
  // Data state
  const [allMembers, setAllMembers] = useState<ConsolidatedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state - Default to PBL Online Active members
  const [vimeoStatusFilter, setVimeoStatusFilter] = useState<'all' | 'pbl-online-active' | 'members' | 'never a member' | 'enabled' | 'cancelled' | 'expired'>('pbl-online-active');
  const [mailchimpStatusFilter, setMailchimpStatusFilter] = useState<'all' | 'subscribers' | 'never subscribed' | 'subscribed' | 'unsubscribed'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'vimeo' | 'mailchimp' | 'both'>('all');
  const [tagMismatchFilter, setTagMismatchFilter] = useState<'all' | 'active-with-cancelled-tag' | 'inactive-with-current-tag'>('all');
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  // Sync status
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Expose sync function to parent component
  useImperativeHandle(ref, () => ({
    handleSyncAndFixAll,
    syncing,
    fixing,
  }));

  // Fetch consolidated members on mount
  useEffect(() => {
    fetchConsolidatedMembers();
  }, []);

  const fetchConsolidatedMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      // We'll need to create a new API endpoint for this
      const response = await fetch('/api/customers/consolidated-members', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch consolidated members: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.members) {
        setAllMembers(data.members);
        if (data.lastSync) {
          setLastSyncTime(new Date(data.lastSync));
        }
        console.log(`Loaded ${data.members.length} consolidated members`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching consolidated members:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const syncAllData = async () => {
    try {
      setSyncing(true);
      setError(null);

      // Trigger sync for both data sources
      const [vimeoResponse, mailchimpResponse] = await Promise.all([
        fetch('/api/vimeo-ott/sync', { method: 'POST' }),
        fetch('/api/mailchimp/lists', { method: 'POST' }),
      ]);

      const vimeoSuccess = vimeoResponse.ok;
      const mailchimpSuccess = mailchimpResponse.ok;

      if (vimeoSuccess && mailchimpSuccess) {
        setLastSyncTime(new Date());
        await fetchConsolidatedMembers();
      } else {
        const errors = [];
        if (!vimeoSuccess) errors.push('Vimeo OTT sync failed');
        if (!mailchimpSuccess) errors.push('MailChimp sync failed');
        throw new Error(errors.join(', '));
      }
    } catch (err) {
      console.error('Error syncing:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAndFixAll = async () => {
    try {
      // Step 1: Sync Vimeo OTT members
      setSyncing(true);
      setError(null);
      
      const vimeoResponse = await fetch('/api/vimeo-ott/sync', { method: 'POST' });
      if (!vimeoResponse.ok) {
        throw new Error('Failed to sync Vimeo OTT members');
      }
      
      // Step 2: Sync Mailchimp members
      const mailchimpResponse = await fetch('/api/mailchimp/lists', { method: 'POST' });
      if (!mailchimpResponse.ok) {
        throw new Error('Failed to sync MailChimp members');
      }
      
      setSyncing(false);
      
      // Step 3: Refresh consolidated data
      await fetchConsolidatedMembers();
      
      // Step 4: Fix all tag issues
      setFixing(true);
      
      // Find all members with tag issues and list issues
      const membersWithWrongTags = allMembers.filter(m => {
        const isPblOnlineActive = m.vimeoStatus === 'enabled' && m.vimeoProduct === 'PBL Online Subscription';
        const hasCancelledTag = m.mailchimpTags?.some(tag => 
          tag.toLowerCase().includes('cancelled') && tag.toLowerCase().includes('members')
        ) || false;
        return isPblOnlineActive && hasCancelledTag;
      });
      
      const membersWithOutdatedTags = allMembers.filter(m => {
        const isPblOnlineActive = m.vimeoStatus === 'enabled' && m.vimeoProduct === 'PBL Online Subscription';
        const hasCurrentTag = m.mailchimpTags?.some(tag => 
          tag.toLowerCase().includes('current') && tag.toLowerCase().includes('members')
        ) || false;
        return !isPblOnlineActive && hasCurrentTag;
      });

      // Find members with 'free workouts' product who need to be added to Free Workout list
      const membersNeedingFreeWorkoutList = allMembers.filter(m => {
        const hasFreeWorkoutsProduct = m.vimeoProduct && 
          m.vimeoProduct.toLowerCase().includes('free workouts');
        const isInFreeWorkoutList = m.mailchimpLists?.some(list => 
          list.toLowerCase().includes('free workout')
        ) || false;
        return hasFreeWorkoutsProduct && !isInFreeWorkoutList;
      });
      
      const actions: TagFixAction[] = [];
      
      // Process wrong tags
      membersWithWrongTags.forEach(member => {
        const cancelledTags = member.mailchimpTags?.filter(tag => 
          tag.toLowerCase().includes('cancelled') && tag.toLowerCase().includes('members')
        ) || [];
        
        cancelledTags.forEach(tag => {
          actions.push({
            email: member.email,
            action: 'remove',
            tag,
            reason: 'Member is active PBL Online subscriber'
          });
        });

        const hasCurrentTag = member.mailchimpTags?.some(tag => 
          tag.toLowerCase().includes('current') && tag.toLowerCase().includes('members')
        );
        
        if (!hasCurrentTag) {
          actions.push({
            email: member.email,
            action: 'add',
            tag: 'current members',
            reason: 'Member is active PBL Online subscriber'
          });
        }
      });
      
      // Process outdated tags
      membersWithOutdatedTags.forEach(member => {
        const currentTags = member.mailchimpTags?.filter(tag => 
          tag.toLowerCase().includes('current') && tag.toLowerCase().includes('members')
        ) || [];
        
        currentTags.forEach(tag => {
          actions.push({
            email: member.email,
            action: 'remove',
            tag,
            reason: 'Member is not an active PBL Online subscriber'
          });
        });

        const hasCancelledTag = member.mailchimpTags?.some(tag => 
          tag.toLowerCase().includes('cancelled') && tag.toLowerCase().includes('members')
        );
        
        if (!hasCancelledTag) {
          actions.push({
            email: member.email,
            action: 'add',
            tag: 'cancelled members',
            reason: 'Member is not an active PBL Online subscriber'
          });
        }
      });
      
      // Execute tag fixes if any
      if (actions.length > 0) {
        const fixResponse = await fetch('/api/mailchimp/fix-tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ actions }),
        });

        if (!fixResponse.ok) {
          throw new Error('Failed to fix tags');
        }
      }

      // Generate and execute list add actions for free workout members
      const listActions: ListAddAction[] = [];
      
      membersNeedingFreeWorkoutList.forEach(member => {
        listActions.push({
          email: member.email,
          listId: 'FREE_WORKOUT_LIST_ID', // This will be resolved by the API
          listName: 'Free Workout',
          reason: 'Member has free workouts product'
        });
      });

      // Execute list additions if any
      if (listActions.length > 0) {
        const listResponse = await fetch('/api/mailchimp/add-to-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ actions: listActions }),
        });

        if (!listResponse.ok) {
          throw new Error('Failed to add to lists');
        }
      }
      
      // Step 5: Re-sync Mailchimp to confirm changes
      await fetch('/api/mailchimp/lists', { method: 'POST' });
      
      // Step 6: Refresh data one final time
      await fetchConsolidatedMembers();
      setLastSyncTime(new Date());
      
    } catch (err) {
      console.error('Error in sync and fix:', err);
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSyncing(false);
      setFixing(false);
    }
  };

  // Client-side filtering
  const filteredMembers = useMemo(() => {
    let filtered = allMembers;

    // Vimeo status filter
    if (vimeoStatusFilter !== 'all') {
      if (vimeoStatusFilter === 'pbl-online-active') {
        // PBL Online Active: enabled members with "PBL Online Subscription" product
        filtered = filtered.filter(m => 
          m.vimeoStatus === 'enabled' && 
          m.vimeoProduct === 'PBL Online Subscription'
        );
      } else if (vimeoStatusFilter === 'members') {
        filtered = filtered.filter(m => m.vimeoStatus && m.vimeoStatus !== 'never a member');
      } else if (vimeoStatusFilter === 'never a member') {
        filtered = filtered.filter(m => m.vimeoStatus === 'never a member' || m.vimeoStatus === null);
      } else {
        filtered = filtered.filter(m => m.vimeoStatus === vimeoStatusFilter);
      }
    }

    // MailChimp status filter
    if (mailchimpStatusFilter !== 'all') {
      if (mailchimpStatusFilter === 'subscribers') {
        filtered = filtered.filter(m => m.mailchimpStatus && m.mailchimpStatus !== 'never subscribed');
      } else if (mailchimpStatusFilter === 'never subscribed') {
        filtered = filtered.filter(m => m.mailchimpStatus === 'never subscribed' || m.mailchimpStatus === null);
      } else {
        filtered = filtered.filter(m => m.mailchimpStatus === mailchimpStatusFilter);
      }
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(m => m.source === sourceFilter);
    }

    // Tag mismatch filter
    if (tagMismatchFilter !== 'all') {
      if (tagMismatchFilter === 'active-with-cancelled-tag') {
        // PBL Online Active members who have "cancelled members" tag in MailChimp
        filtered = filtered.filter(m => {
          const isPblOnlineActive = m.vimeoStatus === 'enabled' && m.vimeoProduct === 'PBL Online Subscription';
          const hasCancelledTag = m.mailchimpTags?.some(tag => 
            tag.toLowerCase().includes('cancelled') && tag.toLowerCase().includes('members')
          ) || false;
          return isPblOnlineActive && hasCancelledTag;
        });
      } else if (tagMismatchFilter === 'inactive-with-current-tag') {
        // Non-PBL Online Active members who have "current members" tag in MailChimp
        filtered = filtered.filter(m => {
          const isPblOnlineActive = m.vimeoStatus === 'enabled' && m.vimeoProduct === 'PBL Online Subscription';
          const hasCurrentTag = m.mailchimpTags?.some(tag => 
            tag.toLowerCase().includes('current') && tag.toLowerCase().includes('members')
          ) || false;
          console.log('Checking member:', m.email, 'isPblOnlineActive:', isPblOnlineActive, 'hasCurrentTag:', hasCurrentTag, 'tags:', m.mailchimpTags);
          return !isPblOnlineActive && hasCurrentTag;
        });
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.email.toLowerCase().includes(query) ||
        m.name?.toLowerCase().includes(query) ||
        m.vimeoPlan?.toLowerCase().includes(query) ||
        m.vimeoProduct?.toLowerCase().includes(query) ||
        m.mailchimpLists?.some(list => list.toLowerCase().includes(query)) ||
        m.mailchimpTags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [allMembers, vimeoStatusFilter, mailchimpStatusFilter, sourceFilter, tagMismatchFilter, searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [vimeoStatusFilter, mailchimpStatusFilter, sourceFilter, tagMismatchFilter, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageMembers = filteredMembers.slice(startIndex, endIndex);

  // Calculate stats
  const stats = useMemo(() => {
    const totalMembers = allMembers.length;
    const vimeoMembers = allMembers.filter(m => m.vimeoStatus && m.vimeoStatus !== 'never a member').length;
    const mailchimpSubscribers = allMembers.filter(m => m.mailchimpStatus && m.mailchimpStatus !== 'never subscribed').length;
    const bothSources = allMembers.filter(m => m.source === 'both').length;
    const vimeoOnly = allMembers.filter(m => m.source === 'vimeo').length;
    const mailchimpOnly = allMembers.filter(m => m.source === 'mailchimp').length;
    const activeVimeoMembers = allMembers.filter(m => m.vimeoStatus === 'enabled').length;
    const activeMailchimpSubscribers = allMembers.filter(m => m.mailchimpStatus === 'subscribed').length;
    
    // Key metric: PBL Online Active members
    const pblOnlineActiveMembers = allMembers.filter(m => 
      m.vimeoStatus === 'enabled' && 
      m.vimeoProduct === 'PBL Online Subscription'
    );
    const pblOnlineActive = pblOnlineActiveMembers.length;
    
    // PBL Online Active members with MailChimp data (for verification)
    const pblOnlineWithMailchimp = pblOnlineActiveMembers.filter(m => 
      m.mailchimpStatus && m.mailchimpStatus !== 'never subscribed'
    ).length;
    
    const pblOnlineWithoutMailchimp = pblOnlineActive - pblOnlineWithMailchimp;
    
    // Tag mismatch statistics
    const activeWithCancelledTag = allMembers.filter(m => {
      const isPblOnlineActive = m.vimeoStatus === 'enabled' && m.vimeoProduct === 'PBL Online Subscription';
      const hasCancelledTag = m.mailchimpTags?.some(tag => 
        tag.toLowerCase().includes('cancelled') && tag.toLowerCase().includes('members')
      ) || false;
      return isPblOnlineActive && hasCancelledTag;
    }).length;
    
    const inactiveWithCurrentTag = allMembers.filter(m => {
      const isPblOnlineActive = m.vimeoStatus === 'enabled' && m.vimeoProduct === 'PBL Online Subscription';
      const hasCurrentTag = m.mailchimpTags?.some(tag => 
        tag.toLowerCase().includes('current') && tag.toLowerCase().includes('members')
      ) || false;
      return !isPblOnlineActive && hasCurrentTag;
    }).length;
    
    return {
      total: totalMembers,
      vimeoMembers,
      mailchimpSubscribers,
      bothSources,
      vimeoOnly,
      mailchimpOnly,
      activeVimeoMembers,
      activeMailchimpSubscribers,
      pblOnlineActive,
      pblOnlineWithMailchimp,
      pblOnlineWithoutMailchimp,
      activeWithCancelledTag,
      inactiveWithCurrentTag,
    };
  }, [allMembers]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getVimeoStatusBadgeColor = (status: string | null) => {
    if (!status || status === 'never a member') {
      return 'bg-gray-100 text-gray-700 border-gray-200';
    }
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

  const getMailchimpStatusBadgeColor = (status: string | null) => {
    if (!status || status === 'never subscribed') {
      return 'bg-gray-100 text-gray-700 border-gray-200';
    }
    switch (status) {
      case 'subscribed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'unsubscribed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'cleaned':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
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
        <div className="text-gray-600">Loading consolidated member data...</div>
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
            onClick={fetchConsolidatedMembers}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
          <Button 
            onClick={syncAllData}
            size="sm"
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            Sync All Sources
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Stats Tiles */}
      <div className="grid grid-cols-5 gap-4">
        {/* PBL Online Active - Primary Tile */}
        <div 
          className={cn(
            "bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 shadow-sm border-2 border-pink-200 cursor-pointer transition-all duration-200",
            vimeoStatusFilter === 'pbl-online-active' ? "ring-2 ring-pink-500/30" : "hover:shadow-md"
          )}
          onClick={() => setVimeoStatusFilter(vimeoStatusFilter === 'pbl-online-active' ? 'all' : 'pbl-online-active')}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
              style={{
                background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
              }}
            >
              {stats.pblOnlineActive}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pblOnlineActive}</p>
              <p className="text-sm text-gray-600 font-medium">PBL Online Active</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-pink-100">
            <div className="text-xs text-pink-600 font-medium">
              {stats.pblOnlineWithMailchimp} with MailChimp • {stats.pblOnlineWithoutMailchimp} missing
            </div>
          </div>
        </div>
        
        {/* Total Contacts */}
        <div 
          className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200",
            vimeoStatusFilter === 'all' && mailchimpStatusFilter === 'all' && sourceFilter === 'all' ? "ring-2 ring-gray-400/20 border-gray-300" : "hover:shadow-md"
          )}
          onClick={() => {
            setVimeoStatusFilter('all');
            setMailchimpStatusFilter('all');
            setSourceFilter('all');
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-lg text-gray-600">
              {stats.total}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Contacts</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="text-xs text-gray-500">All unique email addresses</div>
          </div>
        </div>

        {/* PBL Active with MailChimp Verification */}
        <div 
          className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200",
            vimeoStatusFilter === 'pbl-online-active' && mailchimpStatusFilter === 'subscribers' ? "ring-2 ring-green-500/20 border-green-200" : "hover:shadow-md"
          )}
          onClick={() => {
            setVimeoStatusFilter('pbl-online-active');
            setMailchimpStatusFilter('subscribers');
          }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
              style={{
                background: `linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(21, 128, 61, 0.9) 100%)`
              }}
            >
              {stats.pblOnlineWithMailchimp}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pblOnlineWithMailchimp}</p>
              <p className="text-sm text-gray-600">PBL + MailChimp</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="text-xs text-gray-500">Verified on both platforms</div>
          </div>
        </div>

        {/* Active with Cancelled Tag - Tag Mismatch Issue */}
        <div 
          className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200",
            tagMismatchFilter === 'active-with-cancelled-tag' ? "ring-2 ring-orange-500/20 border-orange-200" : "hover:shadow-md"
          )}
          onClick={() => setTagMismatchFilter(tagMismatchFilter === 'active-with-cancelled-tag' ? 'all' : 'active-with-cancelled-tag')}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
              style={{
                background: `linear-gradient(135deg, rgba(251, 146, 60, 0.9) 0%, rgba(249, 115, 22, 0.9) 100%)`
              }}
            >
              {stats.activeWithCancelledTag}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeWithCancelledTag}</p>
              <p className="text-sm text-gray-600">Wrong Tag</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="text-xs text-gray-500">Active with "cancelled members" tag</div>
          </div>
        </div>
        
        {/* Inactive with Current Tag - Tag Mismatch Issue */}
        <div 
          className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200",
            tagMismatchFilter === 'inactive-with-current-tag' ? "ring-2 ring-red-500/20 border-red-200" : "hover:shadow-md"
          )}
          onClick={() => setTagMismatchFilter(tagMismatchFilter === 'inactive-with-current-tag' ? 'all' : 'inactive-with-current-tag')}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
              style={{
                background: `linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)`
              }}
            >
              {stats.inactiveWithCurrentTag}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.inactiveWithCurrentTag}</p>
              <p className="text-sm text-gray-600">Outdated Tag</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="text-xs text-gray-500">Non-active with "current members" tag</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6">
          {/* Search - Always Visible */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search by name, email, plan, product, list, or tag..."
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
            {/* Source Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Data Source</label>
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'both', 'vimeo', 'mailchimp'] as const).map((source) => (
                  <Button
                    key={source}
                    variant={sourceFilter === source ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSourceFilter(source)}
                    className={cn(
                      "rounded-xl transition-all duration-200",
                      sourceFilter === source
                        ? "text-white shadow-sm"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    )}
                    style={sourceFilter === source ? {
                      background: source === 'both'
                        ? `linear-gradient(135deg, rgba(147, 51, 234, 0.9) 0%, rgba(126, 34, 206, 0.9) 100%)`
                        : source === 'vimeo'
                        ? `linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)`
                        : source === 'mailchimp'
                        ? `linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.9) 100%)`
                        : `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                    } : {}}
                  >
                    {source === 'all' ? 'All Sources' : 
                     source === 'both' ? 'Both Sources' : 
                     source === 'vimeo' ? 'Vimeo Only' : 
                     'MailChimp Only'}
                  </Button>
                ))}
              </div>
            </div>
          
            {/* Vimeo Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Vimeo OTT Status</label>
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'pbl-online-active', 'members', 'never a member', 'enabled', 'cancelled', 'expired'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={vimeoStatusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVimeoStatusFilter(status)}
                    className={cn(
                      "rounded-xl transition-all duration-200",
                      vimeoStatusFilter === status
                        ? "text-white shadow-sm"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    )}
                    style={vimeoStatusFilter === status ? {
                      background: status === 'pbl-online-active' 
                        ? `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                        : status === 'enabled' 
                        ? `linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(21, 128, 61, 0.9) 100%)`
                        : status === 'cancelled' || status === 'expired'
                        ? `linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)`
                        : `linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)`
                    } : {}}
                  >
                    {status === 'all' ? 'All' : 
                     status === 'pbl-online-active' ? 'PBL Online Active' :
                     status === 'members' ? 'Any Member' : 
                     status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* MailChimp Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">MailChimp Status</label>
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'subscribers', 'never subscribed', 'subscribed', 'unsubscribed'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={mailchimpStatusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMailchimpStatusFilter(status)}
                    className={cn(
                      "rounded-xl transition-all duration-200",
                      mailchimpStatusFilter === status
                        ? "text-white shadow-sm"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    )}
                    style={mailchimpStatusFilter === status ? {
                      background: status === 'subscribed' 
                        ? `linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(21, 128, 61, 0.9) 100%)`
                        : status === 'unsubscribed'
                        ? `linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)`
                        : `linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(234, 88, 12, 0.9) 100%)`
                    } : {}}
                  >
                    {status === 'all' ? 'All' : 
                     status === 'subscribers' ? 'Any Subscriber' : 
                     status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tag Mismatch Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Tag Verification Issues</label>
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'active-with-cancelled-tag', 'inactive-with-current-tag'] as const).map((mismatch) => (
                  <Button
                    key={mismatch}
                    variant={tagMismatchFilter === mismatch ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTagMismatchFilter(mismatch)}
                    className={cn(
                      "rounded-xl transition-all duration-200",
                      tagMismatchFilter === mismatch
                        ? "text-white shadow-sm"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    )}
                    style={tagMismatchFilter === mismatch ? {
                      background: mismatch === 'active-with-cancelled-tag'
                        ? `linear-gradient(135deg, rgba(251, 146, 60, 0.9) 0%, rgba(249, 115, 22, 0.9) 100%)`
                        : mismatch === 'inactive-with-current-tag'
                        ? `linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)`
                        : `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                    } : {}}
                  >
                    {mismatch === 'all' ? 'No Filter' : 
                     mismatch === 'active-with-cancelled-tag' ? 'Active → Cancelled Tag' : 
                     'Inactive → Current Tag'}
                  </Button>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                <div>• <strong>Active → Cancelled Tag</strong>: PBL Online Active members tagged as "cancelled members"</div>
                <div>• <strong>Inactive → Current Tag</strong>: Non-active members still tagged as "current members"</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {tagMismatchFilter === 'active-with-cancelled-tag' ? 'Active Members with "Cancelled" Tag' :
             tagMismatchFilter === 'inactive-with-current-tag' ? 'Inactive Members with "Current" Tag' :
             vimeoStatusFilter === 'pbl-online-active' && mailchimpStatusFilter === 'subscribers' ? 'PBL Online Active with MailChimp' :
             vimeoStatusFilter === 'pbl-online-active' && mailchimpStatusFilter === 'never subscribed' ? 'PBL Online Active Missing MailChimp' :
             vimeoStatusFilter === 'pbl-online-active' ? 'PBL Online Active Members' :
             'All Members'} ({filteredMembers.length})
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
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vimeo Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MailChimp Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vimeo Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MailChimp Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPageMembers.map((member, idx) => (
                  <tr key={member.email + idx} className="hover:bg-gray-50 transition-colors">
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
                      <Badge className={cn("text-xs", getVimeoStatusBadgeColor(member.vimeoStatus))}>
                        {member.vimeoStatus || 'never a member'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={cn("text-xs", getMailchimpStatusBadgeColor(member.mailchimpStatus))}>
                        {member.mailchimpStatus || 'never subscribed'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {member.vimeoStatus && member.vimeoStatus !== 'never a member' ? (
                        <div className="text-sm">
                          <div className="text-gray-900 font-medium">{member.vimeoProduct || 'Unknown'}</div>
                          <div className="text-gray-500 text-xs">{member.vimeoPlan}</div>
                          <div className="text-gray-500 text-xs">{formatDate(member.vimeoJoinDate)}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {member.mailchimpStatus && member.mailchimpStatus !== 'never subscribed' ? (
                        <div className="text-sm">
                          {member.mailchimpLists && member.mailchimpLists.length > 0 && (
                            <div className="text-xs text-gray-600 mb-1">
                              {member.mailchimpLists.slice(0, 2).join(', ')}
                              {member.mailchimpLists.length > 2 && ` +${member.mailchimpLists.length - 2} more`}
                            </div>
                          )}
                          {member.mailchimpTags && member.mailchimpTags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {member.mailchimpTags.slice(0, 2).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs px-1 py-0">
                                  {tag}
                                </Badge>
                              ))}
                              {member.mailchimpTags.length > 2 && (
                                <span className="text-xs text-gray-500">+{member.mailchimpTags.length - 2}</span>
                              )}
                            </div>
                          )}
                          {member.mailchimpRating && (
                            <div className="text-xs text-gray-600 mt-1">
                              {member.mailchimpRating.toFixed(1)} ⭐
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(member.lastActivity)}</div>
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
});

AllMembersTab.displayName = 'AllMembersTab';