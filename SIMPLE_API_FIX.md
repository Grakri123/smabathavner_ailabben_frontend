# 🚨 Simple API Fix - Direct Database Queries

## Problem
API-endepunktet sier "invalid token" selv om tokenet er gyldig.

**Årsak:** RPC-funksjoner fungerer ikke riktig med service role key.

---

## ✅ Løsning - Enklere API

### **Erstatt API Endpoint**

1. **Slett** `/api/download.js`
2. **Kopier** `api/download-simple.js` til `/api/download.js`
3. **Deploy** til Vercel

### **Hva er endret:**

**❌ Gammel (RPC):**
```javascript
const { data, error } = await supabase.rpc('public.validate_download_token', {
  p_token: token,
  p_user_id: null
});
```

**✅ Ny (Direct Query):**
```javascript
const { data: tokenData, error: tokenError } = await supabase
  .from('secure_download_tokens')
  .select(`
    *,
    document:documents(*)
  `)
  .eq('token', token)
  .gt('expires_at', new Date().toISOString())
  .is('used_at', null)
  .single();
```

---

## 🎯 Fordeler med ny løsning:

- ✅ **Ingen RPC functions** - bruker direkte database queries
- ✅ **Enklere debugging** - lettere å se hva som går galt
- ✅ **Bedre error handling** - spesifikke feilmeldinger
- ✅ **Støtter .msg filer** - lagt til content-type for Outlook files

---

## 🚀 Test etter deploy:

1. **Deploy** den nye API-en
2. **Test i browser:**
   ```
   https://smabathavner.ailabben.no/api/download?token=YOUR_TOKEN
   ```
3. **Test i appen** - klikk nedlastingsknapp

---

## 🔍 Debug Info:

**Ny API logger:**
- `🔍 Validating download token`
- `✅ Token validated, downloading file`
- `✅ File sent successfully`

**Hvis feil:**
- `❌ Token validation failed`
- `❌ File download error`
- `❌ Download API error`

---

**🚀 Bytt til den enkle API-en og test!**
