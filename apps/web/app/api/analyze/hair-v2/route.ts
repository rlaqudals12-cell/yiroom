/**
 * H-1 헤어분석 v2 API (얼굴형 기반)
 *
 * @description 얼굴형 분석 기반 헤어스타일 추천 API
 * @see docs/specs/SDD-HAIR-ANALYSIS.md
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
  analyzeFaceShape,
  estimateFaceShapeFromPose,
  recommendHairstyles,
  recommendHairColors,
  generateCareTips,
  generateMockHairAnalysisResult,
  type HairAnalysisResult,
  type FaceShapeType,
  type HairTexture,
  FACE_SHAPE_LABELS,
} from '@/lib/analysis/hair';
import type { Landmark33 } from '@/lib/analysis/body-v2';
import {
  checkAndAwardAllAnalysisBadge,
  addXp,
  type BadgeAwardResult,
} from '@/lib/gamification';
import { analyzeHairWithGemini } from '@/lib/gemini/v2-analysis';

// XP 보상 상수
const XP_ANALYSIS_COMPLETE = 10;

// 환경변수: Mock 모드 강제 여부 (개발/테스트용)
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

/**
 * H-1 헤어분석 v2 분석 API
 *
 * POST /api/analyze/hair-v2
 * Body: {
 *   imageBase64: string,                // 얼굴 이미지 (필수)
 *   faceLandmarks?: Array<{x,y,z}>,     // MediaPipe Face Mesh 랜드마크 (선택)
 *   poseLandmarks?: Landmark33[],       // MediaPipe Pose 33 랜드마크 (선택)
 *   currentHair?: {                     // 현재 헤어 정보 (선택)
 *     length?: HairLength,
 *     texture?: HairTexture,
 *     thickness?: string,
 *     density?: string,
 *     scalpCondition?: string
 *   },
 *   personalColorSeason?: string,       // 퍼스널컬러 시즌 (선택)
 *   useMock?: boolean                   // Mock 모드 강제 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   data: HairAssessment,               // DB 저장된 데이터
 *   result: HairAnalysisResult,         // 분석 결과
 *   usedFallback: boolean               // Fallback 사용 여부
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
    const {
      imageBase64,
      faceLandmarks,
      poseLandmarks,
      currentHair,
      personalColorSeason,
      useMock = false,
      skipQualityCheck = false,
    } = body;

    if (!imageBase64 && !faceLandmarks && !poseLandmarks) {
      return validationError('이미지 또는 랜드마크 데이터가 필요합니다.');
    }

    // CIE-1 이미지 품질 검증 (이미지 기반 분석 시에만, Mock 모드 또는 명시적 스킵 시 생략)
    if (imageBase64 && !FORCE_MOCK && !useMock && !skipQualityCheck) {
      const qualityResult = await validateImageForAnalysis(imageBase64, {
        minScore: 40,
        allowWarnings: true,
      });

      if (!qualityResult.success) {
        console.log('[H-1] Image quality check failed:', qualityResult.error.details);
        return imageQualityError(
          qualityResult.error.userMessage,
          qualityResult.error.message
        );
      }

      // 품질 검증 결과 로깅
      logQualityResult('H-1', qualityResult.qualityResult, {
        width: qualityResult.imageData.width,
        height: qualityResult.imageData.height,
      });
    }

    // 분석 실행 (Real AI 또는 Mock)
    let result: HairAnalysisResult;
    let usedFallback = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      result = generateMockHairAnalysisResult({
        personalColorSeason,
      });
      usedFallback = true;
      console.log('[H-1] Using mock analysis');
    } else {
      try {
        console.log('[H-1] Starting face shape analysis...');

        let faceShapeAnalysis;

        // Face Mesh 랜드마크가 있으면 사용 (더 정확)
        if (faceLandmarks && Array.isArray(faceLandmarks) && faceLandmarks.length >= 468) {
          faceShapeAnalysis = analyzeFaceShape(faceLandmarks);
          console.log('[H-1] Using Face Mesh landmarks (468+)');
        }
        // Pose 33 랜드마크가 있으면 대체 분석
        else if (poseLandmarks && Array.isArray(poseLandmarks) && poseLandmarks.length === 33) {
          faceShapeAnalysis = estimateFaceShapeFromPose(poseLandmarks as Landmark33[]);
          console.log('[H-1] Using Pose 33 landmarks (fallback)');
        }
        // 랜드마크가 없으면 Gemini Vision으로 얼굴형 분석
        else if (imageBase64) {
          console.log('[H-1] No landmarks provided, trying Gemini Vision...');

          const geminiResult = await analyzeHairWithGemini(imageBase64);

          if (geminiResult.data && !geminiResult.usedFallback) {
            // Gemini 분석 성공 - 결과 변환
            const geminiData = geminiResult.data;
            const faceShapeType = geminiData.faceShape as FaceShapeType;

            faceShapeAnalysis = {
              faceShape: faceShapeType,
              faceShapeLabel: FACE_SHAPE_LABELS[faceShapeType],
              confidence: geminiData.confidence / 100,
              ratios: {
                faceLength: geminiData.estimatedRatios.faceLength,
                faceWidth: geminiData.estimatedRatios.faceWidth,
                foreheadWidth: geminiData.estimatedRatios.foreheadWidth,
                cheekboneWidth: geminiData.estimatedRatios.cheekboneWidth,
                jawWidth: geminiData.estimatedRatios.jawWidth,
                lengthToWidthRatio: geminiData.estimatedRatios.lengthToWidthRatio,
              },
            };

            console.log('[H-1] Gemini analysis succeeded:', faceShapeType, 'Confidence:', geminiData.confidence);
          } else {
            // Gemini 분석 실패 - Mock으로 폴백
            console.log('[H-1] Gemini analysis failed, using mock fallback');
            result = generateMockHairAnalysisResult({ personalColorSeason });
            usedFallback = true;

            const supabase = createServiceRoleClient();
            return await saveAndRespond(supabase, userId, result, usedFallback);
          }
        }
        // 이미지도 없으면 Mock 폴백
        else {
          console.log('[H-1] No image or landmarks, using mock fallback');
          result = generateMockHairAnalysisResult({ personalColorSeason });
          usedFallback = true;

          const supabase = createServiceRoleClient();
          return await saveAndRespond(supabase, userId, result, usedFallback);
        }

        // 헤어스타일 추천 생성
        const styleRecommendations = recommendHairstyles(faceShapeAnalysis.faceShape, {
          maxResults: 5,
        });

        // 헤어컬러 추천 (퍼스널컬러 연계)
        const colorRecommendations = recommendHairColors(
          personalColorSeason || 'spring',
          { maxResults: 4 }
        );

        // 케어 팁 생성
        const hairTexture = (currentHair?.texture || 'straight') as HairTexture;
        const careTips = generateCareTips(faceShapeAnalysis.faceShape, {
          texture: hairTexture,
          scalpCondition: currentHair?.scalpCondition || 'normal',
        });

        result = {
          id: `h1-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          faceShapeAnalysis,
          hairColorAnalysis: {
            currentColor: undefined,
            skinToneMatch: 75 + Math.floor(Math.random() * 15),
            recommendedColors: colorRecommendations,
          },
          currentHairInfo: currentHair,
          styleRecommendations,
          careTips,
          analyzedAt: new Date().toISOString(),
          usedFallback: false,
        };

        console.log('[H-1] Analysis completed:', faceShapeAnalysis.faceShape, 'Confidence:', faceShapeAnalysis.confidence);
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백
        console.error('[H-1] Analysis error, falling back to mock:', aiError);
        result = generateMockHairAnalysisResult({ personalColorSeason });
        usedFallback = true;
      }
    }

    const supabase = createServiceRoleClient();
    return await saveAndRespond(supabase, userId, result, usedFallback);
  } catch (error) {
    console.error('[H-1] Hair analysis v2 error:', error);
    return internalError(
      '분석 중 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * DB 저장 및 응답 생성
 */
async function saveAndRespond(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  result: HairAnalysisResult,
  usedFallback: boolean
) {
  // DB에 저장 - hair_assessments 테이블 사용
  const { data, error } = await supabase
    .from('hair_assessments')
    .insert({
      clerk_user_id: userId,
      face_shape: result.faceShapeAnalysis.faceShape,
      face_shape_label: result.faceShapeAnalysis.faceShapeLabel,
      confidence: result.faceShapeAnalysis.confidence,
      analysis_data: {
        version: 2,
        faceShapeAnalysis: result.faceShapeAnalysis,
        hairColorAnalysis: result.hairColorAnalysis,
        currentHairInfo: result.currentHairInfo,
      },
      style_recommendations: result.styleRecommendations,
      care_tips: result.careTips,
      used_fallback: usedFallback,
    })
    .select()
    .single();

  if (error) {
    console.error('[H-1] Database insert error:', error);
    return dbError('분석 결과 저장에 실패했습니다.', error.message);
  }

  // users 테이블에 H-1 결과 동기화 (비정규화 - 빠른 조회용)
  const { error: userUpdateError } = await supabase
    .from('users')
    .update({
      latest_hair_assessment_id: data.id,
      face_shape: result.faceShapeAnalysis.faceShape,
    })
    .eq('clerk_user_id', userId);

  if (userUpdateError) {
    console.warn('[H-1] Failed to sync to users table:', userUpdateError);
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

    // 'hair'는 현재 지원되는 배지 타입이 아님 (personal-color, skin, body, posture만 지원)
    // 향후 hair 배지 추가 시 여기에 awardAnalysisBadge 호출 추가

    const allBadge = await checkAndAwardAllAnalysisBadge(supabase, userId);
    if (allBadge) {
      gamificationResult.badgeResults.push(allBadge);
    }
  } catch (gamificationError) {
    console.error('[H-1] Gamification error:', gamificationError);
  }

  return NextResponse.json({
    success: true,
    data,
    result,
    usedFallback,
    gamification: gamificationResult,
  });
}

/**
 * 최근 H-1 분석 결과 조회 API
 *
 * GET /api/analyze/hair-v2
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError();
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('hair_assessments')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[H-1] Database query error:', error);
      return dbError('분석 결과를 불러오는데 실패했습니다.', error.message);
    }

    // v2 형식으로 변환 (analysis_data에 version: 2가 있으면 v2)
    const isV2 = data?.analysis_data?.version === 2;

    return NextResponse.json({
      success: true,
      data: data || null,
      hasResult: !!data,
      isV2,
    });
  } catch (error) {
    console.error('[H-1] Get hair analysis v2 error:', error);
    return internalError(
      '분석 결과 조회 중 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
  }
}
