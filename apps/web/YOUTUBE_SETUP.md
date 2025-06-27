# YouTube Studio Integration Setup

This guide will help you set up YouTube API integration to display all your YouTube videos in the app.

## 1. Create YouTube API Credentials

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Library"

### Step 2: Enable YouTube Data API v3
1. Search for "YouTube Data API v3"
2. Click on it and press "Enable"

### Step 3: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/youtube/auth/callback`
   - For production: `https://yourdomain.com/api/youtube/auth/callback`
5. Download the credentials JSON file

## 2. Configure Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# YouTube OAuth2 credentials
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URL=http://localhost:3000/api/youtube/auth/callback

# For production, use your production URL:
# YOUTUBE_REDIRECT_URL=https://yourdomain.com/api/youtube/auth/callback
```

## 3. How to Use

1. **Start your development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Navigate to YouTube Studio**:
   Go to `/dashboard/videos/library` in your application

3. **Authenticate with YouTube**:
   - If you haven't authenticated yet, you'll see a "Connect YouTube" button
   - Click it to authenticate with your YouTube account
   - You'll be redirected to Google's OAuth flow
   - After successful authentication, you'll be redirected back to the app

4. **View Your Videos**:
   - Once authenticated, all your YouTube videos will be displayed
   - You can search, filter by privacy status, and sort videos
   - Click actions to open videos in YouTube or YouTube Studio

## 4. Features

### Channel Overview
- Channel statistics (subscribers, total views, video count)
- Channel information and thumbnail

### Video Management
- **Search**: Search videos by title or description
- **Filter**: Filter by privacy status (Public, Unlisted, Private)
- **Sort**: Sort by date, views, likes, or title
- **Actions**: 
  - 🎬 Watch video on YouTube
  - ⚙️ Edit in YouTube Studio
  - 📊 View analytics in YouTube Studio

### Video Information Displayed
- Thumbnail with duration overlay
- Title and description
- Privacy status (Public/Unlisted/Private)
- View count, likes, and comments
- Published date
- Video duration

## 5. Troubleshooting

### "Authentication Required" Error
- Make sure your environment variables are set correctly
- Check that the redirect URL matches what you configured in Google Cloud Console
- Ensure the YouTube Data API v3 is enabled in your Google Cloud project

### "API Quota Exceeded" Error
- YouTube API has a default quota of 10,000 units per day
- Each API call uses quota units (fetching videos uses about 1-3 units per video)
- You can request a quota increase in Google Cloud Console if needed

### Videos Not Loading
- Check your browser's developer console for error messages
- Verify that your YouTube credentials haven't expired
- Try disconnecting and reconnecting your YouTube account

## 6. Security Notes

- YouTube tokens are stored in secure HTTP-only cookies
- Tokens automatically expire and will require re-authentication
- The app only requests the minimum required YouTube permissions
- No sensitive data is stored in the client-side code

## 7. YouTube API Costs

- The YouTube Data API v3 has usage quotas but is generally free for reasonable usage
- Default quota: 10,000 units per day
- Typical operations:
  - Fetching videos: ~1-3 units per video
  - Channel information: ~1 unit
  - Video details: ~1 unit per video

## 8. Production Deployment

When deploying to production:

1. Update your environment variables with production values:
   ```bash
   YOUTUBE_REDIRECT_URL=https://yourdomain.com/api/youtube/auth/callback
   ```

2. Add your production domain to the authorized redirect URIs in Google Cloud Console

3. Ensure your production environment has the correct environment variables set

## Need Help?

If you encounter any issues, check:
1. Google Cloud Console for any API errors
2. Browser developer console for client-side errors  
3. Server logs for authentication issues
4. YouTube API documentation: https://developers.google.com/youtube/v3/docs 