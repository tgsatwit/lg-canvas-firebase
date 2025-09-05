import { DocumentInterface } from "@langchain/core/documents";

export interface ModelConfigurationParams {
  name: string;
  label: string;
  modelName?: string;
  config: CustomModelConfig;
  isNew: boolean;
}

export interface CustomModelConfig {
  provider: string;
  temperatureRange: {
    min: number;
    max: number;
    default: number;
    current: number;
  };
  maxTokens: {
    min: number;
    max: number;
    default: number;
    current: number;
  };
  azureConfig?: {
    azureOpenAIApiKey: string;
    azureOpenAIApiInstanceName: string;
    azureOpenAIApiDeploymentName: string;
    azureOpenAIApiVersion: string;
    azureOpenAIBasePath?: string;
  };
}

export type ArtifactLengthOptions = "shortest" | "short" | "long" | "longest";

export type ArtifactType = "code" | "text";

export interface ArtifactContent {
  index: number;
  content: string;
  title: string;
  type: ArtifactType;
  language: string;
}

export interface Artifact {
  id: string;
  contents: ArtifactContent[];
  currentContentIndex: number;
}

export interface ArtifactToolResponse {
  artifact?: string;
  title?: string;
  language?: string;
  type?: string;
}

export type RewriteArtifactMetaToolResponse =
  | {
      type: "text";
      title?: string;
      language: ProgrammingLanguageOptions;
    }
  | {
      type: "code";
      title: string;
      language: ProgrammingLanguageOptions;
    };

export type LanguageOptions =
  | "english"
  | "mandarin"
  | "spanish"
  | "french"
  | "hindi";

export type ProgrammingLanguageOptions =
  | "typescript"
  | "javascript"
  | "cpp"
  | "java"
  | "php"
  | "python"
  | "html"
  | "sql"
  | "json"
  | "rust"
  | "xml"
  | "clojure"
  | "csharp"
  | "other";

export type ReadingLevelOptions =
  | "pirate"
  | "child"
  | "teenager"
  | "college"
  | "phd";

export interface CodeHighlight {
  startCharIndex: number;
  endCharIndex: number;
}

export interface ArtifactMarkdownV3 {
  index: number;
  type: "text";
  title: string;
  fullMarkdown: string;
}

export interface ArtifactCodeV3 {
  index: number;
  type: "code";
  title: string;
  language: ProgrammingLanguageOptions;
  code: string;
}

export interface ArtifactV3 {
  currentIndex: number;
  contents: (ArtifactMarkdownV3 | ArtifactCodeV3)[];
}

export interface TextHighlight {
  fullMarkdown: string;
  markdownBlock: string;
  selectedText: string;
}

export interface CustomQuickAction {
  /**
   * A UUID for the quick action. Used to identify the quick action.
   */
  id: string;
  /**
   * The title of the quick action. Used in the UI
   * to display the quick action.
   */
  title: string;
  /**
   * The prompt to use when the quick action is invoked.
   */
  prompt: string;
  /**
   * Whether or not to include the user's reflections in the prompt.
   */
  includeReflections: boolean;
  /**
   * Whether or not to include the default prefix in the prompt.
   */
  includePrefix: boolean;
  /**
   * Whether or not to include the last 5 (or less) messages in the prompt.
   */
  includeRecentHistory: boolean;
}

export interface Reflections {
  /**
   * Style rules to follow for generating content.
   */
  styleRules: string[];
  /**
   * Key content to remember about the user when generating content.
   */
  content: string[];
}

export type ContextDocument = {
  /**
   * The name of the document.
   */
  name: string;
  /**
   * The type of the document.
   */
  type: string;
  /**
   * The base64 encoded content of the document, or plain
   * text value if the type is `text`
   */
  data: string;
  /**
   * Optional metadata about the document.
   */
  metadata?: Record<string, any>;
};

/**
 * The metadata included in search results from Exa.
 */
export type ExaMetadata = {
  id: string;
  url: string;
  title: string;
  author: string;
  publishedDate: string;
  image?: string;
  favicon?: string;
};

export type SearchResult = DocumentInterface<ExaMetadata>;

export interface GraphInput {
  messages?: Record<string, any>[];

  highlightedCode?: CodeHighlight;
  highlightedText?: TextHighlight;

  artifact?: ArtifactV3;

  next?: string;

  language?: LanguageOptions;
  artifactLength?: ArtifactLengthOptions;
  regenerateWithEmojis?: boolean;
  readingLevel?: ReadingLevelOptions;

  addComments?: boolean;
  addLogs?: boolean;
  portLanguage?: ProgrammingLanguageOptions;
  fixBugs?: boolean;
  customQuickActionId?: string;

  webSearchEnabled?: boolean;
  webSearchResults?: SearchResult[];
}

// Mailchimp Types
export interface MailchimpList {
  id: string;
  web_id: string;
  name: string;
  contact: {
    company: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  permission_reminder: string;
  use_archive_bar: boolean;
  campaign_defaults: {
    from_name: string;
    from_email: string;
    subject: string;
    language: string;
  };
  notify_on_subscribe: string;
  notify_on_unsubscribe: string;
  date_created: string;
  list_rating: number;
  email_type_option: boolean;
  subscribe_url_short: string;
  subscribe_url_long: string;
  beamer_address: string;
  visibility: string;
  double_optin: boolean;
  has_welcome: boolean;
  marketing_permissions: boolean;
  modules: string[];
  stats: {
    member_count: number;
    unsubscribe_count: number;
    cleaned_count: number;
    member_count_since_send: number;
    unsubscribe_count_since_send: number;
    cleaned_count_since_send: number;
    campaign_count: number;
    campaign_last_sent: string;
    merge_field_count: number;
    avg_sub_rate: number;
    avg_unsub_rate: number;
    target_sub_rate: number;
    open_rate: number;
    click_rate: number;
    last_sub_date: string;
    last_unsub_date: string;
  };
}

// Raw member data from Mailchimp API (per list)
export interface MailchimpMemberRaw {
  id: string;
  email_address: string;
  unique_email_id: string;
  contact_id?: string;
  full_name?: string;
  web_id: number;
  email_type: string;
  status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending';
  consents_to_one_to_one_messaging: boolean;
  merge_fields: {
    FNAME?: string;
    LNAME?: string;
    ADDRESS?: {
      addr1: string;
      addr2: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    PHONE?: string;
    BIRTHDAY?: string;
    [key: string]: any;
  };
  interests: { [key: string]: boolean };
  stats: {
    avg_open_rate: number;
    avg_click_rate: number;
    ecommerce_data: {
      total_revenue: number;
      number_of_orders: number;
      currency_code: string;
    };
  };
  ip_signup?: string;
  timestamp_signup?: string;
  ip_opt?: string;
  timestamp_opt?: string;
  member_rating: number;
  last_changed: string;
  language: string;
  vip: boolean;
  email_client?: string;
  location: {
    latitude: number;
    longitude: number;
    gmtoff: number;
    dstoff: number;
    country_code: string;
    timezone: string;
    region: string;
  };
  marketing_permissions: Array<{
    marketing_permission_id: string;
    enabled: boolean;
  }>;
  last_note?: {
    note_id: string;
    created_at: string;
    created_by: string;
    note: string;
  };
  source?: string;
  tags_count: number;
  tags: Array<{
    id: string;
    name: string;
  }>;
  list_id: string;
}

// Simplified member document (one per user email in Firestore)
export interface MailchimpMember {
  // Primary identifiers
  email_address: string;
  unique_email_id: string;
  contact_id?: string;
  full_name?: string;
  
  // Extracted fields for search/filter indexes
  first_name?: string;
  last_name?: string;
  phone?: string;
  
  // Overall status (highest priority across lists)
  overall_status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'mixed';
  
  // Arrays for Firestore compound queries
  lists: string[]; // List IDs for easy filtering
  tags: string[];  // Tag names for easy filtering
  
  // Detailed list information
  list_details: Array<{
    list_id: string;
    list_name: string;
    status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending';
    member_id: string;
    web_id: number;
    timestamp_signup?: string;
    timestamp_opt?: string;
    member_rating: number;
    vip: boolean;
    last_changed: string;
  }>;
  
  // Detailed tag information
  tag_details: Array<{
    name: string;
    list_ids: string[];
  }>;
  
  // Aggregated counts
  total_lists: number;
  active_lists: number;
  avg_member_rating: number;
  
  // Timestamps for sorting
  first_signup_date?: string;
  last_activity_date: string;
  
  // Flags for filtering
  is_vip: boolean;
  
  // Basic metadata
  language: string;
  location?: {
    country_code?: string;
    timezone?: string;
  };
  
  // Firestore metadata
  created_at: string;
  updated_at: string;
}

// Metadata document structure
export interface MailchimpMetadata {
  lists: MailchimpList[];
  total_members: number;
  last_sync: string;
  stats: {
    subscribed: number;
    unsubscribed: number;
    cleaned: number;
    pending: number;
  };
}

export interface MailchimpSyncStatus {
  lastSync?: string;
  isRunning: boolean;
  totalLists?: number;
  totalMembers?: number;
  error?: string;
}