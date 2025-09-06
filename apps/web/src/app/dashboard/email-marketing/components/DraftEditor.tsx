"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { EmailDraft } from '@opencanvas/shared/types';
import { useUserContext } from '@/contexts/UserContext';

interface DraftEditorProps {
  draft: EmailDraft | null;
  onSave: (draft: EmailDraft) => Promise<void>;
  onClose: () => void;
  isNew?: boolean;
}

export function DraftEditor({ draft, onSave, onClose, isNew = false }: DraftEditorProps) {
  const { user } = useUserContext();
  const [editedDraft, setEditedDraft] = useState<EmailDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize draft
  useEffect(() => {
    if (draft) {
      setEditedDraft({ ...draft });
      setHasUnsavedChanges(false);
    } else if (isNew) {
      // Create new draft template
      const newDraft: EmailDraft = {
        id: '',
        title: 'New Email Draft',
        status: 'draft',
        business: 'pilates',
        targetAudience: 'current',
        campaignType: 'weekly',
        subject: '',
        preheader: '',
        emailBody: '',
        keyMessages: [],
        createdBy: user?.id || '',
        createdByName: user?.displayName || user?.email || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasUnsavedChanges: true
      };
      setEditedDraft(newDraft);
      setHasUnsavedChanges(true);
    }
  }, [draft, isNew, user]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!editedDraft || !hasUnsavedChanges || saving) return;
    
    try {
      setAutoSaving(true);
      
      const updatedDraft = {
        ...editedDraft,
        updatedAt: new Date().toISOString(),
        lastEditedBy: user?.id,
        lastEditedByName: user?.displayName ?? user?.email ?? undefined,
        lastAutoSave: new Date().toISOString(),
        hasUnsavedChanges: false
      };

      await onSave(updatedDraft);
      setEditedDraft(updatedDraft);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [editedDraft, hasUnsavedChanges, saving, user, onSave]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (hasUnsavedChanges && !isNew) {
      const interval = setInterval(autoSave, 30000);
      return () => clearInterval(interval);
    }
  }, [hasUnsavedChanges, isNew, autoSave]);

  const updateDraft = (updates: Partial<EmailDraft>) => {
    if (!editedDraft) return;
    
    setEditedDraft(prev => prev ? { ...prev, ...updates } : null);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!editedDraft) return;
    
    try {
      setSaving(true);
      
      const updatedDraft = {
        ...editedDraft,
        updatedAt: new Date().toISOString(),
        lastEditedBy: user?.id,
        lastEditedByName: user?.displayName ?? user?.email ?? undefined,
        hasUnsavedChanges: false
      };

      await onSave(updatedDraft);
      setEditedDraft(updatedDraft);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const markAsCompleted = async () => {
    if (!editedDraft) return;
    
    const completed = { ...editedDraft, status: 'completed' as const };
    updateDraft(completed);
    await handleSave();
  };

  const addKeyMessage = () => {
    if (!editedDraft || (editedDraft.keyMessages?.length || 0) >= 5) return;
    
    updateDraft({
      keyMessages: [...(editedDraft.keyMessages || []), '']
    });
  };

  const updateKeyMessage = (index: number, value: string) => {
    if (!editedDraft) return;
    
    const newMessages = [...(editedDraft.keyMessages || [])];
    newMessages[index] = value;
    updateDraft({ keyMessages: newMessages });
  };

  const removeKeyMessage = (index: number) => {
    if (!editedDraft) return;
    
    const newMessages = (editedDraft.keyMessages || []).filter((_, i) => i !== index);
    updateDraft({ keyMessages: newMessages });
  };

  if (!editedDraft) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div 
        className="p-6 rounded-2xl border"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)`,
          backdropFilter: 'blur(20px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)`
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Input
              value={editedDraft.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              className="text-2xl font-bold bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
              placeholder="Email Draft Title"
            />
            <Badge variant="secondary" className={cn(
              'border',
              editedDraft.status === 'draft' && 'bg-yellow-50 text-yellow-700 border-yellow-200',
              editedDraft.status === 'completed' && 'bg-blue-50 text-blue-700 border-blue-200',
              editedDraft.status === 'sent' && 'bg-green-50 text-green-700 border-green-200'
            )}>
              {editedDraft.status === 'draft' ? 'Draft' : 
               editedDraft.status === 'completed' ? 'Completed' : 'Sent'}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {autoSaving && <span className="text-sm text-gray-500">Auto-saving...</span>}
            {lastSaved && !autoSaving && (
              <span className="text-sm text-gray-500">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {hasUnsavedChanges && !autoSaving && (
              <span className="text-sm text-orange-600">Unsaved changes</span>
            )}
          </div>
        </div>

        {/* Quick Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-2 block">Business</Label>
            <Select value={editedDraft.business} onValueChange={(value: any) => updateDraft({ business: value })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pilates">Pilates by Lisa</SelectItem>
                <SelectItem value="face">Face by Lisa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-2 block">Target Audience</Label>
            <Select value={editedDraft.targetAudience} onValueChange={(value: any) => updateDraft({ targetAudience: value })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Members</SelectItem>
                <SelectItem value="prospective">Prospective Members</SelectItem>
                <SelectItem value="cancelled">Cancelled Members</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-900 mb-2 block">Campaign Type</Label>
            <Select value={editedDraft.campaignType} onValueChange={(value: any) => updateDraft({ campaignType: value })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly Email</SelectItem>
                <SelectItem value="custom">Custom Campaign</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div 
        className="p-6 rounded-2xl border space-y-6"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)`,
          backdropFilter: 'blur(20px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)`
        }}
      >
        <h3 className="text-lg font-semibold text-gray-900">Email Content</h3>

        {/* Subject Line */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">Subject Line</Label>
          <Input
            value={editedDraft.subject || ''}
            onChange={(e) => updateDraft({ subject: e.target.value })}
            placeholder="Enter email subject line..."
            className="rounded-xl"
          />
        </div>

        {/* Preheader */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">Preheader Text</Label>
          <Input
            value={editedDraft.preheader || ''}
            onChange={(e) => updateDraft({ preheader: e.target.value })}
            placeholder="Preview text that appears after the subject line..."
            className="rounded-xl"
          />
        </div>

        {/* Key Messages */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">Key Messages</Label>
          <div className="space-y-2">
            {(editedDraft.keyMessages || []).map((message, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => updateKeyMessage(index, e.target.value)}
                  placeholder={`Key message ${index + 1}`}
                  className="flex-1 rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeKeyMessage(index)}
                  className="rounded-xl px-3 text-red-600 border-red-200 hover:bg-red-50"
                >
                  ×
                </Button>
              </div>
            ))}
            {(editedDraft.keyMessages?.length || 0) < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={addKeyMessage}
                className="w-full rounded-xl border-dashed border-gray-300 text-gray-600 hover:border-pink-300"
              >
                Add Key Message
              </Button>
            )}
          </div>
        </div>

        {/* Email Body */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-2 block">Email Body</Label>
          <Textarea
            value={editedDraft.emailBody || ''}
            onChange={(e) => updateDraft({ emailBody: e.target.value })}
            placeholder="Write your email content here..."
            className="rounded-xl min-h-[300px] resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div 
        className="p-6 rounded-2xl border"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)`,
          backdropFilter: 'blur(20px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)`
        }}
      >
        <div className="flex gap-3 justify-between">
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-xl"
          >
            Back to Drafts
          </Button>
          
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              variant="outline"
              className="rounded-xl"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            
            {editedDraft.status === 'draft' && (
              <Button
                onClick={markAsCompleted}
                disabled={saving}
                className="rounded-xl"
                style={{
                  background: `linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(236, 72, 153, 0.9) 100%)`
                }}
              >
                Mark as Completed
              </Button>
            )}
            
            <Button
              onClick={() => {/* TODO: Implement send to Mailchimp */}}
              disabled={editedDraft.status !== 'completed'}
              className="rounded-xl"
              style={{
                background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
              }}
            >
              Send to Mailchimp
            </Button>
          </div>
        </div>
        
        {/* Draft Info */}
        <div className="mt-4 pt-4 border-t border-gray-200/30 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <span>
              Created by {editedDraft.createdByName} on {new Date(editedDraft.createdAt).toLocaleDateString()}
            </span>
            {editedDraft.lastEditedByName && (
              <span>
                Last edited by {editedDraft.lastEditedByName} on {new Date(editedDraft.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}