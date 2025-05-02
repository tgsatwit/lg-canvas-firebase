// Types for social monitoring data schema

export type SocialPlatform = 'facebook' | 'instagram' | 'youtube';

export interface SocialAccount {
  id: string;
  userId: string;
  platform: SocialPlatform;
  accountId: string;
  accountName: string;
  profilePictureUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SocialComment {
  id: string;
  accountId: string;
  platform: SocialPlatform;
  postId: string;
  commentId: string;
  parentCommentId?: string;
  author: {
    id: string;
    name: string;
    profilePictureUrl?: string;
  };
  content: string;
  contentHtml?: string;
  answered: boolean;
  replyId?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  createdAt: number;
  updatedAt: number;
  lastFetchedAt: number;
}

export interface SocialPost {
  id: string;
  accountId: string;
  platform: SocialPlatform;
  postId: string;
  content: string;
  contentHtml?: string;
  mediaUrls?: string[];
  publishedAt: number;
  commentsCount: number;
  createdAt: number;
  updatedAt: number;
  lastFetchedAt: number;
}

export interface ReplyTemplate {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  useCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserPreferences {
  id: string;
  userId: string;
  enabledPlatforms: SocialPlatform[];
  autoRefreshInterval: number; // in seconds
  notificationSettings: {
    email: boolean;
    push: boolean;
    notifyOnNewComments: boolean;
    notifyOnMentions: boolean;
  };
  defaultFilters: {
    platform?: SocialPlatform[];
    answered?: boolean;
    dateRange?: {
      start: number;
      end: number;
    };
  };
  createdAt: number;
  updatedAt: number;
} 