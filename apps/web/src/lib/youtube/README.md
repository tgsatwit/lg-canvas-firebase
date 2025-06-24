# YouTube Upload Integration

This directory contains the YouTube API integration for uploading videos.

## Setup Instructions

### 1. Enable YouTube Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Go to APIs & Services > Credentials

### 2. Create OAuth 2.0 Credentials

1. Click "Create Credentials" > "OAuth client ID"
2. Choose "Web application"
3. Add authorized redirect URI: `http://localhost:3000/api/auth/youtube/callback`
4. For production, add your production URL: `https://yourdomain.com/api/auth/youtube/callback`
5. Download the credentials JSON

### 3. Set Environment Variables

Add these to your `.env.local` file:

```bash
# YouTube OAuth2 credentials
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URL=http://localhost:3000/api/auth/youtube/callback

# Google Cloud Storage (for accessing video files)
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# Optional: For testing without OAuth flow
YOUTUBE_ACCESS_TOKEN=your_access_token
YOUTUBE_REFRESH_TOKEN=your_refresh_token
```

### 4. Google Cloud Storage Setup

Since videos are stored in GCS, you need:

1. Enable Google Cloud Storage API
2. Create a service account with Storage Object Viewer permissions
3. Download the service account key JSON
4. Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of this file

### 5. YouTube API Quota

Note: YouTube API has strict quotas:
- Default quota: 10,000 units per day
- Video upload: 1600 units per upload
- This allows ~6 video uploads per day by default

To increase quota:
1. Go to APIs & Services > YouTube Data API v3
2. Click on "Quotas"
3. Request a quota increase if needed

## Usage

### First Time Setup

1. User clicks "Upload Now" or "Schedule Upload"
2. If not authenticated, they'll be prompted to authenticate with YouTube
3. After authentication, tokens are stored in secure HTTP-only cookies
4. Upload proceeds automatically

### Video Upload Process

1. Video must have confirmed YouTube metadata (title, description, tags)
2. Video file must exist in Google Cloud Storage (gcpLink)
3. Upload creates an unlisted video by default (for safety)
4. After upload, the video ID and URL are stored in Firestore

### Privacy Settings

By default, all videos are uploaded as "unlisted" to prevent accidental public uploads.
To change this, modify the `privacyStatus` in the upload options.

## Troubleshooting

### Authentication Issues

- Ensure redirect URI matches exactly (including trailing slashes)
- Check that YouTube Data API is enabled
- Verify OAuth consent screen is configured

### Upload Failures

- Check GCS permissions and file existence
- Verify YouTube API quota hasn't been exceeded
- Check video file format is supported by YouTube

### Token Expiration

- Access tokens expire after 1 hour
- Refresh tokens are used automatically to get new access tokens
- If refresh fails, user will need to re-authenticate

## Implementation Status

The YouTube upload functionality is now fully implemented with the following features:

1. **OAuth2 Authentication**: Users can authenticate with YouTube through OAuth2 flow
2. **Direct Upload**: "Upload Now" button uploads videos immediately from GCS to YouTube
3. **Scheduled Upload**: Videos can be scheduled for future upload
4. **Automatic Processing**: The `/api/videos/process-scheduled` endpoint can be called by a cron job to process scheduled uploads
5. **Error Handling**: Comprehensive error handling with user-friendly messages
6. **Token Storage**: Tokens are stored in secure HTTP-only cookies

### Setting up Scheduled Uploads

To enable automatic scheduled uploads, set up a cron job that calls:

```
POST /api/videos/process-scheduled
Authorization: Bearer YOUR_CRON_SECRET
```

Example using Vercel Cron:

```json
{
  "crons": [{
    "path": "/api/videos/process-scheduled",
    "schedule": "*/15 * * * *"
  }]
}
```

This will check for scheduled uploads every 15 minutes. 