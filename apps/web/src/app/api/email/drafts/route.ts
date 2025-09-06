import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { EmailDraft } from '@opencanvas/shared/types';

// GET /api/email/drafts - Fetch all email drafts
export async function GET(request: NextRequest) {
  try {
    const db = adminFirestore();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const business = searchParams.get('business');
    const status = searchParams.get('status');

    // Build query
    let collectionRef = db.collection('email-drafts');
    let query = collectionRef.orderBy('updatedAt', 'desc');
    
    if (userId) {
      query = collectionRef.where('createdBy', '==', userId).orderBy('updatedAt', 'desc');
    }
    
    if (business) {
      query = collectionRef.where('business', '==', business).orderBy('updatedAt', 'desc');
    }
    
    if (status) {
      query = collectionRef.where('status', '==', status).orderBy('updatedAt', 'desc');
    }

    const querySnapshot = await query.get();
    const drafts: EmailDraft[] = [];
    
    querySnapshot.forEach((doc) => {
      drafts.push({
        id: doc.id,
        ...doc.data()
      } as EmailDraft);
    });

    return NextResponse.json({
      success: true,
      drafts,
      count: drafts.length
    });

  } catch (error) {
    console.error('Error fetching email drafts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch email drafts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/email/drafts - Create new email draft
export async function POST(request: NextRequest) {
  try {
    const db = adminFirestore();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.business || !body.targetAudience || !body.campaignType || !body.createdBy) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: title, business, targetAudience, campaignType, createdBy' 
        },
        { status: 400 }
      );
    }

    // Create new draft document
    const draftRef = db.collection('email-drafts').doc();
    const now = new Date().toISOString();
    
    const newDraft: EmailDraft = {
      id: draftRef.id,
      title: body.title,
      status: body.status || 'draft',
      business: body.business,
      targetAudience: body.targetAudience,
      campaignType: body.campaignType,
      subject: body.subject || '',
      preheader: body.preheader || '',
      emailBody: body.emailBody || '',
      theme: body.theme,
      goalType: body.goalType,
      customGoal: body.customGoal,
      keyMessages: body.keyMessages || [],
      emailDesign: body.emailDesign,
      campaignAnalysis: body.campaignAnalysis,
      createdBy: body.createdBy,
      createdByName: body.createdByName,
      createdAt: now,
      updatedAt: now,
      hasUnsavedChanges: false
    };

    // Save to Firestore
    await draftRef.set(newDraft);

    return NextResponse.json({
      success: true,
      draft: newDraft,
      message: 'Email draft created successfully'
    });

  } catch (error) {
    console.error('Error creating email draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create email draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}