/**
 * 스타일 리포트 공개 공유 — 생성/조회
 *
 * @module lib/share/report
 * @description
 *   통합 분석 결과(5축)를 비로그인 링크로 공유하는 레이어 (Phase 4 스타일 리포트).
 *   오프라인 컨설팅 결과지의 무료 웹판 — 바이럴 자산.
 *
 *   보안 원칙:
 *   - 공개 조회는 service-role + 추측 불가 토큰. anon RLS를 열지 않는다.
 *   - 공개 데이터는 화이트리스트 추출만 — 사진 URL·이름·이메일 등 식별 정보는
 *     타입 차원에서 존재하지 않는다 (row를 그대로 넘기지 않음).
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';

/** 공개 리포트가 고지하는 축 코드 (세션 used_fallback과 동일 taxonomy) */
export type PublicAxisCode = 'personal_color' | 'skin' | 'body' | 'hair' | 'makeup';

/** 공개 리포트에 노출해도 안전한 데이터만 담는 타입 (사진·식별자 없음) */
export interface PublicStyleReport {
  createdAt: string;
  persona: string | null;
  /**
   * Mock(샘플) 데이터로 대체된 축 — 수신자에게 정직하게 고지하기 위한 필드.
   *
   * 왜 필요한가: 이 값이 없던 시절 공개 리포트는 전 축이 폴백이어도 "AI 분석 기반"으로만
   * 표기돼, 링크를 받은 사람이 샘플을 개인 진단으로 오인했다 (design-contracts §3 위반).
   * 소유자 화면(AxisFallbackNotice)과 **같은 근거**(세션 used_fallback)를 쓴다.
   */
  fallbackAxes: PublicAxisCode[];
  personalColor: {
    season: string;
    undertone: string | null;
    bestColors: Array<{ hex: string; name: string }>;
  } | null;
  skin: {
    skinType: string;
    overallScore: number | null;
    foundation: string | null;
  } | null;
  body: {
    bodyType: string;
    styleTips: string[];
  } | null;
  hair: {
    hairType: string | null;
    scalpType: string | null;
    faceShape: string | null;
  } | null;
  makeup: {
    undertone: string | null;
    recommendations: string[];
  } | null;
}

/**
 * 공유 링크 생성 — 세션 소유권 검증 후 토큰 발급.
 * 같은 세션에 유효 토큰이 이미 있으면 재사용 (링크 난립 방지).
 */
export async function createReportShare(
  clerkUserId: string,
  sessionId: string
): Promise<{ token: string } | null> {
  const supabase = createServiceRoleClient();

  // 소유권 검증 — service-role은 RLS를 우회하므로 명시적으로 확인
  const { data: session } = await supabase
    .from('integrated_analysis_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();
  if (!session) return null;

  // 기존 유효 토큰 재사용
  const { data: existing } = await supabase
    .from('report_shares')
    .select('token')
    .eq('session_id', sessionId)
    .is('revoked_at', null)
    .maybeSingle();
  if (existing?.token) return { token: existing.token };

  const token = crypto.randomUUID().replace(/-/g, '');
  const { error } = await supabase.from('report_shares').insert({
    token,
    clerk_user_id: clerkUserId,
    session_id: sessionId,
  });
  if (error) {
    console.error('[ReportShare] insert error:', error.message);
    return null;
  }
  return { token };
}

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * 색 하나를 {hex,name}으로 정규화 — 저장 형상 3종을 모두 수용한다.
 *
 * 왜: `best_colors`의 실제 저장 형상은 경로마다 다르다.
 *  - 단독 AI 경로: `{hex, name}` 객체 (방어적으로 `{color}` 폴백도 존재)
 *  - 통합 경로(axis-adapters): **hex 문자열 배열** (`palette.mainColors: string[]`)
 * 객체만 받던 옛 구현은 통합 사용자의 팔레트를 통째로 버렸다.
 * 색 이름은 있을 때만 담는다 — 없는 이름을 지어내지 않는다.
 */
function normalizeColor(item: unknown): { hex: string; name: string } | null {
  let hex: string | null = null;
  let name = '';
  if (typeof item === 'string') {
    hex = item;
  } else if (typeof item === 'object' && item !== null) {
    const c = item as { hex?: unknown; color?: unknown; name?: unknown };
    if (typeof c.hex === 'string') hex = c.hex;
    else if (typeof c.color === 'string') hex = c.color;
    if (typeof c.name === 'string') name = c.name;
  }
  if (!hex || !HEX_PATTERN.test(hex)) return null;
  return { hex, name };
}

function normalizeColors(raw: unknown, max: number): Array<{ hex: string; name: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeColor)
    .filter((c): c is { hex: string; name: string } => c !== null)
    .slice(0, max);
}

/**
 * 메이크업 추천이 담긴 텍스트만 뽑는다 — 저장 형상이 **배열이 아니라 객체**다.
 *
 * 왜: `makeup_analyses.recommendations`는 두 경로 모두 JSONB **객체**다.
 *  - 통합(makeup-composer): `{baseRecommendation, tutorialSteps, lipPalette, ..., usedMock, measured}`
 *  - 단독(/api/analyze/makeup): `{insight, styles, colors, tips, ...}`
 * 옛 구현은 `as unknown[]` 캐스팅 후 `.filter()`를 호출해 **공개 리포트 전체가 500**이었다
 * (객체에는 filter가 없다). 레거시 문자열 배열까지 한 정규화기로 흡수한다.
 */
const MAKEUP_TEXT_KEYS = ['baseRecommendation', 'insight', 'tips', 'tutorialSteps'] as const;

function collectStrings(value: unknown, out: string[], max: number): void {
  if (out.length >= max) return;
  if (typeof value === 'string') {
    const text = value.trim();
    if (text && !out.includes(text)) out.push(text);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out, max);
  }
}

function normalizeMakeupRecommendations(raw: unknown, max: number): string[] {
  const out: string[] = [];
  // 레거시: 문자열 배열이 그대로 저장된 행
  if (Array.isArray(raw)) {
    collectStrings(raw, out, max);
    return out.slice(0, max);
  }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    // 사람이 읽는 문장이 담긴 키만 화이트리스트로 — 팔레트 hex·플래그는 문장이 아니다
    for (const key of MAKEUP_TEXT_KEYS) collectStrings(obj[key], out, max);
  }
  return out.slice(0, max);
}

/** JSONB 안의 boolean 플래그를 안전하게 읽는다 (형상이 깨져 있어도 throw 금지) */
function readFlag(raw: unknown, key: string): boolean {
  if (typeof raw !== 'object' || raw === null) return false;
  return (raw as Record<string, unknown>)[key] === true;
}

/**
 * 축별 Mock 대체 여부를 수집한다.
 *
 * 정본은 세션의 `used_fallback`(축 코드 배열) — 소유자 화면과 같은 근거다.
 * 행에 남은 축별 플래그(PC `image_analysis.usedFallback`, S/H `recommendations.usedFallback`,
 * M `recommendations.usedMock`)를 합집합으로 교차 검증한다 — 세션 집계가 비어 있어도
 * 축 단위 진실이 남아 있으면 고지가 누락되지 않는다. (체형은 행 플래그가 없어 세션값만)
 */
function collectFallbackAxes(
  sessionUsedFallback: unknown,
  rowFlags: Array<{ axis: PublicAxisCode; used: boolean }>
): PublicAxisCode[] {
  const valid: readonly PublicAxisCode[] = [
    'personal_color',
    'skin',
    'body',
    'hair',
    'makeup',
  ] as const;
  const axes = new Set<PublicAxisCode>();
  if (Array.isArray(sessionUsedFallback)) {
    for (const code of sessionUsedFallback) {
      if (typeof code === 'string' && (valid as readonly string[]).includes(code)) {
        axes.add(code as PublicAxisCode);
      }
    }
  }
  for (const { axis, used } of rowFlags) if (used) axes.add(axis);
  // 표시 순서를 taxonomy 순서로 고정 (Set 삽입 순서에 의존하지 않음)
  return valid.filter((axis) => axes.has(axis));
}

/** 토큰으로 공개 리포트 조회 — 무효/철회 토큰은 null */
export async function getSharedReport(token: string): Promise<PublicStyleReport | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;

  const supabase = createServiceRoleClient();

  const { data: share } = await supabase
    .from('report_shares')
    .select('session_id')
    .eq('token', token)
    .is('revoked_at', null)
    .maybeSingle();
  if (!share) return null;

  const sessionId = share.session_id as string;

  const [sessionRes, pcRes, skinRes, bodyRes, hairRes, makeupRes] = await Promise.all([
    supabase
      .from('integrated_analysis_sessions')
      .select('created_at, persona, used_fallback')
      .eq('id', sessionId)
      .maybeSingle(),
    supabase
      .from('personal_color_assessments')
      .select('season, undertone, best_colors, image_analysis')
      .eq('session_id', sessionId)
      .maybeSingle(),
    supabase
      .from('skin_analyses')
      .select('skin_type, overall_score, foundation_recommendation, recommendations')
      .eq('session_id', sessionId)
      .maybeSingle(),
    supabase
      .from('body_analyses')
      .select('body_type, style_recommendations')
      .eq('session_id', sessionId)
      .maybeSingle(),
    supabase
      .from('hair_analyses')
      .select('hair_type, scalp_type, face_shape, recommendations')
      .eq('session_id', sessionId)
      .maybeSingle(),
    supabase
      .from('makeup_analyses')
      .select('undertone, recommendations')
      .eq('session_id', sessionId)
      .maybeSingle(),
  ]);

  if (!sessionRes.data) return null;

  // best_colors: hex 문자열 배열(통합) · {hex,name} 객체 배열(단독) 모두 수용
  const bestColors = normalizeColors(pcRes.data?.best_colors, 10);

  // style_recommendations: JSONB — 문자열 배열(tops/bottoms 등 중첩)에서 팁 추출
  const styleRec = bodyRes.data?.style_recommendations as unknown;
  const styleTips: string[] = [];
  if (Array.isArray(styleRec)) {
    for (const s of styleRec) if (typeof s === 'string') styleTips.push(s);
  } else if (styleRec && typeof styleRec === 'object') {
    for (const v of Object.values(styleRec as Record<string, unknown>)) {
      if (Array.isArray(v)) for (const s of v) if (typeof s === 'string') styleTips.push(s);
    }
  }

  // recommendations는 배열이 아니라 JSONB 객체다 — 캐스팅+filter는 런타임 크래시였다
  const makeupRec = normalizeMakeupRecommendations(makeupRes.data?.recommendations, 3);

  // 축별 Mock 고지 — 세션 집계(정본) ∪ 행에 남은 축별 플래그
  const fallbackAxes = collectFallbackAxes(sessionRes.data.used_fallback, [
    { axis: 'personal_color', used: readFlag(pcRes.data?.image_analysis, 'usedFallback') },
    { axis: 'skin', used: readFlag(skinRes.data?.recommendations, 'usedFallback') },
    { axis: 'hair', used: readFlag(hairRes.data?.recommendations, 'usedFallback') },
    { axis: 'makeup', used: readFlag(makeupRes.data?.recommendations, 'usedMock') },
  ]);

  // persona는 {oneLine, narrative, ...} JSONB — 한 줄 문구만 안전 추출
  const personaRaw = sessionRes.data.persona as { oneLine?: unknown } | string | null;
  const persona =
    typeof personaRaw === 'string'
      ? personaRaw
      : typeof personaRaw?.oneLine === 'string'
        ? personaRaw.oneLine
        : null;

  return {
    createdAt: sessionRes.data.created_at as string,
    persona,
    fallbackAxes,
    personalColor: pcRes.data?.season
      ? {
          season: pcRes.data.season as string,
          undertone: (pcRes.data.undertone as string | null) ?? null,
          bestColors,
        }
      : null,
    skin: skinRes.data?.skin_type
      ? {
          skinType: skinRes.data.skin_type as string,
          overallScore: (skinRes.data.overall_score as number | null) ?? null,
          foundation: (skinRes.data.foundation_recommendation as string | null) ?? null,
        }
      : null,
    body: bodyRes.data?.body_type
      ? { bodyType: bodyRes.data.body_type as string, styleTips: styleTips.slice(0, 4) }
      : null,
    hair: hairRes.data
      ? {
          hairType: (hairRes.data.hair_type as string | null) ?? null,
          scalpType: (hairRes.data.scalp_type as string | null) ?? null,
          faceShape: (hairRes.data.face_shape as string | null) ?? null,
        }
      : null,
    makeup: makeupRes.data
      ? {
          undertone: (makeupRes.data.undertone as string | null) ?? null,
          recommendations: makeupRec,
        }
      : null,
  };
}
