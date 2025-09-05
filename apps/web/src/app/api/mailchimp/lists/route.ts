import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '../../../../lib/firebase/admin';
import { MailchimpList, MailchimpMember, MailchimpMemberRaw, MailchimpMetadata } from '@opencanvas/shared';

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_SERVER_PREFIX = MAILCHIMP_API_KEY?.split('-')[1];

if (!MAILCHIMP_API_KEY || !MAILCHIMP_SERVER_PREFIX) {
  console.error('Mailchimp API key not configured properly');
}

class MailchimpAPI {
  private apiKey: string;
  private serverPrefix: string;
  private baseUrl: string;

  constructor() {
    if (!MAILCHIMP_API_KEY || !MAILCHIMP_SERVER_PREFIX) {
      throw new Error('Mailchimp API key not configured');
    }
    this.apiKey = MAILCHIMP_API_KEY;
    this.serverPrefix = MAILCHIMP_SERVER_PREFIX;
    this.baseUrl = `https://${this.serverPrefix}.api.mailchimp.com/3.0`;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mailchimp API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getAllLists(): Promise<MailchimpList[]> {
    try {
      const response = await this.makeRequest('/lists?count=1000&fields=lists.id,lists.name,lists.stats,lists.date_created,lists.contact,lists.campaign_defaults,lists.web_id,lists.permission_reminder,lists.use_archive_bar,lists.notify_on_subscribe,lists.notify_on_unsubscribe,lists.list_rating,lists.email_type_option,lists.subscribe_url_short,lists.subscribe_url_long,lists.beamer_address,lists.visibility,lists.double_optin,lists.has_welcome,lists.marketing_permissions,lists.modules');
      return response.lists || [];
    } catch (error) {
      console.error('Error fetching Mailchimp lists:', error);
      throw error;
    }
  }

  async getListMembers(listId: string): Promise<MailchimpMemberRaw[]> {
    try {
      let allMembers: MailchimpMemberRaw[] = [];
      let offset = 0;
      const count = 1000; // Max allowed by Mailchimp

      while (true) {
        const response = await this.makeRequest(
          `/lists/${listId}/members?count=${count}&offset=${offset}&fields=members.id,members.email_address,members.unique_email_id,members.contact_id,members.full_name,members.web_id,members.email_type,members.status,members.consents_to_one_to_one_messaging,members.merge_fields,members.interests,members.stats,members.ip_signup,members.timestamp_signup,members.ip_opt,members.timestamp_opt,members.member_rating,members.last_changed,members.language,members.vip,members.email_client,members.location,members.marketing_permissions,members.last_note,members.source,members.tags_count,members.tags`
        );

        const members = response.members || [];
        allMembers = allMembers.concat(members.map((member: any) => ({
          ...member,
          list_id: listId
        })));

        if (members.length < count) {
          break; // No more members to fetch
        }

        offset += count;
      }

      return allMembers;
    } catch (error) {
      console.error(`Error fetching members for list ${listId}:`, error);
      throw error;
    }
  }

  async getAllMembersAcrossLists(): Promise<{ lists: MailchimpList[], members: MailchimpMember[] }> {
    try {
      // Step 1: Get all lists
      const lists = await this.getAllLists();
      console.log(`Found ${lists.length} lists in Mailchimp`);

      // Step 2: Get all members from all lists
      const allRawMembers: MailchimpMemberRaw[] = [];
      for (const list of lists) {
        console.log(`Fetching members from list: ${list.name}`);
        const listMembers = await this.getListMembers(list.id);
        allRawMembers.push(...listMembers);
        console.log(`Added ${listMembers.length} members from ${list.name}`);
      }

      console.log(`Total raw member records: ${allRawMembers.length}`);

      // Step 3: Aggregate members by email address
      const memberMap = new Map<string, MailchimpMember>();

      for (const rawMember of allRawMembers) {
        const email = rawMember.email_address.toLowerCase();
        
        if (!memberMap.has(email)) {
          // Create new optimized member
          const member: MailchimpMember = {
            email_address: rawMember.email_address,
            unique_email_id: rawMember.unique_email_id,
            contact_id: rawMember.contact_id,
            full_name: rawMember.full_name,
            first_name: rawMember.merge_fields.FNAME,
            last_name: rawMember.merge_fields.LNAME,
            phone: rawMember.merge_fields.PHONE,
            overall_status: rawMember.status,
            lists: [],
            tags: [],
            list_details: [],
            tag_details: [],
            total_lists: 0,
            active_lists: 0,
            avg_member_rating: 0,
            first_signup_date: rawMember.timestamp_signup,
            last_activity_date: rawMember.last_changed,
            is_vip: rawMember.vip,
            language: rawMember.language || 'en',
            location: rawMember.location ? {
              country_code: rawMember.location.country_code,
              timezone: rawMember.location.timezone
            } : undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          memberMap.set(email, member);
        }

        const member = memberMap.get(email)!;
        const list = lists.find(l => l.id === rawMember.list_id);

        // Add to lists array for queries
        if (!member.lists.includes(rawMember.list_id)) {
          member.lists.push(rawMember.list_id);
        }
        
        // Add detailed list membership
        member.list_details.push({
          list_id: rawMember.list_id,
          list_name: list?.name || 'Unknown List',
          status: rawMember.status,
          member_id: rawMember.id,
          web_id: rawMember.web_id,
          timestamp_signup: rawMember.timestamp_signup,
          timestamp_opt: rawMember.timestamp_opt,
          member_rating: rawMember.member_rating,
          vip: rawMember.vip,
          last_changed: rawMember.last_changed,
        });

        // Aggregate tags (deduplicate)
        for (const tag of rawMember.tags || []) {
          // Add to tags array for queries
          if (!member.tags.includes(tag.name)) {
            member.tags.push(tag.name);
          }
          
          // Add detailed tag info
          const existingTag = member.tag_details.find(t => t.name === tag.name);
          if (existingTag) {
            if (!existingTag.list_ids.includes(rawMember.list_id)) {
              existingTag.list_ids.push(rawMember.list_id);
            }
          } else {
            member.tag_details.push({
              name: tag.name,
              list_ids: [rawMember.list_id]
            });
          }
        }

        // Update overall status (priority: subscribed > pending > unsubscribed > cleaned)
        const statusPriority: Record<string, number> = { subscribed: 4, pending: 3, unsubscribed: 2, cleaned: 1, mixed: 0 };
        if (statusPriority[rawMember.status] > statusPriority[member.overall_status]) {
          member.overall_status = rawMember.status;
        } else if (member.overall_status !== rawMember.status && member.list_details.length > 1) {
          member.overall_status = 'mixed';
        }

        // Update VIP status
        if (rawMember.vip) {
          member.is_vip = true;
        }

        // Update first signup date
        if (rawMember.timestamp_signup && (!member.first_signup_date || rawMember.timestamp_signup < member.first_signup_date)) {
          member.first_signup_date = rawMember.timestamp_signup;
        }

        // Update last activity date
        if (rawMember.last_changed > member.last_activity_date) {
          member.last_activity_date = rawMember.last_changed;
        }

        // Update personal info with most complete data
        if (rawMember.full_name && !member.full_name) {
          member.full_name = rawMember.full_name;
        }
        if (rawMember.merge_fields.FNAME && !member.first_name) {
          member.first_name = rawMember.merge_fields.FNAME;
        }
        if (rawMember.merge_fields.LNAME && !member.last_name) {
          member.last_name = rawMember.merge_fields.LNAME;
        }
        if (rawMember.merge_fields.PHONE && !member.phone) {
          member.phone = rawMember.merge_fields.PHONE;
        }
      }

      // Step 4: Calculate aggregated stats
      for (const member of Array.from(memberMap.values())) {
        const memberships = member.list_details;
        member.total_lists = memberships.length;
        member.active_lists = memberships.filter(m => m.status === 'subscribed').length;
        
        if (memberships.length > 0) {
          member.avg_member_rating = 
            memberships.reduce((sum, m) => sum + m.member_rating, 0) / memberships.length;
        }
      }

      const uniqueMembers = Array.from(memberMap.values());
      console.log(`Aggregated to ${uniqueMembers.length} unique members`);

      return { lists, members: uniqueMembers };
    } catch (error) {
      console.error('Error fetching all members across lists:', error);
      throw error;
    }
  }
}

// GET - Fetch member data with optimized Firestore queries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'firebase';

    if (source === 'mailchimp') {
      // Fetch directly from Mailchimp API (for testing)
      const mailchimp = new MailchimpAPI();
      const data = await mailchimp.getAllMembersAcrossLists();
      return NextResponse.json({ success: true, ...data });
    }

    const db = adminFirestore();
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    // Get metadata
    const metadataRef = db.collection('mailchimp-metadata').doc('current');
    const metadataDoc = await metadataRef.get();
    
    if (!metadataDoc.exists) {
      return NextResponse.json({
        success: true,
        lists: [],
        members: [],
        total_members: 0,
        message: 'No data found. Please sync with Mailchimp first.'
      });
    }

    const metadata = metadataDoc.data() as MailchimpMetadata;
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Cap at 100
    const search = searchParams.get('search')?.toLowerCase().trim() || '';
    const listFilter = searchParams.get('list') || '';
    const statusFilter = searchParams.get('status') || '';
    const tagFilter = searchParams.get('tag') || '';

    // Build Firestore query
    let query = db.collection('mailchimp-members').orderBy('last_activity_date', 'desc');
    
    // Apply filters using compound queries
    if (listFilter && listFilter !== 'all') {
      query = query.where('lists', 'array-contains', listFilter);
    }
    
    if (statusFilter && statusFilter !== 'all') {
      query = query.where('overall_status', '==', statusFilter);
    }
    
    if (tagFilter) {
      query = query.where('tags', 'array-contains', tagFilter);
    }

    // Execute query with pagination
    const offset = (page - 1) * limit;
    const snapshot = await query.offset(offset).limit(limit).get();
    
    let members = snapshot.docs.map(doc => doc.data() as MailchimpMember);

    // Apply text search filter (post-query since Firestore doesn't have full-text search)
    if (search) {
      members = members.filter(member => {
        const searchFields = [
          member.email_address,
          member.full_name,
          member.first_name,
          member.last_name,
          member.phone
        ].filter(Boolean).map(field => field!.toLowerCase());
        
        return searchFields.some(field => field.includes(search));
      });
    }

    // Get total count for pagination (approximate)
    let totalCount = metadata.total_members;
    
    // If filters are applied, we need actual count (expensive but necessary)
    if (listFilter || statusFilter || tagFilter || search) {
      const countQuery = db.collection('mailchimp-members');
      let countSnapshot;
      
      if (listFilter && listFilter !== 'all') {
        countSnapshot = await countQuery.where('lists', 'array-contains', listFilter).get();
      } else if (statusFilter && statusFilter !== 'all') {
        countSnapshot = await countQuery.where('overall_status', '==', statusFilter).get();
      } else if (tagFilter) {
        countSnapshot = await countQuery.where('tags', 'array-contains', tagFilter).get();
      } else {
        countSnapshot = await countQuery.get();
      }
      
      totalCount = countSnapshot.size;
      
      // Apply search filter to count if needed
      if (search && totalCount > 0) {
        const allDocs = countSnapshot.docs.map(doc => doc.data()) as MailchimpMember[];
        const filteredDocs = allDocs.filter(member => {
          const searchFields = [
            member.email_address,
            member.full_name,
            member.first_name,
            member.last_name,
            member.phone
          ].filter(Boolean).map(field => field!.toLowerCase());
          
          return searchFields.some(field => field.includes(search));
        });
        totalCount = filteredDocs.length;
      }
    }

    return NextResponse.json({
      success: true,
      lists: metadata.lists,
      members,
      total_members: totalCount,
      stats: metadata.stats,
      pagination: {
        page,
        limit,
        total_pages: Math.ceil(totalCount / limit),
        has_more: page * limit < totalCount,
        total_count: totalCount
      },
      last_sync: metadata.last_sync
    });
    
  } catch (error) {
    console.error('Error in Mailchimp API route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Sync with Mailchimp and store as individual documents
export async function POST(request: NextRequest) {
  try {
    const mailchimp = new MailchimpAPI();
    const db = adminFirestore();
    
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    // Update sync status
    const syncStatusRef = db.collection('mailchimp-sync-status').doc('current');
    await syncStatusRef.set({
      isRunning: true,
      lastSync: new Date().toISOString(),
      error: null
    }, { merge: true });

    console.log('Starting optimized Mailchimp sync...');
    
    // Fetch and aggregate all members
    const { lists, members } = await mailchimp.getAllMembersAcrossLists();
    
    console.log(`Processing ${members.length} unique members across ${lists.length} lists`);
    
    const now = new Date().toISOString();
    
    // Calculate stats
    const stats = {
      subscribed: 0,
      unsubscribed: 0,
      cleaned: 0,
      pending: 0
    };

    // Process members in batches of 500 (Firestore batch write limit)
    const BATCH_SIZE = 499; // Leave room for metadata document
    const totalBatches = Math.ceil(members.length / BATCH_SIZE);
    
    console.log(`Writing ${members.length} members in ${totalBatches} batches...`);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batch = db.batch();
      const startIdx = batchIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, members.length);
      const batchMembers = members.slice(startIdx, endIdx);
      
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (members ${startIdx + 1}-${endIdx})...`);
      
      batchMembers.forEach((member) => {
        // Transform member to optimized structure
        const optimizedMember: MailchimpMember = {
          email_address: member.email_address,
          unique_email_id: member.unique_email_id,
          contact_id: member.contact_id,
          full_name: member.full_name,
          first_name: member.first_name,
          last_name: member.last_name,
          phone: member.phone,
          overall_status: member.overall_status,
          
          // Arrays for efficient querying
          lists: member.lists,
          tags: member.tags,
          
          // Detailed information
          list_details: member.list_details,
          tag_details: member.tag_details,
          
          // Aggregated counts
          total_lists: member.total_lists,
          active_lists: member.active_lists,
          avg_member_rating: member.avg_member_rating,
          
          // Timestamps
          first_signup_date: member.first_signup_date,
          last_activity_date: member.last_activity_date,
          
          // Flags
          is_vip: member.is_vip,
          
          // Metadata
          language: member.language || 'en',
          location: member.location,
          
          created_at: now,
          updated_at: now
        };

        // Count stats
        stats[member.overall_status as keyof typeof stats]++;
        
        // Use email as document ID (URL-safe)
        const docId = member.email_address.replace(/[.#$\[\]]/g, '_');
        const docRef = db.collection('mailchimp-members').doc(docId);
        batch.set(docRef, optimizedMember);
      });
      
      // Commit this batch
      await batch.commit();
      console.log(`✅ Batch ${batchIndex + 1}/${totalBatches} committed successfully`);
    }

    // Store metadata in a separate write
    console.log('Writing metadata...');
    const metadataRef = db.collection('mailchimp-metadata').doc('current');
    const metadata: MailchimpMetadata = {
      lists,
      total_members: members.length,
      last_sync: now,
      stats
    };
    await metadataRef.set(metadata);
    
    // Update sync status
    await syncStatusRef.set({
      isRunning: false,
      lastSync: now,
      totalLists: lists.length,
      totalMembers: members.length,
      error: null
    }, { merge: true });

    console.log(`✅ Optimized sync completed: ${lists.length} lists, ${members.length} members`);

    return NextResponse.json({
      success: true,
      message: `Synced ${lists.length} lists with ${members.length} unique members`,
      stats
    });

  } catch (error) {
    console.error('❌ Error syncing Mailchimp data:', error);
    
    const db = adminFirestore();
    if (db) {
      const syncStatusRef = db.collection('mailchimp-sync-status').doc('current');
      await syncStatusRef.set({
        isRunning: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastSync: new Date().toISOString()
      }, { merge: true });
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}