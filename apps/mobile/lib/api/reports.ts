/** AI 생성 콘텐츠 신고 HTTP 클라이언트 — 저장 정본은 웹 `/api/reports`. */

import { getApiBaseUrl } from './base-url';
import { toUserMessage } from './error-text';

export type ContentReportTargetType = 'coach_message' | 'analysis_result' | 'twin_result';
export type ContentReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate_content'
  | 'misinformation'
  | 'other';

export interface SubmitContentReportInput {
  targetType: ContentReportTargetType;
  targetId: string;
  reason: ContentReportReason;
  description?: string;
  contentExcerpt?: string;
}

export interface ContentReportReceipt {
  reportId: string;
}

export class ContentReportApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ContentReportApiError';
    this.status = status;
    this.code = code;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

/** 앱은 신고 판단을 복제하지 않고 인증된 웹 API에 접수만 위임한다. */
export async function submitContentReport(
  input: SubmitContentReportInput,
  clerkToken: string,
  baseUrl?: string
): Promise<ContentReportReceipt> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl(baseUrl)}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify(input),
    });
  } catch {
    throw new ContentReportApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  const json = asRecord(await response.json().catch(() => null)) ?? {};
  const error = asRecord(json.error);
  if (!response.ok || json.success !== true) {
    throw new ContentReportApiError(
      toUserMessage(error?.userMessage, '신고를 접수하지 못했어요. 잠시 후 다시 시도해주세요.'),
      response.status,
      typeof error?.code === 'string' ? error.code : undefined
    );
  }

  const data = asRecord(json.data);
  if (!data || typeof data.reportId !== 'string' || data.reportId.length === 0) {
    throw new ContentReportApiError(
      '신고 접수 결과를 확인하지 못했어요. 잠시 후 다시 시도해주세요.',
      response.status,
      'INVALID_RESPONSE'
    );
  }

  return { reportId: data.reportId };
}
