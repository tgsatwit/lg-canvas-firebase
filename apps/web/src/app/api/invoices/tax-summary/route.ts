import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

interface TaxSummary {
  year: number;
  totalExpenses: number;
  monthlyBreakdown: {
    month: number;
    monthName: string;
    totalAmount: number;
    itemCount: number;
    categories: {
      [key: string]: number;
    };
  }[];
  categoryTotals: {
    [key: string]: number;
  };
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

    if (!year) {
      return NextResponse.json(
        { error: 'Year parameter is required' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);

    // Query all invoices for the year
    const invoicesRef = firestore.collection('invoices');
    const snapshot = await invoicesRef
      .where('year', '==', yearNum)
      .orderBy('month', 'asc')
      .orderBy('date', 'asc')
      .get();

    const monthlyBreakdown: TaxSummary['monthlyBreakdown'] = [];
    const categoryTotals: { [key: string]: number } = {};
    let totalExpenses = 0;

    // Initialize monthly data structure
    const monthData: { [key: number]: TaxSummary['monthlyBreakdown'][0] } = {};
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    for (let month = 1; month <= 12; month++) {
      monthData[month] = {
        month,
        monthName: monthNames[month - 1],
        totalAmount: 0,
        itemCount: 0,
        categories: {},
      };
    }

    // Process all invoice items
    snapshot.forEach((doc) => {
      const data = doc.data();
      const amount = data.amount || 0;
      const category = data.category || 'other';
      const month = data.month || 1;

      // Add to total expenses
      totalExpenses += amount;

      // Add to category totals
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;

      // Add to monthly breakdown
      if (monthData[month]) {
        monthData[month].totalAmount += amount;
        monthData[month].itemCount += 1;
        monthData[month].categories[category] = (monthData[month].categories[category] || 0) + amount;
      }
    });

    // Convert month data to array and filter out empty months
    for (let month = 1; month <= 12; month++) {
      if (monthData[month].itemCount > 0) {
        monthlyBreakdown.push(monthData[month]);
      }
    }

    const taxSummary: TaxSummary = {
      year: yearNum,
      totalExpenses,
      monthlyBreakdown,
      categoryTotals,
    };

    return NextResponse.json(taxSummary);

  } catch (error) {
    console.error('Error generating tax summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate tax summary' },
      { status: 500 }
    );
  }
}