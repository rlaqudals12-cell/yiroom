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
import { normalizeColors } from '@/lib/color/normalize-colors';
import { fetchIntegratedProfileSnapshot } from '@/lib/analysis/integrated/profile-snapshot';

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
  /** 출처 표식이 없어 AI/샘플 어느 쪽인지 확인할 수 없는 낮은 신뢰도 축. */
  unknownAxes: PublicAxisCode[];
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

/** 토큰으로 공개 리포트 조회 — 무효/철회 토큰은 null */
export async function getSharedReport(token: string): Promise<PublicStyleReport | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;

  const supabase = createServiceRoleClient();

  const { data: share } = await supabase
    .from('report_shares')
    .select('session_id, clerk_user_id')
    .eq('token', token)
    .is('revoked_at', null)
    .maybeSingle();
  if (!share) return null;

  const sessionId = share.session_id as string;

  const sessionRes = await supabase
    .from('integrated_analysis_sessions')
    .select('created_at, persona, used_fallback, clerk_user_id')
    .eq('id', sessionId)
    .maybeSingle();

  if (!sessionRes.data) return null;

  const clerkUserId = String(sessionRes.data.clerk_user_id ?? share.clerk_user_id ?? '');
  if (!clerkUserId) return null;

  // 공개 경로는 service-role이므로 필요한 컬럼만 읽고, owner filter를 모든 축에 강제한다.
  const snapshot = await fetchIntegratedProfileSnapshot(supabase, {
    sessionId,
    clerkUserId,
    sessionUsedFallback: sessionRes.data.used_fallback,
    sessionCreatedAt: String(sessionRes.data.created_at),
    selectColumns: {
      personal_color: 'id, session_id, created_at, season, undertone, best_colors, image_analysis',
      skin: 'id, session_id, created_at, skin_type, overall_score, foundation_recommendation, recommendations',
      body: 'id, session_id, created_at, body_type, style_recommendations',
      hair: 'id, session_id, created_at, hair_type, scalp_type, face_shape, recommendations',
      makeup: 'id, session_id, created_at, undertone, recommendations',
    },
  });
  const pc = snapshot.axes.personal_color;
  const skin = snapshot.axes.skin;
  const body = snapshot.axes.body;
  const hair = snapshot.axes.hair;
  const makeup = snapshot.axes.makeup;

  // best_colors: hex 문자열 배열(통합) · {hex,name} 객체 배열(단독) 모두 수용
  const bestColors = normalizeColors(pc?.best_colors, 10);

  // style_recommendations: JSONB — 문자열 배열(tops/bottoms 등 중첩)에서 팁 추출
  const styleRec = body?.style_recommendations;
  const styleTips: string[] = [];
  if (Array.isArray(styleRec)) {
    for (const s of styleRec) if (typeof s === 'string') styleTips.push(s);
  } else if (styleRec && typeof styleRec === 'object') {
    for (const v of Object.values(styleRec as Record<string, unknown>)) {
      if (Array.isArray(v)) for (const s of v) if (typeof s === 'string') styleTips.push(s);
    }
  }

  // recommendations는 배열이 아니라 JSONB 객체다 — 캐스팅+filter는 런타임 크래시였다
  const makeupRec = normalizeMakeupRecommendations(makeup?.recommendations, 3);

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
    fallbackAxes: snapshot.fallbackAxes,
    unknownAxes: snapshot.unknownAxes,
    personalColor: pc?.season
      ? {
          season: pc.season as string,
          undertone: (pc.undertone as string | null) ?? null,
          bestColors,
        }
      : null,
    skin: skin?.skin_type
      ? {
          skinType: skin.skin_type as string,
          overallScore: (skin.overall_score as number | null) ?? null,
          foundation: (skin.foundation_recommendation as string | null) ?? null,
        }
      : null,
    body: body?.body_type
      ? { bodyType: body.body_type as string, styleTips: styleTips.slice(0, 4) }
      : null,
    hair: hair
      ? {
          hairType: (hair.hair_type as string | null) ?? null,
          scalpType: (hair.scalp_type as string | null) ?? null,
          faceShape: (hair.face_shape as string | null) ?? null,
        }
      : null,
    makeup: makeup
      ? {
          undertone: (makeup.undertone as string | null) ?? null,
          recommendations: makeupRec,
        }
      : null,
  };
}
