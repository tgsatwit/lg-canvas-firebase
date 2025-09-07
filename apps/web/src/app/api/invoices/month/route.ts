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

// Invoice item interface (matches frontend)
interface InvoiceItem {
  id: string;
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
}

interface MonthData {
  year: number;
  month: number;
  items: InvoiceItem[];
  totalAmount: number;
}

export async function GET(request: NextRequest) {
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
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month parameters are required' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    // Query Firestore for invoice items for the specific month
    const invoicesRef = firestore.collection('invoices');
    
    // Create date range for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0); // Last day of the month
    
    const snapshot = await invoicesRef
      .where('year', '==', yearNum)
      .where('month', '==', monthNum)
      .orderBy('date', 'desc')
      .get();

    const items: InvoiceItem[] = [];
    let totalAmount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const item: InvoiceItem = {
        id: doc.id,
        description: data.description || '',
        amount: data.amount || 0,
        date: data.date || '',
        category: data.category || 'other',
        frequency: data.frequency || 'adhoc',
        claimable: data.claimable || {
          type: 'percentage',
          value: 100,
          claimableAmount: data.amount || 0
        },
        files: data.files || [],
        // Legacy fields for backward compatibility
        invoiceUrl: data.invoiceUrl,
        fileName: data.fileName,
        uploadedAt: data.uploadedAt,
        uploadedBy: data.uploadedBy,
      };
      
      items.push(item);
      totalAmount += item.amount;
    });

    const monthData: MonthData = {
      year: yearNum,
      month: monthNum,
      items,
      totalAmount,
    };

    return NextResponse.json(monthData);

  } catch (error) {
    console.error('Error fetching month data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch month data' },
      { status: 500 }
    );
  }
}