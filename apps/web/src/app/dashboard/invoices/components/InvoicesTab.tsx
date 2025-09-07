"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Invoice item interface
interface InvoiceItem {
  id: string;
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

// Category interface
interface Category {
  id: string;
  name: string;
  label: string;
  color: string;
  isDefault?: boolean;
}

// Month interface
interface MonthData {
  year: number;
  month: number;
  items: InvoiceItem[];
  totalAmount: number;
}

export function InvoicesTab() {
  // Current month state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Filter and search state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state for new/edit invoice item
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'other',
    frequency: 'adhoc' as 'monthly' | 'quarterly' | 'annual' | 'adhoc',
    date: new Date().toISOString().split('T')[0],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Copy from previous month state
  const [copyingFromPrevious, setCopyingFromPrevious] = useState(false);

  // Format month/year for display
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Go to current month
  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Load month data from Firestore
  const loadMonthData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const response = await fetch(`/api/invoices/month?year=${year}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setMonthData(data);
      } else {
        setMonthData({
          year,
          month,
          items: [],
          totalAmount: 0
        });
      }
    } catch (error) {
      console.error('Failed to load month data:', error);
      setMonthData({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        items: [],
        totalAmount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch('/api/invoices/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load data when component mounts and month changes
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadMonthData();
  }, [currentDate]);

  // Handle form submission (create or update)
  const handleSubmitInvoiceItem = async () => {
    if (!formData.description || !formData.amount) {
      return;
    }

    try {
      setUploading(editingItem ? editingItem.id : 'item');
      
      let invoiceUrl = editingItem?.invoiceUrl || '';
      let fileName = editingItem?.fileName || '';
      
      // Upload file if selected
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('year', currentDate.getFullYear().toString());
        uploadFormData.append('month', (currentDate.getMonth() + 1).toString());
        
        const uploadResponse = await fetch('/api/invoices/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          invoiceUrl = uploadResult.url;
          fileName = selectedFile.name;
        }
      }

      // Prepare invoice item data
      const itemData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        category: formData.category,
        frequency: formData.frequency,
        invoiceUrl,
        fileName,
        uploadedAt: editingItem?.uploadedAt || new Date().toISOString(),
        uploadedBy: editingItem?.uploadedBy || 'Current User'
      };

      let response;
      if (editingItem) {
        // Update existing item
        response = await fetch(`/api/invoices/items/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(itemData),
        });
      } else {
        // Create new item
        response = await fetch('/api/invoices/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...itemData,
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1,
          }),
        });
      }

      if (response.ok) {
        resetForm();
        await loadMonthData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to save invoice item:', error);
      alert('Failed to save invoice item');
    } finally {
      setUploading(null);
    }
  };

  // Handle edit item
  const handleEditItem = (item: InvoiceItem) => {
    setFormData({
      description: item.description,
      amount: item.amount.toString(),
      category: item.category,
      frequency: item.frequency,
      date: item.date,
    });
    setEditingItem(item);
    setShowAddForm(true);
  };

  // Handle delete item
  const handleDeleteItem = async (item: InvoiceItem) => {
    if (!confirm(`Are you sure you want to delete "${item.description}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setUploading(item.id);
      const response = await fetch(`/api/invoices/items/${item.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadMonthData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    } finally {
      setUploading(null);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: categories.length > 0 ? categories[0].name : 'other',
      frequency: 'adhoc',
      date: new Date().toISOString().split('T')[0],
    });
    setSelectedFile(null);
    setShowAddForm(false);
    setEditingItem(null);
  };

  // Copy items from previous month
  const copyFromPreviousMonth = async () => {
    const prevDate = new Date(currentDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    
    try {
      setCopyingFromPrevious(true);
      const response = await fetch(`/api/invoices/copy-previous?year=${currentDate.getFullYear()}&month=${currentDate.getMonth() + 1}`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Copied ${result.count} items from ${formatMonthYear(prevDate)}`);
        await loadMonthData();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error copying from previous month:', error);
      alert('Failed to copy from previous month');
    } finally {
      setCopyingFromPrevious(false);
    }
  };

  // Get category config from loaded categories
  const getCategoryConfig = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter and search items
  const filteredItems = monthData?.items.filter(item => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSearch = !searchQuery || item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  // Calculate category summaries
  const categorySummary = categories.map(category => {
    const categoryItems = filteredItems.filter(item => item.category === category.name);
    const count = categoryItems.length;
    const total = categoryItems.reduce((sum, item) => sum + item.amount, 0);
    return {
      ...category,
      count,
      total,
    };
  }).filter(cat => cat.count > 0 || !selectedCategory);

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      monthly: 'bg-blue-100 text-blue-800',
      quarterly: 'bg-green-100 text-green-800', 
      annual: 'bg-purple-100 text-purple-800',
      adhoc: 'bg-gray-100 text-gray-800'
    };
    return colors[frequency as keyof typeof colors] || colors.adhoc;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin border-t-pink-500"></div>
        </div>
        <div className="text-gray-600">Loading invoice data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation & Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {formatMonthYear(currentDate)}
            </h2>
            <p className="text-sm text-gray-600">
              {filteredItems.length} items • {formatCurrency(filteredItems.reduce((sum, item) => sum + item.amount, 0))}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentMonth}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Today
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="w-8 h-8 p-0 rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ←
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="w-8 h-8 p-0 rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              →
            </Button>
            
            <Button
              onClick={copyFromPreviousMonth}
              disabled={copyingFromPrevious}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 ml-2"
            >
              {copyingFromPrevious ? 'Copying...' : 'Copy Previous Month'}
            </Button>
            
            <Button
              onClick={() => setShowAddForm(true)}
              className="text-white shadow-sm ml-2"
              style={{
                background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
              }}
            >
              Add Invoice Item
            </Button>
          </div>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-gray-200 rounded-xl"
            />
          </div>
          
          <div className="w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          
          {(selectedCategory || searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory('');
                setSearchQuery('');
              }}
              className="border-gray-300 text-gray-700"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Add/Edit Invoice Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingItem ? 'Edit Invoice Item' : 'Add New Invoice Item'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
              <Input
                type="text"
                placeholder="e.g. Monthly phone bill, Gym membership..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="border-gray-200 rounded-xl"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="border-gray-200 rounded-xl"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-10 px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                disabled={categoriesLoading}
              >
                {categoriesLoading ? (
                  <option value="">Loading categories...</option>
                ) : (
                  categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.label}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                className="w-full h-10 px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
              >
                <option value="adhoc">Ad-hoc</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="border-gray-200 rounded-xl"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Invoice File (Optional)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              onClick={resetForm}
              className="border-gray-300 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitInvoiceItem}
              disabled={!formData.description || !formData.amount || uploading === (editingItem?.id || 'item')}
              className="text-white shadow-sm"
              style={{
                background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
              }}
            >
              {uploading === (editingItem?.id || 'item') ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  {editingItem ? 'Updating...' : 'Adding...'}
                </span>
              ) : (
                editingItem ? 'Update Item' : 'Add Item'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Invoice Items List with Category Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Invoice Items List */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Invoice Items - {formatMonthYear(currentDate)}
              </h3>
            </div>
            
            {!filteredItems.length ? (
              <div className="p-8 text-center text-gray-500">
                {monthData?.items.length ? 
                  'No items match your current filters.' : 
                  'No invoice items for this month. Click "Add Invoice Item" to get started.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <Badge className={cn("text-xs font-medium", getCategoryConfig(item.category).color)}>
                            {getCategoryConfig(item.category).label}
                          </Badge>
                          <Badge className={cn("text-xs font-medium", getFrequencyBadge(item.frequency))}>
                            {item.frequency}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{item.description}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span>{formatDate(item.date)}</span>
                            {item.fileName && (
                              <span className="flex items-center gap-1">
                                📎 {item.fileName}
                              </span>
                            )}
                            {item.uploadedBy && (
                              <span>by {item.uploadedBy}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditItem(item)}
                          disabled={uploading === item.id}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteItem(item)}
                          disabled={uploading === item.id}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          {uploading === item.id ? (
                            <span className="w-4 h-4 border-2 border-red-300 border-t-red-700 rounded-full animate-spin"></span>
                          ) : (
                            'Delete'
                          )}
                        </Button>
                        
                        {item.invoiceUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(item.invoiceUrl, '_blank')}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            View File
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {filteredItems.length > 0 && (
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Total for {formatMonthYear(currentDate)}</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(filteredItems.reduce((sum, item) => sum + item.amount, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Category Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-md font-semibold text-gray-900">Categories</h3>
            </div>
            
            <div className="p-4 space-y-2">
              {categorySummary.map((category) => (
                <div
                  key={category.id}
                  className={cn(
                    "p-2 rounded-lg cursor-pointer transition-colors",
                    selectedCategory === category.name ? "bg-pink-50 border border-pink-200" : "hover:bg-gray-50"
                  )}
                  onClick={() => setSelectedCategory(selectedCategory === category.name ? '' : category.name)}
                >
                  <div className="flex items-center justify-between">
                    <Badge className={cn("text-xs font-medium", category.color)}>
                      {category.label}
                    </Badge>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">{category.count} items</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(category.total)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {categorySummary.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <p className="text-sm">No categories to display</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}