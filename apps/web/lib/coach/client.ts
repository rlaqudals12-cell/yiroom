/**
 * AI 웰니스 코치 모듈 - 클라이언트 전용 exports
 * @description 클라이언트 컴포넌트에서 사용 가능한 타입과 유틸리티
 */

// 공유 타입과 유틸리티
export type { UserContext, SkinScores } from './types';
export { summarizeContext } from './types';

// 프롬프트 상수 (클라이언트에서 사용 가능)
export { QUICK_QUESTIONS, QUICK_QUESTIONS_BY_CATEGORY, getQuestionHint } from './prompts';

// 채팅 타입 (클라이언트에서 사용 가능)
export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface CoachChatResponse {
  message: string;
  suggestedQuestions?: string[];
}
