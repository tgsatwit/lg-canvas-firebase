"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Tax summary interface
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

export function TaxTab() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Categories state
  const [categories, setCategories] = useState<any[]>([]);

  // Load tax summary data
  const loadTaxSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/tax-summary?year=${currentYear}`);
      if (response.ok) {
        const data = await response.json();
        setTaxSummary(data);
      } else {
        setTaxSummary({
          year: currentYear,
          totalExpenses: 0,
          monthlyBreakdown: [],
          categoryTotals: {}
        });
      }
    } catch (error) {
      console.error('Failed to load tax summary:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/invoices/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  useEffect(() => {
    loadCategories();
    loadTaxSummary();
  }, [currentYear]);

  // Generate and download ZIP file of all invoices for the year
  const downloadInvoiceZip = async () => {
    try {
      setGenerating(true);
      const response = await fetch(`/api/invoices/download-zip?year=${currentYear}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // For now, alert the user about the available files
          // TODO: Implement actual ZIP download when archiver is working
          alert(`Found ${data.count} invoice files for ${currentYear}. Individual downloads will be available soon.`);
          console.log('Available invoices:', data.invoices);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to get invoice list:', errorData.error);
        alert('Failed to retrieve invoice files.');
      }
    } catch (error) {
      console.error('Error retrieving invoices:', error);
      alert('Error retrieving invoice files.');
    } finally {
      setGenerating(false);
    }
  };

  // Get category config from loaded categories
  const getCategoryConfig = (categoryName: string) => {
    const category = categories.find((cat: any) => cat.name === categoryName);
    return category 
      ? { label: category.label, color: category.color }
      : { label: categoryName, color: 'bg-gray-100 text-gray-800' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin border-t-pink-500"></div>
        </div>
        <div className="text-gray-600">Loading tax summary...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year Navigation & Download */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Tax Summary {currentYear}
            </h2>
            <p className="text-sm text-gray-600">
              Total Expenses: {formatCurrency(taxSummary?.totalExpenses || 0)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentYear(new Date().getFullYear())}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Current Year
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentYear(currentYear - 1)}
              className="w-8 h-8 p-0 rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ←
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentYear(currentYear + 1)}
              disabled={currentYear >= new Date().getFullYear()}
              className="w-8 h-8 p-0 rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              →
            </Button>
            
            <Button
              onClick={downloadInvoiceZip}
              disabled={generating || !taxSummary?.totalExpenses}
              className="text-white shadow-sm ml-2"
              style={{
                background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
              }}
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Generating ZIP...
                </span>
              ) : (
                'Download All Invoices'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {taxSummary?.categoryTotals && Object.keys(taxSummary.categoryTotals).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Expense Categories</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(taxSummary.categoryTotals).map(([category, amount]) => {
                const config = getCategoryConfig(category);
                return (
                  <div key={category} className="text-center p-4 rounded-xl bg-gray-50">
                    <Badge className={`mb-2 ${config.color}`}>
                      {config.label}
                    </Badge>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Breakdown */}
      {taxSummary?.monthlyBreakdown && taxSummary.monthlyBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {taxSummary.monthlyBreakdown.map((month) => (
              <div key={month.month} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{month.monthName}</h4>
                    <p className="text-sm text-gray-600">{month.itemCount} items</p>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(month.totalAmount)}
                  </div>
                </div>
                
                {Object.keys(month.categories).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(month.categories).map(([category, amount]) => {
                      const config = getCategoryConfig(category);
                      return (
                        <div key={category} className="flex items-center gap-2 text-xs">
                          <Badge className={config.color}>
                            {config.label}
                          </Badge>
                          <span className="text-gray-600">{formatCurrency(amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data State */}
      {(!taxSummary?.totalExpenses || taxSummary.totalExpenses === 0) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center text-gray-500">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tax Data Available</h3>
            <p className="text-gray-600 mb-4">
              No invoice items found for {currentYear}. Add some invoice items first to see your tax summary.
            </p>
            <Button
              onClick={() => window.location.href = '/dashboard/invoices'} // Will switch to invoices tab
              className="text-white shadow-sm"
              style={{
                background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
              }}
            >
              Add Invoice Items
            </Button>
          </div>
        </div>
      )}

      {/* Tax Preparation Tips */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Preparation Tips</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 flex-shrink-0"></div>
            <div>
              <strong>Keep All Receipts:</strong> Download the ZIP file containing all invoices for the year to provide to your tax preparer.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 flex-shrink-0"></div>
            <div>
              <strong>Categorize Expenses:</strong> The category breakdown above helps identify different types of business expenses.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 flex-shrink-0"></div>
            <div>
              <strong>Monthly Tracking:</strong> The monthly breakdown shows spending patterns and helps identify any unusual expenses.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 flex-shrink-0"></div>
            <div>
              <strong>Digital Records:</strong> All uploaded invoices are stored securely in the cloud and can be accessed anytime.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}