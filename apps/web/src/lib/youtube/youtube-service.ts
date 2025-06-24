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
  private storage: Storage;
  private activeSessions: Map<string, UploadSession> = new Map();
  private testMode: boolean = false;

  constructor() {
    // Initialize OAuth2 client (traditional constructor)
    this.oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URL || 'http://localhost:3000/api/auth/youtube/callback'
    );

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
   * Test the connection to YouTube API
   */
  async testConnection(): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      console.log('🧪 Testing YouTube API connection...');
      
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
      
      console.log('✅ YouTube API connection successful');
      return {
        success: true,
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

      // For large files (>50MB), use resumable upload
      if (fileSize > 50 * 1024 * 1024) {
        console.log(`Large file detected (${Math.round(fileSize / 1024 / 1024)} MB). Using resumable upload.`);
        const result = await this.uploadLargeVideoResumable(file, fileSize, options, uploadId, progressCallback);
        return { ...result, uploadId };
      } else {
        console.log('Small file detected. Using simple upload.');
        const result = await this.uploadSmallVideoDirect(file, options);
        return { ...result, uploadId };
      }
      
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
}

// Singleton instance
let youtubeService: YouTubeService | null = null;

export function getYouTubeService(): YouTubeService {
  if (!youtubeService) {
    youtubeService = new YouTubeService();
  }
  return youtubeService;
} 