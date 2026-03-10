/**
 * 분석 API 조합형 헬퍼 공유 타입
 *
 * @see ADR-085 Analysis API Composable Helpers
 */

import type { NextResponse } from 'next/server';
import type { BadgeAwardResult } from '@/types/gamification';

/** withAnalysisAuth 성공 결과 */
export interface AuthResult {
  userId: string;
}

// Rate Limit의 response가 NextResponse (제네릭 없음)이므로 넓은 타입 사용
/** withAnalysisAuth 반환 타입 — 성공 시 userId, 실패 시 에러 응답 */
export type AuthOrError = { ok: true; userId: string } | { ok: false; response: NextResponse };

/** withAIFallback 결과 */
export interface AIFallbackResult<T> {
  result: T;
  usedFallback: boolean;
}

/** withAIFallback 옵션 */
export interface AIFallbackOptions {
  /** Mock 모드 강제 (개발/테스트용) */
  forceMock?: boolean;
  /** 모듈 식별자 (로그용) */
  moduleId?: string;
}

/** saveWithFallback 결과 */
export interface DBSaveResult<T> {
  data: T;
  dbSaveFailed: boolean;
}

/** withGamification 결과 */
export interface GamificationResult {
  badgeResults: BadgeAwardResult[];
  xpAwarded: number;
}

/** 분석 뱃지 타입 */
export type AnalysisBadgeType =
  | 'personal_color'
  | 'skin'
  | 'body'
  | 'hair'
  | 'makeup'
  | 'oral_health'
  | 'workout'
  | 'posture'
  | 'food';
