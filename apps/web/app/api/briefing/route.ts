/**
 * 아침 브리핑 API — 전속 뷰티팀의 "오늘의 메시지" (ADR-114 / ADR-118)
 *
 * @route GET /api/briefing
 * @description
 *   웹 홈(DailyBriefing)이 클라이언트에서 조립하는 것과 동일한 입력을 서버에서 수집해
 *   `assembleBriefing`(문장·배색 조립 정본)으로 실행한 뒤 JSON으로 반환한다.
 *   모바일 [오늘] 탭이 이 결과를 렌더만 한다(thin client) — 문장 조립 로직 복제 없음.
 *
 *   ADR-103과 동일하게 모바일 크로스 오리진을 위해 CORS를 개방한다.
 *   인증은 Authorization Bearer JWT가 담당(웹 세션 쿠키도 동일하게 동작).
 *
 * @see docs/adr/ADR-118-mobile-parity-thin-client.md
 * @see docs/adr/ADR-114-beauty-team-ia.md §결정 4
 * @see docs/adr/ADR-103-cross-origin-mobile-access.md
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { computeSkinTrend } from '@yiroom/shared';
import { assembleBriefing } from '@/lib/briefing';
import { unauthorizedError, internalError } from '@/lib/api/error-response';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getCurrentWeather, generateEnvironmentAdvice } from '@/lib/weather';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

/** 모바일 크로스 오리진 허용(ADR-103) — 이 라우트만 개방, 인증은 Bearer JWT가 담당 */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-yiroom-client',
  'Access-Control-Max-Age': '86400',
};

function withCors(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

// ─────────────────────────────────────────────────────────────
// 입력 수집 헬퍼 (useAnalysisStatus의 서버판 — best_colors/추이 정규화 동일)
// ─────────────────────────────────────────────────────────────

/** DB best_colors(JSONB) 항목 하나를 {name,hex}로 정규화 (AI 원본 {name,hex}, color 폴백) */
function normalizeColorItem(c: unknown): { name: string; hex: string } | null {
  if (typeof c !== 'object' || c === null) return null;
  const item = c as { name?: unknown; hex?: unknown; color?: unknown };
  let hex: string | null = null;
  if (typeof item.hex === 'string') hex = item.hex;
  else if (typeof item.color === 'string') hex = item.color;
  if (!hex) return null;
  return { name: typeof item.name === 'string' ? item.name : '', hex };
}

/** best_colors 배열 → 유효한 {name,hex}만 */
function normalizeBestColors(raw: unknown): Array<{ name: string; hex: string }> {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeColorItem).filter((c): c is { name: string; hex: string } => c !== null);
}

/** image_analysis JSONB에서 실측 대비 레벨만 안전 추출 (없거나 무효면 undefined — 추측 없음) */
function extractContrastLevel(raw: unknown): 'low' | 'medium' | 'high' | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const value = (raw as { contrastLevel?: unknown }).contrastLevel;
  return value === 'low' || value === 'medium' || value === 'high' ? value : undefined;
}

type Supabase = ReturnType<typeof createClerkSupabaseClient>;

/** PC 행 → 요약(베스트 컬러·대비 정규화) */
function buildPcSummary(row: {
  id: string;
  season: string;
  created_at: string;
  best_colors: unknown;
  image_analysis: unknown;
}): AnalysisSummary {
  const bestColors = normalizeBestColors(row.best_colors);
  const contrastLevel = extractContrastLevel(row.image_analysis);
  return {
    id: row.id,
    type: 'personal-color',
    createdAt: new Date(row.created_at),
    summary: '',
    seasonType: row.season,
    ...(bestColors.length > 0 ? { bestColors } : {}),
    ...(contrastLevel ? { contrastLevel } : {}),
  };
}

/** 최근 2건 피부 행 → 요약(직전 대비 추이) */
function buildSkinSummary(
  rows: Array<{ id: string; overall_score: number; created_at: string }>
): AnalysisSummary {
  const latestScore = rows[0].overall_score;
  const trend = rows.length > 1 ? computeSkinTrend(latestScore, rows[1].overall_score) : null;
  return {
    id: rows[0].id,
    type: 'skin',
    createdAt: new Date(rows[0].created_at),
    summary: '',
    skinScore: latestScore,
    ...(trend ? { skinDelta: trend.delta, skinTrend: trend.trend } : {}),
  };
}

/**
 * 5축 최신 분석 요약 수집 — 웹 useAnalysisStatus와 동일 쿼리/정규화(서버 실행).
 * assembleBriefing이 쓰는 필드만 채운다(type·createdAt·bestColors·contrastLevel·skinTrend).
 */
async function collectAnalyses(supabase: Supabase): Promise<AnalysisSummary[]> {
  const [pcResult, skinResult, bodyResult, hairResult, makeupResult] = await Promise.all([
    supabase
      .from('personal_color_assessments')
      .select('id, season, created_at, best_colors, image_analysis')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('skin_analyses')
      .select('id, overall_score, created_at')
      .order('created_at', { ascending: false })
      .limit(2), // 추이(직전 대비)용 2건 — ADR-109 Phase 3
    supabase
      .from('body_analyses')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('hair_analyses')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('makeup_analyses')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const results: AnalysisSummary[] = [];

  if (pcResult.data && pcResult.data.length > 0) {
    results.push(buildPcSummary(pcResult.data[0]));
  }

  if (skinResult.data && skinResult.data.length > 0) {
    results.push(buildSkinSummary(skinResult.data));
  }

  // 체형·헤어·메이크업 — 브리핑에는 "마지막 분석 경과일" 산정에만 쓰이므로 최소 필드만
  for (const [type, res] of [
    ['body', bodyResult],
    ['hair', hairResult],
    ['makeup', makeupResult],
  ] as const) {
    if (res.data && res.data.length > 0) {
      results.push({
        id: res.data[0].id,
        type,
        createdAt: new Date(res.data[0].created_at),
        summary: '',
      });
    }
  }

  return results;
}

/** YYYY-MM-DD (로컬 = Asia/Seoul 서버) */
function toDateKey(now: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/briefing
 *
 * 성공 응답(200):
 * {
 *   success: true,
 *   data: {
 *     date, timeSlot,
 *     briefing: { greeting, observation?, advice[], closing },
 *     myColors: { analysisId, colors:[{name,hex}] } | null,
 *     todayStyle: { fashionTip, outfit: {baseName, colors:[{hex,role,name}]} | null },
 *     hasAnalyses
 *   }
 * }
 *
 * 에러: 401 UNAUTHORIZED / 500 INTERNAL_ERROR
 */
export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return withCors(unauthorizedError());
    }

    const supabase = createClerkSupabaseClient();
    const analyses = await collectAnalyses(supabase);

    // 실이름만(없으면 생략형 인사) — currentUser 실패는 브리핑 필수 아님
    let userName: string | null = null;
    try {
      const user = await currentUser();
      userName = user?.firstName || user?.username || null;
    } catch {
      /* 이름 조회 실패 — 이름 없이 진행 */
    }

    // 날씨(서울 기본) → 피부/패션 첫 팁. 실패해도 브리핑은 성립(정직성 가드)
    let weatherSkinTip: string | null = null;
    let weatherFashionTip: string | null = null;
    try {
      const weather = await getCurrentWeather();
      if (weather) {
        const advice = generateEnvironmentAdvice(weather);
        weatherSkinTip = advice.skin[0] ?? null;
        weatherFashionTip = advice.fashion[0] ?? null;
      }
    } catch {
      /* 날씨 조회 실패 — 팁 없이 진행 */
    }

    const now = new Date();
    const payload = assembleBriefing(analyses, {
      userName,
      now,
      weatherSkinTip,
      weatherFashionTip,
    });

    return withCors(
      NextResponse.json({
        success: true,
        data: { date: toDateKey(now), ...payload },
      })
    );
  } catch (error) {
    console.error('[API] GET /briefing error:', error);
    return withCors(
      internalError(
        '브리핑을 불러올 수 없습니다.',
        error instanceof Error ? error.message : undefined
      )
    );
  }
}
