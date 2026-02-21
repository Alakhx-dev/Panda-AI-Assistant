# Environment Variable Setup - Complete Troubleshooting Guide

## ✅ What Was Fixed

1. **Created `vite-env.d.ts`** - TypeScript type definitions for `import.meta.env`
2. **Updated `tsconfig.json`** - Added `vite/client` types for proper env variable recognition
3. **Enhanced logging in `geminiService.ts`** - Detailed diagnostics for environment variable loading
4. **Added `envCheck.ts`** - Utility to verify environment setup at startup
5. **Added startup check in `App.tsx`** - Automatic environment verification on app load

---

## 🔍 How to Verify Environment Setup

### Step 1: Check .env.local File
**Location:** `c:\AI Study Assistant\.env.local`

**Content should be exactly:**
```
VITE_GEMINI_API_KEY=AIzaSyCfO8sjUbSzj5ZKhyGkXosxNi8pZhkgq7k
```

**Verify:**
- ✅ File is at project root (same level as `package.json`)
- ✅ No quotes around the key: `VITE_GEMINI_API_KEY=value` (NOT `"value"`)
- ✅ No extra spaces: `VITE_GEMINI_API_KEY=value` (NOT `VITE_GEMINI_API_KEY = value`)
- ✅ Variable name is exact: `VITE_GEMINI_API_KEY` (NOT `GEMINI_API_KEY`)

### Step 2: Verify TypeScript Configuration
**Files involved:**
- `vite-env.d.ts` - Should exist at root with type definitions ✅
- `tsconfig.json` - Should include `"vite/client"` in types array ✅

### Step 3: Restart Development Server
**Critical:** Vite only reads `.env.local` at server startup.

```bash
# 1. Stop the dev server (Press Ctrl+C in terminal)
# 2. Restart it
npm run dev
```

### Step 4: Check Browser Console
**Open DevTools:** `F12` → **Console** tab

**Look for these logs:**
```
🚀 App.tsx: Performing environment check at startup
🔍 ENVIRONMENT SETUP CHECK
📦 All import.meta.env variables: {...}
🔑 VITE_GEMINI_API_KEY: ✅ PRESENT
✅ Environment check PASSED - API key is available
```

**If you see:**
```
🔑 VITE_GEMINI_API_KEY: ❌ MISSING
⚠️ Environment check FAILED - API key not found
```

Then `.env.local` is not being loaded. Go to Step 5.

### Step 5: Diagnose API Key Loading
When you send a message, watch the console for:

```
🔐 RUNTIME ENVIRONMENT CHECK
🔑 VITE_GEMINI_API_KEY value: AIzaSyCfO8sjUbSzj5ZKhyGkXosxNi8pZhkgq7k
✓ VITE_GEMINI_API_KEY exists: true
✓ VITE_GEMINI_API_KEY length: 39
✓ VITE_GEMINI_API_KEY type: string
✅ API Key loaded successfully
✅ API Key first 10 chars: AIzaSyCfO8...
✅ Model: gemini-1.5-flash
```

### Step 6: Verify Full API Request/Response Flow
After sending a message, you should see in console:

```
📡 REST API REQUEST
🔗 ENDPOINT (key redacted): https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=[REDACTED_API_KEY]
📨 HTTP METHOD: POST
📋 REQUEST HEADERS: { 'Content-Type': 'application/json' }
📦 REQUEST BODY: { contents: [...], systemInstruction: {...}, generationConfig: {...} }

📊 REST API RESPONSE
STATUS: 200
STATUS TEXT: OK
HEADERS: { contentType: 'application/json', ... }
FULL RESPONSE: { candidates: [...], promptFeedback: {...} }

📊 RESPONSE EXTRACTION DEBUG
✅ RESPONSE TEXT EXTRACTED
✅ TEXT LENGTH: 245
✅ TEXT PREVIEW: Here is the response...
```

---

## 🚨 Troubleshooting: Still Getting "API Key Not Found"

### Check 1: Is .env.local in the right location?
```
c:\AI Study Assistant\
├── .env.local                    ✅ HERE (at root)
├── src/
│   └── .env.local               ❌ WRONG (not here)
├── package.json
├── vite.config.ts
└── ...
```

**Fix:** Move `.env.local` to project root if it's in a subdirectory.

### Check 2: Does .env.local have any issues?
```bash
# Open .env.local and verify:
VITE_GEMINI_API_KEY=AIzaSyCfO8sjUbSzj5ZKhyGkXosxNi8pZhkgq7k
```

**Common mistakes:**
- ❌ `VITE_GEMINI_API_KEY="AIzaSy..."` (has quotes)
- ❌ `VITE_GEMINI_API_KEY = value` (extra spaces)
- ❌ `GEMINI_API_KEY=...` (missing VITE_ prefix)
- ❌ `VITE_GEMINI_API_KEY=` (empty value)

### Check 3: Was dev server restarted after .env changes?
Vite reads `.env.local` at server startup only.

**Must restart:**
1. Stop terminal with `Ctrl+C`
2. Run `npm run dev` again

### Check 4: Is there a conflicting .env file?
Vite loads files in this order (last wins):
1. `.env`
2. `.env.local`
3. `.env.production`
4. `.env.production.local`

**Check:** Are there any other `.env*` files? If so, ensure they don't override the key.

### Check 5: Clear Browser Cache (Optional but helpful)
1. Open DevTools: `F12`
2. Right-click the Reload button
3. Click "Empty cache and hard reload"

---

## 📊 File Structure Reference

```
c:\AI Study Assistant\
├── .env.local                      ✅ API key here
├── vite-env.d.ts                   ✅ Type definitions (NEW)
├── tsconfig.json                   ✅ Updated with vite/client
├── vite.config.ts                  ✓ Correct config
├── package.json
├── App.tsx                          ✅ Environment check added
├── index.tsx
├── services/
│   ├── geminiService.ts            ✅ Enhanced diagnostics
│   └── envCheck.ts                 ✅ Utility function (NEW)
└── ...
```

---

## 🔧 Testing the Fix

### Test 1: Check Environment on Startup
1. Restart dev server: `npm run dev`
2. Open browser to `http://localhost:3000`
3. Open DevTools Console (F12)
4. You should see: `✅ Environment check PASSED - API key is available`

### Test 2: Send a Test Message
1. Login to the app
2. Type a test message
3. Open Console (F12)
4. Send the message
5. Look for: `✅ API Key loaded successfully`

### Test 3: Verify API Response
1. Watch the console for these logs in order:
   ```
   ✅ API Key loaded successfully
   📤 Initiating API request...
   📊 REST Response Status: 200
   ✅ REST API Response received
   ```

---

## 💡 Environment Variables in Vite

### How Vite Loads .env Files
- Vite automatically reads `.env.local` at server startup
- Variables must be prefixed with `VITE_` to be accessible in browser code
- Access in code: `import.meta.env.VITE_GEMINI_API_KEY`

### Why This Method?
- ✅ Secure - API key not exposed to `process.env` check
- ✅ Type-safe - With proper TypeScript definitions
- ✅ Vite native - No extra configuration needed
- ✅ Works in browser context - Properly bundled

### Variables Available
```typescript
import.meta.env.VITE_GEMINI_API_KEY   // Your custom variable
import.meta.env.MODE                  // 'development' or 'production'
import.meta.env.DEV                   // true in development
import.meta.env.PROD                  // true in production
import.meta.env.SSR                   // true if SSR build
```

---

## 📝 Console Output Examples

### ✅ Success
```
🚀 App.tsx: Performing environment check at startup
🔍 ENVIRONMENT SETUP CHECK
📦 All import.meta.env variables: 
   VITE_GEMINI_API_KEY: "AIzaSyCfO8sjUbSzj5ZKhyGkXosxNi8pZhkgq7k"
   MODE: "development"
   ...
🔑 VITE_GEMINI_API_KEY: ✅ PRESENT
✅ Environment check PASSED - API key is available
```

### ❌ Failure
```
🚀 App.tsx: Performing environment check at startup
🔍 ENVIRONMENT SETUP CHECK
📦 All import.meta.env variables: 
   MODE: "development"
   ...
   (no VITE_GEMINI_API_KEY)
🔑 VITE_GEMINI_API_KEY: ❌ MISSING
  ⚠️ API Key is not loaded!
  • Ensure .env.local exists at project root
  • Ensure VITE_GEMINI_API_KEY=your_key (no quotes)
  • Restart dev server after .env changes
⚠️ Environment check FAILED - API key not found
```

---

## 🔍 API Runtime Debugging (NEW)

### What Changed - Enhanced Logging
The API service now logs every step of the request/response cycle:

1. **Environment Check** - Verifies API key is loaded at runtime
2. **Request Building** - Shows exact endpoint and request body
3. **Response Status** - Logs HTTP status code and headers
4. **Response Body** - Full JSON response logged for inspection
5. **Response Extraction** - Debug info about how text was extracted
6. **Error Handling** - Complete error details if anything fails

### Console Output for Successful Request
```
🔐 RUNTIME ENVIRONMENT CHECK
ENV CHECK: AIzaSyCfO8sjUbSzj5ZKhyGkXosxNi8pZhkgq7k
✓ VITE_GEMINI_API_KEY exists: true
✅ API Key loaded successfully

📡 REST API REQUEST
🔗 ENDPOINT: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=[REDACTED_API_KEY]
📨 HTTP METHOD: POST
📋 REQUEST HEADERS: { 'Content-Type': 'application/json' }
📦 REQUEST BODY: { contents: [...], systemInstruction: {...} }

📊 REST API RESPONSE
STATUS: 200
FULL RESPONSE: { candidates: [{ content: { parts: [{ text: "..." }] } }] }

✅ RESPONSE TEXT EXTRACTED
✅ TEXT LENGTH: 245
```

### Console Output for Failed Request
```
🔐 RUNTIME ENVIRONMENT CHECK
ENV CHECK: undefined
❌ API Key is UNDEFINED - .env.local not loaded by Vite

❌ STRICT VALIDATION FAILED: API returned empty/undefined response
Response was: undefined

📊 Displaying error to user: API key not found. Restart the dev server.
```

### Common API Error Responses in Console

#### 401 Unauthorized
```
❌ HTTP 401 UNAUTHORIZED
❌ 401 UNAUTHORIZED: Invalid or missing API key
Error: Check VITE_GEMINI_API_KEY in .env.local
```
**Fix:** Verify API key in `.env.local` is valid and not expired

#### 403 Forbidden
```
❌ HTTP 403 FORBIDDEN
❌ 403 FORBIDDEN: API access denied
Error: Enable Generative Language API in Google Cloud Console
```
**Fix:** Go to Google Cloud Console and enable Generative Language API

#### 429 Rate Limited
```
❌ HTTP 429 RATE LIMITED
❌ 429 RATE LIMITED: Too many requests
```
**Fix:** Wait a few minutes before sending another request

#### 400 Bad Request
```
❌ HTTP 400 BAD REQUEST
❌ 400 BAD REQUEST: Invalid request format
Error: Check request body structure
```
**Fix:** Usually means API request format is wrong (should not happen)

### Enable Detailed Network Debugging

**In Browser DevTools:**
1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Send a message in the chat
4. Click on the `generativelanguage.googleapis.com` request
5. View:
   - **Headers** - Check Content-Type, URL, etc.
   - **Request** - See the JSON body sent
   - **Response** - See the JSON response from Google
   - **Timing** - See how long the request took

---

## 🆘 Still Not Working?

### Nuclear Option: Deep Clean
```bash
# 1. Delete node_modules and package-lock.json
rm -r node_modules
rm package-lock.json

# 2. Stop dev server (Ctrl+C)

# 3. Clear cache
npm cache clean --force

# 4. Reinstall
npm install

# 5. Restart dev server
npm run dev
```

### Last Resort: Check Vite Version
The fixes depend on Vite 6.2.0 or later. Check:
```bash
npm list vite
```

Should show: `vite@^6.2.0` or similar.

If older, update:
```bash
npm install vite@latest --save-dev
```

---

## ✅ Expected Result

After these fixes:
1. App loads without "API key not found" error
2. Console shows `✅ Environment check PASSED`
3. API calls work correctly
4. AI responses appear in chat
5. No UI or layout changes
