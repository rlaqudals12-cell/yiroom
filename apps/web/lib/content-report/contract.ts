import { z } from 'zod';

/**
 * AI 생성물 신고 대상.
 *
 * 소셜 신고의 5개 사유는 재사용하되, 대상은 피드 게시물 FK가 아닌 실제 AI 표면을
 * 식별한다. 클라이언트가 임의의 대상 종류를 만들어 운영 큐를 오염시키지 못하게
 * 허용 목록을 계약으로 고정한다.
 */
export const CONTENT_REPORT_TARGET_TYPES = [
  'coach_message',
  'analysis_result',
  'twin_result',
] as const;

export const CONTENT_REPORT_REASONS = [
  'spam',
  'harassment',
  'inappropriate_content',
  'misinformation',
  'other',
] as const;

export const contentReportRequestSchema = z
  .object({
    targetType: z.enum(CONTENT_REPORT_TARGET_TYPES),
    targetId: z.string().trim().min(1).max(255),
    reason: z.enum(CONTENT_REPORT_REASONS),
    description: z.string().trim().max(500).optional(),
    contentExcerpt: z.string().trim().max(2000).optional(),
  })
  .strict();

export type ContentReportTargetType = (typeof CONTENT_REPORT_TARGET_TYPES)[number];
export type ContentReportReason = (typeof CONTENT_REPORT_REASONS)[number];
export type ContentReportRequest = z.infer<typeof contentReportRequestSchema>;

export const CONTENT_REPORT_REASON_LABELS: Record<ContentReportReason, string> = {
  spam: '스팸/광고',
  harassment: '괴롭힘/욕설',
  inappropriate_content: '부적절한 콘텐츠',
  misinformation: '잘못된 정보',
  other: '기타',
};

export const CONTENT_REPORT_TARGET_LABELS: Record<ContentReportTargetType, string> = {
  coach_message: '코치 메시지',
  analysis_result: '분석 결과',
  twin_result: 'AI 아바타 결과',
};
