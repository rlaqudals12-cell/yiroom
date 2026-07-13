/**
 * M-1 메이크업 분석 HTTP 클라이언트 (웹 API 재사용 — ADR-118 thin client)
 *
 * @module lib/api/makeup
 * @description
 *   웹의 POST /api/analyze/makeup 엔드포인트를 모바일에서 호출.
 *   기존 단독 화면은 로컬 lib/gemini 경로(클라이언트 키 없음 → 항상 Mock 폴백,
 *   저장 실패)를 썼다 — 실 AI·서버 저장·연령/생체 게이트가 전부 서버에 있으므로
 *   웹 API가 정본이다.
 *
 *   웹 응답은 부위 형태(눈/입술/얼굴형)·색상 추천·팁 중심이라 모바일 결과 화면 형태로
 *   재구성한다. 웹 enum이 모바일보다 넓은 축(눈꼬리 처짐·입술 small/heart/asymmetric)은
 *   가장 가까운 모바일 값으로 접는다.
 *
 * @see apps/web/app/api/analyze/makeup/route.ts (계약 정본)
 * @see apps/web/lib/mock/makeup-analysis.ts (응답 필드·enum 정본)
 * @see docs/adr/ADR-118 (웹 API 정본 + 모바일 thin client)
 */
import { toUserMessage } from './error-text';

// ============================================
// 1. 타입 (모바일 결과 화면이 소비하는 형태)
// ============================================

export interface MakeupAnalysisApiResult {
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond';
  undertone: 'warm' | 'cool' | 'neutral';
  eyeShape: 'monolid' | 'double' | 'hooded' | 'round' | 'almond';
  lipShape: 'full' | 'thin' | 'wide' | 'bow';
  scores: {
    skinTone: number;
    /** 눈/입술 밸런스: 웹 분석은 개별 점수화하지 않음 → 종합 점수로 근사 (usedMock로 정직성 표시) */
    eyeBalance: number;
    lipBalance: number;
    overall: number;
  };
  recommendations: {
    base: string;
    eye: string;
    lip: string;
    blush: string;
    contour: string;
  };
  /** 추천 컬러 hex 목록 (립·아이섀도·블러셔 색상에서 추출) */
  bestColors: string[];
  /** AI 폴백 여부 — true면 UI에 정직하게 표시 */
  usedMock: boolean;
}

export interface MakeupAnalysisInput {
  imageBase64: string;
}

// ============================================
// 2. 에러 클래스
// ============================================

export class MakeupApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'MakeupApiError';
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

function firstEnum<T extends string>(value: unknown, valid: readonly T[], fallback: T): T {
  return valid.includes(value as T) ? (value as T) : fallback;
}

type MobileEyeShape = MakeupAnalysisApiResult['eyeShape'];
type MobileLipShape = MakeupAnalysisApiResult['lipShape'];

// 웹 눈형(downturned 포함) → 모바일 눈형 (없는 값은 가장 가까운 형태로 접음)
function toEyeShape(value: unknown): MobileEyeShape {
  if (value === 'downturned') return 'almond';
  return firstEnum(value, ['monolid', 'double', 'hooded', 'round', 'almond'] as const, 'double');
}

// 웹 입술형(small/heart/asymmetric 포함) → 모바일 입술형(full/thin/wide/bow)
function toLipShape(value: unknown): MobileLipShape {
  const map: Record<string, MobileLipShape> = {
    small: 'thin',
    heart: 'bow',
    asymmetric: 'wide',
  };
  if (typeof value === 'string' && map[value]) return map[value];
  return firstEnum(value, ['full', 'thin', 'wide', 'bow'] as const, 'full');
}

function clampScore(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** 웹 metrics [{ id, value }]에서 값 조회, 없으면 fallback */
function metricValue(metrics: unknown, id: string, fallback: number): number {
  if (!Array.isArray(metrics)) return fallback;
  const items = metrics as { id?: unknown; value?: unknown }[];
  const found = items.find((m) => m && typeof m === 'object' && m.id === id);
  return found && typeof found.value === 'number' ? found.value : fallback;
}

type WebColorRec = {
  category?: unknown;
  colors?: { name?: unknown; hex?: unknown }[] | unknown;
};

/** colorRecommendations에서 특정 카테고리 색상 이름 목록 (블러셔 문구 조립용) */
function colorNames(recs: WebColorRec[], category: string): string[] {
  const rec = recs.find((r) => r && typeof r === 'object' && r.category === category);
  if (!rec || !Array.isArray(rec.colors)) return [];
  return rec.colors
    .map((c) => (c && typeof c === 'object' && typeof c.name === 'string' ? c.name : null))
    .filter((n): n is string => n !== null);
}

/** 립·아이섀도·블러셔 색상의 hex를 모아 추천 팔레트로 (파운데이션·컨투어 제외) */
function collectBestColors(recs: WebColorRec[]): string[] {
  const wanted = ['lip', 'eyeshadow', 'blush'];
  const hexes: string[] = [];
  for (const category of wanted) {
    const rec = recs.find((r) => r && typeof r === 'object' && r.category === category);
    if (!rec || !Array.isArray(rec.colors)) continue;
    for (const c of rec.colors) {
      if (c && typeof c === 'object' && typeof c.hex === 'string') hexes.push(c.hex);
    }
  }
  // 중복 제거 + 최대 8개
  return Array.from(new Set(hexes)).slice(0, 8);
}

type WebMakeupTip = { category?: unknown; tips?: unknown };

/** makeupTips 배열에서 카테고리별 첫 팁 문구 */
function firstTip(tips: WebMakeupTip[], category: string): string {
  const group = tips.find((t) => t && typeof t === 'object' && t.category === category);
  if (!group || !Array.isArray(group.tips)) return '';
  const first = group.tips.find((t): t is string => typeof t === 'string');
  return first ?? '';
}

// ============================================
// 4. HTTP 클라이언트
// ============================================

/**
 * 메이크업 분석 요청. 서버가 실 AI 분석 + makeup_analyses 저장 + 게이트(연령·생체 동의)까지 처리한다.
 *
 * @throws MakeupApiError 인증(401)/게이트(403)/검증(400)/서버(5xx)/네트워크
 */
export async function requestMakeupAnalysis(
  input: MakeupAnalysisInput,
  clerkToken: string,
  baseUrl?: string
): Promise<MakeupAnalysisApiResult> {
  const url = baseUrl ?? process.env.EXPO_PUBLIC_YIROOM_API_URL;
  if (!url) {
    throw new MakeupApiError(
      'API 서버 주소가 설정되지 않았어요. 앱 설정을 확인해주세요.',
      0,
      'CONFIG_ERROR'
    );
  }

  let response: Response;
  try {
    response = await fetch(`${url}/api/analyze/makeup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify({ imageBase64: input.imageBase64 }),
    });
  } catch {
    throw new MakeupApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
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
    throw new MakeupApiError(
      toUserMessage(message, '메이크업 분석 요청에 실패했어요. 잠시 후 다시 시도해주세요.'),
      response.status,
      code
    );
  }

  const result = (
    typeof obj.result === 'object' && obj.result !== null ? obj.result : {}
  ) as Record<string, unknown>;

  const metrics = result.metrics;
  const overall = clampScore(result.overallScore);
  const colorRecs: WebColorRec[] = Array.isArray(result.colorRecommendations)
    ? (result.colorRecommendations as WebColorRec[])
    : [];
  const tips: WebMakeupTip[] = Array.isArray(result.makeupTips)
    ? (result.makeupTips as WebMakeupTip[])
    : [];

  const blushNames = colorNames(colorRecs, 'blush');
  const blushText =
    blushNames.length > 0
      ? `${blushNames.slice(0, 2).join(', ')} 계열 블러셔를 볼 중앙에 은은하게 올려주세요`
      : '볼 중앙에 은은하게 블러셔를 올려 화사함을 더하세요';

  return {
    faceShape: firstEnum(
      result.faceShape,
      ['oval', 'round', 'square', 'heart', 'oblong', 'diamond'] as const,
      'oval'
    ),
    undertone: firstEnum(result.undertone, ['warm', 'cool', 'neutral'] as const, 'neutral'),
    eyeShape: toEyeShape(result.eyeShape),
    lipShape: toLipShape(result.lipShape),
    scores: {
      skinTone: metricValue(metrics, 'skinTone', overall),
      // 웹 분석은 눈/입술 밸런스를 개별 점수화하지 않으므로 종합 점수로 근사한다.
      eyeBalance: overall,
      lipBalance: overall,
      overall,
    },
    recommendations: {
      base: firstTip(tips, '베이스') || '피부결을 정돈하는 베이스를 얇게 발라주세요',
      eye: firstTip(tips, '아이 메이크업') || '눈의 자연스러운 곡선을 따라 음영을 넣어주세요',
      lip: firstTip(tips, '립 메이크업') || '입술 중앙부터 자연스러운 그라데이션 립을 연출하세요',
      blush: blushText,
      contour: firstTip(tips, '컨투어링') || '얼굴 외곽에 은은하게 음영을 넣어 입체감을 살리세요',
    },
    bestColors: collectBestColors(colorRecs),
    usedMock: obj.usedMock === true,
  };
}
