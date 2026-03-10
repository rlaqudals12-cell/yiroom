/**
 * AI 채팅 모듈 (Barrel Export)
 * 웹 /api/chat 엔드포인트의 thin client
 */

export type { ChatMessage, ChatSession, ChatResponse } from './types';
export { useChat } from './useChat';
export { sendChatMessage, getChatMockResponse, CHAT_QUICK_QUESTIONS } from './api';
export type { ChatQuestionCategory } from './api';
