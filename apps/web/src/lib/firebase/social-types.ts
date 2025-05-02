export type SocialPlatform = 'facebook' | 'instagram' | 'youtube' | 'twitter';

export interface SocialAccount {
  id: string;
  userId: string;
  platformId: string;
  platform: SocialPlatform;
  name: string;
  profileUrl: string;
  profileImageUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
  lastSyncedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SocialComment {
  id: string;
  platformCommentId: string;
  accountId: string;
  platform: SocialPlatform;
  postId?: string;
  parentCommentId?: string;
  author: {
    id: string;
    name: string;
    profileUrl?: string;
    profileImageUrl?: string;
  };
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  answered: boolean;
  hasReplies: boolean;
  replyId?: string; // If we replied to this comment
  replyContent?: string;
  isHidden: boolean;
  publishedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface ReplyTemplate {
  id: string;
  userId: string;
  title: string;
  content: string;
  platforms: SocialPlatform[];
  tags: string[];
  useCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface SocialUserPreferences {
  id: string;
  userId: string;
  defaultPlatforms: SocialPlatform[];
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // in minutes
  dashboardLayout?: {
    widgets: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
    }>;
  };
  createdAt: number;
  updatedAt: number;
} 