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

/** 공개 리포트에 노출해도 안전한 데이터만 담는 타입 (사진·식별자 없음) */
export interface PublicStyleReport {
  createdAt: string;
  persona: string | null;
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
      .select('created_at, persona')
      .eq('id', sessionId)
      .maybeSingle(),
    supabase
      .from('personal_color_assessments')
      .select('season, undertone, best_colors')
      .eq('session_id', sessionId)
      .maybeSingle(),
    supabase
      .from('skin_analyses')
      .select('skin_type, overall_score, foundation_recommendation')
      .eq('session_id', sessionId)
      .maybeSingle(),
    supabase
      .from('body_analyses')
      .select('body_type, style_recommendations')
      .eq('session_id', sessionId)
      .maybeSingle(),
    supabase
      .from('hair_analyses')
      .select('hair_type, scalp_type, face_shape')
      .eq('session_id', sessionId)
      .maybeSingle(),
    supabase
      .from('makeup_analyses')
      .select('undertone, recommendations')
      .eq('session_id', sessionId)
      .maybeSingle(),
  ]);

  if (!sessionRes.data) return null;

  // best_colors: [{hex, name}] JSONB — 방어적 정규화
  const rawColors = (pcRes.data?.best_colors as unknown[] | null) ?? [];
  const bestColors = rawColors
    .filter(
      (c): c is { hex: string; name?: string } =>
        typeof c === 'object' && c !== null && typeof (c as { hex?: unknown }).hex === 'string'
    )
    .map((c) => ({ hex: c.hex, name: c.name ?? '' }))
    .slice(0, 10);

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

  const makeupRec = (makeupRes.data?.recommendations as unknown[] | null) ?? [];

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
          recommendations: makeupRec.filter((r): r is string => typeof r === 'string').slice(0, 3),
        }
      : null,
  };
}
