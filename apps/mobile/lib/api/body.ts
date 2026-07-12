/**
 * C-1 체형 분석 HTTP 클라이언트 (웹 API 재사용 — ADR-118 thin client)
 *
 * @module lib/api/body
 * @description
 *   웹의 POST /api/analyze/body 엔드포인트를 모바일에서 호출.
 *   기존 단독 체형 화면은 로컬 lib/gemini 경로(클라이언트 키 없음 → 항상 Mock 폴백,
 *   저장 실패)를 쓰고 있었다 — 실 AI·서버 저장·연령/생체 게이트가 전부 서버에 있으므로
 *   웹 API가 정본이다. 응답의 result는 웹 3타입(S/W/N) 체계.
 *
 * @see apps/web/app/api/analyze/body/route.ts (계약 정본)
 * @see docs/adr/ADR-118 (웹 API 정본 + 모바일 thin client)
 */

import { toUserMessage } from './error-text';

// ============================================
// 1. 타입 (웹 lib/mock/body-analysis.ts BODY_TYPES_3 체계와 동기화)
// ============================================

export type BodyType3 = 'S' | 'W' | 'N';

export interface BodyStyleRecommendation {
  item: string;
  reason: string;
}

export interface BodyAnalysisApiResult {
  /** 3타입 골격 진단 (S 스트레이트 / W 웨이브 / N 내추럴) */
  bodyType: BodyType3;
  bodyTypeLabel: string;
  bodyTypeDescription: string;
  strengths: string[];
  avoidStyles: string[];
  styleRecommendations: BodyStyleRecommendation[];
  insight?: string;
  /** 서버 계산 BMI (userInput 있을 때) — 없으면 클라이언트에서 파생 */
  bmi?: number;
  /** AI 폴백 여부 — true면 UI에 정직하게 표시 */
  usedMock: boolean;
}

export interface BodyAnalysisInput {
  imageBase64: string;
  height: number;
  weight: number;
}

// ============================================
// 2. 에러 클래스
// ============================================

export class BodyApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'BodyApiError';
    this.status = status;
    this.code = code;
  }
}

// ============================================
// 3. HTTP 클라이언트
// ============================================

/** 웹 에러 봉투(플랫/중첩) 양쪽에서 사용자 메시지·코드 추출 (integrated.ts와 동일 이유) */
function extractApiError(json: unknown): { message?: string; code?: string } {
  if (typeof json !== 'object' || json === null) return {};
  const obj = json as Record<string, unknown>;
  const err = obj.error;

  if (typeof err === 'string') {
    return { message: err, code: typeof obj.code === 'string' ? obj.code : undefined };
  }

  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    const message =
      (typeof e.userMessage === 'string' && e.userMessage) ||
      (typeof e.message === 'string' ? e.message : undefined);
    const code =
      (typeof e.code === 'string' && e.code) ||
      (typeof obj.code === 'string' ? obj.code : undefined);
    return { message: message || undefined, code: code || undefined };
  }

  return {
    message: typeof obj.message === 'string' ? obj.message : undefined,
    code: typeof obj.code === 'string' ? obj.code : undefined,
  };
}

const VALID_BODY_TYPES: readonly BodyType3[] = ['S', 'W', 'N'];

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function toRecommendations(value: unknown): BodyStyleRecommendation[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (v): v is { item: string; reason?: unknown } =>
        typeof v === 'object' && v !== null && typeof (v as { item?: unknown }).item === 'string'
    )
    .map((v) => ({
      item: v.item,
      reason: typeof v.reason === 'string' ? v.reason : '',
    }));
}

/**
 * 체형 분석 요청. 서버가 실 AI 분석 + body_analyses 저장 + 게이트(연령·생체 동의)까지 처리한다.
 *
 * @throws BodyApiError 인증(401)/게이트(403)/검증(400)/서버(5xx) 에러 — message는 사용자 대면 한국어
 */
export async function requestBodyAnalysis(
  input: BodyAnalysisInput,
  clerkToken: string,
  baseUrl?: string
): Promise<BodyAnalysisApiResult> {
  const url = baseUrl ?? process.env.EXPO_PUBLIC_YIROOM_API_URL;
  if (!url) {
    throw new BodyApiError(
      'API 서버 주소가 설정되지 않았어요. 앱 설정을 확인해주세요.',
      0,
      'CONFIG_ERROR'
    );
  }

  let response: Response;
  try {
    response = await fetch(`${url}/api/analyze/body`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify({
        imageBase64: input.imageBase64,
        userInput: { height: input.height, weight: input.weight },
      }),
    });
  } catch {
    throw new BodyApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    json = {};
  }

  const obj = (typeof json === 'object' && json !== null ? json : {}) as Record<string, unknown>;

  if (!response.ok || obj.success !== true) {
    const { message, code } = extractApiError(json);
    throw new BodyApiError(
      toUserMessage(message, '체형 분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.'),
      response.status,
      code
    );
  }

  const result = (
    typeof obj.result === 'object' && obj.result !== null ? obj.result : {}
  ) as Record<string, unknown>;

  const bodyType = VALID_BODY_TYPES.includes(result.bodyType as BodyType3)
    ? (result.bodyType as BodyType3)
    : null;

  // 서버 응답에 체형 타입이 없으면 화면을 지어내지 않고 실패로 처리한다 (정직성)
  if (!bodyType) {
    throw new BodyApiError(
      '분석 결과를 해석하지 못했어요. 잠시 후 다시 시도해주세요.',
      response.status,
      'PARSE_ERROR'
    );
  }

  return {
    bodyType,
    bodyTypeLabel:
      typeof result.bodyTypeLabel === 'string' && result.bodyTypeLabel
        ? result.bodyTypeLabel
        : bodyType,
    bodyTypeDescription:
      typeof result.bodyTypeDescription === 'string' ? result.bodyTypeDescription : '',
    strengths: toStringArray(result.strengths),
    avoidStyles: toStringArray(result.avoidStyles),
    styleRecommendations: toRecommendations(result.styleRecommendations),
    insight: typeof result.insight === 'string' ? result.insight : undefined,
    bmi: typeof result.bmi === 'number' && Number.isFinite(result.bmi) ? result.bmi : undefined,
    usedMock: obj.usedMock === true,
  };
}
