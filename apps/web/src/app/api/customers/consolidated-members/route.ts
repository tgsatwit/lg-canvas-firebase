import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

interface VimeoMember {
  id: string;
  email: string;
  name?: string;
  status: 'enabled' | 'cancelled' | 'expired' | 'disabled' | 'paused' | 'refunded';
  created_at: string;
  updated_at: string;
  plan: string;
  product?: string;
}

interface MailchimpMember {
  email_address: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  overall_status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'mixed';
  lists: string[];
  tags: string[];
  list_details: Array<{
    list_id: string;
    list_name: string;
    status: string;
    member_id: string;
    web_id: number;
    timestamp_signup?: string;
    timestamp_opt?: string;
    member_rating: number;
    vip: boolean;
    last_changed: string;
  }>;
  avg_member_rating: number;
  last_activity_date: string;
}

interface ConsolidatedMember {
  email: string;
  name?: string;
  // Vimeo OTT status - null means not a member
  vimeoStatus: 'enabled' | 'cancelled' | 'expired' | 'disabled' | 'paused' | 'refunded' | 'never a member' | null;
  vimeoJoinDate?: string;
  vimeoPlan?: string;
  vimeoProduct?: string;
  // MailChimp status - null means not a subscriber  
  mailchimpStatus: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'never subscribed' | null;
  mailchimpLists?: string[];
  mailchimpTags?: string[];
  mailchimpRating?: number;
  lastActivity?: string;
  source: 'vimeo' | 'mailchimp' | 'both';
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Fetching consolidated members from Firestore...');

    // Get Firestore instance
    const firestore = adminFirestore();
    if (!firestore) {
      throw new Error('Firebase Admin not initialized');
    }

    // Fetch Vimeo OTT members
    console.log('📺 Fetching Vimeo OTT members...');
    const vimeoSnapshot = await firestore.collection('vimeo-ott-members').get();
    const vimeoMembers: VimeoMember[] = [];
    
    vimeoSnapshot.forEach((doc) => {
      const data = doc.data() as VimeoMember;
      vimeoMembers.push({
        ...data,
        id: doc.id,
      });
    });
    
    console.log(`📺 Found ${vimeoMembers.length} Vimeo OTT members`);

    // Fetch MailChimp members
    console.log('📧 Fetching MailChimp members...');
    const mailchimpSnapshot = await firestore.collection('mailchimp-members').get();
    const mailchimpMembers: MailchimpMember[] = [];
    
    mailchimpSnapshot.forEach((doc) => {
      const data = doc.data() as MailchimpMember;
      mailchimpMembers.push(data);
    });
    
    console.log(`📧 Found ${mailchimpMembers.length} MailChimp members`);

    // Create consolidated member list
    const emailToMemberMap = new Map<string, ConsolidatedMember>();

    // Process Vimeo members first
    vimeoMembers.forEach((vimeoMember) => {
      const email = vimeoMember.email.toLowerCase();
      
      emailToMemberMap.set(email, {
        email: vimeoMember.email,
        name: vimeoMember.name,
        vimeoStatus: vimeoMember.status,
        vimeoJoinDate: vimeoMember.created_at,
        vimeoPlan: vimeoMember.plan,
        vimeoProduct: vimeoMember.product,
        mailchimpStatus: 'never subscribed',
        lastActivity: vimeoMember.updated_at,
        source: 'vimeo'
      });
    });

    // Process MailChimp members and merge with existing
    mailchimpMembers.forEach((mailchimpMember) => {
      const email = mailchimpMember.email_address.toLowerCase();
      const existingMember = emailToMemberMap.get(email);
      
      const mailchimpName = mailchimpMember.full_name || 
        (mailchimpMember.first_name && mailchimpMember.last_name 
          ? `${mailchimpMember.first_name} ${mailchimpMember.last_name}`
          : mailchimpMember.first_name);

      if (existingMember) {
        // Member exists in both sources
        existingMember.mailchimpStatus = mailchimpMember.overall_status;
        existingMember.mailchimpLists = mailchimpMember.list_details?.map(list => list.list_name) || [];
        existingMember.mailchimpTags = mailchimpMember.tags || [];
        existingMember.mailchimpRating = mailchimpMember.avg_member_rating;
        existingMember.source = 'both';
        // Use MailChimp name if Vimeo doesn't have one
        if (!existingMember.name && mailchimpName) {
          existingMember.name = mailchimpName;
        }
        // Use the most recent activity date
        if (mailchimpMember.last_activity_date && 
            (!existingMember.lastActivity || 
             new Date(mailchimpMember.last_activity_date) > new Date(existingMember.lastActivity))) {
          existingMember.lastActivity = mailchimpMember.last_activity_date;
        }
      } else {
        // MailChimp only member
        emailToMemberMap.set(email, {
          email: mailchimpMember.email_address,
          name: mailchimpName,
          vimeoStatus: 'never a member',
          mailchimpStatus: mailchimpMember.overall_status,
          mailchimpLists: mailchimpMember.list_details?.map(list => list.list_name) || [],
          mailchimpTags: mailchimpMember.tags || [],
          mailchimpRating: mailchimpMember.avg_member_rating,
          lastActivity: mailchimpMember.last_activity_date,
          source: 'mailchimp'
        });
      }
    });

    // Convert map to array and sort by email
    const consolidatedMembers = Array.from(emailToMemberMap.values())
      .sort((a, b) => a.email.localeCompare(b.email));

    console.log(`✅ Consolidated ${consolidatedMembers.length} unique members`);
    console.log(`   - Vimeo only: ${consolidatedMembers.filter(m => m.source === 'vimeo').length}`);
    console.log(`   - MailChimp only: ${consolidatedMembers.filter(m => m.source === 'mailchimp').length}`);
    console.log(`   - Both sources: ${consolidatedMembers.filter(m => m.source === 'both').length}`);

    // Get last sync times from both sources
    let lastSyncTime: string | null = null;
    try {
      // Check for Vimeo sync status
      const vimeoSyncDoc = await firestore.collection('sync-status').doc('vimeo-ott').get();
      const mailchimpSyncDoc = await firestore.collection('sync-status').doc('mailchimp').get();
      
      const vimeoSyncData = vimeoSyncDoc.exists ? vimeoSyncDoc.data() : null;
      const mailchimpSyncData = mailchimpSyncDoc.exists ? mailchimpSyncDoc.data() : null;
      
      const vimeoLastSync = vimeoSyncData?.lastSync;
      const mailchimpLastSync = mailchimpSyncData?.lastSync;
      
      if (vimeoLastSync && mailchimpLastSync) {
        // Use the older of the two sync times (most conservative)
        lastSyncTime = new Date(vimeoLastSync) < new Date(mailchimpLastSync) ? vimeoLastSync : mailchimpLastSync;
      } else {
        lastSyncTime = vimeoLastSync || mailchimpLastSync || null;
      }
    } catch (syncError) {
      console.warn('Warning: Could not fetch sync status:', syncError);
    }

    return NextResponse.json({
      success: true,
      members: consolidatedMembers,
      count: consolidatedMembers.length,
      lastSync: lastSyncTime,
      breakdown: {
        vimeoOnly: consolidatedMembers.filter(m => m.source === 'vimeo').length,
        mailchimpOnly: consolidatedMembers.filter(m => m.source === 'mailchimp').length,
        bothSources: consolidatedMembers.filter(m => m.source === 'both').length,
      }
    });

  } catch (error) {
    console.error('❌ Error fetching consolidated members:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch consolidated members',
        members: []
      },
      { status: 500 }
    );
  }
}