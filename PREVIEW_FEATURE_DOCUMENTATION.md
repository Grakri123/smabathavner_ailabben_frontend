# 📄 Document Preview Feature - Documentation

## 🎯 Overview

The Document Preview feature allows users to view **PDF**, **JPEG**, and **PNG** files directly in the browser without downloading them. The system uses the same secure token-based authentication as the download feature to ensure maximum security.

---

## 🔒 Security Features

✅ **Temporary Tokens** - Preview tokens expire after 5 minutes (configurable)  
✅ **Single-Use Tokens** - Each token can only be used once  
✅ **Action-Type Separation** - Separate tokens for `download` vs `preview`  
✅ **Audit Logging** - All preview actions are logged in `download_logs` table  
✅ **IP & User Agent Tracking** - Each preview is logged with request metadata  
✅ **No Direct Storage Access** - Files are served through API with validation  

---

## 📂 Files Created/Modified

### **Database Schema**
- `secure-download-preview-update.sql` - Adds `action_type` field to support preview mode

### **API Endpoints**
- `api/preview.js` - Vercel serverless function for secure preview (serves files inline)

### **Frontend Services**
- `src/utils/secureDownloadService.ts` - Updated with `generatePreviewUrl()` method

### **Components**
- `src/components/Database/PreviewModal.tsx` - New modal component for file preview
- `src/components/Database/DatabaseSearchManager.tsx` - Updated to open preview on eye icon click

---

## 🚀 How It Works

### 1. **User Clicks Eye Icon** 👁️
```typescript
onClick={() => setPreviewDocument(document)}
```

### 2. **PreviewModal Opens**
- Checks file extension (`.pdf`, `.jpg`, `.jpeg`, `.png`)
- If previewable: Generates secure token
- If not previewable: Shows message "Download to open"

### 3. **Token Generation**
```typescript
const url = await secureDownloadService.generatePreviewUrl(documentId, 5); // 5 min expiry
```

### 4. **API Call to `/api/preview`**
```javascript
GET /api/preview?token=abc123xyz
```

### 5. **Token Validation**
- RPC function `validate_download_token` checks:
  - ✅ Token exists
  - ✅ Token not expired
  - ✅ Token not already used
  - ✅ action_type = 'preview'

### 6. **File Served Inline**
```javascript
res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
```

### 7. **Display in Modal**
- **PDF**: Rendered in `<iframe>` with native browser PDF viewer
- **Images**: Displayed with `<img>` tag, responsive and centered
- **Other files** (.msg, .docx, etc.): Show info + download button

---

## 📊 Database Changes

### **New Column: `action_type`**

Added to both `secure_download_tokens` and `download_logs`:

```sql
ALTER TABLE secure_download_tokens 
ADD COLUMN action_type TEXT DEFAULT 'download' 
CHECK (action_type IN ('download', 'preview'));
```

### **Updated RPC Function: `generate_secure_download_token`**

Now accepts `p_action_type` parameter:

```sql
CREATE OR REPLACE FUNCTION generate_secure_download_token(
  p_document_id UUID,
  p_user_id TEXT,
  p_expires_in_minutes INTEGER DEFAULT 60,
  p_action_type TEXT DEFAULT 'download'  -- NEW PARAMETER
)
```

### **Updated RPC Function: `validate_download_token`**

Now returns `action_type` in result:

```sql
RETURNS TABLE(
  is_valid BOOLEAN,
  document_id UUID,
  file_path TEXT,
  file_name TEXT,
  action_type TEXT,  -- NEW FIELD
  error_message TEXT
)
```

---

## 🎨 User Experience

### **Preview Modal Features**

1. **Responsive Design** - Works on desktop, tablet, and mobile
2. **Large Preview Area** - Max 90vh height for optimal viewing
3. **Download Button** - Always available even in preview mode
4. **File Type Detection** - Automatically handles different file types
5. **Error Handling** - Graceful fallback if preview fails
6. **Loading States** - Shows spinner while generating token and loading file
7. **Dark/Light Mode Support** - Follows theme system

### **Supported File Types**

| File Type | Preview Method | Notes |
|-----------|---------------|-------|
| PDF | `<iframe>` with browser's PDF viewer | Full navigation, zoom, search |
| JPEG/JPG | `<img>` responsive display | Centered, max-height 70vh |
| PNG | `<img>` responsive display | Centered, max-height 70vh |
| MSG | Not previewable | Shows "Download to open in Outlook" |
| DOCX/XLSX | Not previewable | Shows "Download to open" message |

---

## 🔧 Configuration

### **Token Expiry Times**

```typescript
// Download tokens (long-lived)
const DOWNLOAD_EXPIRY = 60; // 60 minutes

// Preview tokens (short-lived)
const PREVIEW_EXPIRY = 5;   // 5 minutes
```

### **Environment Variables**

Required in `.env.local` and Vercel:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For API endpoint
```

---

## 📝 Setup Instructions

### **1. Database Setup**

Run the SQL script in Supabase SQL Editor:

```bash
# Navigate to Supabase Dashboard > SQL Editor
# Run: secure-download-preview-update.sql
```

This will:
- Add `action_type` column to `secure_download_tokens`
- Add `action_type` column to `download_logs`
- Update `generate_secure_download_token` function
- Update `validate_download_token` function

### **2. Deploy API Endpoint**

The `/api/preview.js` file is automatically deployed when you push to Vercel:

```bash
git add api/preview.js
git commit -m "Add preview API endpoint"
git push
```

### **3. Test Preview Feature**

1. Go to **Database Søk** tab
2. Search for a document (PDF or image)
3. Click the **eye icon** (👁️)
4. Preview modal should open with the file displayed

### **4. Verify Logs**

Check `download_logs` table for preview actions:

```sql
SELECT * FROM download_logs 
WHERE action_type = 'preview' 
ORDER BY downloaded_at DESC;
```

---

## 🐛 Troubleshooting

### **Preview Not Loading**

1. **Check token generation:**
   ```javascript
   // Console should show:
   👁️ Generating preview URL for document: abc123...
   ✅ Preview URL generated: https://...
   ```

2. **Check API endpoint:**
   ```javascript
   // Vercel logs should show:
   🔍 Validating preview token: abc123...
   ✅ Preview token validated, loading file: document.pdf
   ✅ Preview file sent successfully: document.pdf 123456 bytes
   ```

3. **Check browser console for errors**

### **"Invalid Token" Error**

- Token may have expired (5 min default)
- Token may have already been used
- Check that `action_type = 'preview'` in database

### **File Not Displaying**

- Check file extension is supported (`.pdf`, `.jpg`, `.jpeg`, `.png`)
- Verify file exists in Supabase Storage `customer_docs` bucket
- Check `file_path` in `documents` table is correct

### **CORS Errors**

Add allowed origins in Vercel API settings:
```
https://smabathavner.ailabben.no
```

---

## 📈 Performance Considerations

1. **Token Expiry** - Preview tokens expire faster (5 min) to reduce database load
2. **Single-Use Tokens** - Marked as used after first access
3. **Iframe Caching** - Browser caches PDF viewer for better performance
4. **Image Optimization** - Images are served directly, no re-encoding

---

## 🔐 Security Best Practices

1. ✅ **Use HTTPS** - Always use secure connections
2. ✅ **Validate Tokens** - Every request validates token before serving file
3. ✅ **Log Everything** - All preview actions are logged for audit
4. ✅ **Time-Limited** - Tokens expire quickly (5 minutes for preview)
5. ✅ **Single-Use** - Tokens cannot be reused
6. ✅ **Same-Origin** - Iframes restricted to same origin (X-Frame-Options)

---

## 🎉 Summary

The preview feature provides a **secure, user-friendly way** to view documents without downloading them. It:

- ✅ Works for PDF, JPEG, and PNG files
- ✅ Uses the same secure token system as downloads
- ✅ Provides graceful fallback for unsupported file types
- ✅ Logs all actions for security auditing
- ✅ Follows the existing design system
- ✅ Works on all devices (responsive)

**Next Steps:**
1. Run `secure-download-preview-update.sql` in Supabase
2. Deploy to Vercel
3. Test with different file types
4. Monitor logs for any issues

---

**🚀 Ready to use!** Users can now preview documents by clicking the eye icon in the Documents table.

