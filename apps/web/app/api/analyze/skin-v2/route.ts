/**
 * S-2 피부분석 v2 API (6존 고도화)
 *
 * @description 6존 기반 고도화 피부 분석 API
 * @see docs/specs/SDD-SKIN-ANALYSIS-v2.md
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { applyRateLimit } from '@/lib/security/rate-limit';
import {
  unauthorizedError,
  validationError,
  internalError,
  dbError,
  imageQualityError,
} from '@/lib/api/error-response';
import {
  validateImageForAnalysis,
  logQualityResult,
} from '@/lib/api/image-quality';
import {
  generateMockSkinAnalysisV2Result,
  type SkinAnalysisV2Result,
} from '@/lib/analysis/skin-v2';
import { analyzeSkinV2WithGemini } from '@/lib/gemini/v2-analysis';
import {
  awardAnalysisBadge,
  checkAndAwardAllAnalysisBadge,
  addXp,
  type BadgeAwardResult,
} from '@/lib/gamification';

// XP 보상 상수
const XP_ANALYSIS_COMPLETE = 10;

// 환경변수: Mock 모드 강제 여부 (개발/테스트용)
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

/**
 * S-2 피부분석 v2 분석 API
 *
 * POST /api/analyze/skin-v2
 * Body: {
 *   imageBase64: string,              // 얼굴 이미지 (필수)
 *   useMock?: boolean                 // Mock 모드 강제 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   data: SkinAssessmentV2,           // DB 저장된 데이터
 *   result: SkinAnalysisV2Result,     // 분석 결과
 *   usedFallback: boolean             // Fallback 사용 여부
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
    const { imageBase64, useMock = false, skipQualityCheck = false } = body;

    if (!imageBase64) {
      return validationError('이미지가 필요합니다.');
    }

    // CIE-1 이미지 품질 검증 (Mock 모드 또는 명시적 스킵 시 생략)
    if (!FORCE_MOCK && !useMock && !skipQualityCheck) {
      const qualityResult = await validateImageForAnalysis(imageBase64, {
        minScore: 40,
        allowWarnings: true,
      });

      if (!qualityResult.success) {
        console.log('[S-2] Image quality check failed:', qualityResult.error.details);
        return imageQualityError(
          qualityResult.error.userMessage,
          qualityResult.error.message
        );
      }

      // 품질 검증 결과 로깅
      logQualityResult('S-2', qualityResult.qualityResult, {
        width: qualityResult.imageData.width,
        height: qualityResult.imageData.height,
      });
    }

    // 분석 실행 (Real AI 또는 Mock)
    let result: SkinAnalysisV2Result;
    let usedFallback = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      result = generateMockSkinAnalysisV2Result();
      usedFallback = true;
      console.log('[S-2] Using mock analysis (7-zone system)');
    } else {
      // Real AI 분석 (Gemini Vision API)
      try {
        console.log('[S-2] Starting 7-zone skin analysis with Gemini...');

        const geminiResult = await analyzeSkinV2WithGemini(imageBase64);
        result = geminiResult.result;
        usedFallback = geminiResult.usedFallback;

        console.log(
          '[S-2] Analysis completed:',
          result.skinType,
          'Vitality:',
          result.vitalityScore,
          'Fallback:',
          usedFallback
        );
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백
        console.error('[S-2] Analysis error, falling back to mock:', aiError);
        result = generateMockSkinAnalysisV2Result();
        usedFallback = true;
      }
    }

    const supabase = createServiceRoleClient();

    // DB에 저장
    const { data, error } = await supabase
      .from('skin_assessments')
      .insert({
        clerk_user_id: userId,
        // v2 분석 결과를 기존 스키마에 맞게 매핑
        skin_type: result.skinType,
        scores: {
          version: 2,
          vitalityScore: result.vitalityScore,
          vitalityGrade: result.vitalityGrade,
          scoreBreakdown: result.scoreBreakdown,
        },
        zone_details: {
          zones: result.zoneAnalysis.zones,
          groupAverages: result.zoneAnalysis.groupAverages,
          tUzoneDifference: result.zoneAnalysis.tUzoneDifference,
        },
        concerns: result.primaryConcerns,
        recommendations: result.routineRecommendations?.map(r => ({
          step: r.step,
          category: r.category,
          reason: r.reason,
          ingredients: r.ingredients,
          avoidIngredients: r.avoidIngredients,
        })) ?? [],
      })
      .select()
      .single();

    if (error) {
      console.error('[S-2] Database insert error:', error);
      return dbError('분석 결과 저장에 실패했습니다.', error.message);
    }

    // users 테이블에 S-2 결과 동기화 (비정규화 - 빠른 조회용)
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        latest_skin_assessment_id: data.id,
        skin_type: result.skinType,
      })
      .eq('clerk_user_id', userId);

    if (userUpdateError) {
      console.warn('[S-2] Failed to sync to users table:', userUpdateError);
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
      await addXp(supabase, userId, XP_ANALYSIS_COMPLETE);
      gamificationResult.xpAwarded = XP_ANALYSIS_COMPLETE;

      const skinBadge = await awardAnalysisBadge(supabase, userId, 'skin');
      if (skinBadge) {
        gamificationResult.badgeResults.push(skinBadge);
      }

      const allBadge = await checkAndAwardAllAnalysisBadge(supabase, userId);
      if (allBadge) {
        gamificationResult.badgeResults.push(allBadge);
      }
    } catch (gamificationError) {
      console.error('[S-2] Gamification error:', gamificationError);
    }

    return NextResponse.json({
      success: true,
      data,
      result,
      usedFallback,
      gamification: gamificationResult,
    });
  } catch (error) {
    console.error('[S-2] Skin analysis v2 error:', error);
    return internalError(
      '분석 중 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * 최근 S-2 분석 결과 조회 API
 *
 * GET /api/analyze/skin-v2
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError();
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('skin_assessments')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[S-2] Database query error:', error);
      return dbError('분석 결과를 불러오는데 실패했습니다.', error.message);
    }

    // v2 형식으로 변환 (scores에 version: 2가 있으면 v2)
    const isV2 = data?.scores?.version === 2;

    return NextResponse.json({
      success: true,
      data: data || null,
      hasResult: !!data,
      isV2,
    });
  } catch (error) {
    console.error('[S-2] Get skin analysis v2 error:', error);
    return internalError(
      '분석 결과 조회 중 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * S-2 분석 히스토리 조회 API
 *
 * GET /api/analyze/skin-v2/history
 */
export async function getHistory(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError();
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('skin_assessments')
      .select('id, created_at, skin_type, scores')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[S-2] Database query error:', error);
      return dbError('히스토리 조회에 실패했습니다.', error.message);
    }

    // v2 결과만 필터링
    const v2Results = data?.filter(d => d.scores?.version === 2) || [];

    return NextResponse.json({
      success: true,
      data: v2Results,
      count: v2Results.length,
    });
  } catch (error) {
    console.error('[S-2] Get skin analysis history error:', error);
    return internalError(
      '히스토리 조회 중 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
  }
}
