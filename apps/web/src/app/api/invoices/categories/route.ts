import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

// Category interface
interface Category {
  id?: string;
  name: string;
  label: string;
  color: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default categories to initialize
const defaultCategories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'phone', label: 'Phone Bill', color: 'bg-blue-100 text-blue-800', isDefault: true },
  { name: 'subscription', label: 'Subscription', color: 'bg-purple-100 text-purple-800', isDefault: true },
  { name: 'fitness', label: 'Fitness', color: 'bg-green-100 text-green-800', isDefault: true },
  { name: 'research', label: 'Research', color: 'bg-orange-100 text-orange-800', isDefault: true },
  { name: 'office', label: 'Office', color: 'bg-gray-100 text-gray-800', isDefault: true },
  { name: 'travel', label: 'Travel', color: 'bg-indigo-100 text-indigo-800', isDefault: true },
  { name: 'other', label: 'Other', color: 'bg-pink-100 text-pink-800', isDefault: true },
];

export async function GET(request: NextRequest) {
  try {
    const firestore = db();
    if (!firestore) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    const categoriesRef = firestore.collection('invoice-categories');
    const snapshot = await categoriesRef.orderBy('label', 'asc').get();

    const categories: Category[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      categories.push({
        id: doc.id,
        name: data.name || '',
        label: data.label || '',
        color: data.color || 'bg-gray-100 text-gray-800',
        isDefault: data.isDefault || false,
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
      });
    });

    // If no categories exist, initialize with defaults
    if (categories.length === 0) {
      const batch = firestore.batch();
      const now = new Date().toISOString();
      
      defaultCategories.forEach((category) => {
        const docRef = categoriesRef.doc();
        batch.set(docRef, {
          ...category,
          createdAt: now,
          updatedAt: now,
        });
      });
      
      await batch.commit();
      
      // Fetch the newly created categories
      const newSnapshot = await categoriesRef.orderBy('label', 'asc').get();
      const newCategories: Category[] = [];
      newSnapshot.forEach((doc) => {
        const data = doc.data();
        newCategories.push({
          id: doc.id,
          name: data.name,
          label: data.label,
          color: data.color,
          isDefault: data.isDefault,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      
      return NextResponse.json({ categories: newCategories });
    }

    return NextResponse.json({ categories });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const firestore = db();
    if (!firestore) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
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

    // Check if category name already exists
    const existingRef = firestore.collection('invoice-categories');
    const existingSnapshot = await existingRef.where('name', '==', name).get();
    
    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    // Create new category
    const now = new Date().toISOString();
    const categoryData = {
      name: name.trim(),
      label: label.trim(),
      color: color.trim(),
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await firestore.collection('invoice-categories').add(categoryData);

    return NextResponse.json(
      { 
        success: true, 
        id: docRef.id,
        category: { id: docRef.id, ...categoryData },
        message: 'Category created successfully' 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}