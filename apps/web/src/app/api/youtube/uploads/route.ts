import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';
import { getServerUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerUser();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    const youtubeService = getYouTubeService();
    
    if (uploadId) {
      // Get specific upload status
      const status = youtubeService.getUploadStatus(uploadId);
      
      if (!status) {
        return NextResponse.json({
          error: "Upload not found"
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        upload: status
      });
    } else {
      // Get all active uploads
      const activeUploads = youtubeService.getActiveUploads();
      
      return NextResponse.json({
        success: true,
        uploads: activeUploads,
        count: Object.keys(activeUploads).length
      });
    }
    
  } catch (error: any) {
    console.error('Error getting upload status:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerUser();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');
    const cancelAll = searchParams.get('cancelAll') === 'true';

    const youtubeService = getYouTubeService();
    
    if (cancelAll) {
      console.log('🛑 Cancel all uploads requested');
      const cancelledCount = youtubeService.cancelAllUploads();
      
      return NextResponse.json({
        success: true,
        message: `Cancelled ${cancelledCount} uploads`,
        cancelledCount
      });
    } else if (uploadId) {
      console.log(`🛑 Cancel upload requested: ${uploadId}`);
      const cancelled = youtubeService.cancelUpload(uploadId);
      
      if (cancelled) {
        return NextResponse.json({
          success: true,
          message: `Upload ${uploadId} cancelled`,
          uploadId
        });
      } else {
        return NextResponse.json({
          error: "Upload not found or already completed"
        }, { status: 404 });
      }
    } else {
      return NextResponse.json({
        error: "uploadId parameter required"
      }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('Error cancelling upload:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerUser();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const youtubeService = getYouTubeService();
    
    if (action === 'cleanup') {
      console.log('🧹 Cleanup completed sessions requested');
      youtubeService.cleanupCompletedSessions();
      
      return NextResponse.json({
        success: true,
        message: "Completed sessions cleaned up"
      });
    } else {
      return NextResponse.json({
        error: "Invalid action"
      }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('Error in upload management:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 