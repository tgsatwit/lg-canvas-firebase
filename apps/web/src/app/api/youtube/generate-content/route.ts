import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { videoId, contentType, transcript, videoTitle, videoDescription, videoTags } = await request.json();

    if (!videoId || !contentType || !transcript) {
      return NextResponse.json(
        { error: 'Missing required fields: videoId, contentType, transcript' },
        { status: 400 }
      );
    }

    let prompt = '';
    let systemPrompt = '';

    switch (contentType) {
      case 'youtube-post':
        systemPrompt = 'You are a social media expert specializing in YouTube community posts. Create engaging, informative posts that drive community engagement.';
        prompt = `Based on this video content, create a YouTube community post that:
- Summarizes the key points from the video
- Asks an engaging question to encourage comments
- Uses relevant hashtags
- Is 150-300 characters
- Includes a call-to-action

Video Title: "${videoTitle}"
Video Description: "${videoDescription}"
Tags: "${videoTags?.join(', ') || 'none'}"
Transcript: "${transcript.substring(0, 2000)}"

Generate only the community post content, nothing else.`;
        break;

      case 'instagram-post':
        systemPrompt = 'You are a social media expert specializing in Instagram content. Create visually appealing, engaging posts that work well with Instagram\'s format and audience.';
        prompt = `Based on this video content, create an Instagram post that:
- Hooks the audience in the first line
- Breaks content into digestible points
- Uses relevant hashtags (10-15)
- Includes emojis appropriately
- Encourages engagement
- Is optimized for Instagram's format

Video Title: "${videoTitle}"
Video Description: "${videoDescription}"
Tags: "${videoTags?.join(', ') || 'none'}"
Transcript: "${transcript.substring(0, 2000)}"

Generate only the Instagram post content, nothing else.`;
        break;

      case 'blog-article':
        systemPrompt = 'You are a content writer specializing in blog articles. Create comprehensive, SEO-friendly articles that provide value to readers.';
        prompt = `Based on this video content, create a blog article that:
- Has a compelling headline
- Includes an engaging introduction
- Breaks content into clear sections with subheadings
- Provides actionable insights
- Includes a conclusion with key takeaways
- Is 800-1200 words
- Uses SEO-friendly structure

Video Title: "${videoTitle}"
Video Description: "${videoDescription}"
Tags: "${videoTags?.join(', ') || 'none'}"
Transcript: "${transcript.substring(0, 4000)}"

Generate the complete blog article with proper formatting.`;
        break;

      case 'email-snippet':
        systemPrompt = 'You are an email marketing expert. Create compelling email newsletter snippets that drive engagement and clicks.';
        prompt = `Based on this video content, create an email newsletter snippet that:
- Has a compelling subject line
- Starts with a hook
- Summarizes the key value proposition
- Includes a clear call-to-action
- Is 100-200 words
- Creates urgency or curiosity

Video Title: "${videoTitle}"
Video Description: "${videoDescription}"
Tags: "${videoTags?.join(', ') || 'none'}"
Transcript: "${transcript.substring(0, 2000)}"

Generate the email snippet with subject line and body content.`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid content type. Must be youtube-post, instagram-post, blog-article, or email-snippet' },
          { status: 400 }
        );
    }

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: contentType === 'blog-article' ? 1500 : 500,
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      );
    }

    return NextResponse.json({ content });

  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}