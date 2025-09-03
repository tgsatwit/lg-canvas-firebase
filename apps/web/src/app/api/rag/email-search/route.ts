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

    // Search marketing emails by subject, content, and campaign name
    const emailsRef = collection(db, 'marketing-emails');
    
    // Create queries to search different fields
    const subjectQuery = query(
      emailsRef,
      where('userId', '==', userId),
      where('subject', '>=', searchQuery),
      where('subject', '<=', searchQuery + '\uf8ff'),
      orderBy('subject'),
      limit(searchLimit)
    );

    const campaignQuery = query(
      emailsRef,
      where('userId', '==', userId),
      where('campaignName', '>=', searchQuery),
      where('campaignName', '<=', searchQuery + '\uf8ff'),
      orderBy('campaignName'),
      limit(searchLimit)
    );

    // Execute searches in parallel
    const [subjectResults, campaignResults] = await Promise.all([
      getDocs(subjectQuery),
      getDocs(campaignQuery)
    ]);

    const results = new Map();

    // Process subject search results
    subjectResults.docs.forEach(doc => {
      const data = doc.data();
      results.set(doc.id, {
        id: doc.id,
        subject: data.subject || 'No Subject',
        content: data.content || '',
        htmlContent: data.htmlContent || '',
        campaignName: data.campaignName || 'Untitled Campaign',
        status: data.status || 'draft',
        sentAt: data.sentAt || null,
        createdAt: data.createdAt || Date.now(),
        recipients: data.recipients || [],
        performance: data.performance || {},
        matchType: 'subject',
        relevanceScore: calculateEmailRelevance(searchQuery, data.subject || '', 'subject')
      });
    });

    // Process campaign search results
    campaignResults.docs.forEach(doc => {
      const data = doc.data();
      const existingResult = results.get(doc.id);
      if (existingResult) {
        existingResult.relevanceScore += calculateEmailRelevance(searchQuery, data.campaignName || '', 'campaign');
        existingResult.matchType = 'subject+campaign';
      } else {
        results.set(doc.id, {
          id: doc.id,
          subject: data.subject || 'No Subject',
          content: data.content || '',
          htmlContent: data.htmlContent || '',
          campaignName: data.campaignName || 'Untitled Campaign',
          status: data.status || 'draft',
          sentAt: data.sentAt || null,
          createdAt: data.createdAt || Date.now(),
          recipients: data.recipients || [],
          performance: data.performance || {},
          matchType: 'campaign',
          relevanceScore: calculateEmailRelevance(searchQuery, data.campaignName || '', 'campaign')
        });
      }
    });

    // Search email content (requires full text search)
    const contentResults = await searchEmailContent(searchQuery, userId, searchLimit);
    contentResults.forEach(result => {
      const existingResult = results.get(result.id);
      if (existingResult) {
        existingResult.relevanceScore += result.relevanceScore;
        existingResult.matchType += '+content';
        existingResult.contentMatch = result.contentMatch;
      } else {
        results.set(result.id, {
          ...result,
          matchType: 'content'
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
      searchTypes: ['subject', 'campaign', 'content']
    });

  } catch (error) {
    console.error('Email search error:', error);
    return NextResponse.json(
      { error: 'Failed to search marketing emails' },
      { status: 500 }
    );
  }
}

async function searchEmailContent(searchQuery: string, userId: string, searchLimit: number) {
  try {
    // Get all emails for the user
    const emailsRef = collection(db, 'marketing-emails');
    const userEmailsQuery = query(
      emailsRef,
      where('userId', '==', userId),
      limit(100) // Limit for performance
    );
    const snapshot = await getDocs(userEmailsQuery);

    const results: any[] = [];
    const searchLower = searchQuery.toLowerCase();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const content = (data.content || '').toLowerCase();
      const htmlContent = (data.htmlContent || '').toLowerCase();
      
      // Search in both plain text and HTML content
      const contentMatch = content.includes(searchLower);
      const htmlMatch = htmlContent.includes(searchLower);
      
      if (contentMatch || htmlMatch) {
        // Find the context around the match
        const searchText = contentMatch ? content : htmlContent;
        const matchIndex = searchText.indexOf(searchLower);
        const contextStart = Math.max(0, matchIndex - 100);
        const contextEnd = Math.min(searchText.length, matchIndex + searchQuery.length + 100);
        const context = searchText.substring(contextStart, contextEnd);

        // Calculate relevance based on frequency and position
        const contentFreq = (content.match(new RegExp(searchLower, 'g')) || []).length;
        const htmlFreq = (htmlContent.match(new RegExp(searchLower, 'g')) || []).length;
        const totalFreq = contentFreq + htmlFreq;
        
        const relevanceScore = totalFreq * 0.7 + (matchIndex < 500 ? 0.5 : 0.2);

        results.push({
          id: doc.id,
          subject: data.subject || 'No Subject',
          content: data.content || '',
          htmlContent: data.htmlContent || '',
          campaignName: data.campaignName || 'Untitled Campaign',
          status: data.status || 'draft',
          sentAt: data.sentAt || null,
          createdAt: data.createdAt || Date.now(),
          recipients: data.recipients || [],
          performance: data.performance || {},
          relevanceScore,
          contentMatch: {
            context: context.trim(),
            matchPosition: matchIndex,
            frequency: totalFreq,
            matchedIn: contentMatch ? 'content' : 'html'
          }
        });
      }
    });

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, searchLimit);

  } catch (error) {
    console.error('Email content search error:', error);
    return [];
  }
}

function calculateEmailRelevance(query: string, text: string, field: 'subject' | 'campaign' | 'content'): number {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  let score = 0;
  
  // Field-specific base scores
  const fieldMultiplier = {
    subject: 10,
    campaign: 8,
    content: 6
  };
  
  // Exact match gets highest score
  if (textLower === queryLower) {
    score += fieldMultiplier[field];
  }
  // Starts with query
  else if (textLower.startsWith(queryLower)) {
    score += fieldMultiplier[field] * 0.8;
  }
  // Contains query
  else if (textLower.includes(queryLower)) {
    score += fieldMultiplier[field] * 0.6;
  }
  
  // Word boundary matches
  const wordBoundaryRegex = new RegExp(`\\b${queryLower}\\b`, 'i');
  if (wordBoundaryRegex.test(text)) {
    score += fieldMultiplier[field] * 0.4;
  }

  return score;
}