import { NextRequest, NextResponse } from 'next/server';

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_SERVER_PREFIX = MAILCHIMP_API_KEY?.split('-')[1];
const MAILCHIMP_API_URL = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`;

export async function GET(request: NextRequest) {
  try {
    if (!MAILCHIMP_API_KEY) {
      return NextResponse.json(
        { error: 'Mailchimp API key not configured' },
        { status: 500 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const campaignType = searchParams.get('type') || 'regular';
    const limit = searchParams.get('limit') || '10';

    // Fetch campaigns from Mailchimp
    const response = await fetch(
      `${MAILCHIMP_API_URL}/campaigns?type=${campaignType}&status=sent&sort_field=send_time&sort_dir=DESC&count=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Mailchimp API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch campaigns from Mailchimp' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract relevant campaign data
    const campaigns = data.campaigns.map((campaign: any) => ({
      id: campaign.id,
      web_id: campaign.web_id,
      type: campaign.type,
      create_time: campaign.create_time,
      send_time: campaign.send_time,
      status: campaign.status,
      emails_sent: campaign.emails_sent,
      settings: {
        subject_line: campaign.settings.subject_line,
        preview_text: campaign.settings.preview_text,
        title: campaign.settings.title,
        from_name: campaign.settings.from_name,
        reply_to: campaign.settings.reply_to,
      },
      recipients: {
        list_id: campaign.recipients.list_id,
        list_name: campaign.recipients.list_name,
        recipient_count: campaign.recipients.recipient_count,
      },
      report_summary: campaign.report_summary || {},
      tracking: campaign.tracking,
    }));

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}