
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
  const apiKey = (import.meta.env.VITE_OPENROUTER_API_KEY || '').trim();

  console.group("🔐 RUNTIME ENVIRONMENT CHECK");
  console.log("✓ VITE_OPENROUTER_API_KEY exists:", !!apiKey);
  console.log("✓ VITE_OPENROUTER_API_KEY length:", apiKey ? apiKey.length : 0);
  console.groupEnd();

  if (!apiKey || apiKey === 'YOUR_KEY_HERE') {
    const errorMsg = "❌ CRITICAL: OpenRouter API Key not found. Ensure VITE_OPENROUTER_API_KEY is set in .env.local. Dev server must be restarted after .env changes.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  console.log("✅ OpenRouter API Key loaded successfully");
  console.log("✅ Key prefix:", apiKey.substring(0, 12) + "...");
  console.log("✅ Model:", AI_MODEL);

  // ===== BUILD OPENROUTER MESSAGES =====
  const systemPrompt = getSystemPrompt(language);

  // Convert history to OpenAI-style messages array
  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt }
  ];

  // Only send the last 4 messages for performance
  const recentHistory = history.slice(-4);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  }

  const requestBody = {
    model: AI_MODEL,
    messages: messages,
    temperature: 0.7,
    max_tokens: 1024,
  };

  console.group("📡 OPENROUTER API REQUEST");
  console.log("🔗 Endpoint: https://openrouter.ai/api/v1/chat/completions");
  console.log("📌 Model:", AI_MODEL);
  console.log("📦 Messages count:", messages.length);
  console.groupEnd();

  try {
    // ===== RETRY LOOP WITH EXPONENTIAL BACKOFF FOR 429 =====
    let attempt = 0;
    let response: Response | null = null;

    while (attempt <= MAX_RETRIES) {
      console.log(`🚀 Sending fetch request... (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);

      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin || "http://localhost:3000",
          "X-Title": "Panda AI by Alakh",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      // If rate limited (429) and we have retries left, wait and retry
      if (response.status === 429 && attempt < MAX_RETRIES) {
        const retryAfterHeader = response.headers.get('Retry-After');
        let waitMs: number;

        if (retryAfterHeader) {
          const retryAfterSeconds = parseInt(retryAfterHeader, 10);
          waitMs = isNaN(retryAfterSeconds) ? Math.pow(2, attempt + 1) * 1000 : retryAfterSeconds * 1000;
          console.warn(`⏳ Rate limited (429). Retry-After: ${retryAfterHeader}. Waiting ${waitMs}ms`);
        } else {
          waitMs = Math.pow(2, attempt + 1) * 1000;
          console.warn(`⏳ Rate limited (429). Exponential backoff: ${waitMs}ms`);
        }

        await new Promise(resolve => setTimeout(resolve, waitMs));
        attempt++;
        continue;
      }

      break;
    }

    if (!response) {
      throw new Error('❌ No response received from API after all retry attempts.');
    }

    console.group("📊 OPENROUTER API RESPONSE");
    console.log("STATUS:", response.status);
    console.log("STATUS TEXT:", response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("❌ HTTP ERROR RESPONSE BODY:", errorBody);
      console.groupEnd();

      let errorMessage = '';
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error?.message || errorJson.error?.code || errorBody;
      } catch {
        errorMessage = errorBody;
      }

      switch (response.status) {
        case 401:
          throw new Error(`❌ 401 UNAUTHORIZED: Invalid OpenRouter API key. Check VITE_OPENROUTER_API_KEY in .env.local. Error: ${errorMessage}`);
        case 403:
          throw new Error(`❌ 403 FORBIDDEN: API access denied. Error: ${errorMessage}`);
        case 429:
          throw new Error(`❌ 429 RATE LIMITED: Too many requests. All ${MAX_RETRIES} retries exhausted. Error: ${errorMessage}`);
        case 400:
          throw new Error(`❌ 400 BAD REQUEST: Invalid request format. Error: ${errorMessage}`);
        case 404:
          throw new Error(`❌ 404 NOT FOUND: Model not found. Current model: ${AI_MODEL}. Error: ${errorMessage}`);
        case 500:
          throw new Error(`❌ 500 SERVER ERROR: OpenRouter server error. Try again later. Error: ${errorMessage}`);
        default:
          throw new Error(`❌ HTTP ${response.status} ${response.statusText}: ${errorMessage}`);
      }
    }

    // Parse successful response (OpenAI-style)
    const data = await response.json();
    console.log("FULL RESPONSE:", JSON.stringify(data, null, 2));
    console.groupEnd();

    // Check for API-level errors in the response body
    if (data.error) {
      throw new Error(`❌ OpenRouter API Error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    // Extract text from OpenAI-style response
    const fullText = data.choices?.[0]?.message?.content || '';

    if (!fullText || fullText.trim() === '') {
      console.error("❌ EMPTY RESPONSE from OpenRouter");
      console.error("❌ Full response:", JSON.stringify(data, null, 2));
      throw new Error('API returned empty response. Cannot display message.');
    }

    console.log("✅ RESPONSE TEXT EXTRACTED");
    console.log("✅ TEXT LENGTH:", fullText.length);
    console.log("✅ TEXT PREVIEW:", fullText.substring(0, 100) + (fullText.length > 100 ? '...' : ''));

    onChunk(fullText);
    return fullText;
  } catch (error) {
    console.group("❌ OPENROUTER API ERROR");
    console.error("ERROR OBJECT:", error);
    if (error instanceof Error) {
      console.error("ERROR MESSAGE:", error.message);
      console.error("ERROR STACK:", error.stack);
    }
    console.groupEnd();
    throw error;
  }
};
