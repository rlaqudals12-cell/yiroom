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

// ─── DB 변환 ─────────────────────────────────────────

interface FeedbackRow {
  id: string;
  clerk_user_id: string;
  type: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function toFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    userId: row.clerk_user_id,
    type: row.type as FeedbackType,
    title: row.title,
    content: row.content,
    status: row.status as FeedbackStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── 검증 ─────────────────────────────────────────────

/**
 * 피드백 입력 유효성 검사
 */
export function validateFeedback(
  title: string,
  content: string,
  type: string
): FeedbackValidation {
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
  supabase: SupabaseClient,
  userId: string,
  type: FeedbackType,
  title: string,
  content: string
): Promise<boolean> {
  const { error } = await supabase.from('feedbacks').insert({
    clerk_user_id: userId,
    type,
    title: title.trim(),
    content: content.trim(),
    status: 'pending',
  });

  return !error;
}

/**
 * 내 피드백 조회
 */
export async function getMyFeedbacks(
  supabase: SupabaseClient,
  userId: string
): Promise<Feedback[]> {
  const { data } = await supabase
    .from('feedbacks')
    .select('id, clerk_user_id, type, title, content, status, created_at, updated_at')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false });

  return (data ?? []).map((row) => toFeedback(row as FeedbackRow));
}

// ─── 필터/정렬 ───────────────────────────────────────

/**
 * 상태별 필터링
 */
export function filterFeedbackByStatus(
  feedbacks: Feedback[],
  status: FeedbackStatus
): Feedback[] {
  return feedbacks.filter((f) => f.status === status);
}

/**
 * 유형별 필터링
 */
export function filterFeedbackByType(
  feedbacks: Feedback[],
  type: FeedbackType
): Feedback[] {
  return feedbacks.filter((f) => f.type === type);
}

/**
 * 날짜순 정렬
 */
export function sortFeedbackByDate(
  feedbacks: Feedback[],
  ascending = false
): Feedback[] {
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
