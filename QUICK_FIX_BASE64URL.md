# 🚨 Quick Fix - Base64url Encoding Problem

## Problem
```
❌ Error generating download token: {code: '22023', message: 'unrecognized encoding: "base64url"'}
```

**Årsak:** Supabase støtter ikke `base64url` encoding, kun `base64`.

---

## ✅ Løsning - 1 Enkelt Steg:

### **Kjør Fix SQL**

I **Supabase SQL Editor**, kjør:
```sql
-- Kopier HELE innholdet fra fix-rpc-functions.sql
-- Dette fikser encoding-problemet
```

**Endring gjort:**
```sql
-- ❌ FEIL (støttes ikke):
v_token := encode(gen_random_bytes(32), 'base64url');

-- ✅ RIKTIG (støttes):
v_token := encode(gen_random_bytes(32), 'base64');
v_token := replace(replace(v_token, '+', '-'), '/', '_');
```

---

## 🎯 Test etter fix:

1. **Refresh siden** (F5)
2. **Gå til Database Søk** → **Dokumenter**
3. **Klikk nedlastingsknapp** (📥)
4. **Sjekk console** - skal nå vise:
   ```
   ✅ Download token generated: abc123...
   ✅ Download initiated successfully
   ```

---

## 🔍 Hvis det fortsatt ikke fungerer:

### Sjekk at RPC function er oppdatert:

```sql
-- I Supabase SQL Editor
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'generate_secure_download_token';
```

**Skal inneholde:** `encode(gen_random_bytes(32), 'base64')` (ikke base64url)

### Test RPC manuelt:

```sql
-- Test med dummy data
SELECT generate_secure_download_token(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test@example.com',
  60
);
```

**Skal returnere:** En base64 token (uten base64url feil)

---

**🚀 Kjør fix-rpc-functions.sql og test igjen!**

Dette løser encoding-problemet! 🎯
