/**
 * C-2 체형분석 v2 API (MediaPipe 33 랜드마크)
 *
 * @description MediaPipe Pose 33 랜드마크 기반 체형 분석 API
 * @deprecated 2026-04-24 — 이 엔드포인트는 **orphan**입니다. 웹/모바일 UI에서 호출하지 않으며,
 *   실제 사용자 체형 분석은 다음 경로로 이관됐습니다:
 *   - 개별 진입: `/api/analyze/body` (v1, `lib/analysis/body-v2` 내부 재사용)
 *   - 통합 진입: `/api/analyze/integrated` (ADR-099, PC/S/C/H/M 5축 동시 실행)
 *   현재는 하위 호환용 레거시 shim으로만 남아 있으며, 향후 클린업 세션에서 삭제 예정입니다.
 *   관련: ADR-104, 2026-04-24-integrated-analysis-deployment.md §8
 * @see docs/specs/SDD-BODY-ANALYSIS-v2.md
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
  runFullPipeline,
  computeHybridTrust,
  type PipelineMetadata,
  type HybridTrustResult,
} from '@/lib/api/image-pipeline';
import {
  generateMockBodyAnalysisResult,
  classifyBodyType,
  getBodyShapeInfo,
  calculateClassificationConfidence,
  calculateBodyRatios,
  getStylesToAvoid,
  getStylingPriorities,
  generateMockPoseResult,
  type BodyAnalysisV2Result,
  type Landmark33,
  type PoseDetectionResult,
  type BodyRatios,
} from '@/lib/analysis/body-v2';
import { bodyShapeToType3 } from '@/lib/body';
import { analyzeBodyWithGemini } from '@/lib/gemini/v2-analysis';
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
 * C-2 체형분석 v2 분석 API
 *
 * POST /api/analyze/body-v2
 * Body: {
 *   imageBase64: string,              // 전신 이미지 (필수)
 *   landmarks?: Landmark33[],         // MediaPipe 랜드마크 (선택 - 클라이언트에서 추출 시)
 *   useMock?: boolean                 // Mock 모드 강제 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   data: BodyAssessmentV2,           // DB 저장된 데이터
 *   result: BodyAnalysisV2Result,     // 분석 결과
 *   usedFallback: boolean             // Fallback 사용 여부
 * }
 */
// eslint-disable-next-line sonarjs/cognitive-complexity -- API route handler
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
    const { imageBase64, landmarks, useMock = false, skipQualityCheck = false } = body;

    if (!imageBase64 && !landmarks) {
      return validationError('이미지 또는 랜드마크 데이터가 필요합니다.');
    }

    // CIE 풀 파이프라인 (CIE-1 품질 + CIE-3 AWB + CIE-4 조명)
    let pipelineMeta: PipelineMetadata | undefined;
    if (imageBase64 && !FORCE_MOCK && !useMock && !skipQualityCheck) {
      const pipelineResult = await runFullPipeline(imageBase64, {
        minScore: 35, // 체형 분석은 약간 낮은 기준 허용
        allowWarnings: true,
      });

      if (!pipelineResult.success) {
        return imageQualityError(pipelineResult.error.userMessage, pipelineResult.error.message);
      }

      pipelineMeta = pipelineResult.pipeline;
    }

    // 분석 실행 (Real AI 또는 Mock)
    let result: BodyAnalysisV2Result;
    let usedFallback = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      result = generateMockBodyAnalysisResult();
      usedFallback = true;
    } else {
      // Real AI 분석
      try {
        // 클라이언트에서 랜드마크를 제공한 경우 직접 분석
        if (landmarks && Array.isArray(landmarks) && landmarks.length === 33) {
          const typedLandmarks = landmarks as Landmark33[];

          // PoseDetectionResult 생성
          const poseDetection: PoseDetectionResult = {
            landmarks: typedLandmarks,
            overallVisibility: typedLandmarks.reduce((sum, lm) => sum + lm.visibility, 0) / 33,
            confidence: 0.85, // 클라이언트 제공 데이터 기본 신뢰도
          };

          // 체형 비율 계산
          const bodyRatios = calculateBodyRatios(poseDetection);

          // 체형 분류
          const bodyShape = classifyBodyType(bodyRatios);
          const bodyShapeInfo = getBodyShapeInfo(bodyShape);
          const measurementConfidence = calculateClassificationConfidence(bodyRatios, bodyShape);

          result = {
            id: `c2-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            poseDetection,
            bodyRatios,
            bodyShape,
            bodyShapeInfo,
            stylingRecommendations: {
              tops: bodyShapeInfo.stylingTips.slice(0, 2),
              bottoms: getStylingPriorities(bodyShape).filter(
                (s) => s.includes('팬츠') || s.includes('스커트')
              ),
              outerwear: ['롱 카디건', '테일러드 재킷'],
              silhouettes: getStylingPriorities(bodyShape),
              avoid: getStylesToAvoid(bodyShape),
            },
            measurementConfidence,
            analyzedAt: new Date().toISOString(),
            usedFallback: false,
          };
        } else {
          // 이미지 기반 분석 - Gemini Vision으로 체형 분석

          const geminiResult = await analyzeBodyWithGemini(imageBase64);

          if (geminiResult.data && !geminiResult.usedFallback) {
            // Gemini 분석 성공 - 결과 변환
            const geminiData = geminiResult.data;

            // Gemini 응답을 BodyAnalysisV2Result로 변환
            const bodyShape = geminiData.bodyShape;
            const bodyShapeInfo = getBodyShapeInfo(bodyShape);

            // Gemini 추정 비율을 BodyRatios로 변환
            const estimatedBodyRatios: BodyRatios = {
              shoulderWidth: 40, // 추정값 (cm)
              waistWidth: 40 / geminiData.estimatedRatios.shoulderToWaistRatio,
              hipWidth:
                40 /
                geminiData.estimatedRatios.shoulderToWaistRatio /
                geminiData.estimatedRatios.waistToHipRatio,
              shoulderToWaistRatio: geminiData.estimatedRatios.shoulderToWaistRatio,
              waistToHipRatio: geminiData.estimatedRatios.waistToHipRatio,
              upperBodyLength: 45, // 추정값
              lowerBodyLength: 45 / geminiData.estimatedRatios.upperToLowerRatio,
              upperToLowerRatio: geminiData.estimatedRatios.upperToLowerRatio,
              armLength: 55, // 추정값
              legLength: 80, // 추정값
              armToTorsoRatio: 1.22, // 일반적 비율
            };

            // Mock PoseDetectionResult 생성 (Gemini는 랜드마크 제공 안 함)
            const mockPose = generateMockPoseResult();

            result = {
              id: `c2-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              poseDetection: mockPose,
              bodyRatios: estimatedBodyRatios,
              bodyShape,
              bodyShapeInfo,
              stylingRecommendations: {
                tops: geminiData.stylingRecommendations.tops,
                bottoms: geminiData.stylingRecommendations.bottoms,
                outerwear: ['롱 카디건', '테일러드 재킷'],
                silhouettes: getStylingPriorities(bodyShape),
                avoid: geminiData.stylingRecommendations.avoid,
              },
              measurementConfidence: geminiData.confidence / 100,
              analyzedAt: new Date().toISOString(),
              usedFallback: false,
            };
          } else {
            // Gemini 분석 실패 - Mock으로 폴백
            result = generateMockBodyAnalysisResult();
            usedFallback = true;
          }
        }
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백
        console.error('[C-2] Analysis error, falling back to mock:', aiError);
        result = generateMockBodyAnalysisResult();
        usedFallback = true;
      }
    }

    // 하이브리드 신뢰도 통합 (CIE + AI)
    const aiConfidence = Math.round(result.measurementConfidence * 100);
    const hybridTrust: HybridTrustResult = computeHybridTrust(
      pipelineMeta,
      aiConfidence,
      usedFallback
    );

    // DB 저장 및 후처리 (Mock 모드에서 DB 실패 시 합성 응답 반환)
    try {
      const supabase = createServiceRoleClient();

      // DB에 저장
      const { data, error } = await supabase
        .from('body_assessments')
        .insert({
          clerk_user_id: userId,
          // v2 분석 결과를 기존 스키마에 맞게 매핑
          body_type: bodyShapeToType3(result.bodyShape),
          body_shape: result.bodyShape,
          confidence: result.measurementConfidence,
          analysis_data: {
            version: 2,
            bodyShape: result.bodyShape,
            bodyShapeLabel: result.bodyShapeInfo.label,
            bodyShapeDescription: result.bodyShapeInfo.description,
            ratios: result.bodyRatios,
            postureAnalysis: result.postureAnalysis,
          },
          styling_recommendations: result.stylingRecommendations,
          styles_to_avoid: result.stylingRecommendations?.avoid,
        })
        .select()
        .single();

      if (error) {
        console.error('[C-2] Database insert error:', error);
        // DB 저장 실패해도 분석 결과는 반환 (사용자 경험 우선)
        const syntheticId = crypto.randomUUID();
        return NextResponse.json({
          success: true,
          data: { id: syntheticId, clerk_user_id: userId, created_at: new Date().toISOString() },
          result,
          usedFallback,
          dbSaveFailed: true,
          gamification: { badgeResults: [], xpAwarded: 0 },
          pipeline: pipelineMeta,
          trust: hybridTrust,
        });
      }

      // users 테이블에 C-2 결과 동기화 (비정규화 - 빠른 조회용)
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          latest_body_assessment_id: data.id,
          body_type: bodyShapeToType3(result.bodyShape),
        })
        .eq('clerk_user_id', userId);

      if (userUpdateError) {
        console.warn('[C-2] Failed to sync to users table:', userUpdateError);
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

        const bodyBadge = await awardAnalysisBadge(supabase, userId, 'body');
        if (bodyBadge) {
          gamificationResult.badgeResults.push(bodyBadge);
        }

        const allBadge = await checkAndAwardAllAnalysisBadge(supabase, userId);
        if (allBadge) {
          gamificationResult.badgeResults.push(allBadge);
        }
      } catch (gamificationError) {
        console.error('[C-2] Gamification error:', gamificationError);
      }

      // BeautyProfile 자동 갱신 (비차단)
      try {
        const { updateBeautyProfileField, mapBodyAssessment } = await import('@/lib/capsule');
        await updateBeautyProfileField(
          userId,
          'C',
          mapBodyAssessment({
            body_shape: result.bodyShape,
            analysis_data: { ratios: result.bodyRatios },
          })
        );
      } catch (profileError) {
        console.error('[C-2] BeautyProfile update failed (non-blocking):', profileError);
      }

      return NextResponse.json({
        success: true,
        data,
        result,
        usedFallback,
        gamification: gamificationResult,
        pipeline: pipelineMeta,
        trust: hybridTrust,
      });
    } catch (dbOperationError) {
      // DB 실패 시에도 분석 결과 반환 (사용자 경험 우선)
      console.warn('[C-2] DB operations failed, using synthetic response');
      console.error('[C-2] DB error details:', {
        error:
          dbOperationError instanceof Error ? dbOperationError.message : String(dbOperationError),
      });
      const syntheticId = crypto.randomUUID();
      return NextResponse.json({
        success: true,
        data: {
          id: syntheticId,
          clerk_user_id: userId,
          created_at: new Date().toISOString(),
        },
        result,
        usedFallback,
        dbSaveFailed: true,
        gamification: { badgeResults: [], xpAwarded: 0 },
        pipeline: pipelineMeta,
        trust: hybridTrust,
      });
    }
  } catch (error) {
    console.error('[C-2] Body analysis v2 error:', error);
    return internalError(
      '분석 중 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * 최근 C-2 분석 결과 조회 API
 *
 * GET /api/analyze/body-v2
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError();
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('body_assessments')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[C-2] Database query error:', error);
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
    console.error('[C-2] Get body analysis v2 error:', error);
    return internalError(
      '분석 결과 조회 중 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
  }
}

// =============================================================================
// 헬퍼 함수
// =============================================================================
