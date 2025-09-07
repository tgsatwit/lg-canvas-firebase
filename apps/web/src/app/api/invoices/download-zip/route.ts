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
    const year = searchParams.get('year');

    if (!year) {
      return NextResponse.json(
        { error: 'Year parameter is required' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);

    // Query all invoices for the year that have files
    const invoicesRef = firestore.collection('invoices');
    const snapshot = await invoicesRef
      .where('year', '==', yearNum)
      .where('invoiceUrl', '!=', null)
      .orderBy('invoiceUrl') // Required for != queries
      .orderBy('month', 'asc')
      .orderBy('date', 'asc')
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'No invoice files found for this year' },
        { status: 404 }
      );
    }

    // For now, return a list of download links instead of a ZIP
    // TODO: Implement actual ZIP creation with archiver when build issues are resolved
    const invoiceList: any[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.invoiceUrl) {
        invoiceList.push({
          id: doc.id,
          description: data.description,
          amount: data.amount,
          date: data.date,
          month: data.month,
          fileName: data.fileName,
          downloadUrl: data.invoiceUrl,
        });
      }
    });

    return NextResponse.json({
      success: true,
      year: yearNum,
      count: invoiceList.length,
      invoices: invoiceList,
      message: `Found ${invoiceList.length} invoice files for ${year}. ZIP download will be implemented soon.`
    });

  } catch (error) {
    console.error('Error retrieving invoice list:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve invoice files' },
      { status: 500 }
    );
  }
}