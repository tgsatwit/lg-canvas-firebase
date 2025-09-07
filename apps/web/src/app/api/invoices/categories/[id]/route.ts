import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

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
    const body = await request.json();
    const { name, label, color } = body;

    // Validate required fields
    if (!name || !label || !color) {
      return NextResponse.json(
        { error: 'Name, label, and color are required' },
        { status: 400 }
      );
    }

    // Validate name format (lowercase, hyphen-separated)
    const nameRegex = /^[a-z0-9-]+$/;
    if (!nameRegex.test(name)) {
      return NextResponse.json(
        { error: 'Name must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Check if category exists
    const categoryRef = firestore.collection('invoice-categories').doc(id);
    const categoryDoc = await categoryRef.get();
    
    if (!categoryDoc.exists) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const currentData = categoryDoc.data();

    // Check if name is changing and if new name already exists
    if (currentData?.name !== name) {
      const existingRef = firestore.collection('invoice-categories');
      const existingSnapshot = await existingRef.where('name', '==', name).get();
      
      if (!existingSnapshot.empty) {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update category
    const updateData = {
      name: name.trim(),
      label: label.trim(),
      color: color.trim(),
      updatedAt: new Date().toISOString(),
    };

    await categoryRef.update(updateData);

    return NextResponse.json(
      { 
        success: true,
        message: 'Category updated successfully' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
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

    // Check if category exists
    const categoryRef = firestore.collection('invoice-categories').doc(id);
    const categoryDoc = await categoryRef.get();
    
    if (!categoryDoc.exists) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const categoryData = categoryDoc.data();

    // Prevent deletion of default categories
    if (categoryData?.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default categories' },
        { status: 403 }
      );
    }

    // Check if category is being used by any invoices
    const invoicesRef = firestore.collection('invoices');
    const invoicesSnapshot = await invoicesRef.where('category', '==', categoryData?.name).limit(1).get();
    
    if (!invoicesSnapshot.empty) {
      return NextResponse.json(
        { error: 'Cannot delete category that is being used by invoices. Please reassign those invoices first.' },
        { status: 409 }
      );
    }

    // Delete category
    await categoryRef.delete();

    return NextResponse.json(
      { 
        success: true,
        message: 'Category deleted successfully' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}