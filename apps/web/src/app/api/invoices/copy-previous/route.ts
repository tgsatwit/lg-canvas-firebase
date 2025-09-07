import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const firestore = db();
    if (!firestore) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    if (!yearParam || !monthParam) {
      return NextResponse.json(
        { error: 'Year and month parameters are required' },
        { status: 400 }
      );
    }

    const currentYear = parseInt(yearParam);
    const currentMonth = parseInt(monthParam);

    // Calculate previous month
    let previousYear = currentYear;
    let previousMonth = currentMonth - 1;
    
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear = currentYear - 1;
    }

    // Get items from previous month
    const invoicesRef = firestore.collection('invoices');
    const previousSnapshot = await invoicesRef
      .where('year', '==', previousYear)
      .where('month', '==', previousMonth)
      .get();

    if (previousSnapshot.empty) {
      return NextResponse.json(
        { error: 'No items found in previous month to copy' },
        { status: 404 }
      );
    }

    // Check if current month already has items
    const currentSnapshot = await invoicesRef
      .where('year', '==', currentYear)
      .where('month', '==', currentMonth)
      .get();

    if (!currentSnapshot.empty) {
      return NextResponse.json(
        { error: 'Current month already has items. Cannot copy from previous month.' },
        { status: 409 }
      );
    }

    const copiedItems = [];
    const now = new Date().toISOString();

    // Copy recurring items (monthly, quarterly, annual) to current month
    const batch = firestore.batch();
    
    previousSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Only copy recurring items (not ad-hoc)
      if (data.frequency && data.frequency !== 'adhoc') {
        const shouldCopy = 
          data.frequency === 'monthly' || 
          (data.frequency === 'quarterly' && currentMonth % 3 === (previousMonth + 1) % 3) ||
          (data.frequency === 'annual' && currentMonth === previousMonth && currentYear === previousYear + 1);

        if (shouldCopy || data.frequency === 'monthly') {
          const newDocRef = invoicesRef.doc();
          const newItem = {
            description: data.description,
            amount: data.amount,
            date: new Date(currentYear, currentMonth - 1, new Date(data.date).getDate()).toISOString().split('T')[0],
            category: data.category,
            frequency: data.frequency,
            claimable: data.claimable || {
              type: 'percentage',
              value: 100,
              claimableAmount: data.amount
            },
            files: [], // Don't copy files - new evidence needed each month
            // Legacy fields for backward compatibility
            invoiceUrl: null, // Don't copy the actual file URL
            fileName: null, // Don't copy the file name
            uploadedAt: now,
            uploadedBy: 'Auto-copied from previous month',
            year: currentYear,
            month: currentMonth,
            createdAt: now,
            updatedAt: now,
          };

          batch.set(newDocRef, newItem);
          copiedItems.push(newItem);
        }
      }
    });

    if (copiedItems.length === 0) {
      return NextResponse.json(
        { error: 'No recurring items found in previous month to copy' },
        { status: 404 }
      );
    }

    await batch.commit();

    return NextResponse.json(
      { 
        success: true,
        count: copiedItems.length,
        message: `Successfully copied ${copiedItems.length} recurring items from previous month`
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error copying from previous month:', error);
    return NextResponse.json(
      { error: 'Failed to copy from previous month' },
      { status: 500 }
    );
  }
}