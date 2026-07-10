/**
 * 오늘의 맞춤 루틴 API — 웹 루틴 페이지와 동일한 조립 결과 (ADR-117 / ADR-118)
 *
 * @route GET /api/routine/daily
 * @description
 *   웹 루틴 페이지(analysis/skin/routine)가 클라이언트에서 조립하는 것과 동일한 입력을
 *   서버에서 수집해 `assembleDailyRoutine`(조립 정본)으로 실행한 뒤 JSON으로 반환한다.
 *   모바일 루틴 화면이 이 결과를 렌더만 한다(thin client) — 루틴 조립 로직 복제 없음.
 *
 *   ADR-103과 동일하게 모바일 크로스 오리진을 위해 CORS를 개방한다. 인증은 Bearer JWT.
 *   피부 분석이 0건이면 `hasSkinAnalysis:false`만 반환한다(루틴을 지어내지 않음 — 모바일이 CTA 렌더).
 *
 * @see docs/adr/ADR-118-mobile-parity-thin-client.md
 * @see apps/web/lib/skincare/daily-routine.ts
 * @see apps/web/app/api/briefing/route.ts (CORS/thin-client 관례)
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  assembleDailyRoutine,
  getSkinTypeLabel,
  getStepHowTo,
  getSkinGoalLabel,
  type SkinGoalId,
} from '@/lib/skincare';
import type { RoutineStep } from '@/types/skincare-routine';
import { getShelfItems } from '@/lib/scan/product-shelf';
import { getBeautyProfile } from '@/lib/capsule';
import { unauthorizedError, internalError } from '@/lib/api/error-response';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { SkinTypeId } from '@/lib/mock/skin-analysis';

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
// 응답 계약 (모바일 lib/api/routine.ts와 동기화)
// ─────────────────────────────────────────────────────────────

interface StepHowToDTO {
  amount: string;
  method: string;
  waitTime?: string;
  tips?: string[];
}

interface RoutineStepDTO {
  order: number;
  category: string;
  /** 일반 명칭("클렌저") */
  name: string;
  /** 상태 기반 성분 스펙명("약산성 클렌저") — 있으면 표면이 우선 표시 */
  specName?: string;
  /** specName이 왜 잘 맞는지 한 줄 */
  specReason?: string;
  purpose: string;
  duration?: string;
  tips: string[];
  isOptional: boolean;
  /** 스텝 사용법(초보자 how-to) — 없으면 null */
  howto: StepHowToDTO | null;
  /** 내 화장대 보유 제품 ("내 ○○" 배지) — 없으면 생략 */
  ownedProduct?: { name: string; brand?: string };
}

/** 피부 분석 행 (skin_analyses 실존 컬럼) */
interface SkinAnalysisRow {
  id: string;
  skin_type: SkinTypeId | null;
  hydration: number;
  oil_level: number;
  pores: number;
  pigmentation: number;
  wrinkles: number;
  sensitivity: number;
  created_at: string;
}

/** RoutineStep(정본) → 모바일 DTO. howto는 카테고리 조회(getStepHowTo)로 부착 */
function toStepDTO(step: RoutineStep): RoutineStepDTO {
  const howto = getStepHowTo(step.category);
  return {
    order: step.order,
    category: step.category,
    name: step.name,
    ...(step.specName ? { specName: step.specName } : {}),
    ...(step.specReason ? { specReason: step.specReason } : {}),
    purpose: step.purpose,
    ...(step.duration ? { duration: step.duration } : {}),
    tips: step.tips,
    isOptional: step.isOptional,
    howto: howto
      ? {
          amount: howto.amount,
          method: howto.method,
          ...(howto.waitTime ? { waitTime: howto.waitTime } : {}),
          ...(howto.tips ? { tips: howto.tips } : {}),
        }
      : null,
    ...(step.ownedProduct
      ? {
          ownedProduct: {
            name: step.ownedProduct.name,
            ...(step.ownedProduct.brand ? { brand: step.ownedProduct.brand } : {}),
          },
        }
      : {}),
  };
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
 * GET /api/routine/daily
 *
 * 성공(분석 있음, 200):
 * {
 *   success: true,
 *   data: {
 *     date, hasSkinAnalysis: true, skinType, skinTypeLabel,
 *     carePhase: { phase, label, message },
 *     goals: [{ id, label }],
 *     morning: RoutineStepDTO[], evening: RoutineStepDTO[],
 *     eveningFocus: { focus, label, reason },
 *     weeklyCycle: [{ dow, focus, label }] (7),
 *   }
 * }
 *
 * 분석 0건(200): { success: true, data: { date, hasSkinAnalysis: false } }
 * 에러: 401 UNAUTHORIZED / 500 INTERNAL_ERROR
 */
export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return withCors(unauthorizedError());
    }

    const now = new Date();
    const date = toDateKey(now);
    const supabase = createClerkSupabaseClient();

    // 최신 피부 분석 — 없으면 루틴을 지어내지 않고 CTA 신호만 반환
    const { data: skinRow, error: skinError } = await supabase
      .from('skin_analyses')
      .select(
        'id, skin_type, hydration, oil_level, pores, pigmentation, wrinkles, sensitivity, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (skinError || !skinRow) {
      // PGRST116 = 행 없음 → 분석 0건. 다른 에러도 데이터 없음으로 안전 처리(정직 CTA)
      return withCors(NextResponse.json({ success: true, data: { date, hasSkinAnalysis: false } }));
    }

    const row = skinRow as SkinAnalysisRow;
    const skinType: SkinTypeId = row.skin_type || 'normal';
    const scores: Record<string, number> = {
      hydration: row.hydration,
      oil_level: row.oil_level,
      pores: row.pores,
      pigmentation: row.pigmentation,
      wrinkles: row.wrinkles,
      sensitivity: row.sensitivity,
    };

    // 사용자 목표(beauty_profiles.skin.userGoals) — 실패해도 루틴은 성립(빈 목표)
    let goals: SkinGoalId[] = [];
    try {
      const profile = await getBeautyProfile(userId);
      const raw = profile.skin?.userGoals;
      if (Array.isArray(raw)) goals = raw as SkinGoalId[];
    } catch {
      /* 목표 조회 실패 — 목표 없이 진행 */
    }

    // 내 화장대 보유 제품 — 실패해도 카탈로그 폴백(빈 배열)
    let shelfItems: Awaited<ReturnType<typeof getShelfItems>>['items'] = [];
    try {
      const shelf = await getShelfItems(supabase, userId, { status: 'owned', limit: 100 });
      shelfItems = shelf.items;
    } catch {
      /* 화장대 조회 실패 — 카탈로그 추천으로 폴백 */
    }

    const result = await assembleDailyRoutine({ skinType, scores, goals, shelfItems, now });

    return withCors(
      NextResponse.json({
        success: true,
        data: {
          date,
          hasSkinAnalysis: true,
          skinType,
          skinTypeLabel: getSkinTypeLabel(skinType),
          personalizationNote: result.personalizationNote,
          carePhase: result.carePhase,
          goals: goals.map((id) => ({ id, label: getSkinGoalLabel(id) ?? id })),
          morning: result.morning.map(toStepDTO),
          evening: result.evening.map(toStepDTO),
          eveningFocus: {
            focus: result.eveningFocus.cycle.focus,
            label: result.eveningFocus.cycle.label,
            reason: result.eveningFocus.cycle.reason,
          },
          weeklyCycle: result.eveningFocus.weekly.days,
        },
      })
    );
  } catch (error) {
    console.error('[API] GET /routine/daily error:', error);
    return withCors(
      internalError(
        '루틴을 불러올 수 없습니다.',
        error instanceof Error ? error.message : undefined
      )
    );
  }
}
