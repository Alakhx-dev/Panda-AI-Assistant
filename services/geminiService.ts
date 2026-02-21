
import { GoogleGenAI, Part } from "@google/genai";
import { getSystemPrompt, AI_MODEL } from "../constants";
import { Message, FileAttachment, Language } from "../types";

// ===== MOCK MODE: Set VITE_MOCK_MODE=true in .env.local to skip real API calls =====
const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

// ===== RETRY CONFIG FOR 429 RATE LIMITING =====
const MAX_RETRIES = 3;

export const chatWithGemini = async (
  history: Message[],
  onChunk: (text: string) => void,
  language: Language,
  attachments: FileAttachment[] = []
): Promise<string> => {
  // ===== MOCK MODE: Return hardcoded response for UI testing =====
  if (MOCK_MODE) {
    console.log("🧪 MOCK MODE ACTIVE — skipping real API call");
    const mockResponse = "🐼 [Mock Mode] Hi! I'm Panda AI running in mock mode. No API call was made. This is a test response to help you work on the UI without burning API quota. You can disable mock mode by removing VITE_MOCK_MODE from your .env.local file.";
    await new Promise(resolve => setTimeout(resolve, 500));
    onChunk(mockResponse);
    return mockResponse;
  }

  // ===== ENVIRONMENT VARIABLE VALIDATION =====
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // STRICT: Log API key status AT RUNTIME
  console.group("🔐 RUNTIME ENVIRONMENT CHECK");
  console.log("ENV CHECK:", import.meta.env.VITE_GEMINI_API_KEY);
  console.log("🔑 VITE_GEMINI_API_KEY value:", apiKey);
  console.log("✓ VITE_GEMINI_API_KEY exists:", !!apiKey);
  console.log("✓ VITE_GEMINI_API_KEY length:", apiKey ? apiKey.length : 0);
  console.log("✓ VITE_GEMINI_API_KEY type:", typeof apiKey);

  // Check for common issues
  if (apiKey === undefined) {
    console.error("❌ API Key is UNDEFINED - .env.local not loaded by Vite");
  } else if (apiKey === null) {
    console.error("❌ API Key is NULL");
  } else if (apiKey === '') {
    console.error("❌ API Key is EMPTY STRING - check .env.local value");
  }
  console.groupEnd();

  if (!apiKey) {
    const errorMsg = "❌ CRITICAL: API Key not found. Ensure VITE_GEMINI_API_KEY is set in .env.local. Dev server must be restarted after .env changes.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (apiKey.includes('"') || apiKey.includes("'")) {
    const errorMsg = "❌ CRITICAL: API Key has quotes. Remove quotes from .env.local file. Format should be: VITE_GEMINI_API_KEY=your_actual_api_key_without_quotes";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  console.log("✅ API Key loaded successfully");
  console.log("✅ API Key first 10 chars:", apiKey.substring(0, 10) + "...");
  console.log("✅ Model:", AI_MODEL);

  // Prepare contents for the API
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const lastMessage = history[history.length - 1];
  const parts: Part[] = [{ text: lastMessage.content }];

  attachments.forEach(file => {
    if (file.type.startsWith('image/')) {
      parts.push({
        inlineData: {
          mimeType: file.type,
          data: file.data.split(',')[1]
        }
      });
    } else {
      parts.push({ text: `\n[Attached File: ${file.name}]\n` });
    }
  });

  // Using REST API only (SDK fallback removed temporarily)
  console.log("📤 Using REST API only...");
  return await chatWithGeminiREST(history, onChunk, language, attachments, apiKey);
};

// ===== SDK IMPLEMENTATION (FALLBACK) =====
const chatWithGeminiSDK = async (
  history: Message[],
  onChunk: (text: string) => void,
  language: Language,
  apiKey: string,
  parts: Part[],
  contents: any[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });

  try {
    console.log("📤 Initiating SDK API request...");
    console.log("Model:", AI_MODEL);
    console.log("Language:", language);

    // Prepend system prompt to the last user message
    const systemPrompt = getSystemPrompt(language);
    const lastUserMessage = `${systemPrompt}\n\nUser message:\n${parts[0]?.text || ''}`;

    const response = await ai.models.generateContentStream({
      model: AI_MODEL,
      contents: [
        ...contents.slice(0, -1),
        { role: 'user', parts: [{ text: lastUserMessage }] }
      ],
      config: {
        temperature: 0.7,
        topP: 0.9,
      },
    });

    console.log("🔍 SDK Response object received, beginning streaming...");
    let fullText = '';
    let chunkCount = 0;

    for await (const chunk of response) {
      // Log full chunk structure for debugging (reduced logging)
      console.log("CHUNK TYPE:", typeof chunk, chunk?.constructor?.name);

      // Safely extract text from chunk - handle multiple possible structures
      let chunkText = '';

      if (chunk) {
        // Try direct text property
        if (typeof chunk.text === 'string' && chunk.text) {
          chunkText = chunk.text;
        }
        // Try candidates structure
        else if (chunk.candidates && Array.isArray(chunk.candidates) && chunk.candidates.length > 0) {
          const candidate = chunk.candidates[0];
          if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
            chunkText = candidate.content.parts
              .filter((p: any) => p.text)
              .map((p: any) => p.text)
              .join('');
          }
        }
        // Try function response (use any type to avoid TS error)
        else if ((chunk as any).functionResponse) {
          console.log("Function response received:", (chunk as any).functionResponse);
        }
      }

      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
        chunkCount++;
        console.log(`✓ Chunk ${chunkCount} processed, length:`, chunkText.length);
      }
    }

    console.log("✓ SDK API response streaming complete");
    console.log("📊 Total chunks:", chunkCount);
    console.log("📝 Full response text length:", fullText.length);

    // Validate response not empty
    if (!fullText || fullText.trim() === '') {
      console.warn("⚠️ WARNING: SDK Response text is empty after streaming");
      throw new Error('SDK API returned empty response.');
    }

    console.log("✅ SDK FULL RESPONSE TEXT:", fullText.substring(0, 100));
    return fullText;
  } catch (error) {
    console.error("❌ SDK API Error caught:");
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Non-Error exception:", JSON.stringify(error, null, 2));
    }
    throw error;
  }
};

// ===== REST API FALLBACK IMPLEMENTATION =====
export const chatWithGeminiREST = async (
  history: Message[],
  onChunk: (text: string) => void,
  language: Language,
  attachments: FileAttachment[],
  apiKey: string
) => {
  // Build request body - STRICT validation of structure for v1 API
  // System prompt is prepended directly to the user message (NOT in separate systemInstruction field)
  const contents = history.map((msg, index) => {
    // For the last user message, prepend the system prompt
    let messageText = msg.content;
    if (msg.role === 'user' && index === history.length - 1) {
      const systemPrompt = getSystemPrompt(language);
      messageText = `${systemPrompt}\n\nUser message:\n${msg.content}`;
    }

    return {
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: messageText }]
    };
  });

  const requestBody = {
    contents: contents,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
    }
  };

  // Construct URL - using v1beta as specified
  const baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
  const model = AI_MODEL;
  const endpoint = `${baseURL}/${model}:generateContent?key=${apiKey}`;

  // Log final configuration before request
  console.log("🔧 FINAL API CONFIGURATION:");
  console.log("📌 Model:", model);
  console.log("🌐 API Version: v1beta");
  console.log("🔗 Endpoint:", endpoint.replace(apiKey, '[REDACTED]'));

  console.group("📡 REST API REQUEST DEBUG");
  console.log("🔗 ENDPOINT (key redacted):", endpoint.replace(apiKey, '[REDACTED_API_KEY]'));
  console.log("📨 HTTP METHOD: POST");
  console.log("📋 REQUEST HEADERS:", {
    'Content-Type': 'application/json',
  });
  console.log("📦 REQUEST BODY STRUCTURE:");
  console.log("  ✓ Has 'contents':", !!requestBody.contents);
  console.log("  ✓ Has 'generationConfig':", !!requestBody.generationConfig);
  console.log("  ✓ Does NOT have 'systemInstruction':", !('systemInstruction' in requestBody));
  console.log("  ✓ Contents count:", requestBody.contents?.length);
  console.log("📦 FULL REQUEST BODY:");
  console.log(JSON.stringify(requestBody, null, 2));
  console.groupEnd();

  try {
    // ===== RETRY LOOP WITH EXPONENTIAL BACKOFF FOR 429 =====
    let attempt = 0;
    let response: Response | null = null;

    while (attempt <= MAX_RETRIES) {
      console.log(`🚀 Sending fetch request... (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // If rate limited (429) and we have retries left, wait and retry
      if (response.status === 429 && attempt < MAX_RETRIES) {
        // Respect the Retry-After header if present
        const retryAfterHeader = response.headers.get('Retry-After');
        let waitMs: number;

        if (retryAfterHeader) {
          // Retry-After can be seconds (integer) or an HTTP-date
          const retryAfterSeconds = parseInt(retryAfterHeader, 10);
          waitMs = isNaN(retryAfterSeconds) ? Math.pow(2, attempt + 1) * 1000 : retryAfterSeconds * 1000;
          console.warn(`⏳ Rate limited (429). Retry-After header: ${retryAfterHeader}. Waiting ${waitMs}ms before retry ${attempt + 1}/${MAX_RETRIES}`);
        } else {
          // Exponential backoff: 2s → 4s → 8s
          waitMs = Math.pow(2, attempt + 1) * 1000;
          console.warn(`⏳ Rate limited (429). No Retry-After header. Using exponential backoff: ${waitMs}ms before retry ${attempt + 1}/${MAX_RETRIES}`);
        }

        await new Promise(resolve => setTimeout(resolve, waitMs));
        attempt++;
        continue;
      }

      // Not a 429 or no retries left — break out of the loop
      break;
    }

    // At this point, response is guaranteed to be set
    if (!response) {
      throw new Error('❌ No response received from API after all retry attempts.');
    }

    console.group("📊 REST API RESPONSE");
    console.log("STATUS:", response.status);
    console.log("STATUS TEXT:", response.statusText);
    console.log("ATTEMPTS:", attempt + 1);
    console.log("HEADERS:", {
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      retryAfter: response.headers.get('Retry-After'),
    });

    // Handle specific HTTP error codes FIRST
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("❌ HTTP ERROR RESPONSE BODY:", errorBody);
      console.groupEnd();

      let errorMessage = '';
      try {
        const errorJson = JSON.parse(errorBody);
        console.error("❌ PARSED ERROR JSON:", errorJson);
        errorMessage = errorJson.error?.message || errorJson.error?.code || errorBody;
      } catch {
        errorMessage = errorBody;
      }

      // Specific error handling
      switch (response.status) {
        case 401:
          throw new Error(`❌ 401 UNAUTHORIZED: Invalid or missing API key. Ensure VITE_GEMINI_API_KEY is set in .env.local. Error: ${errorMessage}`);
        case 403:
          throw new Error(`❌ 403 FORBIDDEN: API access denied. Enable Generative Language API in Google Cloud Console. Error: ${errorMessage}`);
        case 429:
          throw new Error(`❌ 429 RATE LIMITED: Too many requests. All ${MAX_RETRIES} retries exhausted. Error: ${errorMessage}`);
        case 400:
          throw new Error(`❌ 400 BAD REQUEST: Invalid request format. Check request body. Ensure NO systemInstruction field. Error: ${errorMessage}`);
        case 404:
          throw new Error(`❌ 404 NOT FOUND: Model not found. Current model: ${model}. Error: ${errorMessage}`);
        case 500:
          throw new Error(`❌ 500 SERVER ERROR: Google API server error. Try again later. Error: ${errorMessage}`);
        default:
          throw new Error(`❌ HTTP ${response.status} ${response.statusText}: ${errorMessage}`);
      }
    }

    // Parse successful response
    const data = await response.json();
    console.log("FULL RESPONSE:", JSON.stringify(data, null, 2));
    console.groupEnd();

    // Extract text from response - STRICT validation
    let fullText = '';
    let extractionDebug = {
      hasCandidates: false,
      candidatesCount: 0,
      hasData: false,
      hasContent: false,
      parts: [] as any[]
    };

    if (data && data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      extractionDebug.hasCandidates = true;
      extractionDebug.candidatesCount = data.candidates.length;

      const candidate = data.candidates[0];
      if (candidate && candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
        extractionDebug.hasContent = true;
        extractionDebug.parts = candidate.content.parts;

        const textParts = candidate.content.parts
          .filter((part: any) => part.text && typeof part.text === 'string')
          .map((part: any) => part.text);

        fullText = textParts.join('');
        extractionDebug.hasData = true;
      }
    }

    console.log("📊 RESPONSE EXTRACTION DEBUG:", extractionDebug);

    // Check for safety blocking
    if (data.promptFeedback && data.promptFeedback.blockReason) {
      console.warn("⚠️ Content blocked by safety filter:", data.promptFeedback.blockReason);
      throw new Error(`Request blocked by safety filter: ${data.promptFeedback.blockReason}`);
    }

    // STRICT: Validate response is not empty
    if (!fullText || fullText.trim() === '') {
      console.error("❌ EMPTY RESPONSE ERROR");
      console.error("❌ Extracted fullText:", fullText);
      console.error("❌ Extracted fullText (trimmed):", fullText?.trim());
      console.error("❌ Full response object was:", JSON.stringify(data, null, 2));
      throw new Error('API returned empty response. Cannot display message.');
    }

    console.log("✅ RESPONSE TEXT EXTRACTED");
    console.log("✅ TEXT LENGTH:", fullText.length);
    console.log("✅ TEXT PREVIEW:", fullText.substring(0, 100) + (fullText.length > 100 ? '...' : ''));

    onChunk(fullText);
    return fullText;
  } catch (error) {
    console.group("❌ REST API ERROR");
    console.error("ERROR OBJECT:", error);
    if (error instanceof Error) {
      console.error("ERROR MESSAGE:", error.message);
      console.error("ERROR STACK:", error.stack);
    } else {
      console.error("NON-ERROR EXCEPTION:", JSON.stringify(error, null, 2));
    }
    console.groupEnd();
    throw error;
  }
};
