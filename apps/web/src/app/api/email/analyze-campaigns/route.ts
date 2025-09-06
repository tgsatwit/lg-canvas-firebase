import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { campaigns, business, targetAudience } = await request.json();

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json(
        { error: 'No campaigns provided for analysis' },
        { status: 400 }
      );
    }

    // Fetch campaign contents for structure analysis
    const campaignIds = campaigns.map((c: any) => c.id);
    let campaignContents = [];
    
    try {
      const contentResponse = await fetch(`${request.nextUrl.origin}/api/email/campaigns/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaignIds: campaignIds.slice(0, 5) }), // Limit to 5 for performance
      });
      
      if (contentResponse.ok) {
        const { contents } = await contentResponse.json();
        campaignContents = contents;
      }
    } catch (error) {
      console.warn('Could not fetch campaign contents for structure analysis:', error);
    }

    // Prepare campaign summaries for analysis
    const campaignSummaries = campaigns.map((campaign: any) => ({
      subject: campaign.settings.subject_line,
      preview: campaign.settings.preview_text,
      sent_date: campaign.send_time,
      recipients: campaign.recipients.recipient_count,
      open_rate: campaign.report_summary?.open_rate || 0,
      click_rate: campaign.report_summary?.click_rate || 0,
    }));

    // Create the enhanced analysis prompt with structure analysis
    const analysisPrompt = `
    You are an expert email marketing analyst. Analyze the following recent email campaigns and provide comprehensive insights and recommendations.

    Business Context:
    - Business: ${business === 'pilates' ? 'Pilates by Lisa (Fitness and wellness services)' : 'Face by Lisa (Beauty and skincare services)'}
    - Target Audience: ${
      targetAudience === 'current' ? 'Current Members (Active subscribers and members)' :
      targetAudience === 'prospective' ? 'Prospective Members (People on mailing list who aren\'t current members)' :
      'Cancelled Members (Former members who cancelled)'
    }

    Recent Campaigns Data:
    ${JSON.stringify(campaignSummaries, null, 2)}

    ${campaignContents.length > 0 ? `
    Email Content Structure Analysis:
    ${JSON.stringify(campaignContents.map((c: any) => ({
      campaignId: c.campaignId,
      plainText: c.plainText?.substring(0, 1000) || 'No plain text available'
    })), null, 2)}
    ` : ''}

    Please provide a comprehensive analysis with:

    ## 1. Campaign Performance Summary
    Brief overview of patterns, themes, and overall performance trends.

    ## 2. Email Structure Analysis
    ${campaignContents.length > 0 ? `
    Based on the email content provided, identify:
    - Common email sections/blocks used (e.g., header, welcome message, featured content, call-to-action, social links, footer)
    - Which sections appear most frequently
    - How sections are typically organized/ordered
    ` : 'Analyze typical email structure patterns based on subject lines and performance data.'}

    ## 3. High-Performing Elements
    - Subject line patterns that drove higher open rates
    - Content themes/sections that likely drove engagement
    - Timing and frequency patterns

    ## 4. Areas for Improvement
    - Underperforming elements to avoid or improve
    - Missing opportunities
    - Structural improvements

    ## 5. Recommended Email Structure for Next Campaign
    Suggest a specific email structure with:
    - **Header Section**: Logo, navigation, or branding elements
    - **Opening Section**: Personal greeting, main message hook
    - **Content Sections**: 2-4 main content blocks (specify what each should contain)
    - **Call-to-Action Section**: Primary action you want recipients to take
    - **Secondary Content**: Additional value-add content
    - **Footer Section**: Social links, contact info, unsubscribe

    For each recommended section, specify:
    - Purpose and content focus
    - Approximate word count or length
    - Priority level (high/medium/low)

    Format your response with clear markdown headers and bullet points for easy reading.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert email marketing analyst specializing in fitness and beauty businesses.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const analysis = completion.choices[0].message.content;

    // Generate specific content recommendations
    const recommendationsPrompt = `
    Based on the analysis above, provide 5 specific key messages for the next weekly email campaign.
    
    Context:
    - Business: ${business === 'pilates' ? 'Pilates by Lisa' : 'Face by Lisa'}
    - Audience: ${targetAudience === 'current' ? 'Current Members' : targetAudience === 'prospective' ? 'Prospective Members' : 'Cancelled Members'}
    
    Previous Analysis:
    ${analysis}
    
    Provide 5 concise, actionable key messages (each should be 1 sentence, under 15 words).
    Format as a JSON array of strings.
    `;

    const recommendationsCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an email marketing expert. Provide only a JSON array of 5 message strings.',
        },
        {
          role: 'user',
          content: recommendationsPrompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    let suggestedMessages = [];
    try {
      const messagesContent = recommendationsCompletion.choices[0].message.content || '[]';
      suggestedMessages = JSON.parse(messagesContent);
    } catch (e) {
      // Fallback messages if parsing fails
      suggestedMessages = [
        'Special offer for loyal members this week',
        'New class schedule starting Monday',
        'Limited spots available - book now',
        'Member success story spotlight',
        'Exclusive wellness tips inside',
      ];
    }

    // Generate recommended email sections
    const sectionsPrompt = `
    Based on the previous analysis, create a structured list of recommended email sections for the next ${business === 'pilates' ? 'Pilates by Lisa' : 'Face by Lisa'} weekly email targeting ${targetAudience === 'current' ? 'Current Members' : targetAudience === 'prospective' ? 'Prospective Members' : 'Cancelled Members'}.

    Return a JSON array of recommended sections with this structure:
    [
      {
        "id": "header",
        "name": "Header Section",
        "description": "Brief description of what this section contains",
        "priority": "high|medium|low",
        "wordCount": "50-100",
        "required": true|false
      }
    ]

    Include 6-8 sections covering: header, opening/greeting, main content blocks, call-to-action, secondary content, and footer.
    `;

    const sectionsCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an email marketing expert. Return only valid JSON array of section objects.',
        },
        {
          role: 'user',
          content: sectionsPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    let recommendedSections = [];
    try {
      const sectionsContent = sectionsCompletion.choices[0].message.content || '[]';
      recommendedSections = JSON.parse(sectionsContent);
    } catch (e) {
      // Fallback sections if parsing fails
      recommendedSections = [
        {
          id: 'header',
          name: 'Header Section',
          description: 'Logo and branding',
          priority: 'high',
          wordCount: '10-20',
          required: true
        },
        {
          id: 'opening',
          name: 'Personal Greeting',
          description: 'Warm welcome and main message hook',
          priority: 'high',
          wordCount: '50-100',
          required: true
        },
        {
          id: 'featured-content',
          name: 'Featured Content',
          description: 'Main content highlight or announcement',
          priority: 'high',
          wordCount: '100-200',
          required: true
        },
        {
          id: 'cta',
          name: 'Call to Action',
          description: 'Primary action for recipients',
          priority: 'high',
          wordCount: '20-50',
          required: true
        },
        {
          id: 'secondary-content',
          name: 'Additional Content',
          description: 'Supporting information or tips',
          priority: 'medium',
          wordCount: '100-150',
          required: false
        },
        {
          id: 'footer',
          name: 'Footer',
          description: 'Contact info and social links',
          priority: 'medium',
          wordCount: '30-50',
          required: true
        }
      ];
    }

    return NextResponse.json({
      analysis,
      suggestedMessages,
      campaignSummaries,
      recommendedSections,
      structureAnalysisAvailable: campaignContents.length > 0,
    });
  } catch (error) {
    console.error('Error analyzing campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to analyze campaigns' },
      { status: 500 }
    );
  }
}