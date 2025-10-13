# 🚨 Quick Fix - Secure Download Setup

## Problem
Console viser: `❌ Error generating download token: Object` og `400 Bad Request`

**Årsak:** RPC-funksjonen `generate_secure_download_token` finnes ikke i Supabase.

---

## ✅ Løsning - 3 Enkle Steg:

### 1. **Kjør SQL Setup**

Gå til **Supabase Dashboard** → **SQL Editor** og kjør:

```sql
-- Kopier HELE innholdet fra supabase-setup-secure-download.sql
-- og lim inn i SQL Editor, deretter klikk "Run"
```

### 2. **Verifiser at det fungerte**

I Supabase Dashboard, sjekk at disse er opprettet:

**Tabeller:**
- ✅ `secure_download_tokens`
- ✅ `download_logs`

**Functions:**
- ✅ `generate_secure_download_token`
- ✅ `validate_download_token`
- ✅ `cleanup_expired_tokens`

### 3. **Test i Browser**

1. **Refresh siden** (F5)
2. **Gå til Database Søk** → **Dokumenter**
3. **Klikk på nedlastingsknapp** (📥)
4. **Sjekk console** - skal nå vise:
   ```
   ✅ Download token generated: abc123...
   ✅ Download initiated successfully
   ```

---

## 🔍 Hvis det fortsatt ikke fungerer:

### Sjekk RPC Functions:

I Supabase Dashboard → **Database** → **Functions**, skal du se:
- `generate_secure_download_token`
- `validate_download_token`
- `cleanup_expired_tokens`

### Test RPC manuelt:

```sql
-- Test i Supabase SQL Editor (erstatt med ekte document_id)
SELECT generate_secure_download_token(
  'your-document-id-here'::uuid,
  'system@ailabben.no',
  60
);
```

### Sjekk Permissions:

```sql
-- Gi tilgang til authenticated users
GRANT EXECUTE ON FUNCTION generate_secure_download_token TO authenticated;
GRANT EXECUTE ON FUNCTION validate_download_token TO authenticated;
```

---

## 🎯 Forventet Resultat:

Etter setup skal du se i console:
```
🔐 Generating secure download token for document: 448484e9-897f-4a64-ac61-bca2e053b6d1
✅ Download token generated: abc123...
📥 Starting secure download for: SV Frakt til Øyane båtforening.msg
✅ Download initiated successfully
```

**Og i database:**
```sql
-- Se genererte tokens
SELECT * FROM secure_download_tokens ORDER BY created_at DESC LIMIT 5;
```

---

**🚀 Kjør SQL-en og test igjen!**
