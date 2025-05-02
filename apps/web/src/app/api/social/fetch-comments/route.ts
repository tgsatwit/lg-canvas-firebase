import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { createScopedLogger } from "@/utils/logger";
import { z } from 'zod';

const logger = createScopedLogger("api/social/fetch-comments");

// Define the schema for the request query parameters
const QuerySchema = z.object({
  limit: z.coerce.number().optional().default(50),
  cursor: z.string().optional(),
  status: z.enum(['all', 'pending', 'answered']).optional().default('all'),
  platform: z.enum(['all', 'twitter', 'linkedin', 'instagram', 'facebook']).optional().default('all')
});

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse URL and extract query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = QuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    
    if (!queryResult.success) {
      logger.error('Invalid query parameters', { errors: queryResult.error.format() });
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.format() },
        { status: 400 }
      );
    }

    const { limit, cursor, status, platform } = queryResult.data;
    
    // Build query filters
    const filters: any = {
      userId: session.user.id,
    };
    
    // Add status filter if not 'all'
    if (status !== 'all') {
      filters.status = status === 'answered' ? 'ANSWERED' : 'PENDING';
    }
    
    // Add platform filter if not 'all'
    if (platform !== 'all') {
      filters.platform = platform.toUpperCase();
    }

    // Query the database with pagination
    const comments = await prisma.socialComment.findMany({
      where: filters,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        generatedReplies: true,
      }
    });

    // Get the next cursor
    const nextCursor = comments.length === limit ? comments[comments.length - 1].id : null;

    logger.info('Comments fetched successfully', { 
      count: comments.length, 
      platform, 
      status 
    });

    return NextResponse.json({
      comments,
      nextCursor,
    });
  } catch (error) {
    logger.error('Error fetching comments', { error });
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
} 