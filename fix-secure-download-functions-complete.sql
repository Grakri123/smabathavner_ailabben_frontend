-- ==============================================
-- KOMPLETT FIX FOR SECURE DOWNLOAD FUNCTIONS
-- ==============================================
-- Oppdaterer både generate og validate funksjoner til å:
-- 1. Støtte action_type parameter (download/preview)
-- 2. Søke i både documents og documents_outlook tabeller
-- 3. Støtte action_type i validate_download_token

-- ==============================================
-- 1. OPPDATER GENERATE_SECURE_DOWNLOAD_TOKEN
-- ==============================================

-- Drop eksisterende funksjon først
DROP FUNCTION IF EXISTS public.generate_secure_download_token(uuid, text, integer);

-- Opprett ny funksjon med action_type support
CREATE OR REPLACE FUNCTION public.generate_secure_download_token(
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
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generer kryptografisk sikker token
  -- Bruk base64 i stedet for base64url (Supabase støtter ikke base64url)
  v_token := encode(gen_random_bytes(32), 'base64');
  -- Fjern spesialtegn som kan forårsake problemer i URLs
  v_token := replace(replace(v_token, '+', '-'), '/', '_');
  v_expires_at := NOW() + (p_expires_in_minutes || ' minutes')::INTERVAL;
  
  -- Sett inn token i database med action_type
  INSERT INTO public.secure_download_tokens (
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

-- ==============================================
-- 2. OPPDATER VALIDATE_DOWNLOAD_TOKEN
-- ==============================================

-- Drop eksisterende funksjon først
DROP FUNCTION IF EXISTS public.validate_download_token(text, text);

-- Opprett ny funksjon med action_type i return og documents_outlook support
CREATE OR REPLACE FUNCTION public.validate_download_token(
  p_token TEXT,
  p_user_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  document_id UUID,
  file_path TEXT,
  file_name TEXT,
  is_valid BOOLEAN,
  error_message TEXT,
  action_type TEXT
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
      'Invalid or expired token'::TEXT,
      NULL::TEXT;
    RETURN;
  END IF;
  
  -- Sjekk bruker-autorisering (hvis user_id er oppgitt)
  IF p_user_id IS NOT NULL AND v_token_record.user_id != p_user_id THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      FALSE,
      'Unauthorized user'::TEXT,
      NULL::TEXT;
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
      'Document not found'::TEXT,
      NULL::TEXT;
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
    download_successful,
    action_type
  ) VALUES (
    v_token_record.id,
    v_document_record.id,
    v_token_record.user_id,
    NOW(),
    TRUE,
    v_token_record.action_type
  );
  
  -- Returner gyldig dokument info med action_type
  RETURN QUERY SELECT 
    v_document_record.id,
    v_document_record.file_path,
    v_document_record.file_name,
    TRUE,
    NULL::TEXT,
    v_token_record.action_type;
END;
$$;

-- ==============================================
-- 3. GI TILGANG TIL FUNKSJONER
-- ==============================================

GRANT EXECUTE ON FUNCTION public.generate_secure_download_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_download_token TO authenticated;

-- ==============================================
-- 4. FJERN FOREIGN KEY CONSTRAINTS SOM BLOKKERER
-- ==============================================

-- Fjern foreign key constraint fra secure_download_tokens
-- Dette er nødvendig fordi vi nå støtter både documents og documents_outlook
DO $$ 
BEGIN
  ALTER TABLE public.secure_download_tokens 
  DROP CONSTRAINT IF EXISTS secure_download_tokens_document_id_fkey;
  
  ALTER TABLE public.download_logs 
  DROP CONSTRAINT IF EXISTS download_logs_document_id_fkey;
  
  RAISE NOTICE 'Removed foreign key constraints that blocked documents_outlook support';
END $$;

-- ==============================================
-- 5. LEGG TIL ACTION_TYPE KOLONNER
-- ==============================================

-- Sjekk at secure_download_tokens har action_type kolonne
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'secure_download_tokens' 
    AND column_name = 'action_type'
  ) THEN
    ALTER TABLE public.secure_download_tokens 
    ADD COLUMN action_type TEXT DEFAULT 'download';
    RAISE NOTICE 'Added action_type column to secure_download_tokens';
  END IF;
END $$;

-- Sjekk at download_logs har action_type kolonne
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'download_logs' 
    AND column_name = 'action_type'
  ) THEN
    ALTER TABLE public.download_logs 
    ADD COLUMN action_type TEXT DEFAULT 'download';
    RAISE NOTICE 'Added action_type column to download_logs';
  END IF;
END $$;

-- ==============================================
-- FERDIG!
-- ==============================================
-- Nå støtter systemet:
-- ✅ action_type parameter (download/preview)
-- ✅ Søk i både documents og documents_outlook
-- ✅ Returner action_type til API for validering

