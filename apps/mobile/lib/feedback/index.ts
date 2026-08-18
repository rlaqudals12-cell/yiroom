/**
 * 사용자 피드백 모듈
 *
 * 피드백 제출, 조회, 필터링, 통계
 *
 * @module lib/feedback
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── 타입 ────────────────────────────────────────────

export type FeedbackType = 'bug' | 'suggestion' | 'question' | 'other';
export type FeedbackStatus = 'pending' | 'in_progress' | 'resolved';

export interface Feedback {
  id: string;
  userId: string;
  type: FeedbackType;
  title: string;
  content: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackStats {
  total: number;
  byType: Record<FeedbackType, number>;
  byStatus: Record<FeedbackStatus, number>;
}

export interface FeedbackValidation {
  isValid: boolean;
  errors: string[];
}

// ─── 상수 ─────────────────────────────────────────────

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  bug: '버그 신고',
  suggestion: '개선 제안',
  question: '질문',
  other: '기타',
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  pending: '대기 중',
  in_progress: '처리 중',
  resolved: '해결됨',
};

// ─── 검증 ─────────────────────────────────────────────

/**
 * 피드백 입력 유효성 검사
 */
export function validateFeedback(title: string, content: string, type: string): FeedbackValidation {
  const errors: string[] = [];

  if (!title || title.trim().length < 5) {
    errors.push('제목은 5글자 이상 입력해주세요');
  }

  if (!content || content.trim().length < 10) {
    errors.push('내용은 10글자 이상 입력해주세요');
  }

  const validTypes: FeedbackType[] = ['bug', 'suggestion', 'question', 'other'];
  if (!validTypes.includes(type as FeedbackType)) {
    errors.push('유효한 피드백 유형을 선택해주세요');
  }

  return { isValid: errors.length === 0, errors };
}

// ─── CRUD ─────────────────────────────────────────────

/**
 * 피드백 제출
 */
export async function submitFeedback(
  _supabase: SupabaseClient,
  _userId: string,
  _type: FeedbackType,
  _title: string,
  _content: string
): Promise<boolean> {
  // 이 레거시 함수는 호출자가 성공으로 오인하지 않도록 API 배선 전까지 명시 실패한다.
  return false;
}

/**
 * 내 피드백 조회
 */
export async function getMyFeedbacks(
  _supabase: SupabaseClient,
  _userId: string
): Promise<Feedback[]> {
  return [];
}

// ─── 필터/정렬 ───────────────────────────────────────

/**
 * 상태별 필터링
 */
export function filterFeedbackByStatus(feedbacks: Feedback[], status: FeedbackStatus): Feedback[] {
  return feedbacks.filter((f) => f.status === status);
}

/**
 * 유형별 필터링
 */
export function filterFeedbackByType(feedbacks: Feedback[], type: FeedbackType): Feedback[] {
  return feedbacks.filter((f) => f.type === type);
}

/**
 * 날짜순 정렬
 */
export function sortFeedbackByDate(feedbacks: Feedback[], ascending = false): Feedback[] {
  return [...feedbacks].sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return ascending ? diff : -diff;
  });
}

// ─── 통계 ─────────────────────────────────────────────

/**
 * 피드백 통계 집계
 */
export function getFeedbackStats(feedbacks: Feedback[]): FeedbackStats {
  const byType: Record<FeedbackType, number> = {
    bug: 0,
    suggestion: 0,
    question: 0,
    other: 0,
  };

  const byStatus: Record<FeedbackStatus, number> = {
    pending: 0,
    in_progress: 0,
    resolved: 0,
  };

  feedbacks.forEach((f) => {
    byType[f.type]++;
    byStatus[f.status]++;
  });

  return { total: feedbacks.length, byType, byStatus };
}
