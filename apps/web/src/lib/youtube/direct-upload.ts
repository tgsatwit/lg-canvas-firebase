import { Storage } from '@google-cloud/storage';
import { adminFirestore } from '../firebase/admin';

const ResumableUpload = require('node-youtube-resumable-upload');

interface UploadProgress {
  uploadId: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  totalSize: number;
  uploadedSize: number;
  error?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
}

export class DirectYouTubeUploader {
  private storage: Storage;

  constructor() {
    // Initialize Google Cloud Storage with proper credentials handling
    let storageOptions: any = {};
    
    // Check if we have GOOGLE_APPLICATION_CREDENTIALS as JSON content
    const googleCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (googleCreds && googleCreds.trim().startsWith('{')) {
      try {
        // Parse JSON credentials directly
        const credentials = JSON.parse(googleCreds);
        storageOptions = {
          projectId: credentials.project_id,
          keyFilename: undefined,
          credentials: credentials
        };
        console.log('Using parsed Google Cloud credentials from environment variable');
      } catch (error) {
        console.warn('Failed to parse GOOGLE_APPLICATION_CREDENTIALS JSON, falling back to default:', error);
      }
    }
    
    this.storage = new Storage(storageOptions);
  }

  /**
   * Upload video to YouTube using proper resumable upload protocol
   */
  async uploadVideo(
    uploadId: string,
    gcpLink: string,
    title: string,
    description: string,
    testMode: boolean = false
  ): Promise<{ success: boolean; youtubeVideoId?: string; youtubeUrl?: string; error?: string }> {
    
    console.log(`[${uploadId}] Starting YouTube upload using resumable upload protocol`);
    console.log(`[${uploadId}] Video: ${title}`);
    console.log(`[${uploadId}] GCS: ${gcpLink}`);
    console.log(`[${uploadId}] Test Mode: ${testMode}`);

    try {
      // Update initial status
      await this.updateProgress(uploadId, {
        uploadId,
        status: 'uploading',
        progress: 0,
        totalSize: 0,
        uploadedSize: 0
      });

      // Parse GCS link
      const gcsMatch = gcpLink.match(/gs:\/\/([^\/]+)\/(.+)/);
      if (!gcsMatch) {
        throw new Error('Invalid GCS link format');
      }

      const [, bucketName, fileName] = gcsMatch;
      console.log(`[${uploadId}] Bucket: ${bucketName}, File: ${fileName}`);

      // Get file from GCS
      console.log(`[${uploadId}] Getting file info from GCS...`);
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(fileName);

      // Get file metadata
      const [metadata] = await file.getMetadata();
      const fileSize = parseInt(String(metadata.size || '0'));
      console.log(`[${uploadId}] File size: ${Math.round(fileSize / 1024 / 1024)}MB`);

      // Download file to temporary location for resumable upload
      // Extract just the filename from the path to avoid nested directories
      const justFileName = fileName.split('/').pop() || fileName;
      const tempFilePath = `/tmp/${uploadId}_${justFileName}`;
      console.log(`[${uploadId}] Downloading file to temporary location: ${tempFilePath}`);
      
      await file.download({ destination: tempFilePath });
      console.log(`[${uploadId}] File downloaded successfully`);

      // Update progress
      await this.updateProgress(uploadId, {
        uploadId,
        status: 'uploading',
        progress: 10,
        totalSize: fileSize,
        uploadedSize: 0
      });

      // Prepare OAuth2 tokens for resumable upload
      const tokens = {
        access_token: await this.getAccessToken(),
        refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/youtube.upload'
      };

      // Prepare video metadata
      const videoMetadata = {
        snippet: {
          title: title,
          description: description,
          tags: ['pilates', 'workout', 'fitness'],
          categoryId: '23', // Sports category
          defaultLanguage: 'en'
        },
        status: {
          privacyStatus: testMode ? 'private' : 'unlisted',
          selfDeclaredMadeForKids: false
        }
      };

      console.log(`[${uploadId}] Starting resumable upload to YouTube...`);

      // Create resumable upload instance
      const resumableUpload = new ResumableUpload();
      resumableUpload.tokens = tokens;
      resumableUpload.filepath = tempFilePath;
      resumableUpload.metadata = videoMetadata;
      resumableUpload.retry = 3;

      // Set up progress monitoring
      let lastProgressTime = Date.now();
      resumableUpload.on('progress', (progress: any) => {
        const now = Date.now();
        const progressPercent = Math.round((progress / fileSize) * 100);
        
        // Throttle progress updates to every 30 seconds
        if (now - lastProgressTime > 30000) {
          console.log(`[${uploadId}] Upload progress: ${progressPercent}% (${Math.round(progress / 1024 / 1024)}MB / ${Math.round(fileSize / 1024 / 1024)}MB)`);
          lastProgressTime = now;
          
          // Update Firestore progress
          this.updateProgress(uploadId, {
            uploadId,
            status: 'uploading',
            progress: progressPercent,
            totalSize: fileSize,
            uploadedSize: progress
          }).catch(console.error);
        }
      });

      // Handle upload completion
      const uploadResult = await new Promise<any>((resolve, reject) => {
        resumableUpload.on('success', (result: any) => {
          console.log(`[${uploadId}] Upload completed successfully!`);
          console.log(`[${uploadId}] YouTube Video ID: ${result.id}`);
          resolve(result);
        });

        resumableUpload.on('error', (error: any) => {
          console.error(`[${uploadId}] Upload failed:`, error);
          reject(error);
        });

        // Start the upload
        resumableUpload.upload();
      });

      const youtubeVideoId = uploadResult.id;
      const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;

      console.log(`[${uploadId}] YouTube URL: ${youtubeUrl}`);

      // Clean up temporary file
      try {
        const fs = require('fs');
        fs.unlinkSync(tempFilePath);
        console.log(`[${uploadId}] Temporary file cleaned up`);
      } catch (error) {
        console.warn(`[${uploadId}] Failed to clean up temporary file:`, error);
      }

      // Update final status
      await this.updateProgress(uploadId, {
        uploadId,
        status: 'completed',
        progress: 100,
        totalSize: fileSize,
        uploadedSize: fileSize,
        youtubeVideoId,
        youtubeUrl
      });

      return {
        success: true,
        youtubeVideoId,
        youtubeUrl
      };

    } catch (error: any) {
      console.error(`[${uploadId}] Upload failed:`, error);
      
      // Update error status
      await this.updateProgress(uploadId, {
        uploadId,
        status: 'error',
        progress: 0,
        totalSize: 0,
        uploadedSize: 0,
        error: error.message || 'Unknown error occurred'
      });

      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  /**
   * Get OAuth2 access token using refresh token
   */
  private async getAccessToken(): Promise<string> {
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

    if (!refreshToken || !clientId || !clientSecret) {
      throw new Error('YouTube OAuth2 credentials not configured');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Update upload progress in Firestore
   */
  private async updateProgress(uploadId: string, progress: UploadProgress): Promise<void> {
    try {
      const firestore = adminFirestore();
      if (firestore) {
        await firestore.collection('youtube_uploads').doc(uploadId).set(progress, { merge: true });
      }
    } catch (error) {
      console.error(`[${uploadId}] Failed to update progress:`, error);
    }
  }

  /**
   * Test YouTube API connection and authentication
   */
  async testConnection(): Promise<{ success: boolean; channelTitle?: string; subscriberCount?: number; error?: string }> {
    try {
      console.log('Testing YouTube API connection...');
      
      const accessToken = await this.getAccessToken();
      
      // Get channel information to verify authentication
      const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `API test failed: ${response.status} ${error}` };
      }

      const data = await response.json();
      const channel = data.items?.[0];
      
      if (channel) {
        const channelTitle = channel.snippet?.title;
        const subscriberCount = parseInt(channel.statistics?.subscriberCount || '0');
        
        console.log(`✅ YouTube API connection successful`);
        console.log(`✅ Channel: ${channelTitle}`);
        console.log(`✅ Subscribers: ${subscriberCount.toLocaleString()}`);
        
        return {
          success: true,
          channelTitle,
          subscriberCount
        };
      } else {
        throw new Error('No YouTube channel found for this account');
      }
    } catch (error: any) {
      console.error('❌ YouTube API connection failed:', error);
      return {
        success: false,
        error: error.message || 'Connection test failed'
      };
    }
  }
}

// Export singleton instance
export const youtubeUploader = new DirectYouTubeUploader(); 