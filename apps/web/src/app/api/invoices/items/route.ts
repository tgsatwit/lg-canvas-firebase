import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

// File attachment interface
interface FileAttachment {
  id: string;
  url: string;
  fileName: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

// Claimable amount interface
interface ClaimableAmount {
  type: 'percentage' | 'fixed';
  value: number;
  claimableAmount: number;
}

// Invoice item interface
interface InvoiceItemData {
  description: string;
  amount: number;
  date: string;
  category: string;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'adhoc';
  claimable: ClaimableAmount;
  files: FileAttachment[];
  // Legacy fields for backward compatibility
  invoiceUrl?: string;
  fileName?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  year: number;
  month: number;
}

export async function POST(request: NextRequest) {
  try {
    const firestore = db();
    if (!firestore) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const body: InvoiceItemData = await request.json();

    // Validate required fields
    if (!body.description || !body.amount || !body.date || !body.category || !body.frequency || !body.year || !body.month) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate claimable amount structure
    if (body.claimable) {
      if (!body.claimable.type || !['percentage', 'fixed'].includes(body.claimable.type)) {
        return NextResponse.json(
          { error: 'Invalid claimable amount type' },
          { status: 400 }
        );
      }
      if (typeof body.claimable.value !== 'number' || body.claimable.value < 0) {
        return NextResponse.json(
          { error: 'Invalid claimable amount value' },
          { status: 400 }
        );
      }
    }

    // Validate amount is a positive number
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate category exists in the categories collection
    const categoriesRef = firestore.collection('invoice-categories');
    const categorySnapshot = await categoriesRef.where('name', '==', body.category).get();
    
    if (categorySnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid category. Category does not exist.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    
    // Create the invoice item document
    const invoiceData = {
      description: body.description.trim(),
      amount: body.amount,
      date: body.date,
      category: body.category,
      frequency: body.frequency,
      claimable: body.claimable || {
        type: 'percentage',
        value: 100,
        claimableAmount: body.amount
      },
      files: body.files || [],
      // Legacy fields for backward compatibility
      invoiceUrl: body.invoiceUrl || (body.files && body.files[0] ? body.files[0].url : null),
      fileName: body.fileName || (body.files && body.files[0] ? body.files[0].fileName : null),
      uploadedAt: body.uploadedAt || now,
      uploadedBy: body.uploadedBy || 'Unknown User', // TODO: Get from authenticated user
      year: body.year,
      month: body.month,
      createdAt: now,
      updatedAt: now,
    };

    // Add to Firestore
    const docRef = await firestore.collection('invoices').add(invoiceData);

    return NextResponse.json(
      { 
        success: true, 
        id: docRef.id,
        message: 'Invoice item created successfully' 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating invoice item:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const firestore = db();
    if (!firestore) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Delete from Firestore
    await firestore.collection('invoices').doc(itemId).delete();

    return NextResponse.json(
      { success: true, message: 'Invoice item deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting invoice item:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice item' },
      { status: 500 }
    );
  }
}