# API Setup Guide for Panda AI

## ✅ Environment Variable Setup

### 1. Create/Edit `.env.local` File
The file should be located at the project root: `c:\AI Study Assistant\.env.local`

### 2. Add API Key (NO QUOTES)
```
VITE_GEMINI_API_KEY=AIzaSyCfO8sjUbSzj5ZKhyGkXosxNi8pZhkgq7k
```

**⚠️ IMPORTANT:**
- Do **NOT** add quotes around the key
- ❌ Wrong: `VITE_GEMINI_API_KEY="AIzaSy..."`
- ✅ Correct: `VITE_GEMINI_API_KEY=AIzaSy...`

### 3. Restart Development Server
After editing `.env.local`, **you MUST restart the dev server**:
1. Stop the running dev server (Ctrl+C)
2. Run `npm run dev` again

The dev server reads `.env.local` at startup. Changes to `.env` files require a restart.

---

## 🔐 API Key Configuration in Google Cloud

### Get API Key from Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Generative Language API**
4. Go to **Credentials** → **Create API Key**
5. Copy the API key to `.env.local`

### Check API Key Restrictions
⚠️ If requests return **401/403 errors**, check key restrictions:
1. Open [Google Cloud Console](https://console.cloud.google.com/) → **Credentials**
2. Click on your API key
3. Under **Application restrictions**, ensure one of:
   - `HTTP referrers (web sites)` - Add `localhost:3000` if restricted
   - `None (Unrestricted)` - Use for development

### Verify API is Enabled
1. Go to **APIs & Services** → **Enabled APIs**
2. Search for **Generative Language API**
3. Ensure it's **Enabled**
4. Check billing is active (if required by Google)

---

## 🧪 Testing & Debugging

### Console Error Messages
Open browser DevTools (F12) → **Console** tab to see detailed logs:

- ✅ `✓ API Key loaded successfully` - Key is valid
- ❌ `CRITICAL: API Key not found` - Key missing or dev server not restarted
- ❌ `401 Unauthorized` - Invalid or expired API key
- ❌ `403 Forbidden` - API not enabled or key restricted
- ❌ `429 Too Many Requests` - Rate limit exceeded

### Network Debugging
In DevTools → **Network** tab:
1. Send a message in chat
2. Look for request to `generativelanguage.googleapis.com`
3. Check response status:
   - `200 OK` - Success
   - `401` - Invalid API key
   - `403` - Permission denied
   - `429` - Rate limit

---

## 🚀 Expected Behavior After Fix

When API is properly configured:
1. Type a message and send
2. Typing animation appears for 1-2 seconds
3. AI response streams in, replacing the animation
4. No "API Error" message should appear
5. Console shows detailed logs without errors

---

## 🔧 If Issue Persists

### Step-by-step Troubleshooting:
1. ✅ Stop dev server
2. ✅ Open `.env.local` - verify key has no quotes
3. ✅ Save `.env.local`
4. ✅ Restart dev server (`npm run dev`)
5. ✅ Clear browser cache (Ctrl+Shift+Del) - optional but recommended
6. ✅ Reload page (Ctrl+R or F5)
7. ✅ Open DevTools (F12) → Console
8. ✅ Send test message and check console logs

### Common Issues:

| Error Message | Fix |
|---|---|
| `CRITICAL: API Key not found` | Restart dev server after editing .env.local |
| `401 Unauthorized` | Check API key is correct and has no quotes |
| `403 Forbidden` | Enable Generative Language API in Google Cloud |
| `429 Too Many Requests` | Wait 60 seconds and retry |
| Empty response | Check API key restrictions in Google Cloud Console |

---

## 📋 File Locations
- **Environment file**: `c:\AI Study Assistant\.env.local`
- **Service code**: `c:\AI Study Assistant\services\geminiService.ts`
- **Main app**: `c:\AI Study Assistant\App.tsx`
- **Constants**: `c:\AI Study Assistant\constants.ts`

---

## 📚 API Details
- **Service**: Google Generative Language API (Gemini)
- **Model**: `gemini-1.5-flash`
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY`
- **Documentation**: https://ai.google.dev/
