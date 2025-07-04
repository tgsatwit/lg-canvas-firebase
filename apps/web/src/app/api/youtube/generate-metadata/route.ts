import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { videoId, type, transcript, currentTitle, currentDescription, currentTags } = await request.json();

    if (!videoId || !type || !transcript) {
      return NextResponse.json(
        { error: 'Missing required fields: videoId, type, transcript' },
        { status: 400 }
      );
    }

    let prompt = '';
    let systemPrompt = '';

    switch (type) {
      case 'title':
        systemPrompt = 'You are a YouTube optimization expert. Generate compelling, SEO-friendly video titles that capture attention and drive clicks while accurately representing the content.';
        prompt = `Based on this video transcript, generate a compelling YouTube title that:
- Is 60 characters or less
- Includes relevant keywords
- Is engaging and clickable
- Accurately represents the content

Current title: "${currentTitle}"
Transcript: "${transcript.substring(0, 2000)}"

Generate only the title, nothing else.`;
        break;

      case 'description':
        systemPrompt = 'You are a YouTube optimization expert. Generate comprehensive, SEO-friendly video descriptions that provide value to viewers and improve discoverability.';
        prompt = `Based on this video transcript, generate a comprehensive YouTube description that:
- Summarizes the main points covered
- Includes relevant keywords naturally
- Has a clear structure with timestamps if applicable
- Encourages engagement (likes, comments, subscriptions)
- Is between 200-1000 characters

Current description: "${currentDescription}"
Transcript: "${transcript.substring(0, 3000)}"

Generate only the description, nothing else.`;
        break;

      case 'tags':
        systemPrompt = 'You are a YouTube optimization expert. Generate relevant, searchable tags that help videos get discovered by the right audience.';
        prompt = `Based on this video transcript, generate 10-15 relevant YouTube tags that:
- Are specific to the content
- Include both broad and niche keywords
- Help with discoverability
- Are commonly searched terms

Current tags: "${currentTags?.join(', ') || 'none'}"
Transcript: "${transcript.substring(0, 2000)}"

Generate only the tags separated by commas, nothing else.`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be title, description, or tags' },
          { status: 400 }
        );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: type === 'description' ? 500 : 200,
    });

    const generated = completion.choices[0]?.message?.content?.trim();

    if (!generated) {
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      );
    }

    return NextResponse.json({ generated });

  } catch (error) {
    console.error('Error generating metadata:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}