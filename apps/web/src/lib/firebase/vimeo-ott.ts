import { adminFirestore } from './admin';
import type { Firestore } from 'firebase-admin/firestore';

// Types
export interface VimeoOttMember {
  id: string;
  email: string;
  name?: string;
  status: 'enabled' | 'cancelled' | 'expired' | 'disabled' | 'paused' | 'refunded';
  created_at: string;
  updated_at: string;
  plan: string;
  subscribed_to_site: boolean;
  product?: string;
  // Derived fields
  joinedThisWeek?: boolean;
  cancelledThisWeek?: boolean;
  // Metadata
  lastSynced?: string;
}

export interface VimeoOttSyncStatus {
  lastSync: string;
  totalMembers: number;
  membersByStatus: {
    enabled: number;
    cancelled: number;
    expired: number;
    disabled: number;
    paused: number;
    refunded: number;
  };
  syncInProgress: boolean;
}

// Collection names
const MEMBERS_COLLECTION = 'vimeo-ott-members';
const SYNC_STATUS_COLLECTION = 'vimeo-ott-sync-status';

/**
 * Sync members from Vimeo OTT API to Firebase
 */
export async function syncVimeoOttMembers(): Promise<{ success: boolean; message: string; stats?: any }> {
  const db = adminFirestore();
  if (!db) {
    return { success: false, message: 'Firestore not initialized' };
  }

  try {
    // Mark sync as in progress
    await db.collection(SYNC_STATUS_COLLECTION).doc('status').set({
      syncInProgress: true,
      syncStarted: new Date().toISOString()
    }, { merge: true });

    console.log('Starting Vimeo OTT members sync...');

    // Fetch all members from Vimeo OTT API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/vimeo-ott/all-members`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch members: ${response.status}`);
    }

    const data = await response.json();
    const { allCustomers, stats } = data;

    console.log(`Fetched ${allCustomers.length} members from Vimeo OTT`);

    // Batch write to Firestore
    const batch = db.batch();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Process and store each member
    for (const customer of allCustomers) {
      const memberId = customer.id.toString();
      const memberRef = db.collection(MEMBERS_COLLECTION).doc(memberId);
      
      const joinDate = new Date(customer.created_at);
      const updateDate = new Date(customer.updated_at);
      
      const memberData: VimeoOttMember = {
        id: memberId,
        email: customer.email,
        name: customer.name,
        status: customer.status || 'enabled',
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        plan: customer.plan,
        subscribed_to_site: customer.subscribed_to_site,
        product: customer._embedded?.latest_event?._embedded?.product || 'Unknown',
        joinedThisWeek: joinDate >= oneWeekAgo && joinDate <= now,
        cancelledThisWeek: (customer.status === 'cancelled' || customer.status === 'expired') && 
                          updateDate >= oneWeekAgo && updateDate <= now,
        lastSynced: now.toISOString()
      };

      batch.set(memberRef, memberData);
    }

    // Commit the batch
    await batch.commit();
    console.log('Successfully synced members to Firestore');

    // Update sync status
    await db.collection(SYNC_STATUS_COLLECTION).doc('status').set({
      lastSync: now.toISOString(),
      totalMembers: allCustomers.length,
      membersByStatus: stats.byStatus,
      syncInProgress: false,
      syncCompleted: now.toISOString()
    });

    return {
      success: true,
      message: `Successfully synced ${allCustomers.length} members`,
      stats
    };

  } catch (error) {
    console.error('Error syncing members:', error);
    
    // Mark sync as failed
    const db = adminFirestore();
    if (db) {
      await db.collection(SYNC_STATUS_COLLECTION).doc('status').set({
        syncInProgress: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        lastErrorTime: new Date().toISOString()
      }, { merge: true });
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to sync members'
    };
  }
}

/**
 * Get all members from Firebase
 */
export async function getVimeoOttMembers(): Promise<VimeoOttMember[]> {
  const db = adminFirestore();
  if (!db) {
    console.error('Firestore not initialized');
    return [];
  }

  try {
    const snapshot = await db.collection(MEMBERS_COLLECTION).get();
    const members: VimeoOttMember[] = [];
    
    snapshot.forEach(doc => {
      members.push(doc.data() as VimeoOttMember);
    });

    return members;
  } catch (error) {
    console.error('Error fetching members from Firestore:', error);
    return [];
  }
}

/**
 * Get sync status
 */
export async function getVimeoOttSyncStatus(): Promise<VimeoOttSyncStatus | null> {
  const db = adminFirestore();
  if (!db) {
    console.error('Firestore not initialized');
    return null;
  }

  try {
    const doc = await db.collection(SYNC_STATUS_COLLECTION).doc('status').get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as VimeoOttSyncStatus;
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return null;
  }
}