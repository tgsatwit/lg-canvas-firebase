# Firestore Security Rules for Mailchimp Collections (Optimized)

Add these rules to your Firestore security rules for the optimized individual document structure.

## Rules to Add

```javascript
// Mailchimp members collection (individual documents per member)
match /mailchimp-members/{memberId} {
  allow read, write: if request.auth != null;
}

// Mailchimp metadata collection
match /mailchimp-metadata/{documentId} {
  allow read, write: if request.auth != null;
}

// Mailchimp sync status collection  
match /mailchimp-sync-status/{documentId} {
  allow read, write: if request.auth != null;
}
```

## Complete Example Rules File

If you need a complete example, here's how it would look in your firestore.rules file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Vimeo OTT Members collection
    match /vimeo-ott-members/{documentId} {
      allow read, write: if request.auth != null;
    }
    
    // Vimeo OTT Sync Status collection  
    match /vimeo-ott-sync-status/{documentId} {
      allow read, write: if request.auth != null;
    }
    
    // Mailchimp Members collection (aggregated member data)
    match /mailchimp-members/{documentId} {
      allow read, write: if request.auth != null;
    }
    
    // Mailchimp Sync Status collection
    match /mailchimp-sync-status/{documentId} {
      allow read, write: if request.auth != null;
    }
    
    // Default rule - deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Collection Structure (Optimized - Individual Documents)

Each member is stored as an individual Firestore document for optimal query performance and scalability:

### mailchimp-metadata/current
This document stores lists and overall metadata:

```javascript
{
  lists: [
    {
      id: string,
      name: string,
      stats: {
        member_count: number,
        // ... other Mailchimp list stats
      },
      // ... other Mailchimp list properties
    }
  ],
  total_members: number,
  last_sync: string,
  stats: {
    subscribed: number,
    unsubscribed: number,
    cleaned: number,
    pending: number
  }
}
```

### mailchimp-members/{email_address_sanitized}
Each member is stored as an individual document (email address as document ID with special chars replaced):

```javascript
{
  // Primary identifiers
  email_address: string,
  unique_email_id: string,
  contact_id?: string,
  full_name?: string,
  
  // Extracted fields for search/filter indexes
  first_name?: string,
  last_name?: string,
  phone?: string,
  
  // Overall status (highest priority across lists)
  overall_status: "subscribed" | "unsubscribed" | "cleaned" | "pending" | "mixed",
  
  // Arrays for Firestore compound queries
  lists: string[], // List IDs for easy filtering
  tags: string[],  // Tag names for easy filtering
  
  // Detailed list information
  list_details: [
    {
      list_id: string,
      list_name: string,
      status: "subscribed" | "unsubscribed" | "cleaned" | "pending",
      member_id: string,
      web_id: number,
      timestamp_signup?: string,
      timestamp_opt?: string,
      member_rating: number,
      vip: boolean,
      last_changed: string
    }
  ],
  
  // Detailed tag information
  tag_details: [
    {
      name: string,
      list_ids: string[]
    }
  ],
  
  // Aggregated counts
  total_lists: number,
  active_lists: number,
  avg_member_rating: number,
  
  // Timestamps for sorting
  first_signup_date?: string,
  last_activity_date: string,
  
  // Flags for filtering
  is_vip: boolean,
  
  // Basic metadata
  language: string,
  location?: {
    country_code?: string,
    timezone?: string
  },
  
  // Firestore metadata
  created_at: string,
  updated_at: string
}
```

### mailchimp-sync-status/current
```javascript
{
  isRunning: boolean,
  lastSync: string,
  totalLists?: number,
  totalMembers?: number,
  error?: string
}
```

## Individual Document Benefits

- **Scalability**: Supports unlimited members with no document size limits
- **Performance**: Lightning-fast queries with Firestore compound indexes  
- **Real-time**: Native Firestore pagination and cursors for instant filtering
- **Efficiency**: Server-side queries eliminate client-side processing overhead

## API Usage

### GET /api/mailchimp/lists
Supports query parameters for filtering and pagination:
- `source=firebase` - Fetch from Firestore (default)
- `source=mailchimp` - Fetch directly from Mailchimp API
- `page=1` - Page number for pagination
- `limit=100` - Items per page
- `search=query` - Search by name or email
- `list=list_id` - Filter by specific list
- `status=subscribed` - Filter by member status
- `tag=tag_name` - Filter by tag name

### POST /api/mailchimp/lists
Syncs data from Mailchimp and stores in batch format automatically.

## Security Considerations

- These rules require authentication (`request.auth != null`)
- Consider implementing more granular permissions based on user roles if needed
- Monitor usage to ensure appropriate access patterns
- Consider rate limiting for the sync operations at the application level
- Batch storage improves security by distributing sensitive data across multiple documents