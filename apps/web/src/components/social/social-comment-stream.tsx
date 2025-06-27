import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Filter } from 'lucide-react';
import { SocialComment } from '@/lib/social';
import { SocialCommentItem } from './social-comment-item';

interface SocialCommentStreamProps {
  comments: SocialComment[];
  isLoading: boolean;
  selectedComments: string[];
  selectedComment: string | null;
  onSelectComment: (commentId: string) => void;
  onSelectCommentToggle: (commentId: string) => void;
  onSelectAllComments: () => void;
  onFilterChange: (platform: string) => void;
  currentFilter: string;
  onShowOnlySelected: () => void;
  showOnlySelected: boolean;
  customReplies: Record<string, string>;
  editingReply: string | null;
  onStartEditReply: (commentId: string) => void;
  onCancelEditReply: () => void;
  onUpdateReply: (commentId: string, text: string) => void;
  onDeleteReply: (commentId: string) => void;
  onCopyReply: (text: string) => void;
  onGenerateReply: (commentId: string) => void;
  onSendReply: (commentId: string, platform: string) => void;
  isGeneratingReplies: boolean;
  replySending: Record<string, boolean>;
}

export function SocialCommentStream({
  comments,
  isLoading,
  selectedComments,
  selectedComment,
  onSelectComment,
  onSelectCommentToggle,
  onSelectAllComments,
  onFilterChange,
  currentFilter,
  onShowOnlySelected,
  showOnlySelected,
  customReplies,
  editingReply,
  onStartEditReply,
  onCancelEditReply,
  onUpdateReply,
  onDeleteReply,
  onCopyReply,
  onGenerateReply,
  onSendReply,
  isGeneratingReplies,
  replySending
}: SocialCommentStreamProps) {
  
  const getFilterLabel = () => {
    switch (currentFilter) {
      case 'instagram': return 'Instagram only';
      case 'facebook': return 'Facebook only';
      case 'youtube': return 'YouTube only';
      default: return 'All platforms';
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Comment Stream</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={onShowOnlySelected}
            >
              {showOnlySelected ? "Show All" : "Show Selected"}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Filter className="h-4 w-4" /> Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onFilterChange("all")}>
                  All Platforms
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFilterChange("instagram")}>
                  Instagram Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFilterChange("facebook")}>
                  Facebook Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFilterChange("youtube")}>
                  YouTube Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardDescription className="flex items-center justify-between">
          <span>{getFilterLabel()}</span>
          <div className="flex items-center gap-2">
            <Checkbox 
              id="select-all" 
              checked={comments.length > 0 && selectedComments.length === comments.length}
              onCheckedChange={onSelectAllComments}
            />
            <label htmlFor="select-all" className="text-xs font-medium cursor-pointer">
              Select All
            </label>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <Tabs defaultValue="unanswered" className="h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
            <TabsTrigger value="all">All Comments</TabsTrigger>
          </TabsList>
          
          <div className="overflow-y-auto max-h-[600px] pr-2">
            <TabsContent value="unanswered" className="space-y-4 m-0">
              {isLoading && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-32 mb-6" />
                  <Skeleton className="h-20 w-full rounded-md" />
                </div>
              )}
              
              {!isLoading && comments.filter(comment => !comment.answered).length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-slate-500">No unanswered comments found</p>
                </div>
              )}
              
              {!isLoading && comments
                .filter(comment => !comment.answered)
                .map(comment => (
                  <SocialCommentItem 
                    key={comment.id}
                    comment={comment}
                    isSelected={selectedComments.includes(comment.id)}
                    isExpanded={selectedComment === comment.id}
                    customReply={customReplies[comment.id]}
                    isEditingReply={editingReply === comment.id}
                    isGeneratingReply={isGeneratingReplies}
                    isSendingReply={replySending[comment.id] || false}
                    onSelect={() => onSelectComment(comment.id)}
                    onToggleSelect={() => onSelectCommentToggle(comment.id)}
                    onStartEditReply={() => onStartEditReply(comment.id)}
                    onCancelEditReply={onCancelEditReply}
                    onUpdateReply={(text) => onUpdateReply(comment.id, text)}
                    onDeleteReply={() => onDeleteReply(comment.id)}
                    onCopyReply={(text) => onCopyReply(text)}
                    onGenerateReply={() => onGenerateReply(comment.id)}
                    onSendReply={() => onSendReply(comment.id, comment.platform)}
                  />
                ))}
            </TabsContent>
            
            <TabsContent value="all" className="space-y-4 m-0">
              {isLoading && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-32 mb-6" />
                  <Skeleton className="h-20 w-full rounded-md" />
                </div>
              )}
              
              {!isLoading && comments.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-slate-500">No comments found</p>
                </div>
              )}
              
              {!isLoading && comments.map(comment => (
                <SocialCommentItem 
                  key={comment.id}
                  comment={comment}
                  isSelected={selectedComments.includes(comment.id)}
                  isExpanded={selectedComment === comment.id}
                  customReply={customReplies[comment.id]}
                  isEditingReply={editingReply === comment.id}
                  isGeneratingReply={isGeneratingReplies}
                  isSendingReply={replySending[comment.id] || false}
                  onSelect={() => onSelectComment(comment.id)}
                  onToggleSelect={() => onSelectCommentToggle(comment.id)}
                  onStartEditReply={() => onStartEditReply(comment.id)}
                  onCancelEditReply={onCancelEditReply}
                  onUpdateReply={(text) => onUpdateReply(comment.id, text)}
                  onDeleteReply={() => onDeleteReply(comment.id)}
                  onCopyReply={(text) => onCopyReply(text)}
                  onGenerateReply={() => onGenerateReply(comment.id)}
                  onSendReply={() => onSendReply(comment.id, comment.platform)}
                />
              ))}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
} 