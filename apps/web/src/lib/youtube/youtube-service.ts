import { google } from 'googleapis';
import { Storage } from '@google-cloud/storage';

const youtube = google.youtube('v3');

interface YouTubeUploadOptions {
  title: string;
  description: string;
  tags?: string[];
  privacyStatus?: 'private' | 'unlisted' | 'public';
  categoryId?: string;
}

interface UploadProgress {
  uploadId: string;
  progress: number;
  bytesUploaded: number;
  totalBytes: number;
  status: 'initializing' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  currentChunk?: number;
  totalChunks?: number;
  estimatedTimeRemaining?: number;
  uploadSpeed?: number;
}

interface UploadSession {
  uploadId: string;
  uploadUrl: string;
  fileSize: number;
  cancelled: boolean;
  startTime: number;
  lastProgressUpdate: number;
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}

export class YouTubeService {
  private oauth2Client: any;
  private serviceAccountAuth: any;
  private storage: Storage;
  private activeSessions: Map<string, UploadSession> = new Map();
  private testMode: boolean = false;
  private useServiceAccount: boolean = false;

  constructor() {
    // Initialize OAuth2 client (traditional constructor)
    this.oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URL || 'http://localhost:3000/api/auth/youtube/callback'
    );

    // Initialize Service Account if available
    this.initializeServiceAccount();

    // Initialize Google Cloud Storage
    // If credentials are not provided, GCS will try to use default credentials
    const storageConfig: any = {};
    
    if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
      storageConfig.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    }
    
    // Handle Google Cloud credentials - check if it's a file path or JSON content
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      let credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      console.log('Raw GOOGLE_APPLICATION_CREDENTIALS preview:', credentials.substring(0, 50) + '...');
      
      // Clean up the credentials string - remove surrounding quotes if present
      credentials = credentials.trim();
      
      // More aggressive quote removal - handle various quote scenarios
      while ((credentials.startsWith('"') && credentials.endsWith('"')) ||
             (credentials.startsWith("'") && credentials.endsWith("'")) ||
             credentials.startsWith('"') || credentials.startsWith("'")) {
        if ((credentials.startsWith('"') && credentials.endsWith('"')) ||
            (credentials.startsWith("'") && credentials.endsWith("'"))) {
          // Remove matching quotes
          credentials = credentials.slice(1, -1);
        } else if (credentials.startsWith('"') || credentials.startsWith("'")) {
          // Remove leading quote even if no matching end quote
          credentials = credentials.slice(1);
        }
        credentials = credentials.trim();
      }
      
      console.log('Cleaned credentials preview:', credentials.substring(0, 50) + '...');
      console.log('Starts with {:', credentials.startsWith('{'));
      
      // If it starts with '{', it's JSON content, not a file path
      if (credentials.startsWith('{')) {
        try {
          // First, let's validate that the JSON looks complete
          if (!credentials.includes('"private_key"') || !credentials.endsWith('}')) {
            throw new Error('JSON appears to be incomplete - missing private_key or ending brace');
          }
          
          storageConfig.credentials = JSON.parse(credentials);
          console.log('Using Google Cloud credentials from JSON string');
        } catch (error) {
          console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS as JSON:', error);
          console.error('Credentials length:', credentials.length);
          console.error('Credentials ends with }:', credentials.endsWith('}'));
          console.error('Contains private_key:', credentials.includes('"private_key"'));
          console.error('Last 50 characters:', credentials.slice(-50));
          
          // Don't set any credentials - let Google Cloud use default credentials
          console.log('Falling back to Google Cloud default credentials');
          // Make sure we don't accidentally set keyFilename
        }
      } else {
        // It's a file path
        storageConfig.keyFilename = credentials;
        console.log('Using Google Cloud credentials from file path:', credentials);
      }
    }
    
    this.storage = new Storage(storageConfig);
    
    // Check if test mode is enabled
    this.testMode = process.env.YOUTUBE_TEST_MODE === 'true';
    if (this.testMode) {
      console.log('⚠️ YouTube Service running in TEST MODE');
    }
  }

  /**
   * Initialize service account authentication if credentials are available
   */
  private initializeServiceAccount() {
    try {
      if (process.env.YOUTUBE_SERVICE_ACCOUNT) {
        console.log('🔐 Initializing YouTube service account...');
        
        let serviceAccountKey;
        if (typeof process.env.YOUTUBE_SERVICE_ACCOUNT === 'string') {
          serviceAccountKey = JSON.parse(process.env.YOUTUBE_SERVICE_ACCOUNT);
        } else {
          serviceAccountKey = process.env.YOUTUBE_SERVICE_ACCOUNT;
        }

        this.serviceAccountAuth = new google.auth.GoogleAuth({
          credentials: serviceAccountKey,
          scopes: [
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube.force-ssl'
          ],
        });

        this.useServiceAccount = true;
        console.log('✅ Service account initialized successfully');
      } else {
        console.log('⚠️ No service account credentials found, using OAuth2');
      }
    } catch (error) {
      console.error('❌ Failed to initialize service account:', error);
      this.useServiceAccount = false;
    }
  }

  /**
   * Get the appropriate auth client (service account or OAuth2)
   */
  private async getAuthClient() {
    if (this.useServiceAccount && this.serviceAccountAuth) {
      console.log('Using service account authentication');
      return await this.serviceAccountAuth.getClient();
    } else {
      console.log('Using OAuth2 authentication');
      return this.oauth2Client;
    }
  }

  /**
   * Test connection with service account
   */
  async testServiceAccountConnection(): Promise<{ success: boolean; error?: string; user?: any }> {
    if (!this.useServiceAccount || !this.serviceAccountAuth) {
      return {
        success: false,
        error: 'Service account not configured'
      };
    }

    try {
      console.log('🧪 Testing YouTube service account connection...');
      
      const authClient = await this.serviceAccountAuth.getClient();
      
      // Try to get channel information
      const response = await youtube.channels.list({
        auth: authClient,
        part: ['snippet', 'statistics'],
        mine: true,
      });
      
      const channel = response.data.items?.[0];
      if (!channel) {
        // If no channel found with 'mine: true', try with forUsername or id
        // Service accounts typically can't use 'mine: true'
        return {
          success: false,
          error: 'Service account cannot access channel data. YouTube Data API v3 requires OAuth2 for personal channels.'
        };
      }
      
      console.log('✅ YouTube service account connection successful');
      return {
        success: true,
        user: {
          channelId: channel.id,
          channelTitle: channel.snippet?.title,
          description: channel.snippet?.description,
        }
      };
      
    } catch (error: any) {
      console.error('❌ YouTube service account connection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch videos using service account or OAuth2
   */
  async fetchChannelVideos(channelId?: string, maxResults: number = 50) {
    try {
      console.log('🎬 Fetching YouTube videos...');
      
      const authClient = await this.getAuthClient();
      
      if (this.useServiceAccount && !channelId) {
        return {
          success: false,
          error: 'Channel ID required when using service account. Service accounts cannot use "mine: true".'
        };
      }

      // First, get the channel information
      let channelResponse;
      if (this.useServiceAccount && channelId) {
        channelResponse = await youtube.channels.list({
          auth: authClient,
          part: ['contentDetails', 'snippet', 'statistics'],
          id: [channelId],
        });
      } else {
        channelResponse = await youtube.channels.list({
          auth: authClient,
          part: ['contentDetails', 'snippet', 'statistics'],
          mine: true,
        });
      }

      const channel = channelResponse.data.items?.[0];
      if (!channel) {
        return {
          success: false,
          error: 'No YouTube channel found'
        };
      }

      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) {
        return {
          success: false,
          error: 'No uploads playlist found'
        };
      }

      // Get videos from the uploads playlist
      const playlistResponse = await youtube.playlistItems.list({
        auth: authClient,
        part: ['snippet', 'contentDetails'],
        playlistId: uploadsPlaylistId,
        maxResults: maxResults,
      });

      const playlistItems = playlistResponse.data.items || [];
      
      // Get detailed video information
      const videoIds = playlistItems
        .map(item => item.contentDetails?.videoId)
        .filter((id): id is string => Boolean(id));

      let videos: any[] = [];
      
      if (videoIds.length > 0) {
        const videosResponse = await youtube.videos.list({
          auth: authClient,
          part: ['snippet', 'statistics', 'status', 'contentDetails'],
          id: videoIds,
        } as any);

        videos = (videosResponse.data.items || []).map((video: any) => ({
          id: video.id,
          title: video.snippet?.title || 'Untitled',
          description: video.snippet?.description || '',
          thumbnail: {
            default: video.snippet?.thumbnails?.default?.url,
            medium: video.snippet?.thumbnails?.medium?.url,
            high: video.snippet?.thumbnails?.high?.url,
            standard: video.snippet?.thumbnails?.standard?.url,
            maxres: video.snippet?.thumbnails?.maxres?.url,
          },
          publishedAt: video.snippet?.publishedAt,
          channelId: video.snippet?.channelId,
          channelTitle: video.snippet?.channelTitle,
          tags: video.snippet?.tags || [],
          categoryId: video.snippet?.categoryId,
          defaultLanguage: video.snippet?.defaultLanguage,
          
          // Statistics
          viewCount: parseInt(video.statistics?.viewCount || '0'),
          likeCount: parseInt(video.statistics?.likeCount || '0'),
          dislikeCount: parseInt(video.statistics?.dislikeCount || '0'),
          favoriteCount: parseInt(video.statistics?.favoriteCount || '0'),
          commentCount: parseInt(video.statistics?.commentCount || '0'),
          
          // Status
          uploadStatus: video.status?.uploadStatus,
          privacyStatus: video.status?.privacyStatus,
          license: video.status?.license,
          embeddable: video.status?.embeddable,
          publicStatsViewable: video.status?.publicStatsViewable,
          
          // Content Details
          duration: video.contentDetails?.duration,
          dimension: video.contentDetails?.dimension,
          definition: video.contentDetails?.definition,
          caption: video.contentDetails?.caption,
          
          // Video URL
          url: `https://www.youtube.com/watch?v=${video.id}`,
          
          // Studio URL
          studioUrl: `https://studio.youtube.com/video/${video.id}/edit`,
        }));
      }

      // Channel information
      const channelInfo = {
        id: channel.id,
        title: channel.snippet?.title,
        description: channel.snippet?.description,
        customUrl: channel.snippet?.customUrl,
        publishedAt: channel.snippet?.publishedAt,
        thumbnails: channel.snippet?.thumbnails,
        country: channel.snippet?.country,
        
        // Statistics
        viewCount: parseInt(channel.statistics?.viewCount || '0'),
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
        hiddenSubscriberCount: channel.statistics?.hiddenSubscriberCount,
        videoCount: parseInt(channel.statistics?.videoCount || '0'),
      };

      return {
        success: true,
        channel: channelInfo,
        videos,
        authMethod: this.useServiceAccount ? 'service_account' : 'oauth2'
      };

    } catch (error: any) {
      console.error('Error fetching YouTube videos:', error);
      return {
        success: false,
        error: error.message,
        authMethod: this.useServiceAccount ? 'service_account' : 'oauth2'
      };
    }
  }

  /**
   * Enable or disable test mode
   */
  setTestMode(enabled: boolean) {
    this.testMode = enabled;
    console.log(`YouTube Service test mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Get the current status of all active uploads
   */
  getActiveUploads(): { [uploadId: string]: UploadProgress } {
    const status: { [uploadId: string]: UploadProgress } = {};
    
    this.activeSessions.forEach((session, uploadId) => {
      status[uploadId] = {
        uploadId,
        progress: 0,
        bytesUploaded: 0,
        totalBytes: session.fileSize,
        status: session.cancelled ? 'cancelled' : 'uploading',
        currentChunk: 0,
        totalChunks: Math.ceil(session.fileSize / (10 * 1024 * 1024)), // 10MB chunks
      };
    });
    
    return status;
  }

  /**
   * Cancel an active upload
   */
  cancelUpload(uploadId: string): boolean {
    const session = this.activeSessions.get(uploadId);
    if (session) {
      console.log(`🛑 Cancelling upload: ${uploadId}`);
      session.cancelled = true;
      
      // Notify about cancellation
      if (session.onProgress) {
        session.onProgress({
          uploadId,
          progress: 0,
          bytesUploaded: 0,
          totalBytes: session.fileSize,
          status: 'cancelled',
        });
      }
      
      // Clean up session after a short delay
      setTimeout(() => {
        this.activeSessions.delete(uploadId);
      }, 5000);
      
      return true;
    }
    return false;
  }

  /**
   * Cancel all active uploads
   */
  cancelAllUploads(): number {
    const cancelledCount = this.activeSessions.size;
    console.log(`🛑 Cancelling all uploads (${cancelledCount} active)`);
    
    this.activeSessions.forEach((session, uploadId) => {
      this.cancelUpload(uploadId);
    });
    
    return cancelledCount;
  }

  /**
   * Set the OAuth2 credentials
   */
  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Get OAuth2 authorization URL
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.force-ssl'
      ],
      prompt: 'consent',
      include_granted_scopes: true,
      state: Date.now().toString(), // Add state for security
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string) {
    try {
      console.log('Attempting to exchange code for tokens...');
      const { tokens } = await this.oauth2Client.getToken(code);
      console.log('Successfully obtained tokens');
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', {
        error: error.message,
        code: error.code,
        status: error.status,
        details: error.response?.data
      });
      throw new Error(`Failed to exchange authorization code: ${error.message}`);
    }
  }

  /**
   * Test the connection to YouTube API (tries service account first, then OAuth2)
   */
  async testConnection(): Promise<{ success: boolean; error?: string; user?: any; authMethod?: string }> {
    // Try service account first
    if (this.useServiceAccount) {
      console.log('🧪 Testing YouTube service account connection...');
      const result = await this.testServiceAccountConnection();
      if (result.success) {
        return { ...result, authMethod: 'service_account' };
      } else {
        console.log('Service account failed, falling back to OAuth2:', result.error);
      }
    }

    // Fall back to OAuth2
    try {
      console.log('🧪 Testing YouTube OAuth2 connection...');
      
      // Check if we have credentials
      if (!this.oauth2Client.credentials?.access_token) {
        throw new Error('No access token available');
      }
      
      // Try to get channel information
      const response = await youtube.channels.list({
        auth: this.oauth2Client,
        part: ['snippet'],
        mine: true,
      } as any);
      
      const channel = response.data.items?.[0];
      if (!channel) {
        throw new Error('No channel found for authenticated user');
      }
      
      console.log('✅ YouTube OAuth2 connection successful');
      return {
        success: true,
        authMethod: 'oauth2',
        user: {
          channelId: channel.id,
          channelTitle: channel.snippet?.title,
          description: channel.snippet?.description,
        }
      };
      
    } catch (error: any) {
      console.error('❌ YouTube API connection failed:', error);
      return {
        success: false,
        authMethod: 'oauth2',
        error: error.message
      };
    }
  }

  /**
   * Test upload with a small dummy file
   */
  async testUpload(): Promise<{ success: boolean; error?: string; videoId?: string }> {
    if (!this.testMode) {
      throw new Error('Test uploads can only be performed in test mode');
    }
    
    try {
      console.log('🧪 Starting test upload...');
      
      // Create a small test video (this would be a minimal video file in practice)
      const testMetadata = {
        title: `Test Upload - ${new Date().toISOString()}`,
        description: 'This is a test upload from the YouTube service. It will be deleted shortly.',
        tags: ['test', 'automated'],
        privacyStatus: 'private' as const,
      };
      
      // In test mode, we'll simulate an upload without actually uploading
      console.log('⚠️ Simulating upload in test mode');
      
      // Return a mock successful result
      return {
        success: true,
        videoId: 'test_video_' + Date.now()
      };
      
    } catch (error: any) {
      console.error('❌ Test upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download video from GCS and upload to YouTube using resumable upload for large files
   */
  async uploadVideoFromGCS(
    gcpLink: string,
    options: YouTubeUploadOptions,
    progressCallback?: (progress: UploadProgress) => void
  ): Promise<{ videoId: string; youtubeUrl: string; uploadId: string }> {
    try {
      console.log('Starting YouTube upload from GCS:', { gcpLink, title: options.title });
      
      // Parse GCS URL to get bucket and file path
      const gcsUrl = new URL(gcpLink);
      const bucketName = gcsUrl.hostname;
      const filePath = gcsUrl.pathname.substring(1); // Remove leading slash

      console.log('Parsed GCS URL:', { bucketName, filePath });

      // Get file from GCS
      console.log('Getting GCS bucket and file...');
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(filePath);
      
      // Check if file exists
      console.log('Checking if file exists in GCS...');
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error(`File not found in GCS: ${gcpLink}`);
      }
      console.log('File exists in GCS ✓');

      // Get file metadata for size
      console.log('Getting file metadata...');
      const [metadata] = await file.getMetadata();
      const fileSize = typeof metadata.size === 'string' ? parseInt(metadata.size, 10) : (metadata.size || 0);
      console.log('File metadata:', { fileSize, contentType: metadata.contentType });

      // Generate unique upload ID
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Use streaming upload for better performance (YouTube recommends avoiding chunking)
      console.log(`File size: ${Math.round(fileSize / 1024 / 1024)} MB. Using optimized streaming upload.`);
      const result = await this.uploadVideoStreamOptimized(file, fileSize, options, uploadId, progressCallback);
      return { ...result, uploadId };
      
    } catch (error) {
      console.error('Error uploading video to YouTube:', error);
      throw error;
    }
  }

  /**
   * Upload large video using YouTube resumable upload with proper error handling and retries
   */
  private async uploadLargeVideoResumable(
    file: any,
    fileSize: number,
    options: YouTubeUploadOptions,
    uploadId: string,
    progressCallback?: (progress: UploadProgress) => void
  ): Promise<{ videoId: string; youtubeUrl: string }> {
    console.log('Starting resumable upload process...');
    
    // Step 1: Create resumable upload session
    const uploadUrl = await this.createResumableUploadSession(options, fileSize);
    console.log('Resumable upload session created');
    
    // Create session tracking
    const session: UploadSession = {
      uploadId,
      uploadUrl,
      fileSize,
      cancelled: false,
      startTime: Date.now(),
      lastProgressUpdate: Date.now(),
      onProgress: progressCallback
    };
    
    this.activeSessions.set(uploadId, session);
    
    try {
      // Step 2: Upload file in chunks
      const result = await this.uploadFileInChunksWithRetry(session, file);
      console.log('File upload completed, video response:', result);
      
      if (!result?.id) {
        throw new Error('Failed to get video ID from YouTube response');
      }

      const videoId = result.id;
      const youtubeUrl = `https://youtube.com/watch?v=${videoId}`;

      console.log('Upload successful:', { videoId, youtubeUrl });

      // Update progress to completed
      if (progressCallback) {
        progressCallback({
          uploadId,
          progress: 100,
          bytesUploaded: fileSize,
          totalBytes: fileSize,
          status: 'completed',
        });
      }

      return { videoId, youtubeUrl };
      
    } finally {
      // Clean up session
      this.activeSessions.delete(uploadId);
    }
  }

  /**
   * Optimized streaming upload - uploads directly without chunking for best performance
   */
  private async uploadVideoStreamOptimized(
    file: any,
    fileSize: number,
    options: YouTubeUploadOptions,
    uploadId: string,
    progressCallback?: (progress: UploadProgress) => void
  ): Promise<{ videoId: string; youtubeUrl: string }> {
    console.log('Starting optimized streaming upload...');
    
    // Step 1: Create resumable upload session
    const uploadUrl = await this.createResumableUploadSession(options, fileSize);
    console.log('Resumable upload session created for streaming');
    
    // Create session tracking
    const session: UploadSession = {
      uploadId,
      uploadUrl,
      fileSize,
      cancelled: false,
      startTime: Date.now(),
      lastProgressUpdate: Date.now(),
      onProgress: progressCallback
    };
    
    this.activeSessions.set(uploadId, session);
    
    try {
      // Step 2: Stream upload directly to YouTube
      const result = await this.uploadFileStreamDirect(session, file);
      console.log('Streaming upload completed, video response:', result);
      
      return {
        videoId: result.id,
        youtubeUrl: `https://www.youtube.com/watch?v=${result.id}`
      };
    } catch (error) {
      console.error('Error in streaming upload:', error);
      throw error;
    } finally {
      this.activeSessions.delete(uploadId);
    }
  }

  /**
   * Upload file using streaming without chunking - recommended by YouTube for performance
   */
  private async uploadFileStreamDirect(
    session: UploadSession,
    file: any
  ): Promise<any> {
    console.log('Starting direct stream upload to YouTube...');
    
    // If in test mode, simulate upload
    if (this.testMode) {
      return this.simulateStreamUpload(session);
    }
    
    // Create read stream from GCS file
    const readStream = file.createReadStream();
    
    try {
      console.log('🚀 Starting memory-optimized stream upload to YouTube...');
      console.log(`📊 Upload details: ${Math.round(session.fileSize / 1024 / 1024)}MB file`);
      
      // Use native Node.js streams instead of axios to avoid memory buffering
      const https = require('https');
      const { URL } = require('url');
      
      const uploadUrlParsed = new URL(session.uploadUrl);
      
      console.log('🔗 Parsed upload URL:', {
        host: uploadUrlParsed.host,
        pathname: uploadUrlParsed.pathname,
        protocol: uploadUrlParsed.protocol
      });
      
      // Create the upload using native Node.js HTTPS with streaming
      const result = await new Promise((resolve, reject) => {
        const options = {
          hostname: uploadUrlParsed.hostname,
          port: uploadUrlParsed.port || 443,
          path: uploadUrlParsed.pathname + uploadUrlParsed.search,
          method: 'PUT',
          headers: {
            'Content-Length': session.fileSize.toString(),
            'Content-Type': 'video/*'
          },
          timeout: 60 * 60 * 1000, // 60 minute timeout
        };
        
        console.log('📡 Creating HTTPS request with options:', options);
        
        const req = https.request(options, (res: any) => {
          console.log('📥 Response status:', res.statusCode);
          console.log('📥 Response headers:', res.headers);
          
          let responseData = '';
          
          res.on('data', (chunk: any) => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            console.log('✅ Upload response completed');
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsedData = responseData ? JSON.parse(responseData) : {};
                resolve(parsedData);
              } catch (e) {
                // Some successful uploads return empty responses
                resolve({ success: true });
              }
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          });
        });
        
        req.on('error', (error: any) => {
          console.error('💥 HTTPS request error:', error);
          reject(error);
        });
        
        req.on('timeout', () => {
          console.error('⏰ HTTPS request timeout');
          req.destroy();
          reject(new Error('Upload timeout'));
        });
        
        // Track upload progress
        let uploadedBytes = 0;
        const startTime = Date.now();
        
        readStream.on('data', (chunk: any) => {
          uploadedBytes += chunk.length;
          const progress = Math.round((uploadedBytes / session.fileSize) * 100);
          const currentTime = Date.now();
          const timeElapsed = currentTime - startTime;
          const uploadSpeed = uploadedBytes / (timeElapsed / 1000); // bytes per second
          const estimatedTimeRemaining = uploadSpeed > 0 ? 
            Math.round((session.fileSize - uploadedBytes) / uploadSpeed) : 0;
          
          // Update progress callback
          if (session.onProgress) {
            session.onProgress({
              uploadId: session.uploadId,
              progress,
              bytesUploaded: uploadedBytes,
              totalBytes: session.fileSize,
              status: 'uploading',
              estimatedTimeRemaining,
              uploadSpeed: Math.round(uploadSpeed / 1024 / 1024 * 100) / 100, // MB/s
              currentChunk: 1,
              totalChunks: 1
            });
          }
          
          // Throttled console logging (every 5%)
          if (progress > 0 && progress % 5 === 0 && 
              currentTime - session.lastProgressUpdate > 5000) {
            console.log(
              `🔄 Upload progress: ${progress}% (${Math.round(uploadedBytes / 1024 / 1024)}MB / ${Math.round(session.fileSize / 1024 / 1024)}MB) - ${Math.round(uploadSpeed / 1024 / 1024 * 100) / 100} MB/s`
            );
            session.lastProgressUpdate = currentTime;
          }
        });
        
        readStream.on('error', (error: any) => {
          console.error('💥 Read stream error:', error);
          req.destroy();
          reject(error);
        });
        
        readStream.on('end', () => {
          console.log('📤 File stream completed');
        });
        
        // Pipe the file stream to the HTTPS request (memory efficient!)
        console.log('🚰 Piping file stream to HTTPS request...');
        readStream.pipe(req);
      });
      
      console.log('✅ Native HTTPS upload completed successfully');
      return result;
      
    } catch (error: any) {
      console.error('❌ Stream upload failed:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Check if it's a network error that should be retried with chunked upload
      if (error.code === 'ECONNRESET' || 
          error.code === 'ETIMEDOUT' || 
          error.code === 'ECONNABORTED' ||
          (error.response && error.response.status >= 500) ||
          error.message?.includes('timeout')) {
        console.log('🔄 Network/timeout error detected, falling back to chunked upload...');
        
        // Reset the session for chunked upload
        session.startTime = Date.now();
        session.lastProgressUpdate = Date.now();
        
        // Fallback to chunked upload for unreliable networks or timeouts
        return this.uploadFileInChunksWithRetry(session, file);
      }
      
      throw error;
    }
  }

  /**
   * Simulate streaming upload for test mode
   */
  private async simulateStreamUpload(session: UploadSession): Promise<any> {
    console.log('🧪 Simulating streaming upload in test mode...');
    
    // Simulate upload progress
    const totalSteps = 20;
    for (let i = 0; i <= totalSteps; i++) {
      const progress = Math.round((i / totalSteps) * 100);
      const uploadedBytes = Math.round((session.fileSize * i) / totalSteps);
      
      if (session.onProgress) {
        session.onProgress({
          uploadId: session.uploadId,
          progress,
          bytesUploaded: uploadedBytes,
          totalBytes: session.fileSize,
          status: 'uploading',
          estimatedTimeRemaining: ((totalSteps - i) * 500) / 1000,
          uploadSpeed: 10, // Simulated 10 MB/s
          currentChunk: 1,
          totalChunks: 1
        });
      }
      
      // Simulate upload time
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return {
      id: `test_video_${Date.now()}`,
      snippet: { title: 'Test Video' }
    };
  }

  /**
   * Create resumable upload session following official YouTube API specification
   */
  private async createResumableUploadSession(options: YouTubeUploadOptions, fileSize: number): Promise<string> {
    console.log('Creating resumable upload session...');
    
    try {
      const axios = require('axios');
      
      // If in test mode, return a mock upload URL
      if (this.testMode) {
        console.log('⚠️ Test mode: returning mock upload URL');
        return 'https://mock.youtube.upload.url/test';
      }
      
      // Step 1: Create the video resource metadata
      const metadata = {
        snippet: {
          title: options.title,
          description: options.description,
          tags: options.tags || [],
          categoryId: options.categoryId || '28',
        },
        status: {
          privacyStatus: options.privacyStatus || 'private',
          selfDeclaredMadeForKids: false,
        },
      };
      
      // Get access token from OAuth2 client
      const accessToken = this.oauth2Client.credentials.access_token;
      if (!accessToken) {
        throw new Error('No access token available');
      }

      console.log('Initiating resumable upload session with YouTube API...');
      
      // Step 1: POST request to initiate resumable session
      const response = await axios.post(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        metadata,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Length': fileSize.toString(),
            'X-Upload-Content-Type': 'video/*',
          },
          timeout: 30000, // 30 second timeout for session creation
        }
      );

      // Step 2: Extract the Location header which contains the upload URL
      const uploadUrl = response.headers.location;
      if (!uploadUrl) {
        throw new Error('No upload URL received from YouTube API');
      }

      console.log('Resumable upload session created successfully');
      console.log('Upload URL received from YouTube');
      
      return uploadUrl;
      
    } catch (error: any) {
      console.error('Error creating resumable upload session:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Upload file in chunks using resumable upload with retry logic and proper error handling
   */
  private async uploadFileInChunksWithRetry(session: UploadSession, readStream: any): Promise<any> {
    const axios = require('axios');
    
    // Use 10MB chunks for better reliability with large files
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds
    
    const totalChunks = Math.ceil(session.fileSize / CHUNK_SIZE);
    
    console.log(`Starting chunked upload: ${totalChunks} chunks of ${CHUNK_SIZE / 1024 / 1024}MB each`);
    
    // If in test mode, simulate upload
    if (this.testMode) {
      return this.simulateChunkedUpload(session, totalChunks);
    }
    
    // Convert stream to buffer for chunked upload
    console.log('Reading file stream into memory...');
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      readStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      readStream.on('end', async () => {
        try {
          console.log('File stream read complete, starting chunk upload...');
          const fileBuffer = Buffer.concat(chunks);
          console.log(`Total file size in buffer: ${fileBuffer.length} bytes`);
          
          // Upload in chunks with retry logic
          let uploadedBytes = 0;
          
          for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            // Check for cancellation
            if (session.cancelled) {
              console.log('Upload cancelled by user');
              reject(new Error('Upload cancelled by user'));
              return;
            }
            
            const start = chunkIndex * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE - 1, session.fileSize - 1);
            const chunkBuffer = fileBuffer.slice(start, end + 1);
            
            const progress = Math.round((uploadedBytes / session.fileSize) * 100);
            const currentTime = Date.now();
            const timeElapsed = currentTime - session.startTime;
            const uploadSpeed = uploadedBytes / (timeElapsed / 1000); // bytes per second
            const estimatedTimeRemaining = uploadSpeed > 0 ? (session.fileSize - uploadedBytes) / uploadSpeed : 0;
            
            console.log(`Uploading chunk ${chunkIndex + 1}/${totalChunks}: bytes ${start}-${end}/${session.fileSize} (${progress}%)`);
            
            // Update progress
            if (session.onProgress) {
              session.onProgress({
                uploadId: session.uploadId,
                progress,
                bytesUploaded: uploadedBytes,
                totalBytes: session.fileSize,
                status: 'uploading',
                currentChunk: chunkIndex + 1,
                totalChunks,
                estimatedTimeRemaining,
                uploadSpeed,
              });
            }
            
            // Retry logic for chunk upload
            let chunkUploaded = false;
            let lastError: any = null;
            
            for (let retryCount = 0; retryCount <= MAX_RETRIES && !chunkUploaded; retryCount++) {
              if (session.cancelled) {
                reject(new Error('Upload cancelled by user'));
                return;
              }
              
              try {
                if (retryCount > 0) {
                  console.log(`Retrying chunk ${chunkIndex + 1}, attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
                  await this.delay(RETRY_DELAY * retryCount); // Exponential backoff
                }
                
                const response = await axios.put(session.uploadUrl, chunkBuffer, {
                  headers: {
                    'Content-Range': `bytes ${start}-${end}/${session.fileSize}`,
                    'Content-Length': chunkBuffer.length.toString(),
                    'Content-Type': 'video/*',
                  },
                  timeout: 300000, // 5 minute timeout per chunk
                  maxContentLength: Infinity,
                  maxBodyLength: Infinity,
                });
                
                uploadedBytes = end + 1;
                chunkUploaded = true;
                
                // Check if upload is complete
                if (response.status === 200 || response.status === 201) {
                  console.log('Upload completed successfully!');
                  console.log('Final response:', response.data);
                  resolve(response.data);
                  return;
                } else if (response.status === 308) {
                  // Resume incomplete - continue with next chunk
                  console.log('Chunk uploaded successfully, continuing...');
                  continue;
                } else {
                  throw new Error(`Unexpected response status: ${response.status}`);
                }
                
              } catch (chunkError: any) {
                lastError = chunkError;
                console.error(`Error uploading chunk ${chunkIndex + 1} (attempt ${retryCount + 1}):`, {
                  status: chunkError.response?.status,
                  statusText: chunkError.response?.statusText,
                  data: chunkError.response?.data,
                  message: chunkError.message
                });
                
                // If it's a 5xx error or network error, retry
                if (retryCount < MAX_RETRIES && (
                  chunkError.code === 'ECONNRESET' ||
                  chunkError.code === 'ETIMEDOUT' ||
                  (chunkError.response?.status >= 500)
                )) {
                  console.log(`Will retry chunk ${chunkIndex + 1} due to ${chunkError.response?.status || chunkError.code}`);
                  continue;
                }
                
                // If it's a 4xx error, don't retry
                break;
              }
            }
            
            if (!chunkUploaded) {
              console.error(`Failed to upload chunk ${chunkIndex + 1} after ${MAX_RETRIES + 1} attempts`);
              reject(lastError || new Error(`Failed to upload chunk ${chunkIndex + 1}`));
              return;
            }
          }
          
          // If we get here, something went wrong
          reject(new Error('Upload completed but no final response received'));
          
        } catch (error) {
          console.error('Error during chunk upload:', error);
          reject(error);
        }
      });
      
      readStream.on('error', (error: any) => {
        console.error('Error reading file stream:', error);
        reject(error);
      });
    });
  }

  /**
   * Simulate chunked upload for testing
   */
  private async simulateChunkedUpload(session: UploadSession, totalChunks: number): Promise<any> {
    console.log('⚠️ Simulating chunked upload in test mode');
    
    for (let i = 0; i < totalChunks; i++) {
      if (session.cancelled) {
        throw new Error('Upload cancelled by user');
      }
      
      // Simulate chunk upload time
      await this.delay(100);
      
      const progress = Math.round(((i + 1) / totalChunks) * 100);
      const bytesUploaded = Math.round((session.fileSize * (i + 1)) / totalChunks);
      
      if (session.onProgress) {
        session.onProgress({
          uploadId: session.uploadId,
          progress,
          bytesUploaded,
          totalBytes: session.fileSize,
          status: 'uploading',
          currentChunk: i + 1,
          totalChunks,
        });
      }
      
      console.log(`Simulated chunk ${i + 1}/${totalChunks} (${progress}%)`);
    }
    
    // Return mock successful response
    return {
      id: 'test_video_' + Date.now(),
      snippet: {
        title: 'Test Video'
      }
    };
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Upload small video using direct upload (fallback for small files)
   */
  private async uploadSmallVideoDirect(
    file: any,
    options: YouTubeUploadOptions
  ): Promise<{ videoId: string; youtubeUrl: string }> {
    console.log('Using direct upload for small file...');
    
    // If in test mode, return mock result
    if (this.testMode) {
      console.log('⚠️ Test mode: returning mock direct upload result');
      const mockVideoId = 'test_small_' + Date.now();
      return {
        videoId: mockVideoId,
        youtubeUrl: `https://youtube.com/watch?v=${mockVideoId}`
      };
    }
    
    const readStream = file.createReadStream();
    
    const uploadRequest = {
      auth: this.oauth2Client,
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: options.title,
          description: options.description,
          tags: options.tags || [],
          categoryId: options.categoryId || '28',
        },
        status: {
          privacyStatus: options.privacyStatus || 'private',
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: readStream,
      },
    };

    try {
      const response = await youtube.videos.insert(uploadRequest as any);
      
      if (!response.data.id) {
        throw new Error('Failed to get video ID from YouTube response');
      }

      const videoId = response.data.id;
      const youtubeUrl = `https://youtube.com/watch?v=${videoId}`;
      
      console.log('Direct upload successful:', { videoId, youtubeUrl });
      return { videoId, youtubeUrl };
    } catch (error) {
      console.error('Error in direct upload:', error);
      throw error;
    }
  }

  /**
   * Update video metadata
   */
  async updateVideo(
    videoId: string,
    updates: Partial<YouTubeUploadOptions>
  ): Promise<void> {
    try {
      if (this.testMode) {
        console.log('⚠️ Test mode: simulating video update for', videoId);
        return;
      }
      
      await youtube.videos.update({
        auth: this.oauth2Client,
        part: ['snippet', 'status'],
        requestBody: {
          id: videoId,
          snippet: {
            title: updates.title,
            description: updates.description,
            tags: updates.tags,
            categoryId: updates.categoryId,
          },
          status: {
            privacyStatus: updates.privacyStatus,
          },
        },
      } as any);
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  }

  /**
   * Get video details
   */
  async getVideo(videoId: string) {
    try {
      if (this.testMode) {
        console.log('⚠️ Test mode: returning mock video details for', videoId);
        return {
          id: videoId,
          snippet: {
            title: 'Test Video',
            description: 'Test video description',
            tags: ['test'],
          },
          status: {
            privacyStatus: 'private',
          },
          statistics: {
            viewCount: '0',
            likeCount: '0',
            commentCount: '0',
          }
        };
      }
      
      const response = await youtube.videos.list({
        auth: this.oauth2Client,
        part: ['snippet', 'status', 'statistics'],
        id: [videoId],
      } as any);

      return response.data.items?.[0];
    } catch (error) {
      console.error('Error getting video details:', error);
      throw error;
    }
  }

  /**
   * Delete a video (useful for cleaning up test videos)
   */
  async deleteVideo(videoId: string): Promise<boolean> {
    try {
      if (this.testMode) {
        console.log('⚠️ Test mode: simulating video deletion for', videoId);
        return true;
      }
      
      await youtube.videos.delete({
        auth: this.oauth2Client,
        id: videoId,
      } as any);
      
      console.log('Video deleted successfully:', videoId);
      return true;
    } catch (error) {
      console.error('Error deleting video:', error);
      return false;
    }
  }

  /**
   * Get upload status for monitoring
   */
  getUploadStatus(uploadId: string): UploadProgress | null {
    const session = this.activeSessions.get(uploadId);
    if (!session) {
      return null;
    }
    
    return {
      uploadId,
      progress: 0, // This would be updated during actual upload
      bytesUploaded: 0,
      totalBytes: session.fileSize,
      status: session.cancelled ? 'cancelled' : 'uploading',
    };
  }

  /**
   * Clean up old completed sessions
   */
  cleanupCompletedSessions() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    this.activeSessions.forEach((session, uploadId) => {
      if (now - session.lastProgressUpdate > maxAge) {
        console.log(`Cleaning up old session: ${uploadId}`);
        this.activeSessions.delete(uploadId);
      }
    });
  }

  /**
   * Load credentials from cookies (for use in API routes)
   */
  async loadCredentialsFromCookies(cookieStore: any): Promise<boolean> {
    try {
      const accessToken = cookieStore.get('youtube_access_token');
      const refreshToken = cookieStore.get('youtube_refresh_token');
      const tokenExpiry = cookieStore.get('youtube_token_expiry');

      if (!accessToken?.value) {
        return false;
      }

      const tokens = {
        access_token: accessToken.value,
        refresh_token: refreshToken?.value,
        expiry_date: tokenExpiry?.value ? parseInt(tokenExpiry.value) : undefined,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/youtube'
      };

      this.setCredentials(tokens);
      return true;
    } catch (error) {
      console.error('Error loading credentials from cookies:', error);
      return false;
    }
  }
}

// Singleton instance
let youtubeService: YouTubeService | null = null;

export function getYouTubeService(): YouTubeService {
  if (!youtubeService) {
    youtubeService = new YouTubeService();
  }
  return youtubeService;
} 