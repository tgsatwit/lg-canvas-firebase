import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { searchQuery, userId, limit: searchLimit = 5 } = await req.json();

    if (!searchQuery || !userId) {
      return NextResponse.json(
        { error: 'Search query and user ID are required' },
        { status: 400 }
      );
    }

    // Search videos by title, description, and transcript
    const videosRef = collection(db, 'videos-master');
    
    // Create multiple queries to search different fields
    const titleQuery = query(
      videosRef,
      where('title', '>=', searchQuery),
      where('title', '<=', searchQuery + '\uf8ff'),
      orderBy('title'),
      limit(searchLimit)
    );

    const descriptionQuery = query(
      videosRef,
      where('description', '>=', searchQuery),
      where('description', '<=', searchQuery + '\uf8ff'),
      orderBy('description'),
      limit(searchLimit)
    );

    // Execute searches in parallel
    const [titleResults, descriptionResults] = await Promise.all([
      getDocs(titleQuery),
      getDocs(descriptionQuery)
    ]);

    const results = new Map();

    // Process title search results
    titleResults.docs.forEach(doc => {
      const data = doc.data();
      results.set(doc.id, {
        id: doc.id,
        title: data.title || 'Untitled',
        description: data.description || '',
        transcript: data.transcript || '',
        url: data.url || '',
        thumbnail: data.thumbnail || '',
        duration: data.duration || 0,
        createdAt: data.createdAt || Date.now(),
        matchType: 'title',
        relevanceScore: calculateRelevance(searchQuery, data.title || '', 'title')
      });
    });

    // Process description search results
    descriptionResults.docs.forEach(doc => {
      const data = doc.data();
      const existingResult = results.get(doc.id);
      if (existingResult) {
        // Boost relevance score if it matches multiple fields
        existingResult.relevanceScore += calculateRelevance(searchQuery, data.description || '', 'description');
        existingResult.matchType = 'title+description';
      } else {
        results.set(doc.id, {
          id: doc.id,
          title: data.title || 'Untitled',
          description: data.description || '',
          transcript: data.transcript || '',
          url: data.url || '',
          thumbnail: data.thumbnail || '',
          duration: data.duration || 0,
          createdAt: data.createdAt || Date.now(),
          matchType: 'description',
          relevanceScore: calculateRelevance(searchQuery, data.description || '', 'description')
        });
      }
    });

    // For transcript search, we'll do a more complex search
    // This would typically use a vector database or full-text search service
    // For now, we'll do a simple text search
    const transcriptResults = await searchTranscripts(searchQuery, searchLimit);
    transcriptResults.forEach(result => {
      const existingResult = results.get(result.id);
      if (existingResult) {
        existingResult.relevanceScore += result.relevanceScore;
        existingResult.matchType += '+transcript';
        existingResult.transcriptMatch = result.transcriptMatch;
      } else {
        results.set(result.id, {
          ...result,
          matchType: 'transcript'
        });
      }
    });

    // Convert to array and sort by relevance
    const sortedResults = Array.from(results.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, searchLimit);

    return NextResponse.json({
      query: searchQuery,
      results: sortedResults,
      totalFound: results.size,
      searchTypes: ['title', 'description', 'transcript']
    });

  } catch (error) {
    console.error('Video search error:', error);
    return NextResponse.json(
      { error: 'Failed to search videos' },
      { status: 500 }
    );
  }
}

async function searchTranscripts(searchQuery: string, searchLimit: number) {
  try {
    // Get all videos that might have transcripts
    const videosRef = collection(db, 'videos-master');
    const allVideosQuery = query(videosRef, limit(100)); // Limit for performance
    const snapshot = await getDocs(allVideosQuery);

    const results: any[] = [];
    const searchLower = searchQuery.toLowerCase();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const transcript = (data.transcript || '').toLowerCase();
      
      if (transcript.includes(searchLower)) {
        // Find the context around the match
        const matchIndex = transcript.indexOf(searchLower);
        const contextStart = Math.max(0, matchIndex - 100);
        const contextEnd = Math.min(transcript.length, matchIndex + searchQuery.length + 100);
        const context = transcript.substring(contextStart, contextEnd);

        // Calculate relevance based on frequency and position
        const frequency = (transcript.match(new RegExp(searchLower, 'g')) || []).length;
        const relevanceScore = frequency * 0.8 + (matchIndex < 1000 ? 0.5 : 0.2);

        results.push({
          id: doc.id,
          title: data.title || 'Untitled',
          description: data.description || '',
          transcript: data.transcript || '',
          url: data.url || '',
          thumbnail: data.thumbnail || '',
          duration: data.duration || 0,
          createdAt: data.createdAt || Date.now(),
          relevanceScore,
          transcriptMatch: {
            context: context.trim(),
            matchPosition: matchIndex,
            frequency
          }
        });
      }
    });

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, searchLimit);

  } catch (error) {
    console.error('Transcript search error:', error);
    return [];
  }
}

function calculateRelevance(query: string, text: string, field: 'title' | 'description'): number {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  let score = 0;
  
  // Exact match gets highest score
  if (textLower === queryLower) {
    score += field === 'title' ? 10 : 5;
  }
  // Starts with query
  else if (textLower.startsWith(queryLower)) {
    score += field === 'title' ? 8 : 4;
  }
  // Contains query
  else if (textLower.includes(queryLower)) {
    score += field === 'title' ? 6 : 3;
  }
  
  // Word boundary matches
  const wordBoundaryRegex = new RegExp(`\\b${queryLower}\\b`, 'i');
  if (wordBoundaryRegex.test(text)) {
    score += field === 'title' ? 4 : 2;
  }

  return score;
}