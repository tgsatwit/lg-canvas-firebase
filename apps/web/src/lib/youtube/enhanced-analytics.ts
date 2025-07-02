import { YouTubeVideo } from '@/lib/firebase/youtube-videos-service';

export interface EnhancedAnalytics {
  // Performance Metrics
  performance: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    averageViews: number;
    averageLikes: number;
    averageComments: number;
    likeToViewRatio: number;
    commentToViewRatio: number;
    engagementScore: number;
  };
  
  // Growth Trends
  growth: {
    viewsLast30Days: number;
    likesLast30Days: number;
    videosLast30Days: number;
    averageViewsPerDayLast30: number;
    growthRate: number;
    projectedMonthlyViews: number;
  };
  
  // Content Analysis
  content: {
    averageVideoLength: number;
    shortsCount: number;
    longFormCount: number;
    shortsVsLongFormPerformance: {
      shortsAvgViews: number;
      longFormAvgViews: number;
      shortsEngagement: number;
      longFormEngagement: number;
    };
    topPerformingTags: Array<{ tag: string; avgViews: number; count: number }>;
    optimalUploadDay: string;
    optimalUploadHour: number;
  };
  
  // Revenue Projections
  revenue: {
    estimatedRPM: number;
    estimatedMonthlyRevenue: number;
    estimatedYearlyRevenue: number;
  };
  
  // Top Performers
  topPerformers: {
    mostViewed: YouTubeVideo[];
    mostLiked: YouTubeVideo[];
    highestEngagement: YouTubeVideo[];
    trending: YouTubeVideo[];
  };
  
  // Recommendations
  recommendations: {
    contentStrategy: string[];
    seoImprovements: string[];
    uploadStrategy: string[];
    engagementBoosts: string[];
  };
}

export class EnhancedAnalyticsService {
  
  /**
   * Calculate comprehensive analytics from basic video data
   */
  static calculateEnhancedAnalytics(videos: YouTubeVideo[]): EnhancedAnalytics {
    if (!videos || videos.length === 0) {
      return this.getEmptyAnalytics();
    }

    const validVideos = videos.filter(v => v.viewCount !== undefined && v.publishedAt);
    
    return {
      performance: this.calculatePerformanceMetrics(validVideos),
      growth: this.calculateGrowthTrends(validVideos),
      content: this.analyzeContent(validVideos),
      revenue: this.estimateRevenue(validVideos),
      topPerformers: this.identifyTopPerformers(validVideos),
      recommendations: this.generateRecommendations(validVideos)
    };
  }
  
  private static calculatePerformanceMetrics(videos: YouTubeVideo[]) {
    const totalViews = videos.reduce((sum, v) => sum + (Number(v.viewCount) || 0), 0);
    const totalLikes = videos.reduce((sum, v) => sum + (Number(v.likeCount) || 0), 0);
    const totalComments = videos.reduce((sum, v) => sum + (Number(v.commentCount) || 0), 0);
    
    const averageViews = Math.round(totalViews / videos.length);
    const averageLikes = Math.round(totalLikes / videos.length);
    const averageComments = Math.round(totalComments / videos.length);
    
    const likeToViewRatio = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;
    const commentToViewRatio = totalViews > 0 ? (totalComments / totalViews) * 100 : 0;
    
    const engagementScore = Math.min(100, (likeToViewRatio + commentToViewRatio * 2) * 20);
    
    return {
      totalViews,
      totalLikes,
      totalComments,
      averageViews,
      averageLikes,
      averageComments,
      likeToViewRatio: Number(likeToViewRatio.toFixed(2)),
      commentToViewRatio: Number(commentToViewRatio.toFixed(2)),
      engagementScore: Number(engagementScore.toFixed(1))
    };
  }
  
  private static calculateGrowthTrends(videos: YouTubeVideo[]) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentVideos = videos.filter(v => new Date(v.publishedAt) >= thirtyDaysAgo);
    
    const viewsLast30Days = recentVideos.reduce((sum, v) => sum + (Number(v.viewCount) || 0), 0);
    const likesLast30Days = recentVideos.reduce((sum, v) => sum + (Number(v.likeCount) || 0), 0);
    const videosLast30Days = recentVideos.length;
    
    const averageViewsPerDayLast30 = Math.round(viewsLast30Days / 30);
    const projectedMonthlyViews = averageViewsPerDayLast30 * 30;
    
    // Calculate growth rate
    const olderVideos = videos.filter(v => new Date(v.publishedAt) < thirtyDaysAgo);
    const olderAvgViews = olderVideos.length > 0 ? 
      olderVideos.reduce((sum, v) => sum + (Number(v.viewCount) || 0), 0) / olderVideos.length : 0;
    const recentAvgViews = recentVideos.length > 0 ?
      recentVideos.reduce((sum, v) => sum + (Number(v.viewCount) || 0), 0) / recentVideos.length : 0;
    
    const growthRate = olderAvgViews > 0 ? 
      ((recentAvgViews - olderAvgViews) / olderAvgViews) * 100 : 0;
    
    return {
      viewsLast30Days,
      likesLast30Days,
      videosLast30Days,
      averageViewsPerDayLast30,
      growthRate: Number(growthRate.toFixed(1)),
      projectedMonthlyViews
    };
  }
  
  private static analyzeContent(videos: YouTubeVideo[]) {
    const shorts = videos.filter(v => this.isShort(v));
    const longForm = videos.filter(v => !this.isShort(v));
    
    const shortsAvgViews = shorts.length > 0 ? 
      shorts.reduce((sum, v) => sum + (Number(v.viewCount) || 0), 0) / shorts.length : 0;
    const longFormAvgViews = longForm.length > 0 ?
      longForm.reduce((sum, v) => sum + (Number(v.viewCount) || 0), 0) / longForm.length : 0;
    
    const shortsEngagement = this.calculateVideoGroupEngagement(shorts);
    const longFormEngagement = this.calculateVideoGroupEngagement(longForm);
    
    const topPerformingTags = this.analyzeTopTags(videos);
    const { optimalUploadDay, optimalUploadHour } = this.analyzeUploadPatterns(videos);
    
    const totalDuration = videos.reduce((sum, v) => sum + this.parseDuration(v.duration), 0);
    const averageVideoLength = Math.round(totalDuration / videos.length);
    
    return {
      averageVideoLength,
      shortsCount: shorts.length,
      longFormCount: longForm.length,
      shortsVsLongFormPerformance: {
        shortsAvgViews: Math.round(shortsAvgViews),
        longFormAvgViews: Math.round(longFormAvgViews),
        shortsEngagement: Number(shortsEngagement.toFixed(1)),
        longFormEngagement: Number(longFormEngagement.toFixed(1))
      },
      topPerformingTags,
      optimalUploadDay,
      optimalUploadHour
    };
  }
  
  private static estimateRevenue(videos: YouTubeVideo[]) {
    const totalViews = videos.reduce((sum, v) => sum + (Number(v.viewCount) || 0), 0);
    const estimatedRPM = 2.5; // Conservative estimate for fitness/wellness
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentViews = videos
      .filter(v => new Date(v.publishedAt) >= thirtyDaysAgo)
      .reduce((sum, v) => sum + (Number(v.viewCount) || 0), 0);
    
    const estimatedMonthlyRevenue = (recentViews / 1000) * estimatedRPM;
    const estimatedYearlyRevenue = estimatedMonthlyRevenue * 12;
    
    return {
      estimatedRPM,
      estimatedMonthlyRevenue: Number(estimatedMonthlyRevenue.toFixed(2)),
      estimatedYearlyRevenue: Number(estimatedYearlyRevenue.toFixed(2))
    };
  }
  
  private static identifyTopPerformers(videos: YouTubeVideo[]) {
    const sortedByViews = [...videos].sort((a, b) => (Number(b.viewCount) || 0) - (Number(a.viewCount) || 0));
    const sortedByLikes = [...videos].sort((a, b) => (Number(b.likeCount) || 0) - (Number(a.likeCount) || 0));
    
    const videosWithEngagement = videos.map(v => ({
      ...v,
      engagementScore: this.calculateVideoEngagement(v)
    })).sort((a, b) => b.engagementScore - a.engagementScore);
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const avgViews = videos.reduce((sum, v) => sum + (Number(v.viewCount) || 0), 0) / videos.length;
    const trending = videos.filter(v => 
      new Date(v.publishedAt) >= thirtyDaysAgo && (Number(v.viewCount) || 0) > avgViews
    );
    
    return {
      mostViewed: sortedByViews.slice(0, 5),
      mostLiked: sortedByLikes.slice(0, 5),
      highestEngagement: videosWithEngagement.slice(0, 5),
      trending: trending.slice(0, 5)
    };
  }
  
  private static generateRecommendations(videos: YouTubeVideo[]) {
    const recommendations = {
      contentStrategy: [] as string[],
      seoImprovements: [] as string[],
      uploadStrategy: [] as string[],
      engagementBoosts: [] as string[]
    };
    
    const shorts = videos.filter(v => this.isShort(v));
    const longForm = videos.filter(v => !this.isShort(v));
    
    if (shorts.length > 0 && longForm.length > 0) {
      const shortsAvg = shorts.reduce((sum, v) => sum + (Number(v.viewCount) || 0), 0) / shorts.length;
      const longFormAvg = longForm.reduce((sum, v) => sum + (Number(v.viewCount) || 0), 0) / longForm.length;
      
      if (shortsAvg > longFormAvg * 1.5) {
        recommendations.contentStrategy.push("Focus more on Shorts - they're significantly outperforming long-form content");
      } else if (longFormAvg > shortsAvg * 1.5) {
        recommendations.contentStrategy.push("Long-form content performs better - consider reducing Shorts frequency");
      }
    }
    
    const avgTitleLength = videos.reduce((sum, v) => sum + v.title.length, 0) / videos.length;
    if (avgTitleLength > 70) {
      recommendations.seoImprovements.push("Shorten video titles for better visibility");
    }
    
    const { optimalUploadDay } = this.analyzeUploadPatterns(videos);
    recommendations.uploadStrategy.push(`Consider uploading more on ${optimalUploadDay}s`);
    
    const avgEngagement = this.calculateVideoGroupEngagement(videos);
    if (avgEngagement < 3) {
      recommendations.engagementBoosts.push("Add compelling calls-to-action to increase engagement");
    }
    
    return recommendations;
  }
  
  // Helper methods
  private static isShort(video: YouTubeVideo): boolean {
    if (!video.duration) return false;
    const duration = this.parseDuration(video.duration);
    return duration <= 60;
  }
  
  private static parseDuration(duration?: string): number {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  private static calculateVideoEngagement(video: YouTubeVideo): number {
    const views = Number(video.viewCount) || 0;
    const likes = Number(video.likeCount) || 0;
    const comments = Number(video.commentCount) || 0;
    
    if (views === 0) return 0;
    return ((likes + comments * 2) / views) * 100;
  }
  
  private static calculateVideoGroupEngagement(videos: YouTubeVideo[]): number {
    if (videos.length === 0) return 0;
    const totalEngagement = videos.reduce((sum, v) => sum + this.calculateVideoEngagement(v), 0);
    return totalEngagement / videos.length;
  }
  
  private static analyzeTopTags(videos: YouTubeVideo[]) {
    const tagPerformance: { [tag: string]: { totalViews: number; count: number } } = {};
    
    videos.forEach(video => {
      if (video.tags && video.viewCount !== undefined) {
        video.tags.forEach(tag => {
          if (!tagPerformance[tag]) {
            tagPerformance[tag] = { totalViews: 0, count: 0 };
          }
          tagPerformance[tag].totalViews += Number(video.viewCount) || 0;
          tagPerformance[tag].count++;
        });
      }
    });
    
    return Object.entries(tagPerformance)
      .map(([tag, data]) => ({
        tag,
        avgViews: Math.round(data.totalViews / data.count),
        count: data.count
      }))
      .filter(item => item.count >= 2)
      .sort((a, b) => b.avgViews - a.avgViews)
      .slice(0, 10);
  }
  
  private static analyzeUploadPatterns(videos: YouTubeVideo[]) {
    const dayPerformance: { [day: string]: { totalViews: number; count: number } } = {};
    
    videos.forEach(video => {
      const date = new Date(video.publishedAt);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (!dayPerformance[day]) {
        dayPerformance[day] = { totalViews: 0, count: 0 };
      }
      
      dayPerformance[day].totalViews += Number(video.viewCount) || 0;
      dayPerformance[day].count++;
    });
    
    const optimalUploadDay = Object.entries(dayPerformance)
      .map(([day, data]) => ({ day, avgViews: data.totalViews / data.count }))
      .sort((a, b) => b.avgViews - a.avgViews)[0]?.day || 'Monday';
    
    const optimalUploadHour = 12; // Default noon
    
    return { optimalUploadDay, optimalUploadHour };
  }
  
  private static getEmptyAnalytics(): EnhancedAnalytics {
    return {
      performance: {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        averageViews: 0,
        averageLikes: 0,
        averageComments: 0,
        likeToViewRatio: 0,
        commentToViewRatio: 0,
        engagementScore: 0
      },
      growth: {
        viewsLast30Days: 0,
        likesLast30Days: 0,
        videosLast30Days: 0,
        averageViewsPerDayLast30: 0,
        growthRate: 0,
        projectedMonthlyViews: 0
      },
      content: {
        averageVideoLength: 0,
        shortsCount: 0,
        longFormCount: 0,
        shortsVsLongFormPerformance: {
          shortsAvgViews: 0,
          longFormAvgViews: 0,
          shortsEngagement: 0,
          longFormEngagement: 0
        },
        topPerformingTags: [],
        optimalUploadDay: 'Monday',
        optimalUploadHour: 12
      },
      revenue: {
        estimatedRPM: 0,
        estimatedMonthlyRevenue: 0,
        estimatedYearlyRevenue: 0
      },
      topPerformers: {
        mostViewed: [],
        mostLiked: [],
        highestEngagement: [],
        trending: []
      },
      recommendations: {
        contentStrategy: [],
        seoImprovements: [],
        uploadStrategy: [],
        engagementBoosts: []
      }
    };
  }
} 