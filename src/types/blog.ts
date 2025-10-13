// Blog and Chat types for existing tables

export interface BlogPost {
  id: string;
  slug: string;
  tittel: string;
  ingress: string;
  innhold_md: string;
  publisert: boolean;
  dato: string;
  created_at: string;
  featured_image?: string; // URL til hovedbilde
  image_gallery?: string[]; // Array med alle bilde-URLs
}

// Alias for compatibility with EditPostModal
export interface Blogginnlegg extends BlogPost {}

// UI Types
export interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'select' | 'boolean' | 'date' | 'number' | 'badge' | 'actions';
  editable?: boolean;
  options?: string[];
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface TableAction {
  label: string;
  icon: string;
  onClick: (row: any) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  condition?: (row: any) => boolean;
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'boolean';
  options?: string[];
}

// API Types
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Image Upload Types
export interface ImageUploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
}

export interface ImageUploadError {
  message: string;
  file?: File;
  code?: string;
}

// Chat History Types (for n8n_chat_histories table)
export interface N8nChatHistory {
  id: number;
  session_id: string;
  message: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    agent_id?: string;
    from?: string;
    to?: string;
    ai_generated?: boolean;
    subject?: string;
    direction?: 'innkommende' | 'utgående';
    metadata?: Record<string, any>;
  };
}

export interface ChatConversation {
  session_id: string;
  messages: N8nChatHistory[];
  first_message: N8nChatHistory;
  last_message: N8nChatHistory;
  message_count: number;
  started_at: Date;
  last_activity: Date;
  // Derived fields for email conversations
  from?: string;
  to?: string;
  subject?: string;
  status: 'aktiv' | 'avsluttet' | 'venter_svar';
  priority: 'lav' | 'medium' | 'høy' | 'kritisk';
  category: 'support' | 'salg' | 'generell' | 'klage';
}

// Småbåthavner Contacts Types (for smabathavner_contacts table)
export interface SmabathavnerContact {
  id: number;
  session_id: string;
  customer_name: string;
  customer_email: string;
  conversation_history: any; // JSONB - will be parsed as array of messages
  trigger_message?: string;
  current_url?: string;
  user_ip?: string;
  user_agent?: string;
  session_duration?: number;
  end_reason?: string;
  created_at: string;
}

export interface ContactSession {
  id: number;
  session_id: string;
  customer_name: string;
  customer_email: string;
  message_count: number;
  last_message: string;
  session_duration: number;
  end_reason: string;
  created_at: Date;
  status: 'aktiv' | 'avsluttet' | 'venter_svar';
  priority: 'lav' | 'medium' | 'høy' | 'kritisk';
}