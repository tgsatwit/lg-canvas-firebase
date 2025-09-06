import { NextRequest, NextResponse } from 'next/server';

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_SERVER_PREFIX = MAILCHIMP_API_KEY?.split('-')[1];
const MAILCHIMP_API_URL = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`;

export async function POST(request: NextRequest) {
  try {
    if (!MAILCHIMP_API_KEY) {
      return NextResponse.json(
        { error: 'Mailchimp API key not configured' },
        { status: 500 }
      );
    }

    const { campaignIds } = await request.json();

    if (!campaignIds || !Array.isArray(campaignIds)) {
      return NextResponse.json(
        { error: 'Campaign IDs required' },
        { status: 400 }
      );
    }

    // Fetch content for each campaign
    const campaignContents = await Promise.all(
      campaignIds.map(async (campaignId: string) => {
        try {
          const response = await fetch(
            `${MAILCHIMP_API_URL}/campaigns/${campaignId}/content`,
            {
              headers: {
                'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            console.warn(`Failed to fetch content for campaign ${campaignId}`);
            return null;
          }

          const content = await response.json();
          return {
            campaignId,
            html: content.html,
            plainText: content.plain_text,
          };
        } catch (error) {
          console.warn(`Error fetching content for campaign ${campaignId}:`, error);
          return null;
        }
      })
    );

    // Filter out failed requests
    const validContents = campaignContents.filter(content => content !== null);

    return NextResponse.json({ contents: validContents });
  } catch (error) {
    console.error('Error fetching campaign contents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}