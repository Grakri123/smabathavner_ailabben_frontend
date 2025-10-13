// Secure Download System Types

export interface SecureDownloadToken {
  id: string;
  token: string;
  document_id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
  used_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
}

export interface DownloadLog {
  id: string;
  token_id: string | null;
  document_id: string;
  user_id: string;
  downloaded_at: string;
  ip_address: string | null;
  user_agent: string | null;
  file_size: number | null;
  download_successful: boolean;
  error_message: string | null;
}

export interface GenerateTokenRequest {
  document_id: string;
  expires_in_minutes?: number; // Default: 60 minutes
}

export interface GenerateTokenResponse {
  success: boolean;
  token?: string;
  download_url?: string;
  expires_at?: string;
  error?: string;
}

export interface ValidateTokenResponse {
  document_id: string | null;
  file_path: string | null;
  file_name: string | null;
  is_valid: boolean;
  error_message: string | null;
}

export interface DownloadStats {
  total_downloads: number;
  downloads_today: number;
  downloads_this_week: number;
  downloads_this_month: number;
  most_downloaded_documents: Array<{
    document_id: string;
    file_name: string;
    download_count: number;
  }>;
}
