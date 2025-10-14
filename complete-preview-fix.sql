-- Complete fix for preview feature
-- Run this script if you're getting "Invalid action type: undefined" error

-- Step 1: Ensure action_type columns exist
ALTER TABLE public.secure_download_tokens 
ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'download' 
CHECK (action_type IN ('download', 'preview'));

ALTER TABLE public.download_logs 
ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'download' 
CHECK (action_type IN ('download', 'preview'));

-- Step 2: Drop and recreate generate_secure_download_token function
DROP FUNCTION IF EXISTS generate_secure_download_token(UUID, TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS generate_secure_download_token(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS generate_secure_download_token(UUID, TEXT);

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

-- Step 3: Drop and recreate validate_download_token function
DROP FUNCTION IF EXISTS validate_download_token(TEXT, TEXT);
DROP FUNCTION IF EXISTS validate_download_token(TEXT);

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

-- Step 4: Verify everything is set up correctly
DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_function_exists BOOLEAN;
BEGIN
  -- Check if action_type column exists in secure_download_tokens
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'secure_download_tokens' 
    AND column_name = 'action_type'
  ) INTO v_column_exists;
  
  IF v_column_exists THEN
    RAISE NOTICE '✅ Column action_type exists in secure_download_tokens';
  ELSE
    RAISE EXCEPTION '❌ Column action_type NOT found in secure_download_tokens';
  END IF;
  
  -- Check if generate_secure_download_token function exists
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'generate_secure_download_token'
  ) INTO v_function_exists;
  
  IF v_function_exists THEN
    RAISE NOTICE '✅ Function generate_secure_download_token exists';
  ELSE
    RAISE EXCEPTION '❌ Function generate_secure_download_token NOT found';
  END IF;
  
  -- Check if validate_download_token function exists
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'validate_download_token'
  ) INTO v_function_exists;
  
  IF v_function_exists THEN
    RAISE NOTICE '✅ Function validate_download_token exists';
  ELSE
    RAISE EXCEPTION '❌ Function validate_download_token NOT found';
  END IF;
  
  RAISE NOTICE '🎉 All preview feature components are set up correctly!';
END $$;

-- Step 5: Test token generation (optional)
DO $$
DECLARE
  v_test_token TEXT;
  v_test_document_id UUID;
BEGIN
  -- Get a test document ID (first document in the table)
  SELECT id INTO v_test_document_id FROM documents LIMIT 1;
  
  IF v_test_document_id IS NOT NULL THEN
    -- Try to generate a preview token
    SELECT generate_secure_download_token(
      v_test_document_id,
      'test@test.com',
      5,
      'preview'
    ) INTO v_test_token;
    
    IF v_test_token IS NOT NULL THEN
      RAISE NOTICE '✅ Test preview token generated successfully: %', substring(v_test_token, 1, 20) || '...';
      
      -- Clean up test token
      DELETE FROM secure_download_tokens WHERE token = v_test_token;
      RAISE NOTICE '✅ Test token cleaned up';
    ELSE
      RAISE EXCEPTION '❌ Failed to generate test token';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ No documents found in database, skipping token generation test';
  END IF;
END $$;

