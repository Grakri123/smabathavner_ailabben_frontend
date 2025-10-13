# 🚨 Troubleshooting - Secure Download

## Problem: RLS Policy Already Exists

**Feil:** `policy "Users can view their own tokens" for table "secure_download_tokens" already exists`

**Løsning:** Bruk `supabase-setup-secure-download-safe.sql` i stedet.

---

## ✅ Safe Setup - Kjør denne:

### 1. **Kjør Safe SQL**

I Supabase SQL Editor, kjør:
```sql
-- Kopier HELE innholdet fra supabase-setup-secure-download-safe.sql
-- Denne versjonen sjekker om ting allerede eksisterer
```

### 2. **Hvis du fortsatt får feil:**

**Alternativ 1: Slett og opprett på nytt**
```sql
-- Slett tabellene (OBS: Dette sletter all data!)
DROP TABLE IF EXISTS public.download_logs CASCADE;
DROP TABLE IF EXISTS public.secure_download_tokens CASCADE;

-- Deretter kjør supabase-setup-secure-download.sql
```

**Alternativ 2: Kun opprett RPC functions**
```sql
-- Hvis tabellene allerede eksisterer, opprett kun funksjonene:

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
  v_token := encode(gen_random_bytes(32), 'base64url');
  v_expires_at := NOW() + (p_expires_in_minutes || ' minutes')::INTERVAL;
  
  INSERT INTO public.secure_download_tokens (
    token, document_id, user_id, expires_at
  ) VALUES (v_token, p_document_id, p_user_id, v_expires_at);
  
  RETURN v_token;
END;
$$;

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
  SELECT * INTO v_token_record
  FROM public.secure_download_tokens
  WHERE token = p_token AND expires_at > NOW() AND used_at IS NULL;
  
  IF v_token_record IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, FALSE, 'Invalid or expired token'::TEXT;
    RETURN;
  END IF;
  
  IF p_user_id IS NOT NULL AND v_token_record.user_id != p_user_id THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, FALSE, 'Unauthorized user'::TEXT;
    RETURN;
  END IF;
  
  SELECT * INTO v_document_record FROM public.documents WHERE id = v_token_record.document_id;
  
  IF v_document_record IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, FALSE, 'Document not found'::TEXT;
    RETURN;
  END IF;
  
  UPDATE public.secure_download_tokens SET used_at = NOW() WHERE id = v_token_record.id;
  
  INSERT INTO public.download_logs (token_id, document_id, user_id)
  VALUES (v_token_record.id, v_document_record.id, v_token_record.user_id);
  
  RETURN QUERY SELECT 
    v_document_record.id,
    v_document_record.file_path,
    v_document_record.file_name,
    TRUE,
    NULL::TEXT;
END;
$$;

-- Gi tilgang
GRANT EXECUTE ON FUNCTION public.generate_secure_download_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_download_token TO authenticated;
```

---

## 🔍 Verifiser at det fungerte:

### Sjekk Functions:
```sql
-- I Supabase SQL Editor
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%download%';
```

**Skal returnere:**
- `generate_secure_download_token`
- `validate_download_token`
- `cleanup_expired_tokens`

### Test RPC:
```sql
-- Test med dummy data
SELECT generate_secure_download_token(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test@example.com',
  60
);
```

**Skal returnere:** En lang base64url token

---

## 🎯 Test i Browser:

1. **Refresh siden** (F5)
2. **Gå til Database Søk** → **Dokumenter**
3. **Klikk nedlastingsknapp** (📥)
4. **Sjekk console** - skal nå vise:
   ```
   ✅ Download token generated: abc123...
   ✅ Download initiated successfully
   ```

---

**🚀 Prøv den safe versjonen først!**
