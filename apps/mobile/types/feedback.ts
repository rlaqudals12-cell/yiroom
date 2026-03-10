/**
 * 피드백 시스템 타입 정의
 * Sprint D Day 9: 운영 기능
 */

// ============================================================
// 피드백 타입
// ============================================================

/** 피드백 유형 */
export type FeedbackType = 'bug' | 'suggestion' | 'question' | 'other';

/** 피드백 상태 */
export type FeedbackStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

/** 피드백 */
export interface Feedback {
  id: string;
  clerkUserId: string;
  type: FeedbackType;
  title: string;
  content: string;
  contactEmail: string | null;
  screenshotUrl: string | null;
  status: FeedbackStatus;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** 조인 시 포함 */
  userName?: string;
}

/** feedback 테이블 Row */
export interface FeedbackRow {
  id: string;
  clerk_user_id: string;
  type: string;
  title: string;
  content: string;
  contact_email: string | null;
  screenshot_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  /** 조인 시 포함 */
  users?: {
    full_name: string;
  };
}

// ============================================================
// 피드백 제출 데이터
// ============================================================

/** 피드백 제출 요청 */
export interface SubmitFeedbackRequest {
  type: FeedbackType;
  title: string;
  content: string;
  contactEmail?: string;
  screenshotUrl?: string;
}

/** 피드백 제출 결과 */
export interface SubmitFeedbackResult {
  success: boolean;
  feedback?: Feedback;
  error?: string;
}

// ============================================================
// UI 상수
// ============================================================

/** 피드백 유형별 이름 */
export const FEEDBACK_TYPE_NAMES: Record<FeedbackType, string> = {
  bug: '버그 신고',
  suggestion: '기능 제안',
  question: '문의',
  other: '기타',
};

/** 피드백 유형별 아이콘 */
export const FEEDBACK_TYPE_ICONS: Record<FeedbackType, string> = {
  bug: '🐛',
  suggestion: '💡',
  question: '❓',
  other: '📝',
};

/** 피드백 상태별 이름 */
export const FEEDBACK_STATUS_NAMES: Record<FeedbackStatus, string> = {
  pending: '대기 중',
  in_progress: '처리 중',
  resolved: '해결됨',
  closed: '종료',
};

/** 피드백 상태별 색상 */
export const FEEDBACK_STATUS_COLORS: Record<FeedbackStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700' },
  resolved: { bg: 'bg-green-100', text: 'text-green-700' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-700' },
};
