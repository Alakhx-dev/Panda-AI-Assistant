
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { getSystemPrompt, AI_MODEL } from "../constants";
import { Message, FileAttachment, Language } from "../types";

export const chatWithGemini = async (
  history: Message[],
  onChunk: (text: string) => void,
  language: Language,
  attachments: FileAttachment[] = []
) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  
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

  const response = await ai.models.generateContentStream({
    model: AI_MODEL,
    contents: [
      ...contents.slice(0, -1),
      { role: 'user', parts }
    ],
    config: {
      systemInstruction: getSystemPrompt(language),
      temperature: 0.7,
      topP: 0.9,
    },
  });

  let fullText = '';
  for await (const chunk of response) {
    const text = chunk.text || '';
    fullText += text;
    onChunk(text);
  }

  return fullText;
};
