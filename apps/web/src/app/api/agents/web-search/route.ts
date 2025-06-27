import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Call the LangGraph web search agent
    const agentUrl = process.env.LANGGRAPH_API_URL || 'http://localhost:54367';
    
    const response = await fetch(`${agentUrl}/runs/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
      },
      body: JSON.stringify({
        assistant_id: 'web_search',
        input: {
          message: message,
          shouldSearch: true, // Let the agent decide, but bias towards searching
        },
        config: {
          configurable: {
            user_id: userId,
          },
        },
        stream_mode: 'values',
      }),
    });

    if (!response.ok) {
      console.error('Agent response not ok:', response.status, response.statusText);
      return NextResponse.json({ 
        searchResults: [],
        shouldSearch: false,
        message: 'Web search unavailable'
      });
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    let searchResults: any[] = [];
    let shouldSearch = false;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Extract search results from the agent response
              if (data.searchResults) {
                searchResults = data.searchResults;
              }
              
              if (data.shouldSearch !== undefined) {
                shouldSearch = data.shouldSearch;
              }
            } catch (_parseError) {
              console.warn('Failed to parse agent response line:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return NextResponse.json({
      searchResults,
      shouldSearch,
      message: searchResults.length > 0 ? 'Search completed' : 'No search needed'
    });

  } catch (error) {
    console.error('Web search API error:', error);
    return NextResponse.json({
      searchResults: [],
      shouldSearch: false,
      message: 'Web search failed'
    }, { status: 500 });
  }
}