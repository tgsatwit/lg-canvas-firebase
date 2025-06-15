import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerUser } from '@/lib/auth';
import { createScopedLogger } from "@/utils/logger";

const logger = createScopedLogger("api/social/permissions");

// Define schemas for the request bodies
const UserPermissionSchema = z.object({
  userId: z.string(),
  platformId: z.string(),
  permissions: z.object({
    canView: z.boolean().default(true),
    canReply: z.boolean().default(false),
    canMarkAnswered: z.boolean().default(false),
    isAdmin: z.boolean().default(false),
  })
});

const GetPermissionsSchema = z.object({
  platformId: z.string().optional(),
  userId: z.string().optional()
});

// GET endpoint for retrieving permissions
export async function GET(request: Request) {
  try {
    // Check authentication
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is an admin (only admins can view all permissions)
    const isAdmin = await checkIfUserIsAdmin(user.uid);
    if (!isAdmin) {
      // Non-admin users can only view their own permissions
      return NextResponse.json({ 
        permissions: await getUserPermissions(user.uid) 
      });
    }

    // Parse URL params for admin queries
    const { searchParams } = new URL(request.url);
    const queryResult = GetPermissionsSchema.safeParse(Object.fromEntries(searchParams.entries()));
    
    if (!queryResult.success) {
      logger.error('Invalid query parameters', { errors: queryResult.error.format() });
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.format() },
        { status: 400 }
      );
    }

    const { platformId, userId } = queryResult.data;
    
    // Get permissions based on filters
    let permissions;
    if (platformId && userId) {
      // Get specific user's permissions for a specific platform
      permissions = await getUserPlatformPermissions(userId, platformId);
    } else if (platformId) {
      // Get all user permissions for a specific platform
      permissions = await getPlatformPermissions(platformId);
    } else if (userId) {
      // Get a specific user's permissions for all platforms
      permissions = await getUserPermissions(userId);
    } else {
      // Get all permissions
      permissions = await getAllPermissions();
    }

    return NextResponse.json({ permissions });
  } catch (error) {
    logger.error('Error fetching permissions', { error });
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// POST endpoint for setting permissions
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify admin status
    const isAdmin = await checkIfUserIsAdmin(user.uid);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can set permissions' },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const result = UserPermissionSchema.safeParse(body);
    
    if (!result.success) {
      logger.error('Invalid request body', { errors: result.error.format() });
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.format() },
        { status: 400 }
      );
    }

    const { userId, platformId, permissions } = result.data;
    
    // Update the permissions in the database
    const updated = await mockUpdatePermissions(userId, platformId, permissions);

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update permissions. User or platform not found.' },
        { status: 404 }
      );
    }

    logger.info('Permissions updated successfully', {
      adminId: user.uid,
      userId,
      platformId
    });

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    logger.error('Error updating permissions', { error });
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 }
    );
  }
}

// Mock functions for permissions management
async function checkIfUserIsAdmin(userId: string): Promise<boolean> {
  // In a real implementation, this would check the database
  // For testing, let's assume certain user IDs are admins
  const adminIds = ['admin-1', 'admin-2', 'superuser'];
  return adminIds.includes(userId) || userId.includes('admin');
}

async function getUserPermissions(userId: string): Promise<UserPermission[]> {
  // Mock permissions data
  return [
    {
      userId,
      platformId: 'fb-123',
      platform: 'facebook',
      accountName: 'Your Business Page',
      permissions: {
        canView: true,
        canReply: true,
        canMarkAnswered: true,
        isAdmin: userId.includes('admin')
      }
    },
    {
      userId,
      platformId: 'ig-456',
      platform: 'instagram',
      accountName: '@yourbusiness',
      permissions: {
        canView: true,
        canReply: true,
        canMarkAnswered: true,
        isAdmin: userId.includes('admin')
      }
    },
    {
      userId,
      platformId: 'yt-789',
      platform: 'youtube',
      accountName: 'Your YouTube Channel',
      permissions: {
        canView: true,
        canReply: userId.includes('admin'),
        canMarkAnswered: true,
        isAdmin: userId.includes('admin')
      }
    }
  ];
}

async function getUserPlatformPermissions(userId: string, platformId: string): Promise<UserPermission | null> {
  const allPermissions = await getUserPermissions(userId);
  return allPermissions.find(p => p.platformId === platformId) || null;
}

async function getPlatformPermissions(platformId: string): Promise<UserPermission[]> {
  // In a real implementation, this would query the database
  // Mock data for a few users
  const userIds = ['user-1', 'user-2', 'admin-1'];
  const platform = platformId.startsWith('fb-') ? 'facebook' : 
                  platformId.startsWith('ig-') ? 'instagram' : 
                  platformId.startsWith('yt-') ? 'youtube' : 'unknown';
  
  const accountName = platform === 'facebook' ? 'Your Business Page' :
                     platform === 'instagram' ? '@yourbusiness' :
                     platform === 'youtube' ? 'Your YouTube Channel' : 'Unknown Platform';
  
  return userIds.map(userId => ({
    userId,
    platformId,
    platform,
    accountName,
    permissions: {
      canView: true,
      canReply: userId.includes('admin'),
      canMarkAnswered: true,
      isAdmin: userId.includes('admin')
    }
  }));
}

async function getAllPermissions(): Promise<UserPermission[]> {
  // In a real implementation, this would query the database
  const userIds = ['user-1', 'user-2', 'admin-1'];
  const platformIds = ['fb-123', 'ig-456', 'yt-789'];
  
  const allPermissions: UserPermission[] = [];
  
  for (const userId of userIds) {
    for (const platformId of platformIds) {
      const platform = platformId.startsWith('fb-') ? 'facebook' : 
                      platformId.startsWith('ig-') ? 'instagram' : 
                      platformId.startsWith('yt-') ? 'youtube' : 'unknown';
      
      const accountName = platform === 'facebook' ? 'Your Business Page' :
                         platform === 'instagram' ? '@yourbusiness' :
                         platform === 'youtube' ? 'Your YouTube Channel' : 'Unknown Platform';
      
      allPermissions.push({
        userId,
        platformId,
        platform,
        accountName,
        permissions: {
          canView: true,
          canReply: userId.includes('admin'),
          canMarkAnswered: true,
          isAdmin: userId.includes('admin')
        }
      });
    }
  }
  
  return allPermissions;
}

async function mockUpdatePermissions(
  userId: string, 
  platformId: string, 
  permissions: z.infer<typeof UserPermissionSchema>['permissions']
): Promise<boolean> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real implementation, this would update the database
  // For now, just log the update
  logger.info(`[MOCK] Updated permissions for user ${userId} on platform ${platformId}`, { permissions });
  
  // Simulate success for most cases
  return Math.random() < 0.95;
}

// Types
interface UserPermission {
  userId: string;
  platformId: string;
  platform: string;
  accountName: string;
  permissions: {
    canView: boolean;
    canReply: boolean;
    canMarkAnswered: boolean;
    isAdmin: boolean;
  };
} 