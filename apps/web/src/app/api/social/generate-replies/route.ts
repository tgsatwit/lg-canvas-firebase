import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { getServerUser } from '@/lib/auth';

// Define the schema for the request body
const RequestSchema = z.object({
  comments: z.array(
    z.object({
      id: z.number(),
      platform: z.string(),
      author: z.string(),
      content: z.string(),
      postTitle: z.string().optional(),
    })
  ),
  tone: z.enum(['friendly', 'professional', 'casual']).default('professional'),
  maxLength: z.number().min(50).max(500).default(200),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse and validate the request body
    const body = await req.json();
    const result = RequestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { comments, tone, maxLength } = result.data;
    
    // Generate replies for each comment
    const replies = await generateReplies(comments, tone, maxLength);
    
    return NextResponse.json({ replies });
  } catch (error) {
    console.error('Error generating replies:', error);
    return NextResponse.json(
      { error: 'Failed to generate replies' },
      { status: 500 }
    );
  }
}

/**
 * Generate replies for comments using OpenAI
 */
async function generateReplies(
  comments: z.infer<typeof RequestSchema>['comments'],
  tone: z.infer<typeof RequestSchema>['tone'],
  maxLength: z.infer<typeof RequestSchema>['maxLength']
) {
  // Initialize OpenAI client when actually needed
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  // Create a prompt for OpenAI
  const systemPrompt = `
    You are a social media manager crafting helpful responses to comments on social media platforms.
    Respond in a ${tone} tone. Keep responses under ${maxLength} characters.
    For each comment, craft a specific, helpful response addressing the user's question or feedback.
    For Instagram, be more casual and use emojis sparingly.
    For Facebook, be conversational and helpful.
    For YouTube, be appreciative of feedback and engagement.
    
    Your responses should:
    - Address the user by their name/handle
    - Answer any questions directly
    - Show appreciation for positive feedback
    - Address concerns professionally
    - Include a call to action when appropriate
    - Keep the brand voice consistent
    - Never be generic or robotic
  `;
  
  // Process each comment individually to maintain context
  const generatedReplies = await Promise.all(
    comments.map(async (comment) => {
      const userPrompt = `
        Generate a reply to this ${comment.platform} comment:
        
        User: ${comment.author}
        Comment: ${comment.content}
        ${comment.postTitle ? `On post: ${comment.postTitle}` : ''}
        
        Your reply should be in a ${tone} tone, address their specific question or comment,
        and not exceed ${maxLength} characters.
      `;
      
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o', // or any appropriate model
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: Math.ceil(maxLength / 2), // Approximate token count
          temperature: 0.7,
        });
        
        // Extract the generated reply
        const generatedReply = completion.choices[0]?.message?.content?.trim() || '';
        
        return {
          id: comment.id,
          generatedReply,
        };
      } catch (error) {
        console.error(`Error generating reply for comment ${comment.id}:`, error);
        return {
          id: comment.id,
          generatedReply: 'Sorry, we were unable to generate a reply for this comment.',
          error: true,
        };
      }
    })
  );
  
  return generatedReplies;
} 