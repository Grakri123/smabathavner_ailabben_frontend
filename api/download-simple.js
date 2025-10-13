// Simplified Secure Download API Endpoint for Vercel
// This version uses direct database queries instead of RPC functions

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
    console.log('🔍 Validating download token:', token.substring(0, 20) + '...');

    // Direct database query instead of RPC function
    const { data: tokenData, error: tokenError } = await supabase
      .from('secure_download_tokens')
      .select(`
        *,
        document:documents(*)
      `)
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      console.error('❌ Token validation failed:', tokenError);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    console.log('✅ Token validated, downloading file:', tokenData.document.file_name);

    // Get file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('customer_docs')
      .download(tokenData.document.file_path);

    if (downloadError) {
      console.error('❌ File download error:', downloadError);
      return res.status(404).json({ error: 'File not found: ' + downloadError.message });
    }

    // Mark token as used
    await supabase
      .from('secure_download_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    // Log the download
    await supabase
      .from('download_logs')
      .insert({
        token_id: tokenData.id,
        document_id: tokenData.document_id,
        user_id: tokenData.user_id
      });

    // Set appropriate headers
    const fileName = tokenData.document.file_name || 'document';
    const fileExtension = fileName.split('.').pop() || '';
    
    // Determine content type based on file extension
    const contentType = getContentType(fileExtension);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Convert blob to buffer and send
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('✅ File sent successfully:', fileName, buffer.length, 'bytes');
    res.send(buffer);

  } catch (error) {
    console.error('❌ Download API error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

// Helper function to determine content type
function getContentType(extension) {
  const contentTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
    'msg': 'application/vnd.ms-outlook', // Outlook message files
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed'
  };

  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}
