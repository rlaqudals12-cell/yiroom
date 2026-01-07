import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  generateMockMakeupAnalysisResult,
  type MakeupAnalysisResult,
  type MakeupConcernId,
} from '@/lib/mock/makeup-analysis';
import { analyzeMakeup } from '@/lib/gemini';
import { addXp, type BadgeAwardResult } from '@/lib/gamification';
import {
  createSkinToneNutritionAlert,
  createCollagenBoostAlert,
  type CrossModuleAlertData,
} from '@/lib/alerts';

// XP 보상 상수
const XP_ANALYSIS_COMPLETE = 15;

// 환경변수: Mock 모드 강제 여부 (개발/테스트용)
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

/**
 * M-1 메이크업 분석 API
 *
 * POST /api/analyze/makeup
 * Body: {
 *   imageBase64: string,    // 얼굴 이미지 (필수)
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

    // AI 분석 실행
    let result: MakeupAnalysisResult;
    let usedMock = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      result = generateMockMakeupAnalysisResult();
      usedMock = true;
      console.log('[M-1] Using mock analysis');
    } else {
      // Gemini AI 분석 실행
      try {
        console.log('[M-1] Starting Gemini analysis...');
        const geminiResult = await analyzeMakeup(imageBase64);
        // Gemini 결과를 MakeupAnalysisResult 형식으로 변환
        result = {
          undertone: geminiResult.undertone,
          undertoneLabel: geminiResult.undertoneLabel,
          eyeShape: geminiResult.eyeShape,
          eyeShapeLabel: geminiResult.eyeShapeLabel,
          lipShape: geminiResult.lipShape,
          lipShapeLabel: geminiResult.lipShapeLabel,
          faceShape: geminiResult.faceShape,
          faceShapeLabel: geminiResult.faceShapeLabel,
          overallScore: geminiResult.overallScore,
          metrics: geminiResult.metrics,
          concerns: geminiResult.concerns as MakeupConcernId[],
          insight: geminiResult.insight,
          recommendedStyles:
            geminiResult.recommendedStyles as MakeupAnalysisResult['recommendedStyles'],
          colorRecommendations: geminiResult.colorRecommendations.map((cr) => ({
            category: cr.category as MakeupAnalysisResult['colorRecommendations'][0]['category'],
            categoryLabel: cr.categoryLabel,
            colors: cr.colors,
          })),
          makeupTips: geminiResult.makeupTips,
          personalColorConnection: geminiResult.personalColorConnection,
          analyzedAt: new Date(),
          analysisReliability: geminiResult.analysisReliability,
        };
        console.log('[M-1] Gemini analysis completed');
      } catch (aiError) {
        console.error('[M-1] Gemini error, falling back to mock:', aiError);
        result = generateMockMakeupAnalysisResult();
        usedMock = true;
      }
    }

    const supabase = createServiceRoleClient();

    // 이미지 업로드
    let imageUrl: string | null = null;
    try {
      const fileName = `${userId}/${Date.now()}_makeup.jpg`;
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const { data, error } = await supabase.storage
        .from('makeup-images')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('[M-1] Image upload error:', error);
      } else {
        imageUrl = data.path;
      }
    } catch (uploadError) {
      console.error('[M-1] Image upload exception:', uploadError);
    }

    // metrics에서 각 지표 추출
    const getMetricValue = (id: string) => {
      const metric = result.metrics.find((m) => m.id === id);
      return metric?.value ?? null;
    };

    // DB에 저장
    const { data, error } = await supabase
      .from('makeup_analyses')
      .insert({
        clerk_user_id: userId,
        image_url: imageUrl || '',
        undertone: result.undertone,
        eye_shape: result.eyeShape,
        lip_shape: result.lipShape,
        face_shape: result.faceShape,
        skin_texture: getMetricValue('skinTexture'),
        skin_tone_uniformity: getMetricValue('skinTone'),
        hydration: getMetricValue('hydration'),
        pore_visibility: getMetricValue('poreVisibility'),
        oil_balance: getMetricValue('oilBalance'),
        overall_score: result.overallScore,
        concerns: result.concerns,
        recommendations: {
          insight: result.insight,
          styles: result.recommendedStyles,
          colors: result.colorRecommendations,
          tips: result.makeupTips,
          personalColorConnection: result.personalColorConnection,
          analysisReliability: result.analysisReliability,
        },
        analysis_reliability: result.analysisReliability,
      })
      .select()
      .single();

    if (error) {
      console.error('[M-1] Database insert error:', error);
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

      // TODO: 메이크업 분석 배지 추가 시 활성화
      // const makeupBadge = await awardAnalysisBadge(supabase, userId, 'makeup');
    } catch (gamificationError) {
      console.error('[M-1] Gamification error:', gamificationError);
    }

    // 크로스 모듈 알림 생성 (M-1 → N-1)
    const alerts: CrossModuleAlertData[] = [];

    // 언더톤 및 피부 고민 기반 영양 추천 알림
    const undertone = result.undertone as 'warm' | 'cool' | 'neutral';
    const skinConcerns = result.concerns || [];
    if (skinConcerns.length > 0) {
      alerts.push(createSkinToneNutritionAlert(undertone, skinConcerns));
    }

    // 피부 텍스처/탄력 기반 콜라겐 추천 알림
    const skinTextureScore = getMetricValue('skinTexture') ?? 70;
    const hydrationScore = getMetricValue('hydration') ?? 70;
    // 피부 텍스처와 수분 점수의 평균을 탄력 proxy로 사용
    const elasticityProxy = Math.round((skinTextureScore + hydrationScore) / 2);
    if (elasticityProxy < 60) {
      alerts.push(createCollagenBoostAlert(elasticityProxy));
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
    console.error('[M-1] Makeup analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 최근 M-1 분석 결과 목록 조회 API
 *
 * GET /api/analyze/makeup
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('makeup_analyses')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[M-1] Database query error:', error);
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('[M-1] Get makeup analyses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
