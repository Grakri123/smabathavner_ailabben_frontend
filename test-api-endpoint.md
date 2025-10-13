# 🧪 Test API Endpoint

## Problem
API-endepunktet sier at tokenet har utløpt, selv om det nettopp ble generert.

## Løsning
API-endepunktet må bruke **service role key** og kalle RPC-funksjonen riktig.

---

## 🔧 Fikset API Endpoint

### Endringer gjort:

1. **RPC function call** - Lagt til `public.` prefix:
   ```javascript
   // ❌ FEIL:
   await supabase.rpc('validate_download_token', {...})
   
   // ✅ RIKTIG:
   await supabase.rpc('public.validate_download_token', {...})
   ```

2. **Bucket name** - Endret til riktig bucket:
   ```javascript
   // ❌ FEIL:
   .from('documents')
   
   // ✅ RIKTIG:
   .from('customer_docs')
   ```

---

## 🧪 Test API Endpoint

### 1. **Deploy oppdatert API**
Kopier den oppdaterte `api/download.js` til Vercel.

### 2. **Test direkte i browser**
Gå til denne URL-en (erstatt med ekte token):
```
https://smabathavner.ailabben.no/api/download?token=5yvdFswC_VIQQ84L-bb7VaYe1dhBOKdXs_KxK-LUumE=
```

**Forventet resultat:**
- ✅ Fil lastes ned automatisk
- ❌ 400/500 error (hvis fortsatt problemer)

### 3. **Sjekk Vercel Logs**
I Vercel Dashboard → **Functions** → **download** → **Logs**

**Skal vise:**
```
🔍 Validating download token: 5yvdFswC_VIQQ84L-bb7...
✅ Token validated, downloading file: Document004871.pdf
✅ File sent successfully: Document004871.pdf 1234567 bytes
```

---

## 🔍 Debug Steps

### Hvis det fortsatt ikke fungerer:

1. **Sjekk Vercel Environment Variables:**
   ```bash
   VITE_SUPABASE_URL=https://phqaxpgnqmsftdwrbjda.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Test RPC function direkte:**
   ```sql
   -- I Supabase SQL Editor
   SELECT public.validate_download_token(
     '5yvdFswC_VIQQ84L-bb7VaYe1dhBOKdXs_KxK-LUumE=',
     NULL
   );
   ```

3. **Sjekk file_path format:**
   ```sql
   -- Se hvordan file_path ser ut
   SELECT id, file_name, file_path 
   FROM documents 
   WHERE id = '448484e9-897f-4a64-ac61-bca2e053b6d1';
   ```

---

## 🎯 Forventet File Path Format

Basert på din info, `file_path` skal se slik ut:
```
eb34af14-8213-4a55-88de-699c1b920932/Document004871.pdf
```

**Ikke** den fulle URL-en:
```
❌ https://phqaxpgnqmsftdwrbjda.supabase.co/storage/v1/object/public/customer_docs/eb34af14-8213-4a55-88de-699c1b920932/Document004871.pdf
```

---

**🚀 Deploy den oppdaterte API-en og test igjen!**
