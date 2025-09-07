"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Category interface
interface Category {
  id: string;
  name: string;
  label: string;
  color: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Color options for categories
const colorOptions = [
  { name: 'Blue', value: 'bg-blue-100 text-blue-800', preview: 'bg-blue-500' },
  { name: 'Purple', value: 'bg-purple-100 text-purple-800', preview: 'bg-purple-500' },
  { name: 'Green', value: 'bg-green-100 text-green-800', preview: 'bg-green-500' },
  { name: 'Orange', value: 'bg-orange-100 text-orange-800', preview: 'bg-orange-500' },
  { name: 'Gray', value: 'bg-gray-100 text-gray-800', preview: 'bg-gray-500' },
  { name: 'Indigo', value: 'bg-indigo-100 text-indigo-800', preview: 'bg-indigo-500' },
  { name: 'Pink', value: 'bg-pink-100 text-pink-800', preview: 'bg-pink-500' },
  { name: 'Red', value: 'bg-red-100 text-red-800', preview: 'bg-red-500' },
  { name: 'Yellow', value: 'bg-yellow-100 text-yellow-800', preview: 'bg-yellow-500' },
  { name: 'Teal', value: 'bg-teal-100 text-teal-800', preview: 'bg-teal-500' },
];

export function SettingsTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state for new/edit category
  const [formData, setFormData] = useState({
    label: '',
    color: 'bg-gray-100 text-gray-800',
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Load categories from API
  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        console.error('Failed to load categories');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Generate slug from label
  const generateSlug = (label: string) => {
    return label.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle form submission (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label.trim()) {
      alert('Label is required');
      return;
    }

    // Generate slug from label
    const categorySlug = generateSlug(formData.label);

    try {
      setSaving(editingCategory ? editingCategory.id : 'new');
      
      const categoryData = {
        name: categorySlug,
        label: formData.label.trim(),
        color: formData.color,
      };

      let response;
      if (editingCategory) {
        // Update existing category
        response = await fetch(`/api/invoices/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData),
        });
      } else {
        // Create new category
        response = await fetch('/api/invoices/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData),
        });
      }

      if (response.ok) {
        // Reset form and reload categories
        setFormData({ label: '', color: 'bg-gray-100 text-gray-800' });
        setShowAddForm(false);
        setEditingCategory(null);
        await loadCategories();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    } finally {
      setSaving(null);
    }
  };

  // Handle edit category
  const handleEdit = (category: Category) => {
    setFormData({
      label: category.label,
      color: category.color,
    });
    setEditingCategory(category);
    setShowAddForm(true);
  };

  // Handle delete category
  const handleDelete = async (category: Category) => {
    if (category.isDefault) {
      alert('Cannot delete default categories');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${category.label}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setSaving(category.id);
      const response = await fetch(`/api/invoices/categories/${category.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadCategories();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    } finally {
      setSaving(null);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({ label: '', color: 'bg-gray-100 text-gray-800' });
    setShowAddForm(false);
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin border-t-pink-500"></div>
        </div>
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Categories Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Invoice Categories</h3>
            <p className="text-sm text-gray-600 mt-1">Manage categories for organizing your invoices</p>
          </div>
          
          <Button
            onClick={() => setShowAddForm(true)}
            className="text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
            }}
          >
            Add Category
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Category name (e.g. Office Supplies, Marketing)"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  className="border-gray-200 rounded-xl"
                  required
                />
              </div>
              
              <div className="flex items-center gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all duration-200",
                      formData.color === color.value
                        ? "border-pink-500 scale-110"
                        : "border-gray-300 hover:border-gray-400"
                    )}
                  >
                    <div className={cn("w-full h-full rounded-full", color.preview)}></div>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  className="border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving === (editingCategory?.id || 'new')}
                  className="text-white shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                  }}
                >
                  {saving === (editingCategory?.id || 'new') ? (
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Saving...
                    </span>
                  ) : (
                    editingCategory ? 'Update' : 'Add'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="divide-y divide-gray-100">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No categories found. Add your first category to get started.
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge className={cn("text-sm font-medium", category.color)}>
                      {category.label}
                    </Badge>
                    <div>
                      <div className="font-medium text-gray-900">{category.label}</div>
                      <div className="text-sm text-gray-600">
                        Slug: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{category.name}</code>
                        {category.isDefault && (
                          <span className="ml-2 text-xs text-blue-600">(Default)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                      disabled={saving === category.id}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </Button>
                    
                    {!category.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category)}
                        disabled={saving === category.id}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        {saving === category.id ? (
                          <span className="w-4 h-4 border-2 border-red-300 border-t-red-700 rounded-full animate-spin"></span>
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}