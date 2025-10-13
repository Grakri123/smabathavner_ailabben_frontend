// Secure Download API Endpoint for Vercel
// This file should be placed in /api/download.js in your Vercel project

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key for server-side operations

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

    console.log('✅ Token validated, downloading file:', validationResult.file_name);

    // Get file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('customer_docs') // Correct bucket name
      .download(validationResult.file_path);

    if (downloadError) {
      console.error('❌ File download error:', downloadError);
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    const fileName = validationResult.file_name || 'document';
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
    res.status(500).json({ error: 'Internal server error' });
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
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed'
  };

  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}
