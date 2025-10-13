-- Secure Download System for Småbåthavner
-- Creates tables and functions for secure document downloads

-- Table for secure download tokens
CREATE TABLE IF NOT EXISTS public.secure_download_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Email or user identifier
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE NULL,
  ip_address INET NULL,
  user_agent TEXT NULL,
  -- Metadata for tracking
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_secure_tokens_token ON secure_download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_secure_tokens_document_id ON secure_download_tokens(document_id);
CREATE INDEX IF NOT EXISTS idx_secure_tokens_user_id ON secure_download_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_secure_tokens_expires ON secure_download_tokens(expires_at);

-- Table for download logs (optional - for audit trail)
CREATE TABLE IF NOT EXISTS public.download_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID REFERENCES secure_download_tokens(id) ON DELETE SET NULL,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET NULL,
  user_agent TEXT NULL,
  file_size BIGINT NULL,
  download_successful BOOLEAN DEFAULT TRUE,
  error_message TEXT NULL
);

-- Indexes for download logs
CREATE INDEX IF NOT EXISTS idx_download_logs_document_id ON download_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_user_id ON download_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_downloaded_at ON download_logs(downloaded_at);

-- Function to generate secure download token
CREATE OR REPLACE FUNCTION generate_secure_download_token(
  p_document_id UUID,
  p_user_id TEXT,
  p_expires_in_minutes INTEGER DEFAULT 60
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate cryptographically secure token
  v_token := encode(gen_random_bytes(32), 'base64url');
  v_expires_at := NOW() + (p_expires_in_minutes || ' minutes')::INTERVAL;
  
  -- Insert token into database
  INSERT INTO secure_download_tokens (
    token,
    document_id,
    user_id,
    expires_at
  ) VALUES (
    v_token,
    p_document_id,
    p_user_id,
    v_expires_at
  );
  
  RETURN v_token;
END;
$$;

-- Function to validate and use download token
CREATE OR REPLACE FUNCTION validate_download_token(
  p_token TEXT,
  p_user_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  document_id UUID,
  file_path TEXT,
  file_name TEXT,
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token_record RECORD;
  v_document_record RECORD;
BEGIN
  -- Get token record
  SELECT * INTO v_token_record
  FROM secure_download_tokens
  WHERE token = p_token
    AND expires_at > NOW()
    AND used_at IS NULL;
  
  -- Check if token exists and is valid
  IF v_token_record IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      FALSE,
      'Invalid or expired token'::TEXT;
    RETURN;
  END IF;
  
  -- Check user authorization (if user_id provided)
  IF p_user_id IS NOT NULL AND v_token_record.user_id != p_user_id THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      FALSE,
      'Unauthorized user'::TEXT;
    RETURN;
  END IF;
  
  -- Get document record
  SELECT * INTO v_document_record
  FROM documents
  WHERE id = v_token_record.document_id;
  
  IF v_document_record IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      FALSE,
      'Document not found'::TEXT;
    RETURN;
  END IF;
  
  -- Mark token as used
  UPDATE secure_download_tokens
  SET used_at = NOW()
  WHERE id = v_token_record.id;
  
  -- Log the download
  INSERT INTO download_logs (
    token_id,
    document_id,
    user_id
  ) VALUES (
    v_token_record.id,
    v_document_record.id,
    v_token_record.user_id
  );
  
  -- Return valid document info
  RETURN QUERY SELECT 
    v_document_record.id,
    v_document_record.file_path,
    v_document_record.file_name,
    TRUE,
    NULL::TEXT;
END;
$$;

-- Function to clean up expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM secure_download_tokens
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Row Level Security
ALTER TABLE secure_download_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for secure_download_tokens
CREATE POLICY "Users can view their own tokens" ON secure_download_tokens
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "System can insert tokens" ON secure_download_tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update tokens" ON secure_download_tokens
  FOR UPDATE USING (true);

-- RLS Policies for download_logs
CREATE POLICY "Users can view their own download logs" ON download_logs
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "System can insert download logs" ON download_logs
  FOR INSERT WITH CHECK (true);

-- Grant permissions (adjust based on your setup)
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT ALL ON secure_download_tokens TO authenticated;
-- GRANT ALL ON download_logs TO authenticated;
-- GRANT EXECUTE ON FUNCTION generate_secure_download_token TO authenticated;
-- GRANT EXECUTE ON FUNCTION validate_download_token TO authenticated;

-- Create a scheduled job to clean up expired tokens (optional)
-- This would typically be set up in your application or using pg_cron
-- SELECT cron.schedule('cleanup-expired-tokens', '0 2 * * *', 'SELECT cleanup_expired_tokens();');

COMMENT ON TABLE secure_download_tokens IS 'Secure download tokens for document access control';
COMMENT ON TABLE download_logs IS 'Audit log for document downloads';
COMMENT ON FUNCTION generate_secure_download_token IS 'Generates a secure download token for a document';
COMMENT ON FUNCTION validate_download_token IS 'Validates and uses a download token';
COMMENT ON FUNCTION cleanup_expired_tokens IS 'Cleans up expired download tokens';
