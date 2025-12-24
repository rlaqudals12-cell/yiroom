/**
 * 피드백 시스템 라이브러리
 * Sprint D Day 9: 운영 기능
 */

import type {
  Feedback,
  FeedbackRow,
  FeedbackType,
  FeedbackStatus,
} from '@/types/feedback';

// ============================================================
// 변환 함수
// ============================================================

/**
 * DB Row를 Feedback으로 변환
 */
export function toFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    type: row.type as FeedbackType,
    title: row.title,
    content: row.content,
    contactEmail: row.contact_email,
    screenshotUrl: row.screenshot_url,
    status: row.status as FeedbackStatus,
    adminNotes: row.admin_notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    userName: row.users?.full_name,
  };
}

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 피드백 필터링 (상태별)
 */
export function filterFeedbackByStatus(
  feedbacks: Feedback[],
  status: FeedbackStatus | 'all'
): Feedback[] {
  if (status === 'all') return feedbacks;
  return feedbacks.filter((f) => f.status === status);
}

/**
 * 피드백 필터링 (유형별)
 */
export function filterFeedbackByType(
  feedbacks: Feedback[],
  type: FeedbackType | 'all'
): Feedback[] {
  if (type === 'all') return feedbacks;
  return feedbacks.filter((f) => f.type === type);
}

/**
 * 피드백 정렬 (최신순)
 */
export function sortFeedbackByDate(feedbacks: Feedback[]): Feedback[] {
  return [...feedbacks].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

/**
 * 피드백 통계
 */
export function getFeedbackStats(feedbacks: Feedback[]): {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  byType: Record<FeedbackType, number>;
} {
  const byType: Record<FeedbackType, number> = {
    bug: 0,
    suggestion: 0,
    question: 0,
    other: 0,
  };

  let pending = 0;
  let inProgress = 0;
  let resolved = 0;

  for (const feedback of feedbacks) {
    byType[feedback.type]++;

    switch (feedback.status) {
      case 'pending':
        pending++;
        break;
      case 'in_progress':
        inProgress++;
        break;
      case 'resolved':
        resolved++;
        break;
    }
  }

  return {
    total: feedbacks.length,
    pending,
    inProgress,
    resolved,
    byType,
  };
}

/**
 * 피드백 유효성 검사
 */
export function validateFeedback(data: {
  type?: FeedbackType;
  title?: string;
  content?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.type) {
    errors.push('피드백 유형을 선택해주세요.');
  }

  if (!data.title || data.title.trim().length < 5) {
    errors.push('제목은 5자 이상 입력해주세요.');
  }

  if (!data.content || data.content.trim().length < 10) {
    errors.push('내용은 10자 이상 입력해주세요.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// 타입 re-export
// ============================================================

export type {
  Feedback,
  FeedbackRow,
  FeedbackType,
  FeedbackStatus,
  SubmitFeedbackRequest,
  SubmitFeedbackResult,
} from '@/types/feedback';

export {
  FEEDBACK_TYPE_NAMES,
  FEEDBACK_TYPE_ICONS,
  FEEDBACK_STATUS_NAMES,
  FEEDBACK_STATUS_COLORS,
} from '@/types/feedback';
