
export type Role = 'user' | 'assistant';
export type Language = 'en' | 'hi';

export interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: FileAttachment[];
  timestamp: number;
}

export interface FileAttachment {
  name: string;
  type: string;
  data: string; // Base64 for images/docs
  size: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface User {
  email: string;
  name: string;
  avatar?: string;
  password?: string;
  provider?: string;
}

export enum ThemeMode {
  DARK = 'dark',
  LIGHT = 'light'
}
