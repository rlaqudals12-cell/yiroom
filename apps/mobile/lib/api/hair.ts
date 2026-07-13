/**
 * H-1 헤어 분석 HTTP 클라이언트 (웹 API 재사용 — ADR-118 thin client)
 *
 * @module lib/api/hair
 * @description
 *   웹의 POST /api/analyze/hair 엔드포인트를 모바일에서 호출.
 *   기존 단독 화면은 로컬 lib/gemini 경로(클라이언트 키 없음 → 항상 Mock 폴백,
 *   저장 실패)를 썼다 — 실 AI·서버 저장·연령/생체 게이트가 전부 서버에 있으므로
 *   웹 API가 정본이다.
 *
 * @see apps/web/app/api/analyze/hair/route.ts (계약 정본)
 * @see apps/web/lib/mock/hair-analysis.ts (응답 필드·concern id 정본)
 * @see docs/adr/ADR-118 (웹 API 정본 + 모바일 thin client)
 */
import { toUserMessage } from './error-text';

// ============================================
// 1. 타입 (모바일 결과 화면이 소비하는 형태)
// ============================================

export interface HairAnalysisApiResult {
  /** 모발 형태 */
  texture: 'straight' | 'wavy' | 'curly' | 'coily';
  /** 모발 굵기 */
  thickness: 'fine' | 'medium' | 'thick';
  /** 두피 상태 */
  scalpCondition: 'dry' | 'oily' | 'normal' | 'sensitive';
  /** 손상도 0-100 (높을수록 손상 — 서버 'damage' 지표는 건강도이므로 반전) */
  damageLevel: number;
  scores: {
    shine: number;
    elasticity: number;
    density: number;
    scalpHealth: number;
  };
  /** 주요 고민 (한국어 라벨 — getScalpConcernNotice 키워드 매칭 대상) */
  mainConcerns: string[];
  /** 추천 케어 루틴 (서버 careTips) */
  careRoutine: string[];
  /** 추천 헤어스타일 — 서버가 제공하지 않으면 빈 배열(지어내지 않음) */
  recommendedStyles: string[];
  /** AI 폴백 여부 — true면 UI에 정직하게 표시 */
  usedMock: boolean;
}

export interface HairAnalysisInput {
  imageBase64: string;
}

// ============================================
// 2. 에러 클래스
// ============================================

export class HairApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'HairApiError';
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

// 웹 concern id → 모바일 한국어 라벨 (apps/web/lib/mock/hair-analysis.ts HAIR_CONCERNS 정본)
const HAIR_CONCERN_LABELS: Record<string, string> = {
  hairloss: '탈모',
  dandruff: '비듬',
  frizz: '푸석함',
  damage: '손상',
  'oily-scalp': '지성 두피',
  'dry-scalp': '건조 두피',
  'split-ends': '끝갈라짐',
  'lack-volume': '볼륨 부족',
};

function firstEnum<T extends string>(value: unknown, valid: readonly T[], fallback: T): T {
  return valid.includes(value as T) ? (value as T) : fallback;
}

/** 웹 result.metrics는 [{ id, value }] 배열 — id로 값 조회, 없으면 중립값 50 */
function metricValue(metrics: unknown, id: string): number {
  if (!Array.isArray(metrics)) return 50;
  const items = metrics as { id?: unknown; value?: unknown }[];
  const found = items.find((m) => m && typeof m === 'object' && m.id === id);
  return found && typeof found.value === 'number' ? found.value : 50;
}

function toConcernLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((c): c is string => typeof c === 'string')
    .map((c) => HAIR_CONCERN_LABELS[c] ?? c);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

// ============================================
// 4. HTTP 클라이언트
// ============================================

/**
 * 헤어 분석 요청. 서버가 실 AI 분석 + hair_analyses 저장 + 게이트(연령·생체 동의)까지 처리한다.
 *
 * @throws HairApiError 인증(401)/게이트(403)/검증(400)/서버(5xx)/네트워크
 */
export async function requestHairAnalysis(
  input: HairAnalysisInput,
  clerkToken: string,
  baseUrl?: string
): Promise<HairAnalysisApiResult> {
  const url = baseUrl ?? process.env.EXPO_PUBLIC_YIROOM_API_URL;
  if (!url) {
    throw new HairApiError(
      'API 서버 주소가 설정되지 않았어요. 앱 설정을 확인해주세요.',
      0,
      'CONFIG_ERROR'
    );
  }

  let response: Response;
  try {
    response = await fetch(`${url}/api/analyze/hair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify({ imageBase64: input.imageBase64 }),
    });
  } catch {
    throw new HairApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
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
    throw new HairApiError(
      toUserMessage(message, '헤어 분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.'),
      response.status,
      code
    );
  }

  const result = (
    typeof obj.result === 'object' && obj.result !== null ? obj.result : {}
  ) as Record<string, unknown>;

  const metrics = result.metrics;

  // 서버 'damage' 지표는 "높을수록 건강"(100-손상). 화면 damageLevel은 손상도이므로 반전.
  const damageHealth = metricValue(metrics, 'damage');

  return {
    texture: firstEnum(
      result.hairType,
      ['straight', 'wavy', 'curly', 'coily'] as const,
      'straight'
    ),
    thickness: firstEnum(result.hairThickness, ['fine', 'medium', 'thick'] as const, 'medium'),
    scalpCondition: firstEnum(
      result.scalpType,
      ['dry', 'oily', 'normal', 'sensitive'] as const,
      'normal'
    ),
    damageLevel: Math.max(0, Math.min(100, 100 - damageHealth)),
    scores: {
      shine: metricValue(metrics, 'shine'),
      elasticity: metricValue(metrics, 'elasticity'),
      density: metricValue(metrics, 'density'),
      scalpHealth: metricValue(metrics, 'scalp'),
    },
    mainConcerns: toConcernLabels(result.concerns),
    careRoutine: toStringArray(result.careTips),
    recommendedStyles: [],
    usedMock: obj.usedMock === true,
  };
}
