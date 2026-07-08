/**
 * 제품-사용자 호환성 분석 API ("나와의 적합도", ADR-112)
 * - POST: 제품 성분 × 사용자 5축 프로필로 적합도 판정 + 규제 사실(L1) + 효과 타임라인(L4)
 * - 응답은 하위호환(기존 CompatibilityResult 필드 유지) + regulatory/timelines 추가.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  analyzeCompatibility,
  generateMockCompatibilityResult,
  type UserAnalysisData,
  type CompatibilityResult,
} from '@/lib/scan/compatibility';
import {
  matchIngredientsToDb,
  buildRegulatoryFlags,
  type RegulatoryFlag,
} from '@/lib/scan/ingredient-db-match';
import { matchTimelines, type IngredientTimeline } from '@/lib/scan/ingredient-timeline';
import type { ProductIngredient } from '@/types/scan';
import type { SupabaseClient } from '@supabase/supabase-js';

export const maxDuration = 10;

interface AnalyzeRequest {
  productId?: string;
  ingredients?: ProductIngredient[];
  category?: string;
  color?: string;
}

/** 판정 응답 = 기존 호환성 결과 + 규제 사실(L1) + 효과 타임라인(L4) */
type ScanAnalyzeResponse = CompatibilityResult & {
  regulatory: RegulatoryFlag[];
  timelines: IngredientTimeline[];
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    const body: AnalyzeRequest = await request.json();
    // productId는 향후 제품 DB 연동 시 사용 예정 (body.productId)
    const { ingredients, category, color } = body;

    // 성분 정보 필수
    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json({ error: '성분 정보가 필요합니다' }, { status: 400 });
    }

    // 매칭용 성분명 (INCI + 국문 모두 사용해 커버리지 확보)
    const namesForMatch = ingredients.flatMap((i) =>
      [i.inciName, i.nameKo].filter((v): v is string => Boolean(v))
    );

    // L4 효과 타임라인 — 순수 함수(프로필/네트워크 무관, 결정론)
    const timelines = matchTimelines(namesForMatch);

    // Supabase 클라이언트 (공개 읽기: cosmetic_ingredients + 사용자 분석)
    let supabase: SupabaseClient | null = null;
    try {
      supabase = createClerkSupabaseClient();
    } catch (e) {
      console.error('[Analyze API] Supabase 클라이언트 생성 실패:', e);
    }

    // L1 규제 사실 — 성분 DB 조인 (실패해도 판정은 진행)
    let regulatory: RegulatoryFlag[] = [];
    if (supabase) {
      try {
        const matches = await matchIngredientsToDb(namesForMatch, supabase);
        regulatory = buildRegulatoryFlags(matches);
      } catch (e) {
        console.error('[Analyze API] 규제 정보 매칭 실패:', e);
      }
    }

    // Mock 모드
    if (process.env.FORCE_MOCK_AI === 'true') {
      const mockResult = generateMockCompatibilityResult();
      const response: ScanAnalyzeResponse = { ...mockResult, regulatory, timelines };
      return NextResponse.json(response);
    }

    // 사용자 분석 데이터 조회 (로그인한 경우)
    const userAnalysis: UserAnalysisData = {};

    if (userId && supabase) {
      // 병렬로 피부 분석과 퍼스널 컬러 조회
      const [skinResult, colorResult] = await Promise.all([
        supabase
          .from('skin_analyses')
          .select('skin_type, concerns, sensitivity')
          .eq('clerk_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('personal_color_assessments')
          .select('season, tone')
          .eq('clerk_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
      ]);

      if (skinResult.data) {
        userAnalysis.skinAnalysis = {
          skinType: mapSkinType(skinResult.data.skin_type),
          concerns: skinResult.data.concerns || [],
          sensitivity: mapSensitivity(skinResult.data.sensitivity),
        };
      }

      if (colorResult.data) {
        userAnalysis.personalColor = {
          seasonType: colorResult.data.season?.toLowerCase() as
            | 'spring'
            | 'summer'
            | 'autumn'
            | 'winter',
          tone: colorResult.data.tone?.toLowerCase() as 'warm' | 'cool',
        };
      }
    }

    // 호환성(적합도) 분석 실행 — 순수 규칙 기반(AI 미사용)
    const result = await analyzeCompatibility(
      ingredients,
      category || 'skincare',
      color,
      userAnalysis
    );

    const response: ScanAnalyzeResponse = { ...result, regulatory, timelines };
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Analyze API] Error:', error);

    // 개발 환경에서는 Mock fallback (레이어는 빈 배열로 형태 유지)
    if (process.env.NODE_ENV === 'development') {
      const mockResult = generateMockCompatibilityResult();
      const response: ScanAnalyzeResponse = { ...mockResult, regulatory: [], timelines: [] };
      return NextResponse.json(response);
    }

    return NextResponse.json({ error: '분석 처리 중 오류가 발생했습니다' }, { status: 500 });
  }
}

/**
 * DB 피부 타입을 코드용 타입으로 변환
 */
function mapSkinType(
  dbType: string | null
): 'dry' | 'oily' | 'sensitive' | 'combination' | 'normal' {
  if (!dbType) return 'normal';

  const typeMap: Record<string, 'dry' | 'oily' | 'sensitive' | 'combination' | 'normal'> = {
    건성: 'dry',
    지성: 'oily',
    민감성: 'sensitive',
    복합성: 'combination',
    중성: 'normal',
    dry: 'dry',
    oily: 'oily',
    sensitive: 'sensitive',
    combination: 'combination',
    normal: 'normal',
  };

  return typeMap[dbType.toLowerCase()] || 'normal';
}

/**
 * DB 민감도를 코드용 타입으로 변환
 */
function mapSensitivity(dbSensitivity: string | number | null): 'low' | 'medium' | 'high' {
  if (!dbSensitivity) return 'low';

  if (typeof dbSensitivity === 'number') {
    if (dbSensitivity >= 70) return 'high';
    if (dbSensitivity >= 40) return 'medium';
    return 'low';
  }

  const sensMap: Record<string, 'low' | 'medium' | 'high'> = {
    높음: 'high',
    중간: 'medium',
    낮음: 'low',
    high: 'high',
    medium: 'medium',
    low: 'low',
  };

  return sensMap[dbSensitivity.toLowerCase()] || 'low';
}
