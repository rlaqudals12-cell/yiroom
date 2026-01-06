import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzePosture, type GeminiPostureAnalysisResult } from '@/lib/gemini';
import {
  generateMockPostureAnalysis,
  POSTURE_TYPES,
  type PostureType,
} from '@/lib/mock/posture-analysis';
import { awardAnalysisBadge, addXp, type BadgeAwardResult } from '@/lib/gamification';

// XP 보상 상수
const XP_ANALYSIS_COMPLETE = 10;

// 환경변수: Mock 모드 강제 여부 (개발/테스트용)
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

/**
 * A-1 자세 분석 API (Real AI + Mock Fallback)
 *
 * POST /api/analyze/posture
 * Body: {
 *   frontImageBase64: string,      // 정면 이미지 (필수)
 *   sideImageBase64?: string,      // 측면 이미지 (선택)
 *   bodyType?: string,             // C-1 체형 연동 (선택)
 *   useMock?: boolean              // Mock 모드 강제 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   data: PostureAnalysis,         // DB 저장된 데이터
 *   result: PostureAnalysisResult, // AI 분석 결과
 *   imagesAnalyzed: { front, side },
 *   usedMock: boolean
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
    const { frontImageBase64, sideImageBase64, bodyType, useMock = false } = body;

    if (!frontImageBase64) {
      return NextResponse.json({ error: 'Front image is required' }, { status: 400 });
    }

    // 분석에 사용된 이미지 현황
    const imagesAnalyzed = {
      front: true,
      side: !!sideImageBase64,
    };
    const imageCount = Object.values(imagesAnalyzed).filter(Boolean).length;

    // AI 분석 실행 (Real AI 또는 Mock)
    let result: GeminiPostureAnalysisResult;
    let usedMock = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      const mockResult = generateMockPostureAnalysis(bodyType);
      result = {
        postureType: mockResult.postureType,
        postureTypeLabel: mockResult.postureTypeLabel,
        postureTypeDescription: mockResult.postureTypeDescription,
        overallScore: mockResult.overallScore,
        confidence: mockResult.confidence,
        frontAnalysis: mockResult.frontAnalysis,
        sideAnalysis: mockResult.sideAnalysis,
        concerns: mockResult.concerns,
        stretchingRecommendations: mockResult.stretchingRecommendations,
        insight: mockResult.insight,
        bodyTypeCorrelation: mockResult.bodyTypeCorrelation,
        imageQuality: {
          angle: sideImageBase64 ? 'both' : 'front',
          fullBodyVisible: true,
          clothingFit: 'fitted',
          analysisReliability: sideImageBase64 ? 'high' : 'medium',
        },
      };
      usedMock = true;
      console.log('[A-1] Using mock analysis');
    } else {
      // Real AI 분석
      try {
        console.log(`[A-1] Starting Gemini analysis (${imageCount} image(s))...`);
        result = await analyzePosture(frontImageBase64, sideImageBase64, bodyType);
        console.log('[A-1] Gemini analysis completed');

        // 다각도 분석 시 신뢰도 보정
        if (imageCount === 2 && result.imageQuality) {
          result.imageQuality.analysisReliability = 'high';
        }
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백
        console.error('[A-1] Gemini error, falling back to mock:', aiError);
        const mockResult = generateMockPostureAnalysis(bodyType);
        result = {
          postureType: mockResult.postureType,
          postureTypeLabel: mockResult.postureTypeLabel,
          postureTypeDescription: mockResult.postureTypeDescription,
          overallScore: mockResult.overallScore,
          confidence: mockResult.confidence,
          frontAnalysis: mockResult.frontAnalysis,
          sideAnalysis: mockResult.sideAnalysis,
          concerns: mockResult.concerns,
          stretchingRecommendations: mockResult.stretchingRecommendations,
          insight: mockResult.insight,
          bodyTypeCorrelation: mockResult.bodyTypeCorrelation,
          imageQuality: {
            angle: sideImageBase64 ? 'both' : 'front',
            fullBodyVisible: true,
            clothingFit: 'fitted',
            analysisReliability: 'medium',
          },
        };
        usedMock = true;
      }
    }

    const supabase = createServiceRoleClient();

    // 이미지 업로드 (정면 이미지만 저장)
    let frontImageUrl: string | null = null;
    if (frontImageBase64) {
      const fileName = `${userId}/posture/${Date.now()}_front.jpg`;
      const base64Data = frontImageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posture-images')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('[A-1] Image upload error:', uploadError);
      } else {
        frontImageUrl = uploadData.path;
      }
    }

    // C-1 체형 정보 조회 (bodyType이 제공되지 않은 경우)
    let finalBodyType = bodyType;
    if (!finalBodyType) {
      const { data: bodyData } = await supabase
        .from('body_analyses')
        .select('body_type')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (bodyData?.body_type) {
        finalBodyType = bodyData.body_type;
        console.log(`[A-1] Using C-1 body type: ${finalBodyType}`);
      }
    }

    // 자세 타입 정보 보완
    const postureTypeInfo = POSTURE_TYPES[result.postureType as PostureType];

    // DB에 저장
    const { data, error } = await supabase
      .from('posture_analyses')
      .insert({
        clerk_user_id: userId,
        front_image_url: frontImageUrl || '',
        posture_type: result.postureType,
        overall_score: result.overallScore,
        confidence: result.confidence,
        front_analysis: result.frontAnalysis,
        side_analysis: result.sideAnalysis,
        concerns: result.concerns,
        stretching_recommendations: result.stretchingRecommendations,
        insight: result.insight,
        analysis_evidence: result.analysisEvidence || null,
        image_quality: result.imageQuality || null,
        body_type: finalBodyType || null,
        body_type_correlation: result.bodyTypeCorrelation || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[A-1] Database insert error:', error);
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
      // XP 추가 (분석 완료 시 10 XP)
      await addXp(supabase, userId, XP_ANALYSIS_COMPLETE);
      gamificationResult.xpAwarded = XP_ANALYSIS_COMPLETE;

      // 자세 분석 완료 배지 (body 분석 배지로 대체 - 추후 posture 배지 추가 시 변경)
      const bodyBadge = await awardAnalysisBadge(supabase, userId, 'body');
      if (bodyBadge) {
        gamificationResult.badgeResults.push(bodyBadge);
      }
    } catch (gamificationError) {
      console.error('[A-1] Gamification error:', gamificationError);
    }

    return NextResponse.json({
      success: true,
      data: data,
      result: {
        ...result,
        postureTypeLabel: result.postureTypeLabel || postureTypeInfo?.label,
        postureTypeDescription: result.postureTypeDescription || postureTypeInfo?.description,
        analyzedAt: new Date().toISOString(),
      },
      bodyType: finalBodyType,
      imagesAnalyzed,
      usedMock,
      gamification: gamificationResult,
    });
  } catch (error) {
    console.error('[A-1] Posture analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 최근 A-1 분석 결과 목록 조회 API
 *
 * GET /api/analyze/posture
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('posture_analyses')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[A-1] Database query error:', error);
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('[A-1] Get posture analyses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
