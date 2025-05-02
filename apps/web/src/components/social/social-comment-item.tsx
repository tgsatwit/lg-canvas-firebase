import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SocialComment } from '@/lib/social';
import { Copy, Edit, Trash, Check, Wand2, Send, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Facebook, Instagram, Youtube } from 'lucide-react';

interface SocialCommentItemProps {
  comment: SocialComment;
  isSelected: boolean;
  isExpanded: boolean;
  customReply?: string;
  isEditingReply: boolean;
  isGeneratingReply: boolean;
  isSendingReply: boolean;
  onSelect: () => void;
  onToggleSelect: () => void;
  onStartEditReply: () => void;
  onCancelEditReply: () => void;
  onUpdateReply: (text: string) => void;
  onDeleteReply: () => void;
  onCopyReply: (text: string) => void;
  onGenerateReply: () => void;
  onSendReply: () => void;
}

export function SocialCommentItem({
  comment,
  isSelected,
  isExpanded,
  customReply,
  isEditingReply,
  isGeneratingReply,
  isSendingReply,
  onSelect,
  onToggleSelect,
  onStartEditReply,
  onCancelEditReply,
  onUpdateReply,
  onDeleteReply,
  onCopyReply,
  onGenerateReply,
  onSendReply
}: SocialCommentItemProps) {
  
  function getPlatformIcon(platform: string) {
    switch(platform) {
      case "instagram": return <Instagram className="h-4 w-4 text-pink-500" />;
      case "facebook": return <Facebook className="h-4 w-4 text-blue-600" />;
      case "youtube": return <Youtube className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return (
    <div
      className={`p-4 border rounded-lg hover:bg-slate-50 cursor-pointer ${
        isSelected ? 'border-indigo-300 bg-indigo-50/50' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
          />
          {getPlatformIcon(comment.platform)}
          <span className="font-medium">{comment.author}</span>
          {comment.answered && (
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Answered
            </Badge>
          )}
        </div>
        <span className="text-xs text-slate-400">{formatDate(comment.date)}</span>
      </div>
      <p className="text-slate-600 mb-2">{comment.content}</p>
      <div className="text-xs text-slate-400 mb-3">
        On: {comment.postTitle || `${comment.platform} Post`}
      </div>
      
      {isExpanded && (!comment.answered || customReply) && (
        <div className="mt-2 space-y-3">
          {customReply && !isEditingReply ? (
            <div className="p-3 bg-indigo-50 rounded-md border border-indigo-100 relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-indigo-700">Your Reply</span>
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartEditReply();
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyReply(customReply);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteReply();
                    }}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-600">{customReply}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="Write your reply here or generate one with AI..."
                value={customReply || ''}
                onChange={(e) => onUpdateReply(e.target.value)}
                className="min-h-[80px]"
                onClick={(e) => e.stopPropagation()}
              />
              
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  {isEditingReply && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelEditReply();
                      }}
                    >
                      <Check className="h-3 w-3" />
                      Done Editing
                    </Button>
                  )}
                  
                  {!customReply && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGenerateReply();
                      }}
                      disabled={isGeneratingReply}
                    >
                      {isGeneratingReply ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Wand2 className="h-3 w-3" />
                      )}
                      Generate Reply
                    </Button>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="default"
                  className="gap-1"
                  disabled={isSendingReply || !customReply}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendReply();
                  }}
                >
                  {isSendingReply ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Reply on {comment.platform}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 