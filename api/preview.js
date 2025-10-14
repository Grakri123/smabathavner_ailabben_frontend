// Secure Preview API Endpoint for Vercel
// This endpoint serves files inline for preview (not as attachment)
// Supports PDF, JPEG, PNG for inline viewing

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    console.log('🔍 Validating preview token:', token.substring(0, 20) + '...');

    // Validate token using Supabase RPC function
    const { data, error } = await supabase.rpc('validate_download_token', {
      p_token: token,
      p_user_id: null // Let the function handle user validation
    });

    if (error) {
      console.error('❌ Token validation error:', error);
      return res.status(400).json({ error: 'Invalid token' });
    }

    const validationResult = data[0];

    if (!validationResult.is_valid) {
      console.error('❌ Token validation failed:', validationResult.error_message);
      return res.status(403).json({ error: validationResult.error_message || 'Invalid token' });
    }

    // Verify this is a preview token
    if (validationResult.action_type !== 'preview') {
      console.error('❌ Invalid action type:', validationResult.action_type);
      return res.status(403).json({ error: 'This token is not valid for preview' });
    }

    console.log('✅ Preview token validated, loading file:', validationResult.file_name);

    // Extract file path from full URL if needed
    let filePath = validationResult.file_path;
    
    // If file_path is a full URL, extract just the path part
    if (filePath.startsWith('http')) {
      const match = filePath.match(/\/customer_docs\/(.+?)(\?|$)/);
      if (match) {
        filePath = match[1];
        console.log('📁 Extracted file path:', filePath);
      }
    }

    // Get file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('customer_docs')
      .download(filePath);

    if (downloadError) {
      console.error('❌ File download error:', downloadError);
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers for INLINE viewing (not attachment)
    const fileName = validationResult.file_name || 'document';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Determine content type
    const contentType = getContentType(fileExtension);
    
    // Set headers for inline viewing
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`); // inline instead of attachment
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate'); // Private cache for preview
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Security headers for iframe embedding
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Allow embedding in same origin
    
    // Convert blob to buffer and send
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('✅ Preview file sent successfully:', fileName, buffer.length, 'bytes');
    
    // Log the preview action
    await logPreviewAction(validationResult.document_id, token, req);
    
    res.send(buffer);

  } catch (error) {
    console.error('❌ Preview API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to determine content type
function getContentType(extension) {
  const contentTypes = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    // Other types (for fallback)
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'msg': 'application/vnd.ms-outlook'
  };

  return contentTypes[extension] || 'application/octet-stream';
}

// Helper function to log preview action
async function logPreviewAction(documentId, token, req) {
  try {
    // Get IP address from request
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     null;
    
    const userAgent = req.headers['user-agent'] || null;

    // Log to download_logs table
    await supabase.from('download_logs').insert({
      document_id: documentId,
      user_id: 'system', // Could be enhanced to track actual user
      action_type: 'preview',
      ip_address: ipAddress,
      user_agent: userAgent,
      download_successful: true
    });

    console.log('📊 Preview action logged');
  } catch (logError) {
    console.error('⚠️ Failed to log preview action:', logError);
    // Don't fail the request if logging fails
  }
}

