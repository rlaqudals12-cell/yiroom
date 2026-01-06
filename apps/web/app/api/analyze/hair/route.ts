import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { generateMockHairAnalysisResult, type HairAnalysisResult } from '@/lib/mock/hair-analysis';
import { addXp, type BadgeAwardResult } from '@/lib/gamification';

// XP 보상 상수
const XP_ANALYSIS_COMPLETE = 10;

// 환경변수: Mock 모드 강제 여부 (개발/테스트용)
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

/**
 * H-1 헤어 분석 API
 *
 * POST /api/analyze/hair
 * Body: {
 *   imageBase64: string,    // 헤어/두피 이미지 (필수)
 *   useMock?: boolean       // Mock 모드 강제 (선택)
 * }
 */
export async function POST(req: Request) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { imageBase64, useMock = false } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // AI 분석 실행 (현재는 Mock만 지원)
    let result: HairAnalysisResult;
    let usedMock = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      result = generateMockHairAnalysisResult();
      usedMock = true;
      console.log('[H-1] Using mock analysis');
    } else {
      // TODO: Real AI 분석 구현 (Gemini analyzeHair)
      // 현재는 Mock으로 대체
      try {
        console.log('[H-1] Starting analysis... (using mock for now)');
        // TODO: result = await analyzeHair(imageBase64);
        result = generateMockHairAnalysisResult();
        usedMock = true;
        console.log('[H-1] Analysis completed');
      } catch (aiError) {
        console.error('[H-1] Analysis error, falling back to mock:', aiError);
        result = generateMockHairAnalysisResult();
        usedMock = true;
      }
    }

    const supabase = createServiceRoleClient();

    // 이미지 업로드
    let imageUrl: string | null = null;
    try {
      const fileName = `${userId}/${Date.now()}_hair.jpg`;
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const { data, error } = await supabase.storage.from('hair-images').upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

      if (error) {
        console.error('[H-1] Image upload error:', error);
      } else {
        imageUrl = data.path;
      }
    } catch (uploadError) {
      console.error('[H-1] Image upload exception:', uploadError);
    }

    // metrics에서 각 지표 추출
    const getMetricValue = (id: string) => {
      const metric = result.metrics.find((m) => m.id === id);
      return metric?.value ?? null;
    };

    // DB에 저장
    const { data, error } = await supabase
      .from('hair_analyses')
      .insert({
        clerk_user_id: userId,
        image_url: imageUrl || '',
        hair_type: result.hairType,
        hair_thickness: result.hairThickness,
        scalp_type: result.scalpType,
        hydration: getMetricValue('hydration'),
        scalp_health: getMetricValue('scalp'),
        damage_level: getMetricValue('damage'),
        density: getMetricValue('density'),
        elasticity: getMetricValue('elasticity'),
        shine: getMetricValue('shine'),
        overall_score: result.overallScore,
        concerns: result.concerns,
        recommendations: {
          insight: result.insight,
          ingredients: result.recommendedIngredients,
          products: result.recommendedProducts,
          careTips: result.careTips,
          analysisReliability: result.analysisReliability,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('[H-1] Database insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save analysis', details: error.message },
        { status: 500 }
      );
    }

    // 게이미피케이션 연동
    const gamificationResult: {
      badgeResults: BadgeAwardResult[];
      xpAwarded: number;
    } = {
      badgeResults: [],
      xpAwarded: 0,
    };

    try {
      // XP 추가
      await addXp(supabase, userId, XP_ANALYSIS_COMPLETE);
      gamificationResult.xpAwarded = XP_ANALYSIS_COMPLETE;

      // TODO: 헤어 분석 배지 추가 시 활성화
      // const hairBadge = await awardAnalysisBadge(supabase, userId, 'hair');
    } catch (gamificationError) {
      console.error('[H-1] Gamification error:', gamificationError);
    }

    return NextResponse.json({
      success: true,
      data: data,
      result: {
        ...result,
        analyzedAt: new Date().toISOString(),
      },
      usedMock,
      gamification: gamificationResult,
    });
  } catch (error) {
    console.error('[H-1] Hair analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 최근 H-1 분석 결과 목록 조회 API
 *
 * GET /api/analyze/hair
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('hair_analyses')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[H-1] Database query error:', error);
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('[H-1] Get hair analyses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
