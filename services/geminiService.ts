
import { getSystemPrompt, DEFAULT_MODEL_ID } from "../constants";
import { Message, FileAttachment, Language } from "../types";
import * as pdfjs from 'pdfjs-dist';

// Helper: decode a data URL (base64) into a Uint8Array
const decodeBase64DataUrl = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.split(',')[1] || '';
  const raw = atob(base64);
  const uint8 = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    uint8[i] = raw.charCodeAt(i);
  }
  return uint8;
};

// Extract text from a PDF data URL using PDF.js (loaded dynamically)
const extractPdfText = async (pdfDataUrl: string): Promise<string> => {
  try {
    // Ensure the worker is loaded from a stable CDN. Version pinned to match a compatible pdfjs-dist release.
    (pdfjs as any).GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const uint8 = decodeBase64DataUrl(pdfDataUrl);
    const loadingTask = (pdfjs as any).getDocument({ data: uint8 });
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page: any = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((it: any) => (it.str || '')).join(' ');
      fullText += (i > 1 ? '\n\n' : '') + pageText;
    }

    return fullText.trim();
  } catch (err) {
    console.error('PDF text extraction failed:', err);
    return '';
  }
};

// ===== MOCK MODE: Set VITE_MOCK_MODE=true in .env.local to skip real API calls =====
const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

// ===== RETRY CONFIG FOR 429 RATE LIMITING =====
const MAX_RETRIES = 3;

export const chatWithGemini = async (
  history: Message[],
  onChunk: (text: string) => void,
  language: Language,
  attachments: FileAttachment[] = [],
  model: string = DEFAULT_MODEL_ID
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
  console.log("✅ Model:", model);

  // ===== BUILD OPENROUTER MESSAGES =====
  const systemPrompt = getSystemPrompt(language);

  // Convert history to OpenAI-style messages array
  // Note: `content` may be a string for text-only messages or an array for multimodal (text + image/pdf-extracted-text)
  const messages: { role: string; content: string | any[] }[] = [
    { role: "system", content: systemPrompt }
  ];

  // Only send the last 4 messages for performance
  const recentHistory = history.slice(-4);

  // Build messages. If attachments were provided with the last user message,
  // convert that message into a multimodal content array expected by the model.
  for (const msg of recentHistory) {
    if (msg.role === 'user' && attachments && attachments.length > 0) {
      const parts: any[] = [];

      // Always include the textual user input as a text part (or fallback prompt)
      const textPart = (msg.content && String(msg.content).trim())
        ? { type: 'text', text: String(msg.content) }
        : { type: 'text', text: 'Please analyze the attached file(s) and summarize the contents.' };

      parts.push(textPart);

      // For each attachment, create the appropriate part
      for (const att of attachments) {
        if (!att.type || att.type.startsWith('image/')) {
          // Image: keep data URL as image_url
          let imageDataUrl = att.data as string;
          if (typeof imageDataUrl === 'string' && !imageDataUrl.startsWith('data:')) {
            const mime = att.type || 'image/jpeg';
            imageDataUrl = `data:${mime};base64,${imageDataUrl}`;
          }

          // Image size guard: 4MB
          const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
          if (att.size && att.size > MAX_IMAGE_BYTES) {
            throw new Error('❌ Image too large: Please upload images smaller than 4MB.');
          }

          parts.push({ type: 'image_url', image_url: { url: imageDataUrl } });
        } else if (att.type === 'application/pdf') {
          // PDF: extract text client-side and send as a text part
          const pdfDataUrl = att.data as string;
          onChunk('[PDF] Extracting text from uploaded PDF...');
          const extracted = await extractPdfText(pdfDataUrl);
          if (extracted && extracted.trim().length > 0) {
            parts.push({ type: 'text', text: `Extracted PDF Content (${att.name || 'document'}):\n${extracted}` });
          } else {
            parts.push({ type: 'text', text: `Uploaded PDF (${att.name || 'document'}) could not be parsed. Please ensure the file is not corrupted.` });
          }
        } else if (att.type.startsWith('text/')) {
          // Plain text file: decode from data URL and include as text
          let dataStr = '';
          const d = att.data as string;
          if (typeof d === 'string') {
            if (d.startsWith('data:')) {
              const base64 = d.split(',')[1] || '';
              try {
                dataStr = atob(base64);
              } catch (err) {
                dataStr = base64;
              }
            } else {
              dataStr = d;
            }
          }
          parts.push({ type: 'text', text: `Uploaded file (${att.name || 'file'}):\n${dataStr}` });
        } else {
          // Fallback: include file name and mime type as a hint to the model
          parts.push({ type: 'text', text: `Uploaded file: ${att.name || 'unknown'} (MIME: ${att.type}).` });
        }
      }

      messages.push({ role: 'user', content: parts });
    } else {
      // Regular text-only message
      messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
    }
  }

  const requestBody = {
    model: model,
    messages: messages,
    temperature: 0.7,
    max_tokens: 1024,
  };

  console.group("📡 OPENROUTER API REQUEST");
  console.log("🔗 Endpoint: https://openrouter.ai/api/v1/chat/completions");
  console.log("📌 Model:", model);
  console.log("📦 Messages count:", messages.length);
  console.groupEnd();

  // ===== HELPER: Execute a single API call with retry logic for 429 =====
  const executeApiCall = async (useModel: string): Promise<string> => {
    const body = { ...requestBody, model: useModel };
    let attempt = 0;
    let response: Response | null = null;

    while (attempt <= MAX_RETRIES) {
      console.log(`🚀 Sending fetch request with model "${useModel}"... (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);

      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin || "http://localhost:3000",
          "X-Title": "Panda AI by Alakh",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
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
    console.log("MODEL USED:", useModel);

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

      // Attach status to error for fallback detection
      const err = new Error(`❌ HTTP ${response.status}: ${errorMessage}`);
      (err as any).status = response.status;
      throw err;
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

    return fullText;
  };

  // ===== MAIN CALL WITH AUTOMATIC FALLBACK =====
  try {
    let resultText: string;

    try {
      resultText = await executeApiCall(model);
    } catch (primaryError: any) {
      const status = primaryError?.status;
      const isModelError = status === 400 || status === 404 || status === 422;

      // If the selected model failed with a model-related error and it's not already the default, fallback
      if (isModelError && model !== DEFAULT_MODEL_ID) {
        console.warn(`⚠️ Model "${model}" failed (HTTP ${status}). Falling back to default: "${DEFAULT_MODEL_ID}"`);
        resultText = await executeApiCall(DEFAULT_MODEL_ID);
      } else {
        throw primaryError;
      }
    }

    onChunk(resultText);
    return resultText;
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
