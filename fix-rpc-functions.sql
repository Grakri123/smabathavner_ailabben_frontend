-- ==============================================
-- FIX RPC FUNCTIONS - Base64url Issue
-- ==============================================
-- Kjør denne for å fikse encoding-problemet

-- 1. Fikset generate_secure_download_token funksjon
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
  -- Bruk base64 i stedet for base64url (Supabase støtter ikke base64url)
  v_token := encode(gen_random_bytes(32), 'base64');
  -- Fjern spesialtegn som kan forårsake problemer i URLs
  v_token := replace(replace(v_token, '+', '-'), '/', '_');
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

-- 2. Fikset validate_download_token funksjon
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

-- 3. Gi tilgang til funksjoner
GRANT EXECUTE ON FUNCTION public.generate_secure_download_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_download_token TO authenticated;

-- 4. Test funksjonen (valgfritt)
-- SELECT public.generate_secure_download_token(
--   '00000000-0000-0000-0000-000000000000'::uuid,
--   'test@example.com',
--   60
-- );

-- ==============================================
-- FIX FERDIG!
-- ==============================================
