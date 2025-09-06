"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useUserContext } from '@/contexts/UserContext';
import { EmailDraft } from '@opencanvas/shared/types';
import { EmailDraftsTab } from './components/EmailDraftsTab';

export default function EmailMarketingPage() {
  const { user, loading } = useUserContext();
  const [activeTab, setActiveTab] = useState<'drafts' | 'setup' | 'analysis' | 'design' | 'preview'>('drafts');
  
  // Draft management state
  const [currentDraft, setCurrentDraft] = useState<EmailDraft | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const [emailData, setEmailData] = useState({
    // New fields for business and audience selection
    business: '',
    targetAudience: '',
    campaignType: '',
    // Existing fields
    theme: '',
    audience: '',
    goalType: '',
    customGoal: '',
    keyMessages: [] as string[],
    generatedCopy: '',
    subject: '',
    preheader: ''
  });
  const [newMessage, setNewMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignAnalysis, setCampaignAnalysis] = useState<{
    analysis: string;
    suggestedMessages: string[];
    campaignSummaries: any[];
    recommendedSections: any[];
    structureAnalysisAvailable: boolean;
  } | null>(null);
  const [emailDesign, setEmailDesign] = useState<{
    focus: string;
    goal: string;
    keyMessages: string[];
    selectedSections: any[];
    customSections: any[];
  }>({
    focus: '',
    goal: '',
    keyMessages: [],
    selectedSections: [],
    customSections: []
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Helper functions for section management
  const moveSection = (fromIndex: number, toIndex: number) => {
    const allSections = [...emailDesign.selectedSections, ...emailDesign.customSections];
    const ctaIndex = allSections.findIndex(s => s.id === 'cta' || s.id === 'call-to-action');
    
    // Don't allow moving CTA section or moving other sections after CTA
    if (fromIndex === ctaIndex || (toIndex >= ctaIndex && ctaIndex !== -1)) {
      return;
    }
    
    setEmailDesign(prev => {
      const newSelectedSections = [...prev.selectedSections];
      const newCustomSections = [...prev.customSections];
      
      // Find which array the section is in
      const selectedIndex = prev.selectedSections.findIndex((_, i) => i === fromIndex);
      const customStartIndex = prev.selectedSections.length;
      
      if (selectedIndex !== -1) {
        // Moving from selectedSections
        const [movedSection] = newSelectedSections.splice(fromIndex, 1);
        if (toIndex < customStartIndex) {
          newSelectedSections.splice(toIndex, 0, movedSection);
        } else {
          newCustomSections.splice(toIndex - customStartIndex, 0, movedSection);
        }
      } else {
        // Moving from customSections
        const customIndex = fromIndex - customStartIndex;
        const [movedSection] = newCustomSections.splice(customIndex, 1);
        if (toIndex < customStartIndex) {
          newSelectedSections.splice(toIndex, 0, movedSection);
        } else {
          newCustomSections.splice(toIndex - customStartIndex, 0, movedSection);
        }
      }
      
      return {
        ...prev,
        selectedSections: newSelectedSections,
        customSections: newCustomSections
      };
    });
  };
  
  const addCustomSection = () => {
    const newSection = {
      id: `custom-${Date.now()}`,
      name: 'Custom Section',
      description: 'Custom content section',
      priority: 'medium',
      wordCount: '50-150',
      required: false,
      content: '',
      components: []
    };
    
    setEmailDesign(prev => ({
      ...prev,
      customSections: [...prev.customSections, newSection]
    }));
  };
  
  const addCampaignMessageSection = () => {
    const campaignMessageSection = {
      id: 'campaign-message',
      name: 'Campaign Message',
      description: 'Key message or announcement for this campaign',
      priority: 'high',
      wordCount: '75-150',
      required: false,
      content: '',
      components: []
    };
    
    setEmailDesign(prev => ({
      ...prev,
      customSections: [...prev.customSections, campaignMessageSection]
    }));
  };
  
  const getAllSections = () => {
    return [...emailDesign.selectedSections, ...emailDesign.customSections];
  };

  // Business types
  const businessTypes = [
    { id: 'pilates', name: 'Pilates by Lisa', description: 'Fitness and wellness services' },
    { id: 'face', name: 'Face by Lisa', description: 'Beauty and skincare services' }
  ];

  // Target audience types
  const audienceTypes = [
    { id: 'current', name: 'Current Members', description: 'Active subscribers and members' },
    { id: 'prospective', name: 'Prospective Members', description: 'All on mailing list who aren\'t current members' },
    { id: 'cancelled', name: 'Cancelled Members', description: 'Former members who cancelled' }
  ];

  // Campaign types
  const campaignTypes = [
    { id: 'weekly', name: 'Weekly Email', description: 'Regular weekly newsletter' },
    { id: 'custom', name: 'Custom Campaign', description: 'Special promotions or announcements' }
  ];

  // Theme options
  const themes = [
    { id: 'professional', name: 'Professional', description: 'Clean, corporate styling' },
    { id: 'friendly', name: 'Friendly', description: 'Warm, conversational tone' },
    { id: 'urgent', name: 'Urgent', description: 'Time-sensitive, action-focused' },
    { id: 'educational', name: 'Educational', description: 'Informative, teaching-focused' },
    { id: 'promotional', name: 'Promotional', description: 'Sales-driven, offer-focused' },
    { id: 'newsletter', name: 'Newsletter', description: 'Regular update format' }
  ];

  // Goal types
  const goalTypes = [
    'Drive sales/conversions',
    'Build brand awareness',
    'Nurture leads',
    'Announce product/service',
    'Share educational content',
    'Re-engage inactive users',
    'Custom goal'
  ];

  const fetchAndAnalyzeCampaigns = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      // Fetch recent campaigns
      const campaignsResponse = await fetch('/api/email/campaigns?type=regular&limit=10');
      if (!campaignsResponse.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      const { campaigns } = await campaignsResponse.json();

      // Analyze campaigns if we have any
      if (campaigns && campaigns.length > 0) {
        const analysisResponse = await fetch('/api/email/analyze-campaigns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaigns,
            business: emailData.business,
            targetAudience: emailData.targetAudience,
          }),
        });

        if (!analysisResponse.ok) {
          throw new Error('Failed to analyze campaigns');
        }

        const analysisData = await analysisResponse.json();
        setCampaignAnalysis(analysisData);

        // Auto-populate suggested messages if available
        if (analysisData.suggestedMessages && analysisData.suggestedMessages.length > 0) {
          setEmailData(prev => ({
            ...prev,
            keyMessages: analysisData.suggestedMessages.slice(0, 5)
          }));
        }
      } else {
        setAnalysisError('No previous campaigns found to analyze');
      }
    } catch (error) {
      console.error('Error analyzing campaigns:', error);
      setAnalysisError('Unable to analyze previous campaigns. You can continue manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddMessage = () => {
    if (newMessage.trim() && emailData.keyMessages.length < 5) {
      setEmailData(prev => ({
        ...prev,
        keyMessages: [...prev.keyMessages, newMessage.trim()]
      }));
      setNewMessage('');
    }
  };

  const handleRemoveMessage = (index: number) => {
    setEmailData(prev => ({
      ...prev,
      keyMessages: prev.keyMessages.filter((_, i) => i !== index)
    }));
  };

  const generateCopy = async () => {
    if (!emailData.business || !emailData.targetAudience || !emailData.campaignType || 
        !emailData.theme || !emailData.goalType || emailData.keyMessages.length === 0) {
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/email/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business: emailData.business,
          targetAudience: emailData.targetAudience,
          campaignType: emailData.campaignType,
          theme: emailData.theme,
          audience: `${emailData.targetAudience} for ${emailData.business}`,
          goal: emailData.goalType === 'Custom goal' ? emailData.customGoal : emailData.goalType,
          keyMessages: emailData.keyMessages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate copy');
      }

      const result = await response.json();
      setEmailData(prev => ({
        ...prev,
        generatedCopy: result.body,
        subject: result.subject,
        preheader: result.preheader
      }));
      setActiveTab('preview');
    } catch (error) {
      console.error('Failed to generate copy:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Draft management functions
  const handleEditDraft = (draft: EmailDraft) => {
    setCurrentDraft(draft);
    
    // Load draft data into campaign form
    setEmailData({
      business: draft.business,
      targetAudience: draft.targetAudience,
      campaignType: draft.campaignType,
      theme: draft.theme || '',
      audience: `${draft.targetAudience} for ${draft.business}`,
      goalType: draft.goalType || '',
      customGoal: draft.customGoal || '',
      keyMessages: draft.keyMessages || [],
      generatedCopy: draft.emailBody || '',
      subject: draft.subject || '',
      preheader: draft.preheader || ''
    });

    // Load email design data
    if (draft.emailDesign) {
      setEmailDesign({
        focus: draft.emailDesign.focus || '',
        goal: draft.emailDesign.goal || '',
        keyMessages: draft.emailDesign.keyMessages || [],
        selectedSections: draft.emailDesign.selectedSections || [],
        customSections: draft.emailDesign.customSections || []
      });
    }

    // Load campaign analysis
    if (draft.campaignAnalysis) {
      setCampaignAnalysis({
        analysis: draft.campaignAnalysis.analysis || '',
        suggestedMessages: draft.campaignAnalysis.suggestedMessages || [],
        campaignSummaries: draft.campaignAnalysis.campaignSummaries || [],
        recommendedSections: draft.campaignAnalysis.recommendedSections || [],
        structureAnalysisAvailable: Boolean(draft.campaignAnalysis.analysis)
      });
    }

    // Navigate to appropriate tab based on draft progress
    if (draft.emailBody) {
      setActiveTab('preview');
    } else if (draft.campaignType === 'weekly' && draft.emailDesign) {
      setActiveTab('design');
    } else if (draft.campaignType === 'weekly' && draft.campaignAnalysis) {
      setActiveTab('analysis');
    } else {
      setActiveTab('setup');
    }
  };

  const handleCreateNew = () => {
    // Reset all form data
    resetForm();
    setCurrentDraft(null);
    setActiveTab('setup');
  };

  const autoSaveDraft = useCallback(async (partialData: Partial<EmailDraft> = {}) => {
    if (!user || autoSaving) return;
    
    // Only save if we have the minimum required fields
    if (!emailData.business || !emailData.targetAudience || !emailData.campaignType) {
      return;
    }
    
    // Rate limiting: don't save more than once every 3 seconds
    const nowTimestamp = Date.now();
    if (nowTimestamp - lastSaveTime < 3000) {
      return;
    }
    
    try {
      setAutoSaving(true);
      setLastSaveTime(nowTimestamp);
      
      const now = new Date().toISOString();
      const draftData: EmailDraft = {
        id: currentDraft?.id || '',
        title: currentDraft?.title || `${businessTypes.find(b => b.id === emailData.business)?.name || 'New'} - ${audienceTypes.find(a => a.id === emailData.targetAudience)?.name || 'Campaign'} - ${new Date().toLocaleDateString()}`,
        status: currentDraft?.status || 'draft',
        business: emailData.business as any,
        targetAudience: emailData.targetAudience as any,
        campaignType: emailData.campaignType as any,
        subject: emailData.subject || '',
        preheader: emailData.preheader || '',
        emailBody: emailData.generatedCopy || '',
        theme: emailData.theme || '',
        goalType: emailData.goalType || '',
        customGoal: emailData.customGoal || '',
        keyMessages: emailData.keyMessages || [],
        emailDesign: emailDesign,
        campaignAnalysis: campaignAnalysis
          ? {
              analysis: campaignAnalysis.analysis,
              suggestedMessages: campaignAnalysis.suggestedMessages,
              campaignSummaries: campaignAnalysis.campaignSummaries,
              recommendedSections: campaignAnalysis.recommendedSections,
            }
          : undefined,
        createdBy: currentDraft?.createdBy || user.id,
        createdByName: currentDraft?.createdByName || (user.displayName ?? user.email ?? ''),
        createdAt: currentDraft?.createdAt || now,
        updatedAt: now,
        lastEditedBy: user.id,
        lastEditedByName: user.displayName ?? user.email ?? '',
        hasUnsavedChanges: false,
        ...partialData
      };

      const url = draftData.id ? `/api/email/drafts/${draftData.id}` : '/api/email/drafts';
      const method = draftData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.draft) {
          setCurrentDraft(data.draft);
        }
      } else {
        const errorData = await response.json();
        console.error('Auto-save failed:', errorData);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [user, autoSaving, currentDraft, emailData, emailDesign, campaignAnalysis, lastSaveTime]);

  const handleBackToDrafts = () => {
    setCurrentDraft(null);
    resetForm();
    setActiveTab('drafts');
  };

  const resetForm = () => {
    setEmailData({
      business: '',
      targetAudience: '',
      campaignType: '',
      theme: '',
      audience: '',
      goalType: '',
      customGoal: '',
      keyMessages: [],
      generatedCopy: '',
      subject: '',
      preheader: ''
    });
    setEmailDesign({
      focus: '',
      goal: '',
      keyMessages: [],
      selectedSections: [],
      customSections: []
    });
    setCampaignAnalysis(null);
    setAnalysisError(null);
    setActiveTab('drafts');
  };

  // Auto-save whenever form data changes (debounced)
  useEffect(() => {
    // Only auto-save if we're in the campaign workflow (not on drafts tab) and have required fields
    if (activeTab !== 'drafts' && emailData.business && emailData.targetAudience && emailData.campaignType) {
      const timeoutId = setTimeout(() => {
        autoSaveDraft();
      }, 2000); // Auto-save 2 seconds after user stops making changes

      return () => clearTimeout(timeoutId);
    }
  }, [emailData, emailDesign, campaignAnalysis, activeTab, autoSaveDraft]);

  // Save when user first completes the required fields
  useEffect(() => {
    if (activeTab !== 'drafts' && emailData.business && emailData.targetAudience && emailData.campaignType && user && !currentDraft) {
      // Small delay to prevent immediate save on page load
      const timeoutId = setTimeout(() => {
        autoSaveDraft();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [emailData.business, emailData.targetAudience, emailData.campaignType, activeTab, user, currentDraft, autoSaveDraft]);

  // Enhanced navigation functions with auto-save
  const navigateToAnalysis = async () => {
    await autoSaveDraft();
    setActiveTab('analysis');
    if (!campaignAnalysis && !isAnalyzing) {
      fetchAndAnalyzeCampaigns();
    }
  };

  const navigateToDesign = async () => {
    await autoSaveDraft();
    setActiveTab('design');
  };

  const navigateToPreview = async () => {
    await autoSaveDraft();
    setActiveTab('preview');
  };

  // Format the analysis text into compact, readable sections
  const formatAnalysis = (text: string) => {
    if (!text) return null;
    
    // Split by numbered points or headers
    const sections = text.split(/\n(?=\d+\.|#{1,3}\s)/);
    
    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          // Check if it's a numbered point
          const numberedMatch = section.match(/^(\d+)\.\s*([\s\S]+)/);
          if (numberedMatch) {
            const [, number, content] = numberedMatch;
            
            return (
              <div key={index} className="flex gap-3 items-start py-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-white text-xs font-medium flex items-center justify-center">
                  {number}
                </span>
                <div className="flex-1 text-sm text-gray-700 leading-relaxed">
                  {formatTextContentCompact(content.trim())}
                </div>
              </div>
            );
          }
          
          // Check if it's a header
          const headerMatch = section.match(/^#{1,3}\s+(.+)/);
          if (headerMatch) {
            const [, header] = headerMatch;
            const remainingContent = section.replace(/^#{1,3}\s+.+\n?/, '');
            return (
              <div key={index} className="mb-3">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">{header}</h4>
                {remainingContent && (
                  <div className="text-sm text-gray-600 leading-relaxed">
                    {formatTextContentCompact(remainingContent.trim())}
                  </div>
                )}
              </div>
            );
          }
          
          // Regular paragraph - don't truncate unnecessarily
          if (section.trim() && section.trim().length > 10) {
            return (
              <div key={index} className="text-sm text-gray-600 leading-relaxed">
                {formatTextContentCompact(section.trim())}
              </div>
            );
          }
          
          return null;
        }).filter(Boolean)}
      </div>
    );
  };

  // Helper function to format text content with bullet points and bold text
  const formatTextContent = (text: string) => {
    // Split by lines to handle bullet points
    const lines = text.split('\n');
    const formattedLines: JSX.Element[] = [];
    let currentList: string[] = [];
    let currentParagraph: string[] = [];

    const processParagraph = () => {
      if (currentParagraph.length > 0) {
        const paragraphText = currentParagraph.join(' ').trim();
        formattedLines.push(
          <p key={`p-${formattedLines.length}`} className="text-gray-700 leading-relaxed mb-2">
            {formatInlineText(paragraphText)}
          </p>
        );
        currentParagraph = [];
      }
    };

    const processList = () => {
      if (currentList.length > 0) {
        formattedLines.push(
          <ul key={`ul-${formattedLines.length}`} className="list-disc list-inside space-y-2 mb-3 ml-4">
            {currentList.map((item, i) => (
              <li key={i} className="text-gray-700 leading-relaxed">
                {formatInlineText(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check for bullet points (-, *, •, or -)
      if (trimmedLine.match(/^[-*•]\s+(.+)/) || trimmedLine.match(/^-\s+(.+)/)) {
        processParagraph(); // Process any pending paragraph
        const bulletContent = trimmedLine.replace(/^[-*•]\s+/, '').trim();
        currentList.push(bulletContent);
      }
      // Check for numbered sub-points (e.g., "- **Something:**")
      else if (trimmedLine.match(/^-\s*\*\*(.+?)\*\*/) || trimmedLine.match(/^•\s*\*\*(.+?)\*\*/)) {
        processParagraph();
        const bulletContent = trimmedLine.replace(/^[-•]\s*/, '').trim();
        currentList.push(bulletContent);
      }
      // Empty line - process current content
      else if (trimmedLine === '') {
        processList();
        processParagraph();
      }
      // Regular text
      else {
        processList(); // Process any pending list
        currentParagraph.push(trimmedLine);
      }
    });

    // Process remaining content
    processList();
    processParagraph();

    return <div>{formattedLines}</div>;
  };

  // Helper function to format inline text (bold, italic, etc.)
  const formatInlineText = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let currentText = text;
    let keyCounter = 0;

    // Replace **bold** text
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Add the bold text
      parts.push(
        <strong key={`bold-${keyCounter++}`} className="font-semibold text-gray-900">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  // Compact version for condensed analysis display
  const formatTextContentCompact = (text: string) => {
    // Keep structure but make more readable - preserve line breaks for sections
    const cleanText = text
      .replace(/^\s*[-•*]\s*/gm, '') // Remove bullet points
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks to double
      .trim();
    
    return (
      <div className="text-gray-700 leading-relaxed space-y-2">
        {cleanText.split('\n\n').map((paragraph, index) => (
          <div key={index} className="">
            {formatInlineText(paragraph.trim())}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center relative"
        style={{
          background: `linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(139, 92, 246, 0.04) 50%, rgba(236, 72, 153, 0.08) 100%)`
        }}>
        <div className="relative z-10 p-8 rounded-2xl border"
          style={{
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)`,
            backdropFilter: 'blur(20px) saturate(150%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)`
          }}>
          <p className="text-gray-800 text-lg">Please sign in to access Email Marketing.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative min-h-screen"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(148, 163, 184, 0.08) 0%,
            rgba(203, 213, 225, 0.04) 50%,
            rgba(148, 163, 184, 0.08) 100%
          )
        `,
      }}
    >
      {/* Ambient background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `
              radial-gradient(circle at 35% 25%, rgba(148, 163, 184, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 65% 75%, rgba(203, 213, 225, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 10%, rgba(156, 163, 175, 0.08) 0%, transparent 40%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 p-6">
        <div className="w-full max-w-none">
          {/* Header */}
          <div 
            className="p-6 rounded-2xl border mb-8"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.25) 0%,
                  rgba(255, 255, 255, 0.1) 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Email Marketing</h1>
              <p className="text-gray-600 mt-1">Create and manage email campaigns for your businesses</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
                <Button
                  variant={activeTab === 'drafts' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={handleBackToDrafts}
                  className={cn(
                    "rounded-xl transition-all duration-200 px-6 py-2",
                    activeTab === 'drafts' 
                      ? "text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                  style={activeTab === 'drafts' ? {
                    background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                  } : {}}
                >
                  Email Drafts
                </Button>

                {/* Show campaign workflow tabs only when not in drafts view */}
                {activeTab !== 'drafts' && (
                  <>
                    <Button
                      variant={activeTab === 'setup' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('setup')}
                      className={cn(
                        "rounded-xl transition-all duration-200 px-6 py-2",
                        activeTab === 'setup' 
                          ? "text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}
                      style={activeTab === 'setup' ? {
                        background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                      } : {}}
                    >
                      Campaign Setup
                    </Button>
                    {emailData.campaignType === 'weekly' && (
                      <Button
                        variant={activeTab === 'analysis' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={navigateToAnalysis}
                        disabled={!emailData.business || !emailData.targetAudience || !emailData.campaignType}
                        className={cn(
                          "rounded-xl transition-all duration-200 px-6 py-2",
                          activeTab === 'analysis' 
                            ? "text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                        )}
                        style={activeTab === 'analysis' ? {
                          background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                        } : {}}
                      >
                        Campaign Analysis
                      </Button>
                    )}
                    {emailData.campaignType === 'weekly' && (
                      <Button
                        variant={activeTab === 'design' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={navigateToDesign}
                        disabled={!campaignAnalysis}
                        className={cn(
                          "rounded-xl transition-all duration-200 px-6 py-2",
                          activeTab === 'design' 
                            ? "text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                        )}
                        style={activeTab === 'design' ? {
                          background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                        } : {}}
                      >
                        Design Email
                      </Button>
                    )}
                    <Button
                      variant={activeTab === 'preview' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={navigateToPreview}
                      disabled={!emailData.generatedCopy}
                      className={cn(
                        "rounded-xl transition-all duration-200 px-6 py-2",
                        activeTab === 'preview' 
                          ? "text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                      )}
                      style={activeTab === 'preview' ? {
                        background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                      } : {}}
                    >
                      Preview & Send
                    </Button>
                  </>
                )}
              </div>
              
              {/* Current draft info and auto-save indicator */}
              {activeTab !== 'drafts' && (
                <div className="flex items-center gap-3">
                  {autoSaving && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                      <span>Saving...</span>
                    </div>
                  )}
                  {currentDraft && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Draft: {currentDraft.title}
                      </Badge>
                      <span>Last saved: {new Date(currentDraft.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {/* Drafts Tab */}
            {activeTab === 'drafts' && (
              <EmailDraftsTab
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onEditDraft={handleEditDraft}
                onCreateNew={handleCreateNew}
              />
            )}

            {/* Setup Tab */}
            {activeTab === 'setup' && (
              <div 
                className="p-6 rounded-2xl border"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.25) 0%,
                      rgba(255, 255, 255, 0.1) 100%
                    )
                  `,
                  backdropFilter: 'blur(20px) saturate(150%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4)
                  `,
                }}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Campaign Setup</h2>
                <div className="space-y-6">
                  {/* Business Selection */}
                  <div>
                    <Label className="text-base font-medium text-gray-900 mb-3 block">Select Business</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {businessTypes.map((business) => (
                        <div
                          key={business.id}
                          className={cn(
                            "p-4 rounded-xl border-2 cursor-pointer transition-all",
                            emailData.business === business.id
                              ? "border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50"
                              : "border-gray-200 hover:border-pink-300 hover:bg-gradient-to-br hover:from-pink-50/50 hover:to-purple-50/50"
                          )}
                          onClick={() => setEmailData(prev => ({ ...prev, business: business.id }))}
                        >
                          <h4 className="font-medium text-gray-900">{business.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{business.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Target Audience Selection */}
                  <div>
                    <Label className="text-base font-medium text-gray-900 mb-3 block">Target Audience</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {audienceTypes.map((audience) => (
                        <div
                          key={audience.id}
                          className={cn(
                            "p-4 rounded-xl border-2 cursor-pointer transition-all",
                            emailData.targetAudience === audience.id
                              ? "border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50"
                              : "border-gray-200 hover:border-pink-300 hover:bg-gradient-to-br hover:from-pink-50/50 hover:to-purple-50/50"
                          )}
                          onClick={() => setEmailData(prev => ({ ...prev, targetAudience: audience.id }))}
                        >
                          <h4 className="font-medium text-gray-900">{audience.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{audience.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Campaign Type Selection */}
                  <div>
                    <Label className="text-base font-medium text-gray-900 mb-3 block">Campaign Type</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {campaignTypes.map((campaign) => (
                        <div
                          key={campaign.id}
                          className={cn(
                            "p-4 rounded-xl border-2 cursor-pointer transition-all",
                            emailData.campaignType === campaign.id
                              ? "border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50"
                              : "border-gray-200 hover:border-pink-300 hover:bg-gradient-to-br hover:from-pink-50/50 hover:to-purple-50/50"
                          )}
                          onClick={() => {
                            setEmailData(prev => ({ ...prev, campaignType: campaign.id }));
                            // Auto-set goal for weekly emails
                            if (campaign.id === 'weekly') {
                              setEmailDesign(prev => ({ ...prev, goal: 'Get more signups for the studio' }));
                            }
                            // Clear analysis if switching away from weekly
                            if (campaign.id !== 'weekly') {
                              setCampaignAnalysis(null);
                              setAnalysisError(null);
                            }
                          }}
                        >
                          <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      if (emailData.campaignType === 'weekly') {
                        navigateToAnalysis();
                      } else {
                        navigateToPreview();
                      }
                    }}
                    disabled={!emailData.business || !emailData.targetAudience || !emailData.campaignType}
                    className="w-full rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                    }}
                  >
                    {emailData.campaignType === 'weekly' ? 'Continue to Campaign Analysis' : 'Continue to Compose Email'}
                  </Button>
                </div>
              </div>
            )}

            {/* Analysis Tab (only for weekly emails) */}
            {activeTab === 'analysis' && emailData.campaignType === 'weekly' && (
              <div 
                className="p-6 rounded-2xl border"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.25) 0%,
                      rgba(255, 255, 255, 0.1) 100%
                    )
                  `,
                  backdropFilter: 'blur(20px) saturate(150%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4)
                  `,
                }}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Campaign Analysis</h2>
                
                {isAnalyzing ? (
                  <div className="p-8 rounded-xl bg-gradient-to-br from-pink-50/50 to-purple-50/50 border border-pink-200">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
                      <p className="text-gray-700 text-lg">Analyzing your last 10 email campaigns...</p>
                      <p className="text-gray-600 text-sm">This may take a moment while we review performance and generate recommendations.</p>
                    </div>
                  </div>
                ) : campaignAnalysis ? (
                  <div className="space-y-6">
                    {/* Analysis Summary */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-pink-50/50 to-purple-50/50 border border-pink-200">
                      <h3 className="font-semibold text-gray-900 mb-4 text-lg">AI Analysis & Recommendations</h3>
                      <div className="prose prose-sm max-w-none">
                        {formatAnalysis(campaignAnalysis.analysis)}
                      </div>
                    </div>
                    
                    {/* Campaign Performance Metrics - Compact Two-Column Layout */}
                    {campaignAnalysis.campaignSummaries && campaignAnalysis.campaignSummaries.length > 0 && (
                      <div className="p-4 rounded-xl bg-white/50 border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3 text-sm">Recent Campaign Performance</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs max-h-48 overflow-y-auto">
                          {campaignAnalysis.campaignSummaries.map((campaign, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50 border border-gray-100">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-xs truncate">{campaign.subject}</p>
                                <p className="text-[10px] text-gray-500">
                                  {new Date(campaign.sent_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                              <div className="flex gap-3 text-[10px] ml-2">
                                <div className="text-center">
                                  <p className={cn(
                                    "font-semibold leading-tight",
                                    campaign.open_rate > 0.25 ? "text-green-600" : 
                                    campaign.open_rate > 0.15 ? "text-yellow-600" : "text-red-600"
                                  )}>
                                    {(campaign.open_rate * 100).toFixed(0)}%
                                  </p>
                                  <p className="text-gray-400">open</p>
                                </div>
                                <div className="text-center">
                                  <p className={cn(
                                    "font-semibold leading-tight",
                                    campaign.click_rate > 0.05 ? "text-green-600" : 
                                    campaign.click_rate > 0.02 ? "text-yellow-600" : "text-red-600"
                                  )}>
                                    {(campaign.click_rate * 100).toFixed(0)}%
                                  </p>
                                  <p className="text-gray-400">click</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {campaignAnalysis.campaignSummaries.length > 10 && (
                          <p className="text-center text-xs text-gray-500 mt-2">
                            Showing first 10 campaigns • {campaignAnalysis.campaignSummaries.length} total
                          </p>
                        )}
                      </div>
                    )}


                    <div className="flex gap-3">
                      <Button 
                        onClick={() => setActiveTab('setup')} 
                        variant="outline"
                        className="rounded-xl"
                      >
                        Back to Setup
                      </Button>
                      <Button 
                        onClick={() => {
                          fetchAndAnalyzeCampaigns();
                        }}
                        variant="outline"
                        className="rounded-xl"
                        disabled={isAnalyzing}
                      >
                        Refresh Analysis
                      </Button>
                      <Button 
                        onClick={navigateToDesign}
                        className="flex-1 rounded-xl"
                        style={{
                          background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                        }}
                      >
                        Continue to Design Email
                      </Button>
                    </div>
                  </div>
                ) : analysisError ? (
                  <div className="space-y-4">
                    <div className="p-6 rounded-xl bg-yellow-50 border border-yellow-200">
                      <h3 className="font-semibold text-yellow-900 mb-2">Analysis Not Available</h3>
                      <p className="text-yellow-800">{analysisError}</p>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => setActiveTab('setup')} 
                        variant="outline"
                        className="rounded-xl"
                      >
                        Back to Setup
                      </Button>
                      <Button 
                        onClick={() => fetchAndAnalyzeCampaigns()}
                        variant="outline"
                        className="rounded-xl"
                      >
                        Try Again
                      </Button>
                      <Button 
                        onClick={navigateToDesign}
                        className="flex-1 rounded-xl"
                        style={{
                          background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                        }}
                      >
                        Continue Without Analysis
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-8">
                    <Button 
                      onClick={() => fetchAndAnalyzeCampaigns()}
                      className="rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                      }}
                    >
                      Start Analysis
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Design Email Tab (only for weekly emails) */}
            {activeTab === 'design' && emailData.campaignType === 'weekly' && (
              <div 
                className="p-6 rounded-2xl border"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.25) 0%,
                      rgba(255, 255, 255, 0.1) 100%
                    )
                  `,
                  backdropFilter: 'blur(20px) saturate(150%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4)
                  `,
                }}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Design Email Structure</h2>
                
                {/* Suggested Key Messages from Analysis */}
                {campaignAnalysis?.suggestedMessages && campaignAnalysis.suggestedMessages.length > 0 && (
                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 border border-purple-200">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Suggested Key Messages</h4>
                    <p className="text-xs text-gray-600 mb-3">Based on your campaign analysis, these messages could be effective for your audience:</p>
                    <div className="flex flex-wrap gap-2">
                      {campaignAnalysis.suggestedMessages.map((message, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="px-3 py-1 text-xs cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            // Add message to key messages if not already there
                            if (!emailDesign.keyMessages?.includes(message)) {
                              setEmailDesign(prev => ({ 
                                ...prev, 
                                keyMessages: [...(prev.keyMessages || []), message]
                              }));
                            }
                          }}
                          style={{
                            background: `linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)`,
                            color: 'rgb(139, 92, 246)',
                            border: '1px solid rgba(139, 92, 246, 0.2)'
                          }}
                        >
                          {message}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Click on any message to add it to your key messages below</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Email Focus/Theme & Goal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-900 mb-1 block">Email Focus & Theme</Label>
                      <Input
                        placeholder="e.g., New class launch, Member spotlight, Wellness tips"
                        value={emailDesign.focus}
                        onChange={(e) => setEmailDesign(prev => ({ ...prev, focus: e.target.value }))}
                        className="rounded-lg h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-900 mb-1 block">Primary Goal</Label>
                      <Input
                        placeholder={emailData.campaignType === 'weekly' ? 'Get more signups for the studio' : 'e.g., Increase class bookings, Build community engagement'}
                        value={emailDesign.goal}
                        onChange={(e) => setEmailDesign(prev => ({ ...prev, goal: e.target.value }))}
                        className="rounded-lg h-9"
                      />
                    </div>
                  </div>

                  {/* Key Messages */}
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-1 block">Key Messages</Label>
                    <p className="text-xs text-gray-600 mb-2">Add 3-5 key messages to include in this email</p>
                    <div className="space-y-2">
                      {emailDesign.keyMessages.map((message, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder={`Key message ${index + 1}`}
                            value={message}
                            onChange={(e) => {
                              const newMessages = [...emailDesign.keyMessages];
                              newMessages[index] = e.target.value;
                              setEmailDesign(prev => ({ ...prev, keyMessages: newMessages }));
                            }}
                            className="flex-1 rounded-lg h-8 text-sm"
                          />
                          <button
                            onClick={() => {
                              setEmailDesign(prev => ({
                                ...prev,
                                keyMessages: prev.keyMessages.filter((_, i) => i !== index)
                              }));
                            }}
                            className="w-8 h-8 rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center text-xs transition-all"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {emailDesign.keyMessages.length < 5 && (
                        <button
                          onClick={() => {
                            setEmailDesign(prev => ({
                              ...prev,
                              keyMessages: [...prev.keyMessages, '']
                            }));
                          }}
                          className="w-full h-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-pink-300 hover:text-pink-600 transition-all text-sm"
                        >
                          + Add Key Message
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Available Sections for Selection */}
                  {campaignAnalysis?.recommendedSections && campaignAnalysis.recommendedSections.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-900 mb-1 block">Available Sections</Label>
                      <p className="text-xs text-gray-600 mb-2">Click to add sections to your email:</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {campaignAnalysis.recommendedSections
                          .filter(section => !['header', 'footer'].includes(section.id))
                          .map((section) => {
                            const isAlreadySelected = [...emailDesign.selectedSections, ...emailDesign.customSections]
                              .some(s => s.id === section.id);
                            
                            return (
                              <button
                                key={section.id}
                                disabled={isAlreadySelected}
                                className={cn(
                                  "p-2 rounded border text-left transition-all text-xs",
                                  isAlreadySelected
                                    ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                    : "border-gray-200 hover:border-pink-300 hover:bg-gradient-to-br hover:from-pink-50/50 hover:to-purple-50/50 cursor-pointer"
                                )}
                                onClick={() => {
                                  if (!isAlreadySelected) {
                                    setEmailDesign(prev => ({
                                      ...prev,
                                      selectedSections: [...prev.selectedSections, { ...section, content: '', components: [] }]
                                    }));
                                  }
                                }}
                              >
                                <div className="font-medium text-gray-900 mb-1 text-sm">{section.name}</div>
                                <div className="text-xs text-gray-600">{section.description}</div>
                              </button>
                            );
                          })}
                      </div>
                      
                      {/* Add Section Buttons */}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={addCampaignMessageSection}
                          disabled={getAllSections().some(s => s.id === 'campaign-message')}
                          className={cn(
                            "px-2 py-1.5 rounded border text-xs transition-all",
                            getAllSections().some(s => s.id === 'campaign-message')
                              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                              : "border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100"
                          )}
                        >
                          + Campaign Message
                        </button>
                        <button
                          onClick={addCustomSection}
                          className="px-2 py-1.5 rounded border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs transition-all"
                        >
                          + Custom Section
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Selected Sections with Reordering */}
                  {(emailDesign.selectedSections.length > 0 || emailDesign.customSections.length > 0) && (
                    <div>
                      <Label className="text-sm font-medium text-gray-900 mb-1 block">Email Structure</Label>
                      <p className="text-xs text-gray-600 mb-2">Design your sections and their order (Call-to-Action will always be last):</p>
                      
                      <div className="space-y-2">
                        {getAllSections().map((section, index) => {
                          const isCta = section.id === 'cta' || section.id === 'call-to-action';
                          const isCustomSection = emailDesign.customSections.some(s => s.id === section.id);
                          
                          return (
                            <div
                              key={section.id}
                              className={cn(
                                "p-3 rounded border bg-gradient-to-br from-pink-50 to-purple-50",
                                isCta ? "border-pink-300" : "border-pink-200"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500 bg-white px-1.5 py-0.5 rounded">
                                    {index + 1}
                                  </span>
                                  <div>
                                    <h4 className="font-medium text-gray-900 text-sm">{section.name}</h4>
                                    <p className="text-xs text-gray-600">{section.description}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {/* Reorder buttons */}
                                  {!isCta && (
                                    <>
                                      <button
                                        onClick={() => moveSection(index, Math.max(0, index - 1))}
                                        disabled={index === 0}
                                        className={cn(
                                          "w-5 h-5 rounded border bg-white flex items-center justify-center text-xs transition-all",
                                          index === 0
                                            ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                            : "border-gray-300 text-gray-600 hover:border-pink-300"
                                        )}
                                      >
                                        ↑
                                      </button>
                                      <button
                                        onClick={() => {
                                          const allSections = getAllSections();
                                          const ctaIndex = allSections.findIndex(s => s.id === 'cta' || s.id === 'call-to-action');
                                          const maxIndex = ctaIndex !== -1 ? ctaIndex - 1 : allSections.length - 1;
                                          moveSection(index, Math.min(maxIndex, index + 1));
                                        }}
                                        disabled={(() => {
                                          const allSections = getAllSections();
                                          const ctaIndex = allSections.findIndex(s => s.id === 'cta' || s.id === 'call-to-action');
                                          return ctaIndex !== -1 ? index >= ctaIndex - 1 : index >= allSections.length - 1;
                                        })()}
                                        className={cn(
                                          "w-5 h-5 rounded border bg-white flex items-center justify-center text-xs transition-all",
                                          (() => {
                                            const allSections = getAllSections();
                                            const ctaIndex = allSections.findIndex(s => s.id === 'cta' || s.id === 'call-to-action');
                                            return ctaIndex !== -1 ? index >= ctaIndex - 1 : index >= allSections.length - 1;
                                          })()
                                            ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                            : "border-gray-300 text-gray-600 hover:border-pink-300"
                                        )}
                                      >
                                        ↓
                                      </button>
                                    </>
                                  )}
                                  
                                  {/* Remove button */}
                                  <button
                                    onClick={() => {
                                      if (isCustomSection) {
                                        setEmailDesign(prev => ({
                                          ...prev,
                                          customSections: prev.customSections.filter(s => s.id !== section.id)
                                        }));
                                      } else {
                                        setEmailDesign(prev => ({
                                          ...prev,
                                          selectedSections: prev.selectedSections.filter(s => s.id !== section.id)
                                        }));
                                      }
                                    }}
                                    className="w-5 h-5 rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center text-xs transition-all"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                              
                              {/* Section Content Planning */}
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs font-medium text-gray-700 mb-1 block">Content Description</Label>
                                  <Input
                                    placeholder="What will this section contain?"
                                    value={section.content || ''}
                                    onChange={(e) => {
                                      if (isCustomSection) {
                                        setEmailDesign(prev => ({
                                          ...prev,
                                          customSections: prev.customSections.map(s => 
                                            s.id === section.id ? { ...s, content: e.target.value } : s
                                          )
                                        }));
                                      } else {
                                        setEmailDesign(prev => ({
                                          ...prev,
                                          selectedSections: prev.selectedSections.map(s => 
                                            s.id === section.id ? { ...s, content: e.target.value } : s
                                          )
                                        }));
                                      }
                                    }}
                                    className="text-sm h-8"
                                  />
                                </div>
                                
                                {/* Custom section name editing */}
                                {isCustomSection && (section.id.startsWith('custom-') || section.id === 'campaign-message') && (
                                  <div>
                                    <Label className="text-xs font-medium text-gray-700 mb-1 block">Section Name</Label>
                                    <Input
                                      placeholder="Section name"
                                      value={section.name || ''}
                                      onChange={(e) => {
                                        setEmailDesign(prev => ({
                                          ...prev,
                                          customSections: prev.customSections.map(s => 
                                            s.id === section.id ? { ...s, name: e.target.value } : s
                                          )
                                        }));
                                      }}
                                      className="text-sm h-8"
                                    />
                                  </div>
                                )}
                                
                                {/* Component Selection */}
                                <div>
                                  <Label className="text-xs font-medium text-gray-700 mb-1 block">Components</Label>
                                  <div className="flex flex-wrap gap-1">
                                    {[
                                      'New workout', 'Special offer', 'Success story', 'Events', 'Schedule change', 
                                      'Wellness tip', 'Equipment', 'Challenge', 'Instructor', 'Seasonal'
                                    ].map((component) => {
                                      const isComponentSelected = section.components?.includes(component);
                                      return (
                                        <button
                                          key={component}
                                          className={cn(
                                            "text-xs px-2 py-1 rounded border transition-all",
                                            isComponentSelected
                                              ? "border-pink-400 bg-pink-100 text-pink-700"
                                              : "border-gray-200 bg-white text-gray-600 hover:border-pink-300"
                                          )}
                                          onClick={() => {
                                            if (isCustomSection) {
                                              setEmailDesign(prev => ({
                                                ...prev,
                                                customSections: prev.customSections.map(s => {
                                                  if (s.id === section.id) {
                                                    const currentComponents = s.components || [];
                                                    return {
                                                      ...s,
                                                      components: isComponentSelected
                                                        ? currentComponents.filter((c: any) => c !== component)
                                                        : [...currentComponents, component]
                                                    };
                                                  }
                                                  return s;
                                                })
                                              }));
                                            } else {
                                              setEmailDesign(prev => ({
                                                ...prev,
                                                selectedSections: prev.selectedSections.map(s => {
                                                  if (s.id === section.id) {
                                                    const currentComponents = s.components || [];
                                                    return {
                                                      ...s,
                                                      components: isComponentSelected
                                                        ? currentComponents.filter((c: any) => c !== component)
                                                        : [...currentComponents, component]
                                                    };
                                                  }
                                                  return s;
                                                })
                                              }));
                                            }
                                          }}
                                        >
                                          {component}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}


                  {/* Navigation */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setActiveTab('analysis')} 
                      variant="outline"
                      className="rounded-xl"
                    >
                      Back to Analysis
                    </Button>
                    <Button 
                      onClick={async () => {
                        // Transfer design data to email data and generate email directly
                        const allSections = getAllSections();
                        const allComponents = allSections.flatMap(s => s.components || []);
                        const sectionContent = allSections.map(s => s.content).filter(Boolean);
                        
                        const updatedEmailData = {
                          ...emailData,
                          theme: emailDesign.focus ? 'newsletter' : 'friendly',
                          goalType: emailDesign.goal || 'Get more signups for the studio',
                          keyMessages: [...emailDesign.keyMessages, emailDesign.focus, ...sectionContent.slice(0, 2), ...allComponents.slice(0, 2)].filter(Boolean)
                        };
                        
                        setEmailData(updatedEmailData);
                        setIsGenerating(true);
                        
                        try {
                          const response = await fetch('/api/email/generate', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              business: updatedEmailData.business,
                              targetAudience: updatedEmailData.targetAudience,
                              theme: updatedEmailData.theme,
                              goalType: updatedEmailData.goalType,
                              keyMessages: updatedEmailData.keyMessages,
                              emailDesign: {
                                focus: emailDesign.focus,
                                goal: emailDesign.goal,
                                sections: allSections,
                                keyMessages: emailDesign.keyMessages
                              },
                              campaignAnalysis
                            }),
                          });
                          
                          if (response.ok) {
                            const data = await response.json();
                            setEmailData(prev => ({
                              ...prev,
                              generatedCopy: data.emailCopy,
                              subject: data.subject,
                              preheader: data.preheader
                            }));
                            navigateToPreview();
                          } else {
                            console.error('Failed to generate email');
                          }
                        } catch (error) {
                          console.error('Error generating email:', error);
                        } finally {
                          setIsGenerating(false);
                        }
                      }}
                      disabled={!emailDesign.focus || getAllSections().length === 0 || emailDesign.keyMessages.filter(Boolean).length === 0 || isGenerating}
                      className="flex-1 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                      }}
                    >
                      {isGenerating ? 'Generating Email...' : 'Generate Email'}
                    </Button>
                  </div>

                  {/* Design Summary */}
                  {(emailDesign.focus || emailDesign.keyMessages.length > 0 || getAllSections().length > 0) && (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm">Email Design Summary</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {emailDesign.focus && (
                          <p><span className="font-medium">Focus:</span> {emailDesign.focus}</p>
                        )}
                        {emailDesign.goal && (
                          <p><span className="font-medium">Goal:</span> {emailDesign.goal}</p>
                        )}
                        {emailDesign.keyMessages.filter(Boolean).length > 0 && (
                          <p><span className="font-medium">Key Messages:</span> {emailDesign.keyMessages.filter(Boolean).join(', ')}</p>
                        )}
                        {getAllSections().length > 0 && (
                          <div>
                            <span className="font-medium">Content Structure:</span>
                            <div className="ml-2 mt-1">
                              {emailDesign.selectedSections.map((section, index) => (
                                <div key={section.id} className="text-xs text-gray-500 mb-1">
                                  <span className="font-medium text-gray-700">{section.name}:</span>
                                  {section.content && <span className="ml-1">{section.content}</span>}
                                  {section.components && section.components.length > 0 && (
                                    <span className="ml-1 text-pink-600">
                                      [{section.components.join(', ')}]
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <div 
                className="p-6 rounded-2xl border"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.25) 0%,
                      rgba(255, 255, 255, 0.1) 100%
                    )
                  `,
                  backdropFilter: 'blur(20px) saturate(150%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4)
                  `,
                }}
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Preview & Send</h2>
                
                {/* Campaign Summary */}
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-pink-50/50 to-purple-50/50 border border-pink-200">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Business:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {businessTypes.find(b => b.id === emailData.business)?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Audience:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {audienceTypes.find(a => a.id === emailData.targetAudience)?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Campaign:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {campaignTypes.find(c => c.id === emailData.campaignType)?.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Subject Line */}
                  <div>
                    <Label htmlFor="subject" className="text-base font-medium text-gray-900 mb-2 block">Subject Line</Label>
                    <Input
                      id="subject"
                      value={emailData.subject}
                      onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Preheader */}
                  <div>
                    <Label htmlFor="preheader" className="text-base font-medium text-gray-900 mb-2 block">Preheader Text</Label>
                    <Input
                      id="preheader"
                      value={emailData.preheader}
                      onChange={(e) => setEmailData(prev => ({ ...prev, preheader: e.target.value }))}
                      className="rounded-xl"
                      placeholder="Preview text that appears after the subject line"
                    />
                  </div>

                  {/* Email Body */}
                  <div>
                    <Label htmlFor="body" className="text-base font-medium text-gray-900 mb-2 block">Email Body</Label>
                    <Textarea
                      id="body"
                      value={emailData.generatedCopy}
                      onChange={(e) => setEmailData(prev => ({ ...prev, generatedCopy: e.target.value }))}
                      className="rounded-xl min-h-[300px]"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => emailData.campaignType === 'weekly' ? setActiveTab('design') : setActiveTab('setup')} 
                      variant="outline"
                      className="rounded-xl"
                    >
                      {emailData.campaignType === 'weekly' ? 'Back to Design' : 'Back to Setup'}
                    </Button>
                    <Button 
                      onClick={handleBackToDrafts}
                      variant="outline" 
                      className="rounded-xl"
                    >
                      Back to Drafts
                    </Button>
                    <Button 
                      onClick={async () => {
                        await autoSaveDraft({ status: 'completed' });
                        // TODO: Implement Mailchimp integration
                      }}
                      className="flex-1 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                      }}
                    >
                      Complete & Save Draft
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}