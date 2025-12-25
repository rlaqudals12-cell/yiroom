/**
 * AI 웰니스 코치 모듈
 * @description 맞춤형 웰니스 조언을 위한 AI 코치 기능
 */

export { getUserContext, summarizeContext } from './context';
export type { UserContext } from './context';

export { buildCoachSystemPrompt, getQuestionHint, QUICK_QUESTIONS, QUICK_QUESTIONS_BY_CATEGORY } from './prompts';

export { generateCoachResponse, generateCoachResponseStream } from './chat';
export type { CoachMessage, CoachChatRequest, CoachChatResponse } from './chat';
