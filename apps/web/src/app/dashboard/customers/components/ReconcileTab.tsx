"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Member {
  email: string;
  name?: string;
  vimeoStatus: 'enabled' | 'cancelled' | 'expired' | 'disabled' | 'paused' | 'refunded' | 'never a member' | null;
  vimeoJoinDate?: string;
  vimeoPlan?: string;
  vimeoProduct?: string;
  mailchimpStatus: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'never subscribed' | null;
  mailchimpLists?: string[];
  mailchimpTags?: string[];
  mailchimpRating?: number;
  lastActivity?: string;
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

interface ReconcileTabProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ReconcileTab({ searchQuery, onSearchChange }: ReconcileTabProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fixing, setFixing] = useState(false);
  const [activeSection, setActiveSection] = useState<'wrong' | 'outdated' | 'free-workout'>('wrong');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [fixActions, setFixActions] = useState<TagFixAction[]>([]);
  const [listActions, setListActions] = useState<ListAddAction[]>([]);

  useEffect(() => {
    fetchMembersForReconcile();
  }, []);

  const fetchMembersForReconcile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/customers/consolidated-members', {
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
        setMembers(data.members);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching members for reconcile:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Members with wrong tags: Active PBL Online subscribers with "cancelled members" tag
  const membersWithWrongTags = useMemo(() => {
    return members.filter(m => {
      const isPblOnlineActive = m.vimeoStatus === 'enabled' && m.vimeoProduct === 'PBL Online Subscription';
      const hasCancelledTag = m.mailchimpTags?.some(tag => 
        tag.toLowerCase().includes('cancelled') && tag.toLowerCase().includes('members')
      ) || false;
      return isPblOnlineActive && hasCancelledTag;
    });
  }, [members]);

  // Members with outdated tags: Non-active members with "current members" tag
  const membersWithOutdatedTags = useMemo(() => {
    return members.filter(m => {
      const isPblOnlineActive = m.vimeoStatus === 'enabled' && m.vimeoProduct === 'PBL Online Subscription';
      const hasCurrentTag = m.mailchimpTags?.some(tag => 
        tag.toLowerCase().includes('current') && tag.toLowerCase().includes('members')
      ) || false;
      return !isPblOnlineActive && hasCurrentTag;
    });
  }, [members]);

  // Members with 'free workouts' product who need to be added to Free Workout list
  const membersNeedingFreeWorkoutList = useMemo(() => {
    return members.filter(m => {
      const hasFreeWorkoutsProduct = m.vimeoProduct && 
        m.vimeoProduct.toLowerCase().includes('free workouts');
      const isInFreeWorkoutList = m.mailchimpLists?.some(list => 
        list.toLowerCase().includes('free workout')
      ) || false;
      return hasFreeWorkoutsProduct && !isInFreeWorkoutList;
    });
  }, [members]);

  const currentMembers = activeSection === 'wrong' ? membersWithWrongTags : 
                         activeSection === 'outdated' ? membersWithOutdatedTags : 
                         membersNeedingFreeWorkoutList;

  // Filter by search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return currentMembers;
    
    const query = searchQuery.toLowerCase();
    return currentMembers.filter(m => 
      m.email.toLowerCase().includes(query) ||
      m.name?.toLowerCase().includes(query) ||
      m.mailchimpTags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [currentMembers, searchQuery]);

  const handleMemberToggle = (email: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedMembers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.email)));
    }
  };

  const generateFixActions = (): TagFixAction[] => {
    const actions: TagFixAction[] = [];
    
    selectedMembers.forEach(email => {
      const member = members.find(m => m.email === email);
      if (!member) return;

      if (activeSection === 'wrong') {
        // Remove "cancelled members" tag and add "current members" tag
        const cancelledTags = member.mailchimpTags?.filter(tag => 
          tag.toLowerCase().includes('cancelled') && tag.toLowerCase().includes('members')
        ) || [];
        
        cancelledTags.forEach(tag => {
          actions.push({
            email,
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
            email,
            action: 'add',
            tag: 'current members',
            reason: 'Member is active PBL Online subscriber'
          });
        }
      } else if (activeSection === 'outdated') {
        // Remove "current members" tag and add "cancelled members" tag
        const currentTags = member.mailchimpTags?.filter(tag => 
          tag.toLowerCase().includes('current') && tag.toLowerCase().includes('members')
        ) || [];
        
        currentTags.forEach(tag => {
          actions.push({
            email,
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
            email,
            action: 'add',
            tag: 'cancelled members',
            reason: 'Member is not an active PBL Online subscriber'
          });
        }
      }
      // Note: free-workout section doesn't use tag actions, it uses list actions
    });

    return actions;
  };

  const generateListActions = (): ListAddAction[] => {
    const actions: ListAddAction[] = [];
    
    if (activeSection === 'free-workout') {
      selectedMembers.forEach(email => {
        const member = members.find(m => m.email === email);
        if (!member) return;

        // Add to Free Workout list - we'll need to get the actual list ID from Mailchimp
        actions.push({
          email,
          listId: 'FREE_WORKOUT_LIST_ID', // This will be resolved by the API
          listName: 'Free Workout',
          reason: 'Member has free workouts product'
        });
      });
    }

    return actions;
  };

  const handleFixTags = async () => {
    if (selectedMembers.size === 0) return;

    try {
      setFixing(true);
      setError(null);

      if (activeSection === 'free-workout') {
        // Handle list additions for free workout members
        const listActions = generateListActions();
        setListActions(listActions);

        const response = await fetch('/api/mailchimp/add-to-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ actions: listActions }),
        });

        if (!response.ok) {
          throw new Error(`Failed to add to list: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          // Refresh data after fixing
          await fetchMembersForReconcile();
          setSelectedMembers(new Set());
          setListActions([]);
        } else {
          throw new Error(result.error || 'Failed to add to list');
        }
      } else {
        // Handle tag fixes for wrong/outdated tags
        const actions = generateFixActions();
        setFixActions(actions);

        const response = await fetch('/api/mailchimp/fix-tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ actions }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fix tags: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          // Refresh data after fixing
          await fetchMembersForReconcile();
          setSelectedMembers(new Set());
          setFixActions([]);
        } else {
          throw new Error(result.error || 'Failed to fix tags');
        }
      }
    } catch (err) {
      console.error('Error fixing issues:', err);
      setError(err instanceof Error ? err.message : 'Failed to fix issues');
    } finally {
      setFixing(false);
    }
  };

  const handleAutoFixAll = async () => {
    // Select all members with wrong tags, outdated tags, or needing free workout list
    const allProblematicMembers = new Set([
      ...membersWithWrongTags.map(m => m.email),
      ...membersWithOutdatedTags.map(m => m.email),
      ...membersNeedingFreeWorkoutList.map(m => m.email)
    ]);
    
    if (allProblematicMembers.size === 0) return;
    
    // Set selected members to all problematic ones
    setSelectedMembers(allProblematicMembers);
    
    try {
      setFixing(true);
      setError(null);

      // Generate and execute tag fix actions
      const tagActions: TagFixAction[] = [];
      
      // Process wrong tags (active with cancelled tag)
      membersWithWrongTags.forEach(member => {
        const cancelledTags = member.mailchimpTags?.filter(tag => 
          tag.toLowerCase().includes('cancelled') && tag.toLowerCase().includes('members')
        ) || [];
        
        cancelledTags.forEach(tag => {
          tagActions.push({
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
          tagActions.push({
            email: member.email,
            action: 'add',
            tag: 'current members',
            reason: 'Member is active PBL Online subscriber'
          });
        }
      });
      
      // Process outdated tags (inactive with current tag)
      membersWithOutdatedTags.forEach(member => {
        const currentTags = member.mailchimpTags?.filter(tag => 
          tag.toLowerCase().includes('current') && tag.toLowerCase().includes('members')
        ) || [];
        
        currentTags.forEach(tag => {
          tagActions.push({
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
          tagActions.push({
            email: member.email,
            action: 'add',
            tag: 'cancelled members',
            reason: 'Member is not an active PBL Online subscriber'
          });
        }
      });

      // Generate and execute list add actions
      const listActions: ListAddAction[] = [];
      
      // Process members needing free workout list
      membersNeedingFreeWorkoutList.forEach(member => {
        listActions.push({
          email: member.email,
          listId: 'FREE_WORKOUT_LIST_ID', // This will be resolved by the API
          listName: 'Free Workout',
          reason: 'Member has free workouts product'
        });
      });

      // Execute tag fixes if any
      if (tagActions.length > 0) {
        setFixActions(tagActions);
        
        const tagResponse = await fetch('/api/mailchimp/fix-tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ actions: tagActions }),
        });

        if (!tagResponse.ok) {
          throw new Error(`Failed to fix tags: ${tagResponse.status}`);
        }

        const tagResult = await tagResponse.json();
        if (!tagResult.success) {
          throw new Error(tagResult.error || 'Failed to fix tags');
        }
      }

      // Execute list additions if any
      if (listActions.length > 0) {
        setListActions(listActions);
        
        const listResponse = await fetch('/api/mailchimp/add-to-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ actions: listActions }),
        });

        if (!listResponse.ok) {
          throw new Error(`Failed to add to lists: ${listResponse.status}`);
        }

        const listResult = await listResponse.json();
        if (!listResult.success) {
          throw new Error(listResult.error || 'Failed to add to lists');
        }
      }

      // Refresh data after all fixes
      await fetchMembersForReconcile();
      setSelectedMembers(new Set());
      setFixActions([]);
      setListActions([]);

    } catch (err) {
      console.error('Error fixing all issues:', err);
      setError(err instanceof Error ? err.message : 'Failed to fix all issues');
    } finally {
      setFixing(false);
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
        <div className="text-gray-600">Loading reconciliation data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="text-red-600 font-medium mb-2">Error loading reconciliation data</div>
        <div className="text-red-600 text-sm mb-4">{error}</div>
        <Button 
          onClick={fetchMembersForReconcile}
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
      {/* Auto-Fix All Button */}
      {(membersWithWrongTags.length > 0 || membersWithOutdatedTags.length > 0 || membersNeedingFreeWorkoutList.length > 0) && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Automatic Reconciliation
              </h3>
              <p className="text-sm text-gray-600">
                Found {membersWithWrongTags.length + membersWithOutdatedTags.length + membersNeedingFreeWorkoutList.length} members with issues.
                Click to automatically fix all tag issues and list assignments.
              </p>
              <div className="mt-3 space-y-1">
                <div className="text-sm text-gray-700">
                  • {membersWithWrongTags.length} active members incorrectly tagged as cancelled
                </div>
                <div className="text-sm text-gray-700">
                  • {membersWithOutdatedTags.length} inactive members still tagged as current
                </div>
                <div className="text-sm text-gray-700">
                  • {membersNeedingFreeWorkoutList.length} free workout members missing from Free Workout list
                </div>
              </div>
            </div>
            <Button
              onClick={handleAutoFixAll}
              disabled={fixing}
              className="ml-6 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              style={{
                background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`,
                minWidth: '140px'
              }}
            >
              {fixing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Fixing...
                </span>
              ) : (
                `Fix All (${membersWithWrongTags.length + membersWithOutdatedTags.length + membersNeedingFreeWorkoutList.length})`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div 
          className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border cursor-pointer transition-all duration-200",
            activeSection === 'wrong' ? "border-orange-200 ring-2 ring-orange-500/20" : "border-gray-100 hover:shadow-md"
          )}
          onClick={() => setActiveSection('wrong')}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
              style={{
                background: `linear-gradient(135deg, rgba(251, 146, 60, 0.9) 0%, rgba(249, 115, 22, 0.9) 100%)`
              }}
            >
              {membersWithWrongTags.length}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{membersWithWrongTags.length}</p>
              <p className="text-sm text-gray-600">Wrong Tags</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-500">
              Active PBL Online subscribers tagged as "cancelled members"
            </p>
          </div>
        </div>

        <div 
          className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border cursor-pointer transition-all duration-200",
            activeSection === 'outdated' ? "border-red-200 ring-2 ring-red-500/20" : "border-gray-100 hover:shadow-md"
          )}
          onClick={() => setActiveSection('outdated')}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
              style={{
                background: `linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)`
              }}
            >
              {membersWithOutdatedTags.length}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{membersWithOutdatedTags.length}</p>
              <p className="text-sm text-gray-600">Outdated Tags</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-500">
              Non-active members still tagged as "current members"
            </p>
          </div>
        </div>

        <div 
          className={cn(
            "bg-white rounded-2xl p-6 shadow-sm border cursor-pointer transition-all duration-200",
            activeSection === 'free-workout' ? "border-blue-200 ring-2 ring-blue-500/20" : "border-gray-100 hover:shadow-md"
          )}
          onClick={() => setActiveSection('free-workout')}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
              style={{
                background: `linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)`
              }}
            >
              {membersNeedingFreeWorkoutList.length}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{membersNeedingFreeWorkoutList.length}</p>
              <p className="text-sm text-gray-600">Missing List</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-500">
              Free workout members not in "Free Workout" list
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <Input
          type="text"
          placeholder="Search by name, email, or tag..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-12 bg-white border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
        />
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeSection === 'wrong' 
                ? `Members with Wrong Tags (${filteredMembers.length})`
                : activeSection === 'outdated'
                ? `Members with Outdated Tags (${filteredMembers.length})`
                : `Members Missing Free Workout List (${filteredMembers.length})`
              }
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
                disabled={filteredMembers.length === 0}
              >
                {selectedMembers.size === filteredMembers.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                onClick={handleFixTags}
                size="sm"
                disabled={selectedMembers.size === 0 || fixing}
                className="text-white"
                style={{
                  background: selectedMembers.size > 0 
                    ? `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                    : undefined
                }}
              >
                {fixing ? 'Fixing...' : `Fix ${selectedMembers.size} Selected`}
              </Button>
            </div>
          </div>
          
          {activeSection === 'wrong' && (
            <p className="text-sm text-gray-600 mb-2">
              These members are active PBL Online subscribers but are incorrectly tagged as "cancelled members" in MailChimp.
              Fixing will remove the cancelled tag and add the current members tag.
            </p>
          )}
          
          {activeSection === 'outdated' && (
            <p className="text-sm text-gray-600 mb-2">
              These members are not active PBL Online subscribers but still have the "current members" tag in MailChimp.
              Fixing will remove the current tag and add the cancelled members tag.
            </p>
          )}

          {activeSection === 'free-workout' && (
            <p className="text-sm text-gray-600 mb-2">
              These members have a "free workouts" product in Vimeo OTT but are not subscribed to the "Free Workout" list in MailChimp.
              Fixing will add them to the Free Workout list.
            </p>
          )}
        </div>
        
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? 'No members found matching your search.' : 
             activeSection === 'wrong' ? 'No members with wrong tags found.' :
             activeSection === 'outdated' ? 'No members with outdated tags found.' :
             'No members missing from Free Workout list found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vimeo Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.email} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedMembers.has(member.email)}
                        onChange={() => handleMemberToggle(member.email)}
                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0 mr-3">
                          {member.name ? member.name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.name || member.email.split('@')[0]}
                          </div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={cn("text-xs", getVimeoStatusBadgeColor(member.vimeoStatus))}>
                        {member.vimeoStatus || 'never a member'}
                      </Badge>
                      {member.vimeoProduct && (
                        <div className="text-xs text-gray-500 mt-1">{member.vimeoProduct}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {member.mailchimpTags && member.mailchimpTags.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {member.mailchimpTags.map((tag, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary" 
                              className={cn(
                                "text-xs px-1 py-0",
                                (tag.toLowerCase().includes('cancelled') && tag.toLowerCase().includes('members')) ||
                                (tag.toLowerCase().includes('current') && tag.toLowerCase().includes('members'))
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : ""
                              )}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No tags</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {activeSection === 'wrong' ? (
                          <div className="text-orange-600">
                            Active subscriber tagged as cancelled
                          </div>
                        ) : activeSection === 'outdated' ? (
                          <div className="text-red-600">
                            Inactive subscriber tagged as current
                          </div>
                        ) : (
                          <div className="text-blue-600">
                            Free workout member missing from list
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fix Actions Preview */}
      {selectedMembers.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h4 className="font-medium text-blue-900 mb-3">
            Actions to be performed for {selectedMembers.size} selected member{selectedMembers.size !== 1 ? 's' : ''}:
          </h4>
          <div className="text-sm text-blue-800">
            {activeSection === 'wrong' ? (
              <ul className="list-disc list-inside space-y-1">
                <li>Remove "cancelled members" tag from MailChimp</li>
                <li>Add "current members" tag to MailChimp</li>
              </ul>
            ) : activeSection === 'outdated' ? (
              <ul className="list-disc list-inside space-y-1">
                <li>Remove "current members" tag from MailChimp</li>
                <li>Add "cancelled members" tag to MailChimp</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                <li>Add members to "Free Workout" list in MailChimp</li>
                <li>Subscribe them with their existing name and email data</li>
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}