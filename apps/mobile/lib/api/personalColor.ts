/**
 * PC-1 퍼스널 컬러 분석 HTTP 클라이언트 (웹 API 재사용 — ADR-118 thin client)
 *
 * @module lib/api/personalColor
 * @description
 *   웹의 POST /api/analyze/personal-color 엔드포인트를 모바일에서 호출.
 *   기존 단독 화면은 로컬 lib/gemini 경로(클라이언트 키 없음 → 항상 Mock 폴백,
 *   저장 실패)를 썼다 — 실 AI·서버 저장·연령/생체 게이트가 전부 서버에 있으므로
 *   웹 API가 정본이다.
 *
 * @see apps/web/app/api/analyze/personal-color/route.ts (계약 정본)
 * @see docs/adr/ADR-118 (웹 API 정본 + 모바일 thin client)
 */
import type { PersonalColorSeason } from '@yiroom/shared';

import { trackAnalysisComplete, trackAnalysisStart } from '../analytics/tracker';
import { getApiBaseUrl } from './base-url';
import { toUserMessage } from './error-text';

// ============================================
// 1. 타입
// ============================================

export interface PersonalColorApiResult {
  /** 4계절 진단 (Spring/Summer/Autumn/Winter) */
  season: PersonalColorSeason;
  /** 서버가 판정한 12톤 서브타입. 구 결과에는 없을 수 있다. */
  seasonSubtype: PersonalColorSeasonSubtype | null;
  /** 판정 신뢰도 0~1 (서버는 0~100로 주므로 정규화) */
  confidence: number;
  /** 시즌 설명 (없으면 빈 문자열 — 화면에서 정적 설명으로 폴백) */
  description: string;
  /** 서버가 사진에서 판정한 베스트 컬러 hex 목록 */
  bestColors: string[];
  /** 서버가 사진에서 판정한 피해야 할 컬러 hex 목록 */
  worstColors: string[];
  /** AI 폴백 여부 — true면 UI에 정직하게 표시 */
  usedMock: boolean;
  /** 분석은 반환됐지만 서버 기록 저장이 실패했는지 */
  dbSaveFailed: boolean;
}

export type PersonalColorSeasonSubtype = 'bright' | 'light' | 'true' | 'mute' | 'deep';

export interface PersonalColorAnalysisInput {
  imageBase64: string;
}

// ============================================
// 2. 에러 클래스
// ============================================

export class PersonalColorApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'PersonalColorApiError';
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

const VALID_SEASONS: readonly PersonalColorSeason[] = ['Spring', 'Summer', 'Autumn', 'Winter'];
const VALID_SUBTYPES: readonly PersonalColorSeasonSubtype[] = [
  'bright',
  'light',
  'true',
  'mute',
  'deep',
];
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const SUBTYPE_LABELS: Record<PersonalColorSeasonSubtype, string> = {
  bright: '브라이트',
  light: '라이트',
  true: '트루',
  mute: '뮤트',
  deep: '딥',
};

/** 웹은 season을 'Spring'(data) 또는 'spring'(result.seasonType) 두 형태로 준다 — 대소문자 정규화 */
function toSeason(value: unknown): PersonalColorSeason | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return VALID_SEASONS.includes(normalized as PersonalColorSeason)
    ? (normalized as PersonalColorSeason)
    : null;
}

/** API result 객체형과 DB string[] 양쪽을 모바일 UI용 hex 배열로 정규화한다. */
export function normalizePersonalColorHexes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const colors = value
    .map((item): string | null => {
      if (typeof item === 'string') return item;
      if (typeof item !== 'object' || item === null) return null;
      const color = item as Record<string, unknown>;
      if (typeof color.hex === 'string') return color.hex;
      return typeof color.color === 'string' ? color.color : null;
    })
    .map((color) => color?.trim() ?? null)
    .filter((color): color is string => color !== null && HEX_COLOR_PATTERN.test(color));

  return Array.from(new Set(colors));
}

/** 서버/DB의 12톤 표식을 한 계약으로 정규화한다. */
export function normalizePersonalColorSubtype(value: unknown): PersonalColorSeasonSubtype | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  const canonical = normalized === 'muted' ? 'mute' : normalized;
  return VALID_SUBTYPES.includes(canonical as PersonalColorSeasonSubtype)
    ? (canonical as PersonalColorSeasonSubtype)
    : null;
}

export function getPersonalColorSubtypeLabel(subtype: PersonalColorSeasonSubtype): string {
  return SUBTYPE_LABELS[subtype];
}

/** 신뢰도 정규화: 서버는 0~100 스케일, 화면은 0~1을 기대 (×100로 표시) */
function normalizeConfidence(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0.85;
  const c = value > 1 ? value / 100 : value;
  return Math.min(1, Math.max(0, c));
}

// ============================================
// 4. HTTP 클라이언트
// ============================================

/**
 * 퍼스널 컬러 분석 요청. 서버가 실 AI 분석 + personal_color_assessments 저장 +
 * 게이트(연령·생체 동의)까지 처리한다.
 *
 * @throws PersonalColorApiError 인증(401)/게이트(403)/검증(400)/서버(5xx)/네트워크
 */
export async function requestPersonalColorAnalysis(
  input: PersonalColorAnalysisInput,
  clerkToken: string,
  baseUrl?: string
): Promise<PersonalColorApiResult> {
  const url = getApiBaseUrl(baseUrl);
  void trackAnalysisStart('personal-color', 'full', clerkToken);

  let response: Response;
  try {
    response = await fetch(`${url}/api/analyze/personal-color`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify({ imageBase64: input.imageBase64 }),
    });
  } catch {
    throw new PersonalColorApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
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
    throw new PersonalColorApiError(
      toUserMessage(message, '퍼스널 컬러 분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.'),
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
  const imageAnalysis =
    typeof data.image_analysis === 'object' && data.image_analysis !== null
      ? (data.image_analysis as Record<string, unknown>)
      : {};

  // data.season('Spring') 우선, 없으면 result.seasonType('spring')
  const season = toSeason(data.season) ?? toSeason(result.seasonType);

  // 시즌을 해석하지 못하면 화면을 지어내지 않고 실패로 처리한다 (정직성)
  if (!season) {
    throw new PersonalColorApiError(
      '분석 결과를 해석하지 못했어요. 잠시 후 다시 시도해주세요.',
      response.status,
      'PARSE_ERROR'
    );
  }

  const description =
    (typeof result.seasonDescription === 'string' && result.seasonDescription) ||
    (typeof result.insight === 'string' ? result.insight : '') ||
    '';

  // AI 결과를 우선하고, DB 응답 형상은 저장 성공 경로의 보조 소스로만 사용한다.
  const resultBestColors = normalizePersonalColorHexes(result.bestColors);
  const resultWorstColors = normalizePersonalColorHexes(result.worstColors);
  const seasonSubtype =
    normalizePersonalColorSubtype(result.seasonSubtype) ??
    normalizePersonalColorSubtype(data.season_subtype) ??
    normalizePersonalColorSubtype(imageAnalysis.seasonSubtype);

  const analysis: PersonalColorApiResult = {
    season,
    seasonSubtype,
    confidence: normalizeConfidence(result.confidence),
    description,
    bestColors:
      resultBestColors.length > 0
        ? resultBestColors
        : normalizePersonalColorHexes(data.best_colors),
    worstColors:
      resultWorstColors.length > 0
        ? resultWorstColors
        : normalizePersonalColorHexes(data.worst_colors),
    usedMock: obj.usedMock === true,
    dbSaveFailed: obj.dbSaveFailed === true,
  };
  void trackAnalysisComplete(
    'personal-color',
    { status: 'completed', axesCompletedCount: 1, usedFallback: analysis.usedMock },
    clerkToken
  );
  return analysis;
}
