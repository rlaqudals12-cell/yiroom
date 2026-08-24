/**
 * 숨김 자세 분석의 웹 API thin client.
 *
 * 출시 플래그가 닫혀 있어도 구현을 보존하되, 다시 열릴 때 앱 번들의 공개 키나
 * Google AI 직접 호출로 돌아가지 않도록 서버 경계를 정본으로 둔다.
 */
import { getApiBaseUrl } from './base-url';
import { toUserMessage } from './error-text';

const POSTURE_TYPES = [
  'normal',
  'forward_head',
  'rounded_shoulders',
  'swayback',
  'flat_back',
  'kyphosis',
] as const;

export type PostureType = (typeof POSTURE_TYPES)[number];

export interface PostureAnalysisApiResult {
  postureType: PostureType;
  issues: string[];
  exercises: Array<{ name: string; description: string; duration: string }>;
  /** 서버가 실제로 반환한 인사이트만 보존하며 새 문구를 만들지 않는다. */
  dailyTips: string[];
  usedMock: boolean;
  dbSaveFailed: boolean;
}

export class PostureApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'PostureApiError';
    this.status = status;
    this.code = code;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function parseExercises(value: unknown): PostureAnalysisApiResult['exercises'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const record = asRecord(item);
    if (typeof record.name !== 'string' || record.name.trim() === '') return [];
    return [
      {
        name: record.name,
        description: typeof record.description === 'string' ? record.description : '',
        duration: typeof record.duration === 'string' ? record.duration : '',
      },
    ];
  });
}

function extractApiError(value: unknown): { message?: unknown; code?: string } {
  const response = asRecord(value);
  const error = asRecord(response.error);
  return {
    message:
      (typeof error.userMessage === 'string' && error.userMessage) ||
      (typeof error.message === 'string' && error.message) ||
      response.message ||
      response.error,
    code:
      (typeof error.code === 'string' && error.code) ||
      (typeof response.code === 'string' ? response.code : undefined),
  };
}

export async function requestPostureAnalysis(
  frontImageBase64: string,
  clerkToken: string,
  baseUrl?: string
): Promise<PostureAnalysisApiResult> {
  const url = getApiBaseUrl(baseUrl);
  let response: Response;
  try {
    response = await fetch(`${url}/api/analyze/posture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify({ frontImageBase64 }),
    });
  } catch {
    throw new PostureApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  let json: unknown = {};
  try {
    json = await response.json();
  } catch {
    json = {};
  }
  const envelope = asRecord(json);
  if (!response.ok || envelope.success !== true) {
    const error = extractApiError(json);
    throw new PostureApiError(
      toUserMessage(error.message, '자세 분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.'),
      response.status,
      error.code
    );
  }

  const result = asRecord(envelope.result);
  const postureType = POSTURE_TYPES.includes(result.postureType as PostureType)
    ? (result.postureType as PostureType)
    : null;
  if (!postureType) {
    throw new PostureApiError(
      '자세 분석 결과를 해석하지 못했어요. 잠시 후 다시 시도해주세요.',
      response.status,
      'PARSE_ERROR'
    );
  }

  const insight = typeof result.insight === 'string' ? result.insight.trim() : '';
  const correlation = asRecord(result.bodyTypeCorrelation);
  const correlationNote =
    typeof correlation.correlationNote === 'string' ? correlation.correlationNote.trim() : '';

  return {
    postureType,
    issues: stringArray(result.concerns),
    exercises: parseExercises(result.stretchingRecommendations),
    // 실제 서버 문구만 중복 제거해 전달한다. 비어 있으면 정직한 빈 배열이다.
    dailyTips: Array.from(new Set([insight, correlationNote].filter(Boolean))),
    usedMock: envelope.usedMock === true,
    dbSaveFailed: envelope.dbSaveFailed === true,
  };
}
