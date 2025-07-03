import { NextRequest, NextResponse } from 'next/server';

// Test VTT content similar to what the user reported
const TEST_VTT_CONTENT = `WEBVTT
Kind: captions
Language: en

1
00:00:00.000 --> 00:00:03.000
hi and welcome to PBL live these are hi and welcome to PBL live these are

2
00:00:03.000 --> 00:00:06.000
fulllength effective workouts just like fulllength effective workouts just like

3
00:00:06.000 --> 00:00:09.000
you're in the studio direct from my you're in the studio direct from my

4
00:00:09.000 --> 00:00:12.000
living room to yours today we'll be living room to yours today we'll be

5
00:00:12.000 --> 00:00:15.000
doing a 45minute full body workout doing a 45minute full body workout`;

function parseVTT(vttContent: string): string {
  try {
    // Validate input
    if (!vttContent) {
      console.warn('⚠️ VTT content is empty or null');
      return '';
    }
    
    // Ensure we have a string
    if (typeof vttContent !== 'string') {
      console.warn('⚠️ VTT content is not a string, converting...');
      vttContent = String(vttContent);
    }
    
    // Check for [object Blob] or similar invalid strings
    if (vttContent === '[object Blob]' || vttContent === '[object Object]') {
      console.error('❌ VTT content is not properly converted from Blob/Object');
      return '';
    }
    
    const lines = vttContent.split('\n');
    const textLines: string[] = [];
    const seenText = new Set<string>(); // Track seen text to prevent duplicates
    
    let inCueBlock = false;
    let skipNextTextLine = false;
    
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        inCueBlock = false;
        skipNextTextLine = false;
        continue;
      }
      
      // Skip WebVTT header and related metadata
      if (trimmedLine.startsWith('WEBVTT') || 
          trimmedLine.startsWith('Kind:') || 
          trimmedLine.startsWith('Language:') ||
          trimmedLine.match(/^NOTE\s/i)) {
        continue;
      }
      
      // Skip cue settings lines (contain positioning/styling info)
      if (trimmedLine.includes('align:') || 
          trimmedLine.includes('position:') || 
          trimmedLine.includes('size:') ||
          trimmedLine.includes('line:')) {
        continue;
      }
      
      // Check for timestamp lines (contains -->)
      if (trimmedLine.includes('-->')) {
        inCueBlock = true;
        skipNextTextLine = false;
        continue;
      }
      
      // Skip cue identifiers (just numbers or alphanumeric IDs)
      if (/^[\w\d-]+$/.test(trimmedLine) && !inCueBlock) {
        skipNextTextLine = true;
        continue;
      }
      
      // If we're in a cue block or this looks like text content
      if (inCueBlock && !skipNextTextLine) {
        // Clean up HTML tags and formatting
        let cleanText = trimmedLine
          .replace(/<[^>]*>/g, '') // Remove HTML/VTT tags
          .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
          .replace(/&amp;/g, '&') // Replace &amp; with &
          .replace(/&lt;/g, '<') // Replace &lt; with <
          .replace(/&gt;/g, '>') // Replace &gt; with >
          .replace(/&quot;/g, '"') // Replace &quot; with "
          .replace(/&#39;/g, "'") // Replace &#39; with '
          .trim();
        
        // Additional cleaning for VTT-specific artifacts
        cleanText = cleanText
          .replace(/^[-\s]*/, '') // Remove leading dashes and spaces
          .replace(/[-\s]*$/, '') // Remove trailing dashes and spaces
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        // Only add if it's valid text and we haven't seen it before
        if (cleanText && 
            cleanText.length > 1 && 
            !cleanText.includes('-->') && 
            !cleanText.match(/^[\d\s:.-]+$/) && // Skip pure timestamp/number lines
            !seenText.has(cleanText.toLowerCase())) {
          
          textLines.push(cleanText);
          seenText.add(cleanText.toLowerCase());
        }
      }
      
      // Reset after collecting text
      if (inCueBlock && trimmedLine && !trimmedLine.includes('-->')) {
        skipNextTextLine = false;
      }
    }
    
    // Join all text and perform final cleanup
    let finalTranscript = textLines.join(' ').replace(/\s+/g, ' ').trim();
    
    // Remove any remaining duplicated phrases (handles cases where content is repeated)
    finalTranscript = removeDuplicatedContent(finalTranscript);
    
    // Log success with more details
    console.log(`✅ Parsed VTT successfully: ${finalTranscript.length} characters, ${textLines.length} segments, ${seenText.size} unique`);
    
    return finalTranscript;
    
  } catch (error) {
    console.error('Error parsing VTT:', error);
    return typeof vttContent === 'string' ? vttContent : String(vttContent || '');
  }
}

// Helper function to remove duplicated content patterns
function removeDuplicatedContent(text: string): string {
  if (!text || text.length < 100) {
    return text;
  }
  
  // Split into sentences for analysis
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  if (sentences.length < 3) {
    return text;
  }
  
  // Look for repeated patterns
  const seenSentences = new Set<string>();
  const uniqueSentences: string[] = [];
  
  for (const sentence of sentences) {
    const normalizedSentence = sentence.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Skip very short sentences or already seen ones
    if (normalizedSentence.length > 10 && !seenSentences.has(normalizedSentence)) {
      uniqueSentences.push(sentence);
      seenSentences.add(normalizedSentence);
    }
  }
  
  // Rejoin sentences
  let result = uniqueSentences.join('. ').trim();
  
  // Add final period if needed
  if (result && !result.match(/[.!?]$/)) {
    result += '.';
  }
  
  return result;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing VTT parsing improvements...');
    
    // Parse the test VTT content
    const parsedResult = parseVTT(TEST_VTT_CONTENT);
    
    // Check if improvements are working
    const hasMetadataRemoved = !parsedResult.includes('Kind: captions') && !parsedResult.includes('Language: en');
    const hasNoDuplication = !parsedResult.includes('hi and welcome to PBL live these are hi and welcome to PBL live these are');
    const startsCorrectly = parsedResult.startsWith('hi and welcome to PBL live');
    
    return NextResponse.json({
      success: true,
      test: 'vtt-parsing-improvements',
      results: {
        originalLength: TEST_VTT_CONTENT.length,
        parsedLength: parsedResult.length,
        parsedContent: parsedResult,
        improvements: {
          metadataRemoved: hasMetadataRemoved,
          duplicationEliminated: hasNoDuplication,
          startsCorrectly: startsCorrectly
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ VTT parsing test failed:', error);
    return NextResponse.json({
      success: false,
      test: 'vtt-parsing-improvements',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 