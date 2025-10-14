-- Update Secure Download System to Support Preview Mode
-- This adds action_type field to distinguish between download and preview actions

-- Add action_type column to secure_download_tokens
ALTER TABLE public.secure_download_tokens 
ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'download' CHECK (action_type IN ('download', 'preview'));

-- Add action_type column to download_logs
ALTER TABLE public.download_logs 
ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'download' CHECK (action_type IN ('download', 'preview'));

-- Update the generate_secure_download_token function to support action_type
CREATE OR REPLACE FUNCTION generate_secure_download_token(
  p_document_id UUID,
  p_user_id TEXT,
  p_expires_in_minutes INTEGER DEFAULT 60,
  p_action_type TEXT DEFAULT 'download'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
  v_raw_token BYTEA;
  v_base64_token TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Validate action_type
  IF p_action_type NOT IN ('download', 'preview') THEN
    RAISE EXCEPTION 'Invalid action_type. Must be "download" or "preview"';
  END IF;

  -- Generate cryptographically secure token
  v_raw_token := gen_random_bytes(32);
  v_base64_token := encode(v_raw_token, 'base64');
  
  -- Make it URL-safe by replacing characters
  v_token := replace(replace(replace(v_base64_token, '+', '-'), '/', '_'), '=', '');
  
  v_expires_at := NOW() + (p_expires_in_minutes || ' minutes')::INTERVAL;
  
  -- Insert token into database
  INSERT INTO secure_download_tokens (
    token,
    document_id,
    user_id,
    expires_at,
    action_type
  ) VALUES (
    v_token,
    p_document_id,
    p_user_id,
    v_expires_at,
    p_action_type
  );
  
  RETURN v_token;
END;
$$;

-- Update the validate_download_token function to include action_type in response
CREATE OR REPLACE FUNCTION validate_download_token(
  p_token TEXT,
  p_user_id TEXT DEFAULT NULL
)
RETURNS TABLE(
  is_valid BOOLEAN,
  document_id UUID,
  file_path TEXT,
  file_name TEXT,
  action_type TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token_record RECORD;
  v_document_record RECORD;
BEGIN
  -- Get token details
  SELECT * INTO v_token_record
  FROM secure_download_tokens
  WHERE token = p_token;
  
  -- Check if token exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Token not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if token has expired
  IF v_token_record.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Token has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check if token has already been used
  IF v_token_record.used_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Token has already been used'::TEXT;
    RETURN;
  END IF;
  
  -- Optional: Check user_id if provided
  IF p_user_id IS NOT NULL AND v_token_record.user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Unauthorized user'::TEXT;
    RETURN;
  END IF;
  
  -- Get document details
  SELECT * INTO v_document_record
  FROM documents
  WHERE id = v_token_record.document_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Document not found'::TEXT;
    RETURN;
  END IF;
  
  -- Mark token as used
  UPDATE secure_download_tokens
  SET used_at = NOW()
  WHERE token = p_token;
  
  -- Return success with document details and action_type
  RETURN QUERY SELECT 
    TRUE,
    v_document_record.id,
    v_document_record.file_path,
    v_document_record.file_name,
    v_token_record.action_type,
    NULL::TEXT;
END;
$$;

-- Add comment to explain the action_type field
COMMENT ON COLUMN secure_download_tokens.action_type IS 'Type of action: "download" for file download, "preview" for inline viewing';
COMMENT ON COLUMN download_logs.action_type IS 'Type of action: "download" for file download, "preview" for inline viewing';

