# 🚀 Quick Setup Guide - Document Preview Feature

## ✅ Step-by-Step Setup

### **Step 1: Update Database Schema**

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project: `phqaxpgnqmsftdwrbjda`
3. Go to **SQL Editor**
4. Run the file: `secure-download-preview-update.sql`

This will add the `action_type` field to support preview mode.

**Expected Output:**
```
Successfully executed query
```

---

### **Step 2: Deploy API Endpoint**

The `/api/preview.js` file will be automatically deployed when you push to Vercel.

**Commands:**
```bash
git add .
git commit -m "Add document preview feature"
git push
```

**Verify Deployment:**
1. Go to Vercel Dashboard
2. Check that deployment succeeded
3. Verify `/api/preview` endpoint exists

---

### **Step 3: Test Preview Feature**

1. **Go to the app:** https://smabathavner.ailabben.no
2. **Login** with authorized email
3. **Navigate to:** Database Søk tab (🗄️)
4. **Click:** Documents tab
5. **Click:** Eye icon (👁️) on any PDF or image file

**Expected Result:**
- Preview modal opens
- File is displayed inline (PDF in iframe, images as img)
- Download button is available
- Close button works

---

### **Step 4: Verify Security**

**Check token generation in browser console:**
```javascript
👁️ Generating preview URL for document: abc123...
✅ Preview URL generated: https://smabathavner.ailabben.no/api/preview?token=...
```

**Check Vercel logs:**
```
🔍 Validating preview token: abc123...
✅ Preview token validated, loading file: document.pdf
📁 Extracted file path: uuid/document.pdf
✅ Preview file sent successfully: document.pdf 123456 bytes
📊 Preview action logged
```

**Check database logs:**
```sql
SELECT * FROM download_logs 
WHERE action_type = 'preview' 
ORDER BY downloaded_at DESC 
LIMIT 10;
```

---

## 📋 Supported File Types

| Type | Preview | Notes |
|------|---------|-------|
| **PDF** | ✅ Yes | Inline iframe viewer |
| **JPEG/JPG** | ✅ Yes | Image display |
| **PNG** | ✅ Yes | Image display |
| **MSG** | ❌ No | Shows "Download to open in Outlook" |
| **DOCX** | ❌ No | Shows "Download to open" |
| **XLSX** | ❌ No | Shows "Download to open" |

---

## 🔧 Configuration

### **Token Expiry (Optional)**

If you want to change preview token expiry time:

**In `src/utils/secureDownloadService.ts`:**
```typescript
// Default is 5 minutes
await secureDownloadService.generatePreviewUrl(documentId, 10); // 10 minutes
```

### **Environment Variables**

Make sure these are set in Vercel:
```
VITE_SUPABASE_URL=https://phqaxpgnqmsftdwrbjda.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🐛 Troubleshooting

### **Problem: Preview modal opens but shows loading forever**

**Solution:**
1. Check browser console for errors
2. Check Vercel logs for API errors
3. Verify token was generated correctly
4. Check file exists in Supabase Storage

### **Problem: "Invalid token" error**

**Solution:**
1. Check if database migration ran successfully
2. Verify RPC functions exist: `generate_secure_download_token`, `validate_download_token`
3. Check that `action_type` column exists in `secure_download_tokens` table

### **Problem: Preview shows blank page for PDF**

**Solution:**
1. Check browser's PDF viewer settings
2. Try in incognito mode (to rule out extensions)
3. Check if file is corrupted in Supabase Storage
4. Verify Content-Type header is `application/pdf`

### **Problem: Images not loading**

**Solution:**
1. Check image file extension is `.jpg`, `.jpeg`, or `.png`
2. Verify file exists in `customer_docs` bucket
3. Check CORS settings in Supabase Storage
4. Verify file path is correct in `documents` table

---

## ✅ Verification Checklist

- [ ] Database schema updated (ran `secure-download-preview-update.sql`)
- [ ] API endpoint deployed (`/api/preview.js` exists in Vercel)
- [ ] Environment variables set in Vercel
- [ ] Preview modal opens when clicking eye icon
- [ ] PDF files display correctly
- [ ] Image files display correctly
- [ ] MSG files show "Download to open" message
- [ ] Download button works from preview modal
- [ ] Preview actions logged in `download_logs` table
- [ ] Tokens expire after 5 minutes
- [ ] Tokens are single-use only

---

## 🎉 Success!

If all checks pass, the preview feature is working correctly! Users can now:
- 👁️ Click eye icon to preview documents
- 📥 Download directly from preview modal
- 🔒 All actions are secure and logged

---

**Questions or Issues?**
Check `PREVIEW_FEATURE_DOCUMENTATION.md` for detailed technical documentation.

