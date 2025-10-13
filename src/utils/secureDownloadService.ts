import { supabase } from '../store/authStore';
import type { 
  GenerateTokenRequest, 
  GenerateTokenResponse, 
  ValidateTokenResponse,
  DownloadStats 
} from '../types/secureDownload';

class SecureDownloadService {
  private readonly TOKEN_EXPIRY_MINUTES = 60; // 1 hour default
  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

  // Generate secure download token
  async generateDownloadToken(
    documentId: string, 
    expiresInMinutes: number = this.TOKEN_EXPIRY_MINUTES
  ): Promise<GenerateTokenResponse> {
    try {
      console.log('🔐 Generating secure download token for document:', documentId);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Call Supabase RPC function to generate token
      const { data, error } = await supabase.rpc('generate_secure_download_token', {
        p_document_id: documentId,
        p_user_id: user.email || user.id,
        p_expires_in_minutes: expiresInMinutes
      });

      if (error) {
        console.error('❌ Error generating download token:', error);
        throw error;
      }

      const token = data;
      const downloadUrl = `${this.API_BASE_URL}/api/download?token=${token}`;
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

      console.log('✅ Download token generated:', {
        token: token.substring(0, 20) + '...',
        expiresAt,
        downloadUrl
      });

      return {
        success: true,
        token,
        download_url: downloadUrl,
        expires_at: expiresAt
      };

    } catch (error) {
      console.error('❌ Error in generateDownloadToken:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate download token'
      };
    }
  }

  // Validate download token (used by API endpoint)
  async validateDownloadToken(token: string, userId?: string): Promise<ValidateTokenResponse> {
    try {
      console.log('🔍 Validating download token:', token.substring(0, 20) + '...');
      
      const { data, error } = await supabase.rpc('validate_download_token', {
        p_token: token,
        p_user_id: userId || null
      });

      if (error) {
        console.error('❌ Error validating token:', error);
        throw error;
      }

      const result = data[0] as ValidateTokenResponse;
      console.log('✅ Token validation result:', {
        is_valid: result.is_valid,
        document_id: result.document_id,
        error_message: result.error_message
      });

      return result;

    } catch (error) {
      console.error('❌ Error in validateDownloadToken:', error);
      return {
        document_id: null,
        file_path: null,
        file_name: null,
        is_valid: false,
        error_message: error instanceof Error ? error.message : 'Token validation failed'
      };
    }
  }

  // Download file with secure token
  async downloadDocument(documentId: string): Promise<boolean> {
    try {
      console.log('📥 Starting secure download for document:', documentId);
      
      // Generate secure token
      const tokenResponse = await this.generateDownloadToken(documentId);
      
      if (!tokenResponse.success || !tokenResponse.download_url) {
        throw new Error(tokenResponse.error || 'Failed to generate download token');
      }

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = tokenResponse.download_url;
      link.download = ''; // Let server set filename
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ Download initiated for document:', documentId);
      return true;

    } catch (error) {
      console.error('❌ Error downloading document:', error);
      return false;
    }
  }

  // Get download statistics (for admin dashboard)
  async getDownloadStats(): Promise<DownloadStats | null> {
    try {
      // This would require additional RPC functions in Supabase
      // For now, return basic stats from download_logs table
      
      const { data, error } = await supabase
        .from('download_logs')
        .select('*', { count: 'exact' });

      if (error) {
        console.error('❌ Error fetching download stats:', error);
        return null;
      }

      const totalDownloads = data?.length || 0;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const downloadsToday = data?.filter(log => 
        new Date(log.downloaded_at) >= today
      ).length || 0;

      const downloadsThisWeek = data?.filter(log => 
        new Date(log.downloaded_at) >= weekAgo
      ).length || 0;

      const downloadsThisMonth = data?.filter(log => 
        new Date(log.downloaded_at) >= monthAgo
      ).length || 0;

      return {
        total_downloads: totalDownloads,
        downloads_today: downloadsToday,
        downloads_this_week: downloadsThisWeek,
        downloads_this_month: downloadsThisMonth,
        most_downloaded_documents: [] // Would need aggregation query
      };

    } catch (error) {
      console.error('❌ Error getting download stats:', error);
      return null;
    }
  }

  // Clean up expired tokens (admin function)
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_tokens');
      
      if (error) {
        console.error('❌ Error cleaning up expired tokens:', error);
        return 0;
      }

      console.log('✅ Cleaned up expired tokens:', data);
      return data || 0;

    } catch (error) {
      console.error('❌ Error in cleanupExpiredTokens:', error);
      return 0;
    }
  }
}

export const secureDownloadService = new SecureDownloadService();
export default secureDownloadService;
