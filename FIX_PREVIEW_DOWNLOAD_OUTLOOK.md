# 🔧 FIX: Preview og Nedlasting for Documents_Outlook

## Problemet
Preview og nedlasting fungerte ikke for dokumenter fra `documents_outlook` tabellen fordi:

1. ✅ **RPC funksjonen søkte kun i `documents` tabellen**
   - `validate_download_token` fant ikke dokumenter fra `documents_outlook`
   
2. ✅ **Manglende `action_type` støtte**
   - Frontend sender `p_action_type` parameter
   - RPC funksjoner støttet ikke dette
   - API preview sjekker `action_type` men fikk `undefined`

3. ✅ **Foreign Key Constraint blokkerte `documents_outlook`**
   - `secure_download_tokens` hadde FK til **kun** `documents` tabellen
   - Når vi prøvde å lage token for `documents_outlook` dokument → Foreign Key error
   - Error: `Key (document_id)=(...) is not present in table "documents"`

## Løsningen

### 1️⃣ Kjør SQL-filen i Supabase

**Fil:** `fix-secure-download-functions-complete.sql`

Dette gjør:
- ✅ **FJERNER Foreign Key constraints** som blokkerte `documents_outlook` support
- ✅ Dropper og oppretter ny `generate_secure_download_token` med `p_action_type` parameter
- ✅ Dropper og oppretter ny `validate_download_token` som:
  - Søker i både `documents` og `documents_outlook` tabeller
  - Returnerer `action_type` i resultatsettet
- ✅ Legger til `action_type` kolonne i `secure_download_tokens` og `download_logs` tabeller (hvis mangler)
- ✅ Gir riktige tilganger til funksjonene

### 2️⃣ Deploy Frontend

Frontend er allerede oppdatert med:
- ✅ `action_type` lagt til i TypeScript interfaces
- ✅ Service kaller RPC med `p_action_type` parameter
- ✅ API endpoints støtter `action_type` validering

### 3️⃣ Test

Etter SQL-kjøring, test:

**For Documents (Manuelt):**
- ✅ Nedlasting skal fungere
- ✅ Preview skal fungere

**For Documents_Outlook:**
- ✅ Nedlasting skal fungere
- ✅ Preview skal fungere

## Hva Som Ble Endret

### Database
```sql
-- KRITISK: Foreign Key Constraints fjernet
ALTER TABLE secure_download_tokens DROP CONSTRAINT secure_download_tokens_document_id_fkey;
ALTER TABLE download_logs DROP CONSTRAINT download_logs_document_id_fkey;

-- generate_secure_download_token nå har:
p_action_type TEXT DEFAULT 'download'

-- validate_download_token nå:
-- 1. Søker i documents først
-- 2. Søker i documents_outlook hvis ikke funnet
-- 3. Returnerer action_type
```

### Frontend
```typescript
// src/types/secureDownload.ts
export interface SecureDownloadToken {
  // ... existing fields
  action_type?: 'download' | 'preview';
}

export interface ValidateTokenResponse {
  // ... existing fields
  action_type?: string | null;
}
```

### API Endpoints
- `api/preview.js` - Sjekker at `action_type === 'preview'`
- `api/download.js` - Fungerer for alle typer

## Hvis Det Fortsatt Ikke Fungerer

### Sjekk at kolonner eksisterer:
```sql
-- Kjør i Supabase SQL Editor
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'secure_download_tokens' 
AND table_schema = 'public';

-- Skal inkludere: action_type
```

### Sjekk at funksjoner har riktig signatur:
```sql
-- Kjør i Supabase SQL Editor
SELECT 
  proname as function_name, 
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname IN ('generate_secure_download_token', 'validate_download_token')
AND pronamespace = 'public'::regnamespace;

-- generate_secure_download_token skal ha: p_document_id uuid, p_user_id text, p_expires_in_minutes integer DEFAULT 60, p_action_type text DEFAULT 'download'::text
-- validate_download_token skal returnere: action_type i resultatsettet
```

### Debug i konsollen:
- Frontend logger `action_type` når token genereres
- API logger `action_type` når token valideres
- Se etter feilmeldinger om "Invalid action type"

## Tidligere Filer (Kan Slettes)

Disse filene er erstattet av `fix-secure-download-functions-complete.sql`:
- ❌ `fix-validate-function-documents-outlook.sql` (ufullstendig, manglet action_type)

## Support

Hvis fortsatt problemer, sjekk:
1. Browser console for frontend errors
2. Vercel logs for API errors  
3. Supabase logs for RPC errors

🎯 **Etter SQL-kjøring skal alt fungere!**

