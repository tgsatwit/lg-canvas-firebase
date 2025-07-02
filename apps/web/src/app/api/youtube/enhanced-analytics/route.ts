import { NextRequest, NextResponse } from 'next/server';
import { EnhancedAnalyticsService } from '@/lib/youtube/enhanced-analytics';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching enhanced YouTube analytics...');
    
    // Get stored videos directly from the API
    const videosResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/youtube/videos/stored?limit=100`);
    if (!videosResponse.ok) {
      throw new Error('Failed to fetch stored videos');
    }
    const videosData = await videosResponse.json();
    const videos = videosData.videos || [];
    
    if (!videos || videos.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'NO_VIDEOS',
        message: 'No videos found. Please sync your YouTube videos first.',
        analytics: EnhancedAnalyticsService.calculateEnhancedAnalytics([])
      });
    }
    
    console.log(`📈 Analyzing ${videos.length} videos for enhanced insights...`);
    
    // Calculate enhanced analytics
    const enhancedAnalytics = EnhancedAnalyticsService.calculateEnhancedAnalytics(videos);
    
    console.log('✅ Enhanced analytics calculated successfully');
    
    return NextResponse.json({
      success: true,
      analytics: enhancedAnalytics,
      videosAnalyzed: videos.length,
      lastUpdated: new Date().toISOString(),
      summary: {
        totalViews: enhancedAnalytics.performance.totalViews,
        totalVideos: videos.length,
        engagementScore: enhancedAnalytics.performance.engagementScore,
        growthRate: enhancedAnalytics.growth.growthRate,
        estimatedMonthlyRevenue: enhancedAnalytics.revenue.estimatedMonthlyRevenue
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error calculating enhanced analytics:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'ANALYTICS_ERROR',
        details: error.message || 'Failed to calculate enhanced analytics',
        analytics: EnhancedAnalyticsService.calculateEnhancedAnalytics([])
      },
      { status: 500 }
    );
  }
} 