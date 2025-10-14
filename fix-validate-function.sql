-- Fix validate_download_token function to return action_type
-- This script safely updates the function

-- Drop the old function first (with all possible signatures)
DROP FUNCTION IF EXISTS validate_download_token(TEXT, TEXT);
DROP FUNCTION IF EXISTS validate_download_token(TEXT);

-- Recreate the function with action_type support
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
    COALESCE(v_token_record.action_type, 'download')::TEXT,  -- Default to 'download' if NULL
    NULL::TEXT;
END;
$$;

-- Verify the function exists and has correct signature
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'validate_download_token'
  ) THEN
    RAISE NOTICE '✅ Function validate_download_token exists and has been updated';
  ELSE
    RAISE EXCEPTION '❌ Function validate_download_token was not created successfully';
  END IF;
END $$;

