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
import {
  assembleBriefing,
  ratingToFeedback,
  type BriefingCapsulePriority,
  type BriefingRecentProduct,
} from '@/lib/briefing';
import { unauthorizedError, internalError } from '@/lib/api/error-response';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getShelfItems } from '@/lib/scan/product-shelf';
import { getTodayDailyCapsule } from '@/lib/capsule';
import {
  getCurrentHourInTimezone,
  getDateKeyInTimezone,
  DEFAULT_TIMEZONE,
} from '@/lib/utils/timezone';
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

const DAY_MS = 24 * 60 * 60 * 1000;

/** 경과일 — 실제 now(UTC) 대비. 음수는 0으로 절삭 */
function daysSince(date: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS));
}

/**
 * 최근 제품함에 담은 소유 제품 1건 → "기억한다" 화법(제품함 후속) 입력.
 * 이전 응답(rating)이 있으면 그 답을 실어 보내 폐루프 회고가 되게 한다 — 지어내지 않음.
 * 실패/없음이면 null(assembleBriefing이 미주입).
 */
async function collectRecentProduct(
  supabase: Supabase,
  userId: string,
  now: Date
): Promise<BriefingRecentProduct | null> {
  try {
    const { items } = await getShelfItems(supabase, userId, { status: 'owned', limit: 1 });
    const latest = items[0];
    if (!latest?.productName) return null;
    // rating(1~5) → 응답 해석. 응답이 있을 때만 "언제 답했는지"를 updated_at 기준으로 산정.
    const feedback = ratingToFeedback(latest.rating);
    return {
      shelfItemId: latest.id,
      name: latest.productName,
      addedDaysAgo: daysSince(latest.scannedAt, now),
      feedback,
      feedbackDaysAgo: feedback ? daysSince(latest.updatedAt, now) : null,
    };
  } catch {
    return null;
  }
}

/**
 * 오늘 캡슐의 우선 항목 1건 → 조언 입력. 캐시된 오늘 캡슐만 읽는다(생성 부작용 없음).
 * 없거나 실패면 null(미주입).
 */
async function collectCapsulePriority(userId: string): Promise<BriefingCapsulePriority | null> {
  try {
    const capsule = await getTodayDailyCapsule(userId);
    const first = capsule?.items?.[0];
    if (!first?.name) return null;
    return { name: first.name, reason: first.reason ?? null };
  } catch {
    return null;
  }
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

    // 시각/날짜는 서울 기준(Vercel UTC 서버에서 인사·날짜가 어긋나지 않도록).
    // now(실제 UTC)는 "경과 시간" 계산용, hour는 인사 시간대용으로 분리한다.
    const now = new Date();
    const hour = getCurrentHourInTimezone(DEFAULT_TIMEZONE);
    const date = getDateKeyInTimezone(DEFAULT_TIMEZONE);

    // "기억한다" 화법 입력 — 제품함 후속 + 오늘 캡슐 우선(둘 다 없으면 미주입, 정직성 가드)
    const [recentProduct, capsulePriority] = await Promise.all([
      collectRecentProduct(supabase, userId, now),
      collectCapsulePriority(userId),
    ]);

    const payload = assembleBriefing(analyses, {
      userName,
      now,
      hour,
      weatherSkinTip,
      weatherFashionTip,
      recentProduct,
      capsulePriority,
    });

    return withCors(
      NextResponse.json({
        success: true,
        data: { date, ...payload },
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
