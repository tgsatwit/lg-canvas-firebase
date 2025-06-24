import { NextRequest, NextResponse } from 'next/server';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { analyzeUserStyle } from '@/lib/firebase/chatService';

export async function POST(request: NextRequest) {
  try {
    const { messages, systemInstructions, model, userId } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Initialize the chat model
    const chatModel = new ChatAnthropic({
      model: model || 'claude-sonnet-4-20250514',
      temperature: 0.7,
      maxTokens: 4096,
    });

    // Format messages for the model
    const formattedMessages = [
      new SystemMessage(systemInstructions),
      ...messages.map((msg: any) => 
        msg.role === 'user' 
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      )
    ];

    // Create a readable stream
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await chatModel.stream(formattedMessages);
          
          for await (const chunk of response) {
            const content = chunk.content;
            fullResponse += content;
            
            const data = JSON.stringify({ content });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          
          // Analyze user style in background (don't await)
          if (userId && messages.length > 5) {
            analyzeUserStyle(userId, messages).catch(console.error);
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Error streaming response:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 