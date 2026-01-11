/**
 * 제품-사용자 호환성 분석 API
 * - POST: 제품 성분과 사용자 분석 데이터를 기반으로 호환성 분석
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  analyzeCompatibility,
  generateMockCompatibilityResult,
  type UserAnalysisData,
} from '@/lib/scan/compatibility';
import type { ProductIngredient } from '@/types/scan';

export const maxDuration = 10;

interface AnalyzeRequest {
  productId?: string;
  ingredients?: ProductIngredient[];
  category?: string;
  color?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    const body: AnalyzeRequest = await request.json();
    const { productId, ingredients, category, color } = body;

    // 성분 정보 필수
    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json({ error: '성분 정보가 필요합니다' }, { status: 400 });
    }

    // 사용자 분석 데이터 조회 (로그인한 경우)
    const userAnalysis: UserAnalysisData = {};

    if (userId) {
      const supabase = createClerkSupabaseClient();

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

    // Mock 모드
    if (process.env.FORCE_MOCK_AI === 'true') {
      const mockResult = generateMockCompatibilityResult();
      return NextResponse.json(mockResult);
    }

    // 호환성 분석 실행
    const result = await analyzeCompatibility(
      ingredients,
      category || 'skincare',
      color,
      userAnalysis
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Analyze API] Error:', error);

    // 개발 환경에서는 Mock fallback
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analyze API] Falling back to mock result');
      const mockResult = generateMockCompatibilityResult();
      return NextResponse.json(mockResult);
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
