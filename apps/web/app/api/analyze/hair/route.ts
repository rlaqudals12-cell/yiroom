import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/security/rate-limit';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  unauthorizedError,
  validationError,
  internalError,
  dbError,
} from '@/lib/api/error-response';
import {
  generateMockHairAnalysisResult,
  type HairAnalysisResult,
  type HairConcernId,
} from '@/lib/mock/hair-analysis';
import { analyzeHair } from '@/lib/gemini';
import { addXp, type BadgeAwardResult } from '@/lib/gamification';
import {
  createScalpHealthNutritionAlert,
  createHairLossPreventionAlert,
  createHairShineBoostAlert,
  type CrossModuleAlertData,
} from '@/lib/alerts';

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
export async function POST(req: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError();
    }

    // Rate Limit 체크
    const rateLimitResult = applyRateLimit(req, userId);
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    const body = await req.json();
    const { imageBase64, useMock = false } = body;

    if (!imageBase64) {
      return validationError('이미지가 필요합니다.');
    }

    // AI 분석 실행
    let result: HairAnalysisResult;
    let usedMock = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      result = generateMockHairAnalysisResult();
      usedMock = true;
      console.log('[H-1] Using mock analysis');
    } else {
      // Gemini AI 분석 실행
      try {
        console.log('[H-1] Starting Gemini analysis...');
        const geminiResult = await analyzeHair(imageBase64);
        // Gemini 결과를 HairAnalysisResult 형식으로 변환
        result = {
          hairType: geminiResult.hairType,
          hairTypeLabel: geminiResult.hairTypeLabel,
          hairThickness: geminiResult.hairThickness,
          hairThicknessLabel: geminiResult.hairThicknessLabel,
          scalpType: geminiResult.scalpType,
          scalpTypeLabel: geminiResult.scalpTypeLabel,
          overallScore: geminiResult.overallScore,
          metrics: geminiResult.metrics,
          concerns: geminiResult.concerns as HairConcernId[],
          insight: geminiResult.insight,
          recommendedIngredients: geminiResult.recommendedIngredients,
          recommendedProducts: geminiResult.recommendedProducts,
          careTips: geminiResult.careTips,
          analyzedAt: new Date(),
          analysisReliability: geminiResult.analysisReliability,
        };
        console.log('[H-1] Gemini analysis completed');
      } catch (aiError) {
        console.error('[H-1] Gemini error, falling back to mock:', aiError);
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
      return dbError('분석 결과 저장에 실패했습니다.', error.message);
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

      // P3: 헤어 분석 배지 (게이미피케이션 확장 시 활성화)
      // const hairBadge = await awardAnalysisBadge(supabase, userId, 'hair');
    } catch (gamificationError) {
      console.error('[H-1] Gamification error:', gamificationError);
    }

    // 크로스 모듈 알림 생성 (H-1 → N-1)
    const alerts: CrossModuleAlertData[] = [];

    // 두피 건강 점수 기반 알림
    const scalpHealthScore = getMetricValue('scalp') ?? 70;
    if (scalpHealthScore < 70) {
      alerts.push(
        createScalpHealthNutritionAlert(scalpHealthScore, result.recommendedIngredients || [])
      );
    }

    // 모발 밀도 기반 탈모 예방 알림
    const densityScore = getMetricValue('density') ?? 70;
    const riskLevel: 'low' | 'medium' | 'high' =
      densityScore < 40 ? 'high' : densityScore < 60 ? 'medium' : 'low';
    if (densityScore < 70) {
      alerts.push(createHairLossPreventionAlert(densityScore, riskLevel));
    }

    // 모발 손상도 기반 윤기 알림
    const damageLevel = getMetricValue('damage') ?? 30;
    if (damageLevel > 40) {
      alerts.push(createHairShineBoostAlert(damageLevel));
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
      alerts, // 크로스 모듈 알림
    });
  } catch (error) {
    console.error('[H-1] Hair analysis error:', error);
    return internalError(
      '헤어 분석 중 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
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
      return unauthorizedError();
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
      return dbError('분석 결과를 불러오는데 실패했습니다.', error.message);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('[H-1] Get hair analyses error:', error);
    return internalError(
      '분석 목록 조회 중 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
  }
}
