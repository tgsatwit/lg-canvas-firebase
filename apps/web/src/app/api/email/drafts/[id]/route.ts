import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { EmailDraft } from '@opencanvas/shared/types';

// GET /api/email/drafts/[id] - Fetch specific email draft
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = adminFirestore();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    const { id } = await params;
    
    const docRef = db.collection('email-drafts').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email draft not found' 
        },
        { status: 404 }
      );
    }

    const draft: EmailDraft = {
      id: docSnap.id,
      ...docSnap.data()
    } as EmailDraft;

    return NextResponse.json({
      success: true,
      draft
    });

  } catch (error) {
    console.error('Error fetching email draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch email draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/email/drafts/[id] - Update email draft
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = adminFirestore();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    
    // Check if draft exists
    const docRef = db.collection('email-drafts').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email draft not found' 
        },
        { status: 404 }
      );
    }

    // Update draft with new data
    const now = new Date().toISOString();
    const updateData = {
      ...body,
      id, // Ensure ID stays the same
      updatedAt: now,
      hasUnsavedChanges: false
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await docRef.update(updateData);

    // Fetch updated document
    const updatedDocSnap = await docRef.get();
    const updatedDraft: EmailDraft = {
      id: updatedDocSnap.id,
      ...updatedDocSnap.data()
    } as EmailDraft;

    return NextResponse.json({
      success: true,
      draft: updatedDraft,
      message: 'Email draft updated successfully'
    });

  } catch (error) {
    console.error('Error updating email draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update email draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/email/drafts/[id] - Delete email draft
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = adminFirestore();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    const { id } = await params;
    
    // Check if draft exists
    const docRef = db.collection('email-drafts').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email draft not found' 
        },
        { status: 404 }
      );
    }

    // Delete the draft
    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Email draft deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting email draft:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete email draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}