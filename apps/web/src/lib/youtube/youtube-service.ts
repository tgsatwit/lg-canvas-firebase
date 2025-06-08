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

export class YouTubeService {
  private oauth2Client: any;
  private storage: Storage;

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
      const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      // If it starts with '{', it's JSON content, not a file path
      if (credentials.startsWith('{')) {
        try {
          storageConfig.credentials = JSON.parse(credentials);
        } catch (error) {
          console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS as JSON:', error);
        }
      } else {
        // It's a file path
        storageConfig.keyFilename = credentials;
      }
    }
    
    this.storage = new Storage(storageConfig);
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
      scope: ['https://www.googleapis.com/auth/youtube.upload'],
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
   * Download video from GCS and upload to YouTube
   */
  async uploadVideoFromGCS(
    gcpLink: string,
    options: YouTubeUploadOptions
  ): Promise<{ videoId: string; youtubeUrl: string }> {
    try {
      console.log('Starting YouTube upload from GCS:', { gcpLink, title: options.title });
      
      // Parse GCS URL to get bucket and file path
      const gcsUrl = new URL(gcpLink);
      const bucketName = gcsUrl.hostname;
      const filePath = gcsUrl.pathname.substring(1); // Remove leading slash

      console.log('Parsed GCS URL:', { bucketName, filePath });

      // Get file from GCS
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(filePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error(`File not found in GCS: ${gcpLink}`);
      }

      // Get file metadata for size
      const [metadata] = await file.getMetadata();
      const fileSize = metadata.size;

      // Create read stream from GCS
      const readStream = file.createReadStream();

      // Upload to YouTube
      const response = await youtube.videos.insert({
        auth: this.oauth2Client,
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: options.title,
            description: options.description,
            tags: options.tags || [],
            categoryId: options.categoryId || '28', // Science & Technology
          },
          status: {
            privacyStatus: options.privacyStatus || 'private',
            selfDeclaredMadeForKids: false,
          },
        },
        media: {
          body: readStream,
        },
      } as any);

      if (!response.data.id) {
        throw new Error('Failed to get video ID from YouTube response');
      }

      const videoId = response.data.id;
      const youtubeUrl = `https://youtube.com/watch?v=${videoId}`;

      return { videoId, youtubeUrl };
    } catch (error) {
      console.error('Error uploading video to YouTube:', error);
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
}

// Singleton instance
let youtubeService: YouTubeService | null = null;

export function getYouTubeService(): YouTubeService {
  if (!youtubeService) {
    youtubeService = new YouTubeService();
  }
  return youtubeService;
} 