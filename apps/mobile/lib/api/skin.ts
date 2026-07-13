/**
 * S-1 피부 분석 HTTP 클라이언트 (웹 API 재사용 — ADR-118 thin client)
 *
 * @module lib/api/skin
 * @description
 *   웹의 POST /api/analyze/skin 엔드포인트를 모바일에서 호출.
 *   기존 단독 피부 화면은 로컬 lib/gemini 경로(클라이언트에 Gemini 키 없음 → 항상 Mock
 *   폴백 + 클라이언트 DB 저장은 스키마 드리프트로 조용히 실패)를 썼다. 실 AI 분석·서버
 *   저장·연령/생체 동의 게이트가 전부 서버에 있으므로 웹 API가 정본이다.
 *
 * @see apps/web/app/api/analyze/skin/route.ts (계약 정본)
 * @see docs/adr/ADR-118 (웹 API 정본 + 모바일 thin client)
 */
import type { SkinType } from '@yiroom/shared';

import type { SkinMetrics } from '@/lib/skincare';

import { toUserMessage } from './error-text';

// ============================================
// 1. 타입
// ============================================

export interface SkinAnalysisApiResult {
  /** 피부 타입 (건성/지성/복합성/민감성/중성) */
  skinType: SkinType;
  /** 6+1축 지표 (0-100). 서버 응답에 없는 축은 중립값 50으로 채움 */
  metrics: SkinMetrics;
  /** 서버 종합 점수 (0-100) — 화면은 자체 가중 평균을 쓰므로 참고용 */
  overallScore?: number;
  /** AI 폴백 여부 — true면 UI에 정직하게 표시 */
  usedMock: boolean;
  /** 방금 저장된 분석 row id — 이전 분석 대비 변화량 계산 시 자기 자신 제외용 */
  analysisId?: string;
}

export interface SkinAnalysisInput {
  imageBase64: string;
}

// ============================================
// 2. 에러 클래스
// ============================================

export class SkinApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'SkinApiError';
    this.status = status;
    this.code = code;
  }
}

// ============================================
// 3. 매핑 헬퍼
// ============================================

/** 웹 에러 봉투(플랫/중첩) 양쪽에서 사용자 메시지·코드 추출 (body.ts와 동일 이유) */
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

const VALID_SKIN_TYPES: readonly SkinType[] = ['dry', 'oily', 'combination', 'sensitive', 'normal'];

function toSkinType(value: unknown): SkinType | null {
  return VALID_SKIN_TYPES.includes(value as SkinType) ? (value as SkinType) : null;
}

/** 웹 result.metrics는 [{ id, value }] 배열 — id로 값 조회, 없으면 중립값 50 */
function metricValue(metrics: unknown, id: string, fallbackId?: string): number {
  if (!Array.isArray(metrics)) return 50;
  const items = metrics as { id?: unknown; value?: unknown }[];
  const pick = (targetId: string): number | null => {
    const found = items.find((m) => m && typeof m === 'object' && m.id === targetId);
    return found && typeof found.value === 'number' ? found.value : null;
  };
  const primary = pick(id);
  if (primary !== null) return primary;
  if (fallbackId) {
    const fb = pick(fallbackId);
    if (fb !== null) return fb;
  }
  return 50;
}

// ============================================
// 4. HTTP 클라이언트
// ============================================

/**
 * 피부 분석 요청. 서버가 실 AI 분석 + skin_analyses 저장 + 게이트(연령·생체 동의)까지 처리한다.
 *
 * @throws SkinApiError 인증(401)/게이트(403)/검증(400)/서버(5xx)/네트워크 — message는 사용자 대면 한국어
 */
export async function requestSkinAnalysis(
  input: SkinAnalysisInput,
  clerkToken: string,
  baseUrl?: string
): Promise<SkinAnalysisApiResult> {
  const url = baseUrl ?? process.env.EXPO_PUBLIC_YIROOM_API_URL;
  if (!url) {
    throw new SkinApiError(
      'API 서버 주소가 설정되지 않았어요. 앱 설정을 확인해주세요.',
      0,
      'CONFIG_ERROR'
    );
  }

  let response: Response;
  try {
    response = await fetch(`${url}/api/analyze/skin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify({ imageBase64: input.imageBase64 }),
    });
  } catch {
    throw new SkinApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
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
    throw new SkinApiError(
      toUserMessage(message, '피부 분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.'),
      response.status,
      code
    );
  }

  const result = (
    typeof obj.result === 'object' && obj.result !== null ? obj.result : {}
  ) as Record<string, unknown>;
  const data = (typeof obj.data === 'object' && obj.data !== null ? obj.data : {}) as Record<
    string,
    unknown
  >;

  // 서버가 검증한 피부 타입(data.skin_type) 우선, 없으면 AI 원본(result.skinType)
  const skinType = toSkinType(data.skin_type) ?? toSkinType(result.skinType);

  // 피부 타입을 해석하지 못하면 화면을 지어내지 않고 실패로 처리한다 (정직성)
  if (!skinType) {
    throw new SkinApiError(
      '분석 결과를 해석하지 못했어요. 잠시 후 다시 시도해주세요.',
      response.status,
      'PARSE_ERROR'
    );
  }

  const metrics = result.metrics;

  return {
    skinType,
    metrics: {
      moisture: metricValue(metrics, 'hydration'),
      oil: metricValue(metrics, 'oil'),
      pores: metricValue(metrics, 'pores'),
      wrinkles: metricValue(metrics, 'wrinkles'),
      pigmentation: metricValue(metrics, 'pigmentation'),
      sensitivity: metricValue(metrics, 'sensitivity', 'trouble'),
      elasticity: metricValue(metrics, 'elasticity'),
    },
    overallScore: typeof result.overallScore === 'number' ? result.overallScore : undefined,
    usedMock: obj.usedMock === true,
    analysisId: typeof data.id === 'string' ? data.id : undefined,
  };
}
