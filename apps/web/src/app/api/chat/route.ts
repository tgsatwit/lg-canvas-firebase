import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { analyzeUserStyle } from '@/lib/firebase/chatService';
import { getServerUser } from '@/lib/auth';
import { getModelById } from '@/types/models';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Chat API called at:', new Date().toISOString());
    console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Check authentication
    console.log('🔐 Checking authentication...');
    const user = await getServerUser();
    console.log('👤 Authentication result:', user ? `User ${user.uid}` : 'No user');
    
    if (!user) {
      console.log('❌ Authentication failed - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('✅ Authentication successful, proceeding with chat');

    const requestBody = await request.json();
    const { messages, systemInstructions, model, userId } = requestBody;


    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages:', messages);
      return NextResponse.json({ error: 'Messages are required and must be an array' }, { status: 400 });
    }

    // Ensure the userId matches the authenticated user
    if (userId && userId !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let selectedModel = getModelById(model) || getModelById('gpt-5');

    // Route to a thinking variant when hinted
    const hasThinkingHint = (
      (typeof systemInstructions === 'string' && /\bthink:\s*on|\bdeep_reason|\buse thinking/i.test(systemInstructions)) ||
      (Array.isArray(messages) && messages.some((m: any) => m?.role === 'user' && typeof m?.content === 'string' && /\bthink:\s*on|\bplease think deeply|\buse thinking/i.test(m.content)))
    );
    const thinkingModel = getModelById('gpt-5-thinking');
    if (selectedModel?.id === 'gpt-5' && hasThinkingHint && thinkingModel) {
      selectedModel = thinkingModel;
    }

    if (!selectedModel) {
      return NextResponse.json({ error: 'Invalid model specified' }, { status: 400 });
    }

    if (selectedModel.provider !== 'openai') {
      return NextResponse.json({ error: 'Only OpenAI models are supported' }, { status: 400 });
    }

    const isReasoningCapable = selectedModel.capabilities.includes('reasoning') || selectedModel.capabilities.includes('thinking');
    const temperature = isReasoningCapable ? 0.2 : 0.7;
    const maxTokens = (() => {
      // Reasoning-aware caps for GPT‑5 family
      if (selectedModel.id?.startsWith('gpt-5')) {
        if (selectedModel.id.includes('thinking')) {
          return Math.min(selectedModel.maxTokens ?? 32768, 32768);
        }
        return Math.min(selectedModel.maxTokens ?? 8192, 8192);
      }
      // Default cap for non‑reasoning models
      return Math.min(selectedModel.maxTokens ?? 4096, 4096);
    })();

    // Optional structured outputs (JSON) when hinted or supported
    const wantsJSON = Array.isArray(messages) && messages.some((m: any) => m?.role === 'user' && typeof m?.content === 'string' && /\bjson\s*:/i.test(m.content));
    const hasStructuredOutput = selectedModel.features && selectedModel.features.includes('structured_output');
    const responseFormat = (hasStructuredOutput && wantsJSON) ? { type: 'json_object' } : undefined;

    // Enhanced system instructions for reasoning models
    let enhancedSystemInstructions = systemInstructions || 'You are a helpful AI assistant.';
    
    if (selectedModel.capabilities.includes('reasoning') || selectedModel.capabilities.includes('thinking')) {
      enhancedSystemInstructions += `\n\nYou are using a reasoning‑capable model (GPT‑5). Perform any step‑by‑step analysis privately in your scratchpad. In your final answer, give concise conclusions and, when helpful, a short list of key steps or factors—do not include your hidden chain‑of‑thought.`;
    }
    
    if (selectedModel.capabilities.includes('research')) {
      enhancedSystemInstructions += `\n\nYou excel at research and analysis. When answering questions, consider multiple sources of information, fact-check claims, and provide comprehensive, well-researched responses.`;
    }

    // Format messages for the model, including attachments
    const formattedMessages = [
      new SystemMessage(enhancedSystemInstructions),
      ...(await Promise.all(messages.map(async (msg: any) => {
        if (msg.role === 'user') {
          let content = msg.content;
          
          // If the message has attachments, add them to the content
          if (msg.attachments && msg.attachments.length > 0) {
            const attachmentContextPromises = msg.attachments.map(async (attachment: any) => {
              const { name, type, content: fileContent } = attachment;
              
              if (type.startsWith('image/')) {
                // For images, include the base64 data for vision models
                return `[Image Attachment: ${name}]\n${fileContent}`;
              } else if (type === 'application/pdf' || 
                         type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                         type === 'application/msword') {
                // Process PDF and Word documents server-side
                try {
                  // Import libraries dynamically
                  if (type === 'application/pdf') {
                    const PDFParser = (await import('pdf2json')).default;
                    const base64Data = fileContent.includes(',') ? fileContent.split(',')[1] : fileContent;
                    const buffer = Buffer.from(base64Data, 'base64');
                    
                    return new Promise((resolve) => {
                      const pdfParser = new PDFParser();
                      
                      pdfParser.on('pdfParser_dataError', () => {
                        resolve(`[PDF File: ${name} - Error parsing PDF content]`);
                      });
                      
                      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
                        try {
                          let fullText = '';
                          
                          if (pdfData && pdfData.Pages) {
                            pdfData.Pages.forEach((page: any) => {
                              if (page.Texts) {
                                page.Texts.forEach((text: any) => {
                                  if (text.R) {
                                    text.R.forEach((run: any) => {
                                      if (run.T) {
                                        fullText += decodeURIComponent(run.T) + ' ';
                                      }
                                    });
                                  }
                                });
                                fullText += '\n';
                              }
                            });
                          }
                          
                          resolve(`[PDF File: ${name}]\n\`\`\`\n${fullText.slice(0, 10000)}${fullText.length > 10000 ? '...' : ''}\n\`\`\``);
                        } catch (error) {
                          resolve(`[PDF File: ${name} - Error extracting text: ${error instanceof Error ? error.message : String(error)}]`);
                        }
                      });
                      
                      pdfParser.parseBuffer(buffer);
                    });
                  } else {
                    const mammoth = (await import('mammoth')).default;
                    const base64Data = fileContent.includes(',') ? fileContent.split(',')[1] : fileContent;
                    const buffer = Buffer.from(base64Data, 'base64');
                    const result = await mammoth.extractRawText({ buffer });
                    return `[Word Document: ${name}]\n\`\`\`\n${result.value.slice(0, 10000)}${result.value.length > 10000 ? '...' : ''}\n\`\`\``;
                  }
                } catch (error) {
                  console.error(`Error processing ${type} file ${name}:`, error);
                  return `[File Attachment: ${name} - Could not extract text: ${error instanceof Error ? error.message : String(error)}]`;
                }
              } else if (type.startsWith('text/') || type.includes('json') || type.includes('javascript') || type.includes('typescript')) {
                // For text files, decode and include content
                try {
                  const base64Data = fileContent.split(',')[1]; // Remove data:type;base64, prefix
                  const textContent = atob(base64Data);
                  return `[File Attachment: ${name}]\n\`\`\`\n${textContent}\n\`\`\``;
                } catch (error) {
                  return `[File Attachment: ${name} - Error reading file content]`;
                }
              } else {
                return `[File Attachment: ${name} (${type}) - Binary file, content not displayed]`;
              }
            });
            
            const attachmentContext = await Promise.all(attachmentContextPromises);
            content = `${content}\n\n${attachmentContext.join('\n\n')}`;
          }
          
          return new HumanMessage(content);
        } else {
          return new AIMessage(msg.content);
        }
      })))
    ];

    // Map our internal 'gpt-5' to the actual OpenAI model
    const actualModelId = selectedModel.id === 'gpt-5' ? 'gpt-4o' : selectedModel.id;
    
    const baseChatOpts: any = {
      model: actualModelId,
      temperature,
      maxTokens,
      streaming: true,
    };
    if (responseFormat) baseChatOpts.responseFormat = responseFormat;
    const chatModel = new ChatOpenAI(baseChatOpts);

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
          if (messages.length > 5) {
            analyzeUserStyle(user.uid, messages).catch(console.error);
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 