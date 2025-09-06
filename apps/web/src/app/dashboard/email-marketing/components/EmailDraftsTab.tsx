"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { EmailDraft } from '@opencanvas/shared/types';
import { useUserContext } from '@/contexts/UserContext';

interface EmailDraftsTabProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEditDraft: (draft: EmailDraft) => void;
  onCreateNew: () => void;
}

export function EmailDraftsTab({ 
  searchQuery, 
  onSearchChange, 
  onEditDraft,
  onCreateNew 
}: EmailDraftsTabProps) {
  const { user } = useUserContext();
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'completed' | 'sent'>('all');
  const [businessFilter, setBusinessFilter] = useState<'all' | 'pilates' | 'face'>('all');
  const [createdByFilter, setCreatedByFilter] = useState<'all' | 'mine'>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/email/drafts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch drafts: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.drafts) {
        setDrafts(data.drafts);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching drafts:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    
    try {
      const response = await fetch(`/api/email/drafts/${draftId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setDrafts(prev => prev.filter(d => d.id !== draftId));
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const duplicateDraft = async (draft: EmailDraft) => {
    try {
      const newDraft = {
        ...draft,
        id: undefined,
        title: `Copy of ${draft.title}`,
        status: 'draft' as const,
        createdBy: user?.id || '',
        createdByName: user?.displayName || user?.email || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastEditedBy: undefined,
        lastEditedByName: undefined,
        mailchimpCampaignId: undefined,
        sentDate: undefined,
        sentToMailchimp: false
      };

      const response = await fetch('/api/email/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDraft),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.draft) {
          setDrafts(prev => [data.draft, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error duplicating draft:', error);
    }
  };

  // Filter and sort drafts
  const filteredDrafts = drafts
    .filter(draft => {
      // Search filter
      if (searchQuery && !draft.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !draft.subject?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && draft.status !== statusFilter) {
        return false;
      }
      
      // Business filter
      if (businessFilter !== 'all' && draft.business !== businessFilter) {
        return false;
      }
      
      // Created by filter
      if (createdByFilter === 'mine' && draft.createdBy !== user?.id) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      const aValue = sortBy === 'title' ? a.title : new Date(a[sortBy]).getTime();
      const bValue = sortBy === 'title' ? b.title : new Date(b[sortBy]).getTime();
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
      }
    });

  const getStatusBadge = (status: EmailDraft['status']) => {
    const styles = {
      draft: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      completed: 'bg-blue-50 text-blue-700 border-blue-200',
      sent: 'bg-green-50 text-green-700 border-green-200'
    };
    
    return (
      <Badge variant="secondary" className={cn('border', styles[status])}>
        {status === 'draft' ? 'Draft' : status === 'completed' ? 'Completed' : 'Sent'}
      </Badge>
    );
  };

  const getBusinessBadge = (business: EmailDraft['business']) => {
    return (
      <Badge 
        variant="outline" 
        className="text-xs"
        style={{
          background: business === 'pilates' 
            ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
          border: `1px solid ${business === 'pilates' ? 'rgba(236, 72, 153, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
          color: business === 'pilates' ? 'rgb(236, 72, 153)' : 'rgb(139, 92, 246)'
        }}
      >
        {business === 'pilates' ? 'Pilates by Lisa' : 'Face by Lisa'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div 
        className="p-6 rounded-2xl border"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)`,
          backdropFilter: 'blur(20px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)`
        }}
      >
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search drafts by title or subject..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-32 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={businessFilter} onValueChange={(value: any) => setBusinessFilter(value)}>
              <SelectTrigger className="w-32 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Business</SelectItem>
                <SelectItem value="pilates">Pilates</SelectItem>
                <SelectItem value="face">Face</SelectItem>
              </SelectContent>
            </Select>

            <Select value={createdByFilter} onValueChange={(value: any) => setCreatedByFilter(value)}>
              <SelectTrigger className="w-32 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authors</SelectItem>
                <SelectItem value="mine">My Drafts</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value: string) => {
              const [field, order] = value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}>
              <SelectTrigger className="w-40 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
                <SelectItem value="createdAt-desc">Recently Created</SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={onCreateNew}
              className="rounded-xl"
              style={{
                background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
              }}
            >
              New Draft
            </Button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredDrafts.length} of {drafts.length} drafts
        </span>
        {searchQuery && (
          <span>
            Filtered by: "{searchQuery}"
          </span>
        )}
      </div>

      {/* Drafts Table */}
      <div 
        className="rounded-2xl border overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)`,
          backdropFilter: 'blur(20px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)`
        }}
      >
        {error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchDrafts} variant="outline" className="rounded-xl">
              Try Again
            </Button>
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              {drafts.length === 0 ? "No email drafts yet." : "No drafts match your filters."}
            </p>
            <Button
              onClick={onCreateNew}
              className="rounded-xl"
              style={{
                background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
              }}
            >
              Create Your First Draft
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/50">
                  <th className="text-left p-4 font-medium text-gray-900">Title</th>
                  <th className="text-left p-4 font-medium text-gray-900">Status</th>
                  <th className="text-left p-4 font-medium text-gray-900">Business</th>
                  <th className="text-left p-4 font-medium text-gray-900">Campaign Type</th>
                  <th className="text-left p-4 font-medium text-gray-900">Created By</th>
                  <th className="text-left p-4 font-medium text-gray-900">Updated</th>
                  <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrafts.map((draft) => (
                  <tr 
                    key={draft.id} 
                    className="border-b border-gray-200/30 hover:bg-white/20 transition-colors cursor-pointer"
                    onClick={() => onEditDraft(draft)}
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">{draft.title}</p>
                        {draft.subject && (
                          <p className="text-sm text-gray-600 mt-1">{draft.subject}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(draft.status)}
                    </td>
                    <td className="p-4">
                      {getBusinessBadge(draft.business)}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">
                        {draft.campaignType === 'weekly' ? 'Weekly Email' : 'Custom Campaign'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm text-gray-900">{draft.createdByName || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(draft.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          {new Date(draft.updatedAt).toLocaleDateString()}
                        </p>
                        {draft.lastEditedByName && (
                          <p className="text-xs text-gray-500">by {draft.lastEditedByName}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditDraft(draft)}
                          className="rounded-lg text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => duplicateDraft(draft)}
                          className="rounded-lg text-xs"
                        >
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteDraft(draft.id)}
                          className="rounded-lg text-xs text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
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