import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { createScopedLogger } from '@/utils/logger';

const logger = createScopedLogger('lib/auth');

export type User = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

export type Session = {
  user?: User;
  expires: string;
};

/**
 * Get the current session from Next Auth
 */
export async function getSession(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    logger.error('Error getting session', { error });
    return null;
  }
} 