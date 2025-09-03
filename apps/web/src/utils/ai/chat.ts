import { Message, UserReflection } from '@/types/chat';

interface GenerateChatResponseParams {
  messages: Message[];
  systemInstructions: string;
  onChunk: (chunk: string) => void;
  onComplete: (finalContent: string) => void;
  userId: string;
  reflections?: UserReflection[];
  model?: string;
}

export async function generateChatResponse({
  messages,
  systemInstructions,
  onChunk,
  onComplete,
  userId,
  reflections = [],
  model = 'gpt-4o-mini'
}: GenerateChatResponseParams) {
  try {
    // Build enhanced system instructions with reflections
    const enhancedSystemInstructions = buildEnhancedSystemInstructions(
      systemInstructions,
      reflections
    );

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: formatMessagesForAPI(messages),
        systemInstructions: enhancedSystemInstructions,
        model,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    let fullContent = '';
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete(fullContent);
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullContent += parsed.content;
              onChunk(fullContent);
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }

    onComplete(fullContent);
  } catch (error) {
    console.error('Error generating chat response:', error);
    console.error('This might be an authentication issue - make sure you are logged in');
    throw error;
  }
}

function buildEnhancedSystemInstructions(
  baseInstructions: string,
  reflections: UserReflection[]
): string {
  if (reflections.length === 0) {
    return baseInstructions;
  }

  const styleReflections = reflections
    .filter(r => r.category === 'style')
    .map(r => r.content)
    .join('\n');

  const preferenceReflections = reflections
    .filter(r => r.category === 'preference')
    .map(r => r.content)
    .join('\n');

  let enhanced = baseInstructions;

  if (styleReflections) {
    enhanced += `\n\nUser Communication Style:\n${styleReflections}`;
  }

  if (preferenceReflections) {
    enhanced += `\n\nUser Preferences:\n${preferenceReflections}`;
  }

  enhanced += `\n\nPlease adapt your responses to match the user's communication style and preferences while maintaining helpfulness and accuracy.`;

  return enhanced;
}

function formatMessagesForAPI(messages: Message[]) {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    ...(msg.attachments && { attachments: msg.attachments }),
  }));
} 