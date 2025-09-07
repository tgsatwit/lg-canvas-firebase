import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

interface InvoiceItemUpdateData {
  description: string;
  amount: number;
  date: string;
  category: string;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'adhoc';
  invoiceUrl?: string;
  fileName?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const firestore = db();
    if (!firestore) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const { id } = params;
    const body: InvoiceItemUpdateData = await request.json();

    // Validate required fields
    if (!body.description || !body.amount || !body.date || !body.category || !body.frequency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate amount is a positive number
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Check if item exists
    const itemRef = firestore.collection('invoices').doc(id);
    const itemDoc = await itemRef.get();
    
    if (!itemDoc.exists) {
      return NextResponse.json(
        { error: 'Invoice item not found' },
        { status: 404 }
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

    // Update the invoice item document
    const updateData = {
      description: body.description.trim(),
      amount: body.amount,
      date: body.date,
      category: body.category,
      frequency: body.frequency,
      invoiceUrl: body.invoiceUrl || itemDoc.data()?.invoiceUrl || null,
      fileName: body.fileName || itemDoc.data()?.fileName || null,
      uploadedAt: body.uploadedAt || itemDoc.data()?.uploadedAt || new Date().toISOString(),
      uploadedBy: body.uploadedBy || itemDoc.data()?.uploadedBy || 'Unknown User',
      updatedAt: new Date().toISOString(),
    };

    await itemRef.update(updateData);

    return NextResponse.json(
      { 
        success: true,
        message: 'Invoice item updated successfully' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating invoice item:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const firestore = db();
    if (!firestore) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const { id } = params;

    // Check if item exists
    const itemRef = firestore.collection('invoices').doc(id);
    const itemDoc = await itemRef.get();
    
    if (!itemDoc.exists) {
      return NextResponse.json(
        { error: 'Invoice item not found' },
        { status: 404 }
      );
    }

    // Delete from Firestore
    await itemRef.delete();

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