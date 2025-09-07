# Firebase Rules for Invoices & Tax Management

This document outlines the Firebase Security Rules you need to configure for the invoices and tax management system.

## 🔒 Firestore Security Rules

Add these rules to your Firestore security rules file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Existing rules...
    
    // Invoice items collection
    match /invoices/{invoiceId} {
      // Only authenticated users can read/write invoice data
      allow read, write: if request.auth != null;
      
      // Additional validation for writes
      allow create: if request.auth != null 
        && validateInvoiceData(request.resource.data);
      
      allow update: if request.auth != null 
        && validateInvoiceData(request.resource.data)
        && resource.data.createdAt == request.resource.data.createdAt; // Prevent createdAt modification
        
      allow delete: if request.auth != null;
    }
    
    // Invoice categories collection  
    match /invoice-categories/{categoryId} {
      // Anyone authenticated can read categories
      allow read: if request.auth != null;
      
      // Only authenticated users can create/update categories
      allow create: if request.auth != null 
        && validateCategoryData(request.resource.data);
        
      allow update: if request.auth != null 
        && validateCategoryData(request.resource.data)
        && resource.data.createdAt == request.resource.data.createdAt; // Prevent createdAt modification
      
      // Only allow deletion if not a default category and no invoices use it
      allow delete: if request.auth != null 
        && resource.data.isDefault != true;
    }
    
    // Helper functions
    function validateInvoiceData(data) {
      return data.keys().hasAll(['description', 'amount', 'date', 'category', 'year', 'month', 'createdAt', 'updatedAt'])
        && data.description is string
        && data.description.size() > 0
        && data.description.size() <= 500
        && data.amount is number
        && data.amount > 0
        && data.date is string
        && data.category is string
        && data.category.size() > 0
        && data.year is int
        && data.year >= 2020
        && data.year <= 2100
        && data.month is int
        && data.month >= 1
        && data.month <= 12
        && data.createdAt is string
        && data.updatedAt is string;
    }
    
    function validateCategoryData(data) {
      return data.keys().hasAll(['name', 'label', 'color', 'isDefault', 'createdAt', 'updatedAt'])
        && data.name is string
        && data.name.size() > 0
        && data.name.size() <= 50
        && data.name.matches('^[a-z0-9-]+$') // Only lowercase, numbers, hyphens
        && data.label is string
        && data.label.size() > 0
        && data.label.size() <= 100
        && data.color is string
        && data.color.size() > 0
        && data.isDefault is bool
        && data.createdAt is string
        && data.updatedAt is string;
    }
  }
}
```

## 🗃️ Firebase Storage Rules

Add these rules to your Firebase Storage rules file:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Existing rules...
    
    // Invoice files storage
    match /invoices/{year}/{month}/{fileName} {
      // Only authenticated users can read invoice files
      allow read: if request.auth != null;
      
      // Only authenticated users can upload invoice files
      allow write: if request.auth != null 
        && validateInvoiceFile();
      
      // Allow deletion of invoice files
      allow delete: if request.auth != null;
    }
    
    // Helper function to validate invoice file uploads
    function validateInvoiceFile() {
      return resource == null // New file
        && request.resource.size <= 10 * 1024 * 1024 // Max 10MB
        && request.resource.contentType.matches('(application/pdf|image/jpeg|image/jpg|image/png)')
        && request.resource.name.size() > 0;
    }
  }
}
```

## 🔧 Required Firestore Indexes

You'll need to create these composite indexes in Firestore:

### 1. Invoices Collection Indexes

```
Collection ID: invoices
Fields: 
- year (Ascending)
- month (Ascending) 
- date (Descending)
```

```
Collection ID: invoices  
Fields:
- year (Ascending)
- invoiceUrl (Ascending)
- month (Ascending)
- date (Ascending)
```

### 2. Invoice Categories Collection Indexes

```
Collection ID: invoice-categories
Fields:
- name (Ascending)
```

## 📋 Setup Instructions

### 1. Update Firestore Rules

1. Go to Firebase Console → Firestore Database → Rules
2. Add the Firestore rules above to your existing rules file
3. Publish the rules

### 2. Update Storage Rules

1. Go to Firebase Console → Storage → Rules  
2. Add the Storage rules above to your existing rules file
3. Publish the rules

### 3. Create Firestore Indexes

1. Go to Firebase Console → Firestore Database → Indexes
2. Create the composite indexes listed above
3. Wait for indexes to build (may take a few minutes)

### 4. Test the Rules

After deploying, test that:

- ✅ Authenticated users can create/read/update/delete invoices
- ✅ Authenticated users can read categories
- ✅ Authenticated users can create/update/delete non-default categories  
- ✅ Files upload successfully to the invoices/{year}/{month}/ path
- ✅ File size and type restrictions work
- ❌ Unauthenticated users cannot access any data
- ❌ Default categories cannot be deleted
- ❌ Files over 10MB are rejected

## 🛡️ Security Features

### Authentication Required
- All operations require user authentication
- No public read/write access

### Data Validation  
- Invoice data is validated for required fields and types
- Category names must be lowercase with hyphens only
- File uploads restricted to PDF, JPG, PNG under 10MB

### Business Logic Protection
- Default categories cannot be deleted
- Creation timestamps cannot be modified
- Proper data structure enforcement

### File Organization
- Files are organized by year/month for easy management
- Consistent naming and path structure

## 🔍 Monitoring & Debugging

Use Firebase Console to monitor:
- **Authentication**: Check user login activity
- **Firestore**: Monitor read/write operations and rule denials
- **Storage**: Track file uploads and access patterns
- **Rules**: Review rule evaluation logs for debugging

If you encounter permission errors, check:
1. User is properly authenticated
2. Rules syntax is correct  
3. Required indexes are built

