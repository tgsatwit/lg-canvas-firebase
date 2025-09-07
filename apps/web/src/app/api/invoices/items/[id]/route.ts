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

interface InvoiceItemUpdateData {
  description: string;
  amount: number;
  date: string;
  category: string;
  frequency: 'monthly' | 'quarterly' | 'annual' | 'adhoc';
  claimable: ClaimableAmount;
  files: FileAttachment[];
  filesToDelete?: string[]; // File IDs to delete
  // Legacy fields for backward compatibility
  invoiceUrl?: string;
  fileName?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firestore = db();
    if (!firestore) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const { id } = await params;
    const body: InvoiceItemUpdateData = await request.json();

    // Validate required fields
    if (!body.description || !body.amount || !body.date || !body.category || !body.frequency) {
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

    const now = new Date().toISOString();
    const existingData = itemDoc.data();
    
    // Handle file deletions if specified
    let currentFiles = existingData?.files || [];
    if (body.filesToDelete && body.filesToDelete.length > 0) {
      currentFiles = currentFiles.filter((file: any) => !body.filesToDelete!.includes(file.id));
      // TODO: Delete actual files from storage here
    }
    
    // Merge new files with existing ones (excluding deleted)
    const updatedFiles = [...currentFiles, ...(body.files || [])];

    // Update the invoice item document
    const updateData = {
      description: body.description.trim(),
      amount: body.amount,
      date: body.date,
      category: body.category,
      frequency: body.frequency,
      claimable: body.claimable || existingData?.claimable || {
        type: 'percentage',
        value: 100,
        claimableAmount: body.amount
      },
      files: updatedFiles,
      // Legacy fields for backward compatibility
      invoiceUrl: body.invoiceUrl || (updatedFiles[0] ? updatedFiles[0].url : existingData?.invoiceUrl) || null,
      fileName: body.fileName || (updatedFiles[0] ? updatedFiles[0].fileName : existingData?.fileName) || null,
      uploadedAt: body.uploadedAt || existingData?.uploadedAt || now,
      uploadedBy: body.uploadedBy || existingData?.uploadedBy || 'Unknown User',
      updatedAt: now,
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const firestore = db();
    if (!firestore) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const { id } = await params;

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