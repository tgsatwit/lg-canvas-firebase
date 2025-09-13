import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '../../../../lib/firebase/admin';
import { MailchimpMember } from '@opencanvas/shared';

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_SERVER_PREFIX = MAILCHIMP_API_KEY?.split('-')[1];

if (!MAILCHIMP_API_KEY || !MAILCHIMP_SERVER_PREFIX) {
  console.error('Mailchimp API key not configured properly');
}

interface ListAddAction {
  email: string;
  listId: string;
  listName: string;
  reason: string;
}

interface MailchimpListResponse {
  id: string;
  name: string;
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

    // Handle empty responses
    const responseText = await response.text();
    if (!responseText.trim()) {
      return {}; // Return empty object for successful empty responses
    }

    try {
      return JSON.parse(responseText);
    } catch (error) {
      console.warn(`Failed to parse MailChimp response as JSON: ${responseText}`);
      return {}; // Return empty object if JSON parsing fails but response was successful
    }
  }

  private md5(str: string): string {
    // Simple MD5 hash function for email addresses
    const crypto = require('crypto');
    return crypto.createHash('md5').update(str.toLowerCase()).digest('hex');
  }

  async getAllLists(): Promise<MailchimpListResponse[]> {
    try {
      const response = await this.makeRequest('/lists?count=1000&fields=lists.id,lists.name');
      return response.lists || [];
    } catch (error) {
      console.error('Error fetching Mailchimp lists:', error);
      throw error;
    }
  }

  async addMemberToList(listId: string, email: string, firstName?: string, lastName?: string): Promise<void> {
    try {
      const subscriberHash = this.md5(email);
      
      // First, try to get the member to see if they already exist
      let existingMember;
      try {
        existingMember = await this.makeRequest(`/lists/${listId}/members/${subscriberHash}`);
      } catch (error) {
        // Member doesn't exist, which is fine
      }

      if (existingMember && existingMember.status === 'subscribed') {
        console.log(`Member ${email} is already subscribed to list ${listId}`);
        return;
      }

      // Add or update the member
      const memberData: any = {
        email_address: email,
        status: 'subscribed'
      };

      // Add merge fields if we have name data
      if (firstName || lastName) {
        memberData.merge_fields = {};
        if (firstName) memberData.merge_fields.FNAME = firstName;
        if (lastName) memberData.merge_fields.LNAME = lastName;
      }

      await this.makeRequest(`/lists/${listId}/members/${subscriberHash}`, {
        method: 'PUT',
        body: JSON.stringify(memberData),
      });

      console.log(`Successfully added ${email} to list ${listId}`);
    } catch (error) {
      console.error(`Error adding ${email} to list ${listId}:`, error);
      throw error;
    }
  }

  async findListByName(listName: string): Promise<string | null> {
    try {
      const lists = await this.getAllLists();
      const matchingList = lists.find(list => 
        list.name.toLowerCase().includes(listName.toLowerCase())
      );
      return matchingList ? matchingList.id : null;
    } catch (error) {
      console.error(`Error finding list by name "${listName}":`, error);
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { actions }: { actions: ListAddAction[] } = await request.json();
    
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No actions provided' },
        { status: 400 }
      );
    }

    const mailchimp = new MailchimpAPI();
    const db = adminFirestore();
    
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    const results: Array<{
      email: string;
      listId: string;
      listName: string;
      success: boolean;
      error?: string;
    }> = [];

    console.log(`Processing list additions for ${actions.length} actions...`);

    // Process each action
    for (const action of actions) {
      try {
        // Resolve list ID if it's a placeholder
        let actualListId = action.listId;
        if (action.listId === 'FREE_WORKOUT_LIST_ID') {
          const foundListId = await mailchimp.findListByName('Free Workout');
          if (!foundListId) {
            throw new Error(`Could not find "Free Workout" list in Mailchimp`);
          }
          actualListId = foundListId;
        }

        // Get member's name from Firebase cache if available
        let firstName: string | undefined;
        let lastName: string | undefined;
        
        try {
          const docId = action.email.replace(/[.#$\[\]]/g, '_');
          const memberRef = db.collection('mailchimp-members').doc(docId);
          const memberDoc = await memberRef.get();
          
          if (memberDoc.exists) {
            const memberData = memberDoc.data() as MailchimpMember;
            firstName = memberData.first_name;
            lastName = memberData.last_name;
          }
        } catch (error) {
          console.warn(`Could not get name data for ${action.email}:`, error);
        }

        // Add member to the list
        await mailchimp.addMemberToList(actualListId, action.email, firstName, lastName);

        results.push({
          email: action.email,
          listId: action.listId,
          listName: action.listName,
          success: true
        });

        // Update local Firebase cache to include the new list
        try {
          const docId = action.email.replace(/[.#$\[\]]/g, '_');
          const memberRef = db.collection('mailchimp-members').doc(docId);
          const memberDoc = await memberRef.get();
          
          if (memberDoc.exists) {
            const memberData = memberDoc.data() as MailchimpMember;
            const updatedLists = [...(memberData.lists || [])];
            
            if (!updatedLists.includes(actualListId)) {
              updatedLists.push(actualListId);
              
              // Also add to list_details
              const updatedListDetails = [...(memberData.list_details || [])];
              updatedListDetails.push({
                list_id: actualListId,
                list_name: action.listName,
                status: 'subscribed',
                member_id: '', // Will be updated on next sync
                web_id: 0,
                timestamp_signup: new Date().toISOString(),
                timestamp_opt: new Date().toISOString(),
                member_rating: 2, // Default rating
                vip: false,
                last_changed: new Date().toISOString()
              });
              
              await memberRef.update({
                lists: updatedLists,
                list_details: updatedListDetails,
                total_lists: updatedLists.length,
                active_lists: updatedListDetails.filter(d => d.status === 'subscribed').length,
                updated_at: new Date().toISOString()
              });
            }
          }
        } catch (error) {
          console.error(`Error updating local cache for ${action.email}:`, error);
          // Non-critical error, continue
        }

      } catch (error) {
        console.error(`Error processing action for ${action.email}:`, error);
        results.push({
          email: action.email,
          listId: action.listId,
          listName: action.listName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`List addition completed: ${successCount} successful, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} list additions: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('Error in add-to-list API route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
