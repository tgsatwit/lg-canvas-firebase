import { google } from 'googleapis';

const youtube = google.youtube('v3');

export interface TranscriptItem {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptResult {
  success: boolean;
  transcript?: string;
  transcriptItems?: TranscriptItem[];
  error?: string;
  method?: 'captions_api' | 'public_api' | 'manual' | 'none';
}

export class TranscriptService {
  private oauth2Client: any;

  constructor(oauth2Client: any) {
    this.oauth2Client = oauth2Client;
  }

  /**
   * Fetch video transcript using non-sensitive methods only
   */
  async fetchTranscript(videoId: string): Promise<TranscriptResult> {
    console.log(`🔍 Fetching transcript for video: ${videoId}`);

    try {
      // Skip Captions API (requires sensitive youtubepartner scope)
      console.log('📋 Skipping YouTube Captions API (requires sensitive scopes)...');

      // Method 1: Try youtube-transcript library (public transcript extraction)
      const publicResult = await this.fetchFromPublicTranscript(videoId);
      if (publicResult.success) {
        return publicResult;
      }

      // Method 2: Try to extract from video description or other metadata
      const videoResult = await this.extractFromVideoMetadata(videoId);
      if (videoResult.success) {
        return videoResult;
      }

      // Method 3: Return empty transcript with information
      return {
        success: false,
        error: 'No transcript available through non-sensitive API methods',
        method: 'none'
      };

    } catch (error: any) {
      console.error('❌ Error fetching transcript:', error);
      return {
        success: false,
        error: error.message,
        method: 'none'
      };
    }
  }

  /**
   * Fetch captions using YouTube Data API v3
   */
  private async fetchFromCaptionsAPI(videoId: string): Promise<TranscriptResult> {
    try {
      console.log('📋 Skipping YouTube Captions API (requires sensitive scopes)...');

      // Make sure OAuth2 client has valid tokens
      if (this.oauth2Client.credentials?.refresh_token && !this.oauth2Client.credentials?.access_token) {
        console.log('🔄 Refreshing OAuth2 token for captions...');
        try {
          const { credentials } = await this.oauth2Client.refreshAccessToken();
          this.oauth2Client.setCredentials(credentials);
          console.log('✅ Token refreshed for captions API');
        } catch (refreshError) {
          console.error('❌ Failed to refresh token for captions:', refreshError);
          throw new Error('Authentication failed for captions API');
        }
      }

      // First, list available captions
      const captionsListResponse = await youtube.captions.list({
        auth: this.oauth2Client,
        part: ['snippet'],
        videoId: videoId,
      });

      const captions = captionsListResponse.data.items || [];
      
      if (captions.length === 0) {
        return {
          success: false,
          error: 'No captions available for this video',
          method: 'captions_api'
        };
      }

      // Find the best caption track (prefer English, then auto-generated)
      let selectedCaption = captions.find(caption => 
        caption.snippet?.language === 'en' && caption.snippet?.trackKind === 'standard'
      ) || captions.find(caption => 
        caption.snippet?.language === 'en'
      ) || captions[0];

      if (!selectedCaption?.id) {
        return {
          success: false,
          error: 'No suitable caption track found',
          method: 'captions_api'
        };
      }

      console.log(`📥 Downloading caption track: ${selectedCaption.snippet?.name} (${selectedCaption.snippet?.language})`);

      // Download the caption track
      try {
        const captionResponse = await youtube.captions.download({
          auth: this.oauth2Client,
          id: selectedCaption.id,
          tfmt: 'srt', // SubRip format
        });

        const transcriptText = this.parseSRT(captionResponse.data as string);
        
        return {
          success: true,
          transcript: transcriptText,
          method: 'captions_api'
        };

      } catch (downloadError: any) {
        console.warn('⚠️ Caption download failed:', downloadError.message);
        
        // If download fails due to permissions, try alternative format
        if (downloadError.code === 403) {
          return {
            success: false,
            error: 'Caption download not permitted (video may have restricted captions)',
            method: 'captions_api'
          };
        }
        
        throw downloadError;
      }

    } catch (error: any) {
      console.warn('⚠️ YouTube Captions API failed:', {
        message: error.message,
        code: error.code,
        status: error.status,
        statusText: error.response?.statusText,
        errorDetails: error.response?.data
      });
      
      return {
        success: false,
        error: `${error.message} (Code: ${error.code || 'unknown'})`,
        method: 'captions_api'
      };
    }
  }

  /**
   * Fetch transcript using youtube-transcript library (public method)
   */
  private async fetchFromPublicTranscript(videoId: string): Promise<TranscriptResult> {
    try {
      console.log('🌐 Trying public transcript extraction...');
      
      // Dynamic import to avoid module loading issues
      let YoutubeTranscript;
      try {
        const module = await import('youtube-transcript');
        YoutubeTranscript = module.YoutubeTranscript || module.default;
      } catch (importError) {
        console.warn('⚠️ youtube-transcript module not available:', importError);
        return {
          success: false,
          error: 'youtube-transcript library not available',
          method: 'public_api'
        };
      }
      
      if (!YoutubeTranscript) {
        return {
          success: false,
          error: 'YoutubeTranscript class not found in module',
          method: 'public_api'
        };
      }
      
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (!transcriptItems || transcriptItems.length === 0) {
        return {
          success: false,
          error: 'No public transcript available',
          method: 'public_api'
        };
      }
      
      // Convert transcript items to plain text
      const transcriptText = transcriptItems
        .map((item: any) => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`✅ Successfully fetched public transcript (${transcriptText.length} characters)`);
      
      return {
        success: true,
        transcript: transcriptText,
        method: 'public_api'
      };
      
    } catch (error: any) {
      console.warn('⚠️ Public transcript extraction failed:', error.message);
      return {
        success: false,
        error: error.message,
        method: 'public_api'
      };
    }
  }

  /**
   * Extract transcript information from video metadata
   */
  private async extractFromVideoMetadata(videoId: string): Promise<TranscriptResult> {
    try {
      console.log('📄 Checking video metadata for transcript info...');

      const videoResponse = await youtube.videos.list({
        auth: this.oauth2Client,
        part: ['snippet'],
        id: [videoId],
      });

      const video = videoResponse.data.items?.[0];
      if (!video) {
        return {
          success: false,
          error: 'Video not found',
          method: 'manual'
        };
      }

      const description = video.snippet?.description || '';
      
      // Look for transcript patterns in description
      const transcriptPatterns = [
        /transcript:?\s*([\s\S]+?)(?:\n\n|\n[A-Z]|\n--|\nConnect|$)/i,
        /full transcript:?\s*([\s\S]+?)(?:\n\n|\n[A-Z]|\n--|\nConnect|$)/i,
        /video transcript:?\s*([\s\S]+?)(?:\n\n|\n[A-Z]|\n--|\nConnect|$)/i
      ];

      for (const pattern of transcriptPatterns) {
        const match = description.match(pattern);
        if (match && match[1] && match[1].trim().length > 100) {
          console.log('✅ Found transcript in video description');
          return {
            success: true,
            transcript: match[1].trim(),
            method: 'manual'
          };
        }
      }

      return {
        success: false,
        error: 'No transcript found in video metadata',
        method: 'manual'
      };

    } catch (error: any) {
      console.warn('⚠️ Video metadata extraction failed:', error.message);
      return {
        success: false,
        error: error.message,
        method: 'manual'
      };
    }
  }

  /**
   * Parse SRT format to plain text
   */
  private parseSRT(srtContent: string): string {
    try {
      // Remove SRT timing information and keep only text
      const lines = srtContent.split('\n');
      const textLines: string[] = [];
      
      let isTextLine = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) {
          isTextLine = false;
          continue;
        }
        
        // Skip sequence numbers (just digits)
        if (/^\d+$/.test(trimmedLine)) {
          continue;
        }
        
        // Skip timing lines (contains -->)
        if (trimmedLine.includes('-->')) {
          isTextLine = true;
          continue;
        }
        
        // This should be a text line
        if (isTextLine || (!trimmedLine.includes('-->') && !/^\d+$/.test(trimmedLine))) {
          // Clean up HTML tags and formatting
          const cleanText = trimmedLine
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
            .replace(/&amp;/g, '&') // Replace &amp; with &
            .replace(/&lt;/g, '<') // Replace &lt; with <
            .replace(/&gt;/g, '>') // Replace &gt; with >
            .trim();
          
          if (cleanText) {
            textLines.push(cleanText);
          }
        }
      }
      
      return textLines.join(' ').replace(/\s+/g, ' ').trim();
      
    } catch (error) {
      console.error('Error parsing SRT:', error);
      return srtContent; // Return original if parsing fails
    }
  }

  /**
   * Get available caption languages for a video
   */
  async getAvailableLanguages(videoId: string): Promise<string[]> {
    try {
      const captionsListResponse = await youtube.captions.list({
        auth: this.oauth2Client,
        part: ['snippet'],
        videoId: videoId,
      });

      const captions = captionsListResponse.data.items || [];
      return captions
        .map(caption => caption.snippet?.language)
        .filter(Boolean) as string[];

    } catch (error) {
      console.error('Error getting available languages:', error);
      return [];
    }
  }

  /**
   * Check if a video has captions available
   */
  async hasCaptions(videoId: string): Promise<boolean> {
    try {
      const languages = await this.getAvailableLanguages(videoId);
      return languages.length > 0;
    } catch (error) {
      return false;
    }
  }
}