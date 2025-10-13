-- ==============================================
-- SECURE DOWNLOAD SYSTEM - SAFE SETUP
-- ==============================================
-- Denne versjonen sjekker om ting allerede eksisterer før opprettelse

-- 1. Opprett secure_download_tokens tabell (hvis den ikke eksisterer)
CREATE TABLE IF NOT EXISTS public.secure_download_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  document_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE NULL,
  ip_address INET NULL,
  user_agent TEXT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT secure_download_tokens_document_id_fkey 
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 2. Opprett download_logs tabell (hvis den ikke eksisterer)
CREATE TABLE IF NOT EXISTS public.download_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID REFERENCES secure_download_tokens(id) ON DELETE SET NULL,
  document_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET NULL,
  user_agent TEXT NULL,
  file_size BIGINT NULL,
  download_successful BOOLEAN DEFAULT TRUE,
  error_message TEXT NULL,
  CONSTRAINT download_logs_document_id_fkey 
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 3. Opprett indexer (hvis de ikke eksisterer)
CREATE INDEX IF NOT EXISTS idx_secure_tokens_token 
  ON public.secure_download_tokens USING btree (token);

CREATE INDEX IF NOT EXISTS idx_secure_tokens_document_id 
  ON public.secure_download_tokens USING btree (document_id);

CREATE INDEX IF NOT EXISTS idx_secure_tokens_user_id 
  ON public.secure_download_tokens USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_secure_tokens_expires 
  ON public.secure_download_tokens USING btree (expires_at);

CREATE INDEX IF NOT EXISTS idx_download_logs_document_id 
  ON public.download_logs USING btree (document_id);

CREATE INDEX IF NOT EXISTS idx_download_logs_user_id 
  ON public.download_logs USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_download_logs_downloaded_at 
  ON public.download_logs USING btree (downloaded_at);

-- 4. Opprett RPC funksjon for å generere tokens
CREATE OR REPLACE FUNCTION public.generate_secure_download_token(
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
  -- Generer kryptografisk sikker token
  v_token := encode(gen_random_bytes(32), 'base64url');
  v_expires_at := NOW() + (p_expires_in_minutes || ' minutes')::INTERVAL;
  
  -- Sett inn token i database
  INSERT INTO public.secure_download_tokens (
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

-- 5. Opprett RPC funksjon for å validere tokens
CREATE OR REPLACE FUNCTION public.validate_download_token(
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
  -- Hent token record
  SELECT * INTO v_token_record
  FROM public.secure_download_tokens
  WHERE token = p_token
    AND expires_at > NOW()
    AND used_at IS NULL;
  
  -- Sjekk om token eksisterer og er gyldig
  IF v_token_record IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      FALSE,
      'Invalid or expired token'::TEXT;
    RETURN;
  END IF;
  
  -- Sjekk bruker-autorisering (hvis user_id er oppgitt)
  IF p_user_id IS NOT NULL AND v_token_record.user_id != p_user_id THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      FALSE,
      'Unauthorized user'::TEXT;
    RETURN;
  END IF;
  
  -- Hent dokument record
  SELECT * INTO v_document_record
  FROM public.documents
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
  
  -- Marker token som brukt
  UPDATE public.secure_download_tokens
  SET used_at = NOW()
  WHERE id = v_token_record.id;
  
  -- Logg nedlastingen
  INSERT INTO public.download_logs (
    token_id,
    document_id,
    user_id
  ) VALUES (
    v_token_record.id,
    v_document_record.id,
    v_token_record.user_id
  );
  
  -- Returner gyldig dokument info
  RETURN QUERY SELECT 
    v_document_record.id,
    v_document_record.file_path,
    v_document_record.file_name,
    TRUE,
    NULL::TEXT;
END;
$$;

-- 6. Opprett cleanup funksjon
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.secure_download_tokens
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 7. Aktiver Row Level Security (hvis ikke allerede aktivert)
ALTER TABLE public.secure_download_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;

-- 8. Slett eksisterende policies først (hvis de eksisterer)
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.secure_download_tokens;
DROP POLICY IF EXISTS "System can insert tokens" ON public.secure_download_tokens;
DROP POLICY IF EXISTS "System can update tokens" ON public.secure_download_tokens;
DROP POLICY IF EXISTS "Users can view their own download logs" ON public.download_logs;
DROP POLICY IF EXISTS "System can insert download logs" ON public.download_logs;

-- 9. Opprett nye RLS policies
CREATE POLICY "Users can view their own tokens" 
  ON public.secure_download_tokens
  FOR SELECT 
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "System can insert tokens" 
  ON public.secure_download_tokens
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update tokens" 
  ON public.secure_download_tokens
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can view their own download logs" 
  ON public.download_logs
  FOR SELECT 
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "System can insert download logs" 
  ON public.download_logs
  FOR INSERT 
  WITH CHECK (true);

-- 10. Gi tilgang til funksjoner
GRANT EXECUTE ON FUNCTION public.generate_secure_download_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_download_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_tokens TO authenticated;

-- 11. Test funksjonen (valgfritt - fjern etter testing)
-- SELECT public.generate_secure_download_token(
--   '00000000-0000-0000-0000-000000000000'::uuid,
--   'test@example.com',
--   60
-- );

-- ==============================================
-- SETUP FERDIG!
-- ==============================================
-- Nå skal secure download systemet fungere
