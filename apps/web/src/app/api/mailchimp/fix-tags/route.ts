import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '../../../../lib/firebase/admin';
import { MailchimpMember } from '@opencanvas/shared';

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_SERVER_PREFIX = MAILCHIMP_API_KEY?.split('-')[1];

if (!MAILCHIMP_API_KEY || !MAILCHIMP_SERVER_PREFIX) {
  console.error('Mailchimp API key not configured properly');
}

interface TagFixAction {
  email: string;
  action: 'add' | 'remove';
  tag: string;
  reason: string;
}

interface MailchimpTagResponse {
  tags: Array<{
    id: number;
    name: string;
  }>;
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

    // Handle empty responses (common for tag operations)
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

  async addTagsToMember(listId: string, email: string, tags: string[]): Promise<void> {
    try {
      const subscriberHash = this.md5(email);
      await this.makeRequest(`/lists/${listId}/members/${subscriberHash}/tags`, {
        method: 'POST',
        body: JSON.stringify({
          tags: tags.map(tag => ({ name: tag, status: 'active' }))
        }),
      });
    } catch (error) {
      console.error(`Error adding tags to ${email} in list ${listId}:`, error);
      throw error;
    }
  }

  async removeTagsFromMember(listId: string, email: string, tags: string[]): Promise<void> {
    try {
      const subscriberHash = this.md5(email);
      await this.makeRequest(`/lists/${listId}/members/${subscriberHash}/tags`, {
        method: 'POST',
        body: JSON.stringify({
          tags: tags.map(tag => ({ name: tag, status: 'inactive' }))
        }),
      });
    } catch (error) {
      console.error(`Error removing tags from ${email} in list ${listId}:`, error);
      throw error;
    }
  }

  async getMemberLists(email: string): Promise<string[]> {
    try {
      const subscriberHash = this.md5(email);
      
      // Get all lists first
      const listsResponse = await this.makeRequest('/lists?count=1000');
      const allLists = listsResponse.lists || [];
      
      const memberLists: string[] = [];
      
      // Check each list for the member
      for (const list of allLists) {
        try {
          const memberResponse = await this.makeRequest(`/lists/${list.id}/members/${subscriberHash}`);
          if (memberResponse && memberResponse.status !== 'cleaned') {
            memberLists.push(list.id);
          }
        } catch (error) {
          // Member not found in this list, continue
          continue;
        }
      }
      
      return memberLists;
    } catch (error) {
      console.error(`Error getting lists for ${email}:`, error);
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { actions }: { actions: TagFixAction[] } = await request.json();
    
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
      action: string;
      tag: string;
      success: boolean;
      error?: string;
    }> = [];

    // Group actions by email for efficiency
    const actionsByEmail = new Map<string, TagFixAction[]>();
    for (const action of actions) {
      const email = action.email.toLowerCase();
      if (!actionsByEmail.has(email)) {
        actionsByEmail.set(email, []);
      }
      actionsByEmail.get(email)!.push(action);
    }

    console.log(`Processing tag fixes for ${actionsByEmail.size} members...`);

    // Process each member's actions
    for (const [email, memberActions] of actionsByEmail) {
      try {
        // Get the member's lists from MailChimp
        const memberLists = await mailchimp.getMemberLists(email);
        
        if (memberLists.length === 0) {
          console.warn(`Member ${email} not found in any lists`);
          for (const action of memberActions) {
            results.push({
              email: action.email,
              action: action.action,
              tag: action.tag,
              success: false,
              error: 'Member not found in any lists'
            });
          }
          continue;
        }

        // Group actions by type
        const tagsToAdd = memberActions.filter(a => a.action === 'add').map(a => a.tag);
        const tagsToRemove = memberActions.filter(a => a.action === 'remove').map(a => a.tag);

        // Apply tag changes to all lists the member belongs to
        for (const listId of memberLists) {
          try {
            if (tagsToAdd.length > 0) {
              await mailchimp.addTagsToMember(listId, email, tagsToAdd);
            }
            if (tagsToRemove.length > 0) {
              await mailchimp.removeTagsFromMember(listId, email, tagsToRemove);
            }
          } catch (error) {
            console.error(`Error updating tags for ${email} in list ${listId}:`, error);
            // Continue with other lists even if one fails
          }
        }

        // Record successful actions
        for (const action of memberActions) {
          results.push({
            email: action.email,
            action: action.action,
            tag: action.tag,
            success: true
          });
        }

        // Update local Firebase cache
        try {
          const docId = email.replace(/[.#$\[\]]/g, '_');
          const memberRef = db.collection('mailchimp-members').doc(docId);
          const memberDoc = await memberRef.get();
          
          if (memberDoc.exists) {
            const memberData = memberDoc.data() as MailchimpMember;
            let updatedTags = [...(memberData.tags || [])];
            
            // Apply tag changes to local data
            for (const tag of tagsToAdd) {
              if (!updatedTags.includes(tag)) {
                updatedTags.push(tag);
              }
            }
            for (const tag of tagsToRemove) {
              updatedTags = updatedTags.filter(t => t !== tag);
            }
            
            // Update tag details
            let updatedTagDetails = [...(memberData.tag_details || [])];
            for (const tag of tagsToAdd) {
              const existingTag = updatedTagDetails.find(t => t.name === tag);
              if (!existingTag) {
                updatedTagDetails.push({
                  name: tag,
                  list_ids: memberLists
                });
              }
            }
            for (const tag of tagsToRemove) {
              updatedTagDetails = updatedTagDetails.filter(t => t.name !== tag);
            }
            
            await memberRef.update({
              tags: updatedTags,
              tag_details: updatedTagDetails,
              updated_at: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`Error updating local cache for ${email}:`, error);
          // Non-critical error, continue
        }

      } catch (error) {
        console.error(`Error processing actions for ${email}:`, error);
        for (const action of memberActions) {
          results.push({
            email: action.email,
            action: action.action,
            tag: action.tag,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Tag fix completed: ${successCount} successful, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} tag operations: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('Error in fix-tags API route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}