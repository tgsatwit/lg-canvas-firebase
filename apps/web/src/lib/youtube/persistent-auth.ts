import { cookies } from 'next/headers';

interface YouTubeTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type: string;
  scope: string;
}

/**
 * Store YouTube tokens securely with long expiration
 */
export async function storeYouTubeTokens(tokens: YouTubeTokens): Promise<void> {
  const cookieStore = await cookies();
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 90, // 90 days for refresh tokens
  };

  const accessTokenOptions = {
    ...cookieOptions,
    maxAge: 60 * 60, // 1 hour for access tokens
  };

  // Store access token with shorter expiration
  cookieStore.set('youtube_access_token', tokens.access_token, accessTokenOptions);
  
  // Store refresh token with longer expiration
  if (tokens.refresh_token) {
    cookieStore.set('youtube_refresh_token', tokens.refresh_token, cookieOptions);
  }

  // Store expiry time
  if (tokens.expiry_date) {
    cookieStore.set('youtube_token_expiry', tokens.expiry_date.toString(), cookieOptions);
  }

  // Store scope and token type
  cookieStore.set('youtube_token_scope', tokens.scope, cookieOptions);
  cookieStore.set('youtube_token_type', tokens.token_type, cookieOptions);
  
  console.log('✅ YouTube tokens stored successfully');
}

/**
 * Retrieve YouTube tokens from cookies
 */
export async function getYouTubeTokens(): Promise<YouTubeTokens | null> {
  try {
    const cookieStore = await cookies();
    
    const accessToken = cookieStore.get('youtube_access_token');
    const refreshToken = cookieStore.get('youtube_refresh_token');
    const tokenExpiry = cookieStore.get('youtube_token_expiry');
    const tokenScope = cookieStore.get('youtube_token_scope');
    const tokenType = cookieStore.get('youtube_token_type');

    if (!accessToken?.value) {
      return null;
    }

    return {
      access_token: accessToken.value,
      refresh_token: refreshToken?.value,
      expiry_date: tokenExpiry?.value ? parseInt(tokenExpiry.value) : undefined,
      token_type: tokenType?.value || 'Bearer',
      scope: tokenScope?.value || 'https://www.googleapis.com/auth/youtube.readonly',
    };
  } catch (error) {
    console.error('Error retrieving YouTube tokens:', error);
    return null;
  }
}

/**
 * Clear all YouTube tokens
 */
export async function clearYouTubeTokens(): Promise<void> {
  const cookieStore = await cookies();
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0, // Expire immediately
  };

  cookieStore.set('youtube_access_token', '', cookieOptions);
  cookieStore.set('youtube_refresh_token', '', cookieOptions);
  cookieStore.set('youtube_token_expiry', '', cookieOptions);
  cookieStore.set('youtube_token_scope', '', cookieOptions);
  cookieStore.set('youtube_token_type', '', cookieOptions);
  
  console.log('✅ YouTube tokens cleared');
}

/**
 * Check if tokens are expired and need refresh
 */
export function areTokensExpired(tokens: YouTubeTokens): boolean {
  if (!tokens.expiry_date) {
    return false; // Assume not expired if no expiry date
  }
  
  // Add 5 minute buffer before actual expiry
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  const expiryTime = tokens.expiry_date - bufferTime;
  
  return Date.now() >= expiryTime;
} 