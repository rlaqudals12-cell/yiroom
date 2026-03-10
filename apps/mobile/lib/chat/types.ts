/**
 * AI 채팅 타입 정의
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
}

export interface ChatResponse {
  message: string;
  suggestedQuestions?: string[];
}
