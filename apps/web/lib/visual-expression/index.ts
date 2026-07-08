/**
 * 표현 레이어(Visual Expression) 공개 API (ADR-113)
 *
 * AI 자연 보정 + 가상 착장. 이 모듈은 "표현"만 생산하며 분석 진실값
 * (lib/analysis, lib/gemini 분석 경로, app/api/analyze/**)에 쓰지 않고,
 * 그쪽에서 이 모듈을 import하지도 않는다(단방향 — 표현→진실 읽기만).
 *
 * @module lib/visual-expression
 * @see ADR-113 표현 레이어 분리
 */

export { beautifyForShare, BEAUTIFY_PROMPT, BEAUTIFY_MODEL } from './internal/beautify';
export { isTryonAvailable, generateTryon } from './internal/tryon';
export { checkAndConsumeBudget, DAILY_LIMIT } from './internal/budget';

export type {
  BeautifyInput,
  BeautifyOutput,
  TryonInput,
  TryonOutput,
  TryonCategory,
  BudgetResult,
} from './types';
