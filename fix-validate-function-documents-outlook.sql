-- ==============================================
-- FIX VALIDATE_DOWNLOAD_TOKEN FOR DOCUMENTS_OUTLOOK
-- ==============================================
-- Oppdaterer validate_download_token til å søke i både documents og documents_outlook

-- Drop eksisterende funksjon først (hvis den har forskjellig signatur)
DROP FUNCTION IF EXISTS public.validate_download_token(text, text);

-- Oppdater validate_download_token funksjon til å støtte begge tabeller
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
  
  -- Søk først i documents tabellen
  SELECT * INTO v_document_record
  FROM public.documents
  WHERE id = v_token_record.document_id;
  
  -- Hvis ikke funnet i documents, søk i documents_outlook
  IF v_document_record IS NULL THEN
    SELECT * INTO v_document_record
    FROM public.documents_outlook
    WHERE id = v_token_record.document_id;
  END IF;
  
  -- Hvis fortsatt ikke funnet
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
    user_id,
    downloaded_at,
    download_successful
  ) VALUES (
    v_token_record.id,
    v_document_record.id,
    v_token_record.user_id,
    NOW(),
    TRUE
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

-- Gi tilgang til funksjonen
GRANT EXECUTE ON FUNCTION public.validate_download_token TO authenticated;

-- ==============================================
-- TEST FUNKSJONEN (valgfritt)
-- ==============================================
-- Du kan teste funksjonen med:
-- SELECT * FROM public.validate_download_token('your-token-here', NULL);
