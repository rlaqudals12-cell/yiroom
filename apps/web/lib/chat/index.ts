/**
 * AI 채팅 시스템 통합 Export
 */

// Prompt
export {
  SYSTEM_PROMPT,
  buildContextPrompt,
  buildHistoryPrompt,
  buildFullPrompt,
  parseProductRecommendations,
} from './prompt';

// Context
export {
  generateMockContext,
  fetchUserContext,
  summarizeContext,
  hasValidContext,
  detectRelatedAnalysis,
} from './context';

// Gemini
export {
  generateChatResponse,
  generateMockResponse,
  isGeminiConfigured,
} from './gemini';

// Types re-export
export type {
  ChatMessage,
  ChatSession,
  ChatContext,
  ChatRequest,
  ChatResponse,
  ProductRecommendation,
  ChatMessageMetadata,
  SuggestedQuestion,
} from '@/types/chat';
