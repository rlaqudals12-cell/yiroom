/**
 * PC-2 퍼스널컬러 v2 API (Lab 12톤 시스템)
 *
 * @description Lab 색공간 기반 12톤 퍼스널컬러 분석 API
 * @deprecated 2026-04-24 — 이 엔드포인트는 **orphan**입니다. 웹/모바일 UI에서 호출하지 않으며,
 *   실제 사용자 퍼스널컬러 분석은 다음 경로로 이관됐습니다:
 *   - 개별 진입: `/api/analyze/personal-color` (v1, `lib/analysis/personal-color-v2` 내부 재사용)
 *   - 통합 진입: `/api/analyze/integrated` (ADR-099, PC/S/C/H/M 5축 동시 실행)
 *   현재는 하위 호환용 레거시 shim으로만 남아 있으며, 향후 클린업 세션에서 삭제 예정입니다.
 *   관련: ADR-104, 2026-04-24-integrated-analysis-deployment.md §8
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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
  classifyTone,
  rgbToLab,
  generateMockResult,
  getTonePalette,
  getToneLabel,
  type TwelveTone,
  type PersonalColorV2Result,
} from '@/lib/analysis/personal-color-v2';
import {
  extractSkinColorWithGemini,
  mapBrightnessToValueLevel,
  mapSaturationLevel,
} from '@/lib/gemini/v2-analysis';
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
 * PC-2 퍼스널컬러 v2 분석 API
 *
 * POST /api/analyze/personal-color-v2
 * Body: {
 *   imageBase64: string,              // 얼굴 이미지 (필수)
 *   skinRgb?: { r: number, g: number, b: number }, // 피부색 RGB (선택)
 *   useMock?: boolean                 // Mock 모드 강제 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   data: PersonalColorV2Assessment,  // DB 저장된 데이터
 *   result: PersonalColorV2Result,    // 분석 결과
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
    const { imageBase64, skinRgb, useMock = false, skipQualityCheck = false } = body;

    if (!imageBase64 && !skinRgb) {
      return validationError('이미지 또는 피부색 정보가 필요합니다.');
    }

    // 퍼스널 대비 실측값 (ADR-116) — 클라이언트가 피부·모발 L* 격차를 측정해 전달.
    // ⚠️ 클라이언트 산출값을 신뢰한다: 표시용 힌트이지 보안 자산이 아니므로 수용(v2: 서버 재검증 여지).
    // 잘못된 값/미측정은 무시(undefined) — 있을 때만 detailedAnalysis에 실어 저장 경로로 흘린다.
    const measuredContrast = z
      .enum(['low', 'medium', 'high'])
      .optional()
      .catch(undefined)
      .parse(body?.contrastLevel);

    // CIE 풀 파이프라인 (CIE-1 품질 + CIE-3 AWB + CIE-4 조명)
    let pipelineMeta: PipelineMetadata | undefined;
    if (imageBase64 && !FORCE_MOCK && !useMock && !skipQualityCheck) {
      const pipelineResult = await runFullPipeline(imageBase64, {
        minScore: 40,
        allowWarnings: true,
      });

      if (!pipelineResult.success) {
        return imageQualityError(pipelineResult.error.userMessage, pipelineResult.error.message);
      }

      pipelineMeta = pipelineResult.pipeline;
    }

    // 분석 실행 (Real AI 또는 Mock)
    let result: PersonalColorV2Result;
    let usedFallback = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      result = generateMockResult();
      usedFallback = true;
    } else {
      // Real AI 분석
      try {
        // skinRgb가 제공된 경우 직접 분석
        // 아닌 경우 이미지에서 피부색 추출 필요 (Gemini 연동)
        if (skinRgb) {
          const { r, g, b } = skinRgb;
          const skinLab = rgbToLab(r, g, b);
          const classification = classifyTone(skinLab);
          const palette = getTonePalette(classification.tone);
          const makeup = generateMakeupRecommendations(classification.tone);
          const styling = generateStylingRecommendations(classification.tone);

          result = {
            id: `pc2-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            classification,
            palette,
            detailedAnalysis: {
              skinToneLab: skinLab,
              // contrastLevel(퍼스널 대비)은 모발-피부 명도 실측값 — 클라이언트 실측이 있을 때만 채운다(ADR-116)
              ...(measuredContrast ? { contrastLevel: measuredContrast } : {}),
              saturationLevel: 'medium',
              valueLevel: 'medium',
            },
            stylingRecommendations: {
              clothing: styling.clothingColors,
              metals: determineMetals(classification.undertone),
              jewelry: styling.accessoryColors,
            },
            analyzedAt: new Date().toISOString(),
            usedFallback: false,
          };

          // 팔레트에 메이크업 컬러 추가 (TonePalette 타입에 맞게)
          result.palette.lipColors = makeup.lipColors;
          result.palette.eyeshadowColors = makeup.eyeColors;
          result.palette.blushColors = makeup.blushColors;
        } else {
          // 이미지 기반 분석 - Gemini로 피부색 추출

          const geminiResult = await extractSkinColorWithGemini(imageBase64);

          if (geminiResult.data && !geminiResult.usedFallback) {
            // Gemini 성공: 추출된 RGB로 Lab 분석
            const { r, g, b } = geminiResult.data.skinRgb;
            const skinLab = rgbToLab(r, g, b);
            const classification = classifyTone(skinLab);
            const palette = getTonePalette(classification.tone);
            const makeup = generateMakeupRecommendations(classification.tone);
            const styling = generateStylingRecommendations(classification.tone);

            result = {
              id: `pc2-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              classification,
              palette,
              detailedAnalysis: {
                skinToneLab: skinLab,
                // contrastLevel(퍼스널 대비)은 모발-피부 명도 실측값 — VLM 밝기 추정으로
                // 지어내지 않고, 클라이언트 모발 샘플러 실측이 전달됐을 때만 채운다(ADR-116 결정 2).
                ...(measuredContrast ? { contrastLevel: measuredContrast } : {}),
                saturationLevel: mapSaturationLevel(geminiResult.data.saturationLevel),
                valueLevel: mapBrightnessToValueLevel(geminiResult.data.brightnessLevel),
              },
              stylingRecommendations: {
                clothing: styling.clothingColors,
                metals: determineMetals(classification.undertone),
                jewelry: styling.accessoryColors,
              },
              analyzedAt: new Date().toISOString(),
              usedFallback: false,
            };

            result.palette.lipColors = makeup.lipColors;
            result.palette.eyeshadowColors = makeup.eyeColors;
            result.palette.blushColors = makeup.blushColors;
          } else {
            // Gemini 실패: Mock으로 폴백
            result = generateMockResult();
            usedFallback = true;
          }
        }
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백
        console.error('[PC-2] Analysis error, falling back to mock:', aiError);
        result = generateMockResult();
        usedFallback = true;
      }
    }

    // 하이브리드 신뢰도 통합 (CIE + AI)
    const aiConfidence = result.classification?.confidence ?? 50;
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
        .from('personal_color_assessments')
        .insert({
          clerk_user_id: userId,
          questionnaire_answers: {},
          face_image_url: null,
          season: mapSeasonToDb(result.classification.season),
          undertone: mapUndertoneToDb(result.classification.undertone),
          confidence: result.classification.confidence,
          season_scores: generateSeasonScores(
            result.classification.season,
            result.classification.confidence
          ),
          image_analysis: {
            // PC-2 v2 분석 결과
            version: 2,
            tone: result.classification.tone,
            toneLabel: getToneLabel(result.classification.tone),
            subtype: result.classification.subtype,
            skinLab: result.detailedAnalysis?.skinToneLab || result.classification.measuredLab,
            palette: result.palette,
            // 퍼스널 대비(ADR-116) — 실측값이 있을 때만 저장(없으면 필드 자체 생략)
            ...(result.detailedAnalysis?.contrastLevel
              ? { contrastLevel: result.detailedAnalysis.contrastLevel }
              : {}),
          },
          best_colors: result.palette.mainColors || [],
          worst_colors: result.palette.avoidColors || [],
          makeup_recommendations: {
            lipstick: result.palette.lipColors || [],
            eyeshadow: result.palette.eyeshadowColors || [],
            blush: result.palette.blushColors || [],
          },
          fashion_recommendations: {
            clothing: result.stylingRecommendations.clothing || [],
            accessories: result.stylingRecommendations.jewelry || [],
          },
        })
        .select()
        .single();

      if (error) {
        console.error('[PC-2] Database insert error:', error);
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

      // users 테이블에 PC-2 결과 동기화 (비정규화 - 빠른 조회용)
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          latest_pc_assessment_id: data.id,
          personal_color_season: mapSeasonToDb(result.classification.season),
          personal_color_undertone: mapUndertoneToDb(result.classification.undertone),
        })
        .eq('clerk_user_id', userId);

      if (userUpdateError) {
        console.warn('[PC-2] Failed to sync to users table:', userUpdateError);
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

        const pcBadge = await awardAnalysisBadge(supabase, userId, 'personal-color');
        if (pcBadge) {
          gamificationResult.badgeResults.push(pcBadge);
        }

        const allBadge = await checkAndAwardAllAnalysisBadge(supabase, userId);
        if (allBadge) {
          gamificationResult.badgeResults.push(allBadge);
        }
      } catch (gamificationError) {
        console.error('[PC-2] Gamification error:', gamificationError);
      }

      // BeautyProfile 자동 갱신 (비차단)
      try {
        const { updateBeautyProfileField, mapPCAssessment } = await import('@/lib/capsule');
        await updateBeautyProfileField(
          userId,
          'PC',
          mapPCAssessment({
            season: result.classification?.season,
            undertone: result.classification?.undertone,
            image_analysis: { tone: result.classification?.tone },
            best_colors: result.palette?.mainColors,
          })
        );
      } catch (profileError) {
        console.error('[PC-2] BeautyProfile update failed (non-blocking):', profileError);
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
      console.warn('[PC-2] DB operations failed, using synthetic response');
      console.error('[PC-2] DB error details:', {
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
    console.error('[PC-2] Personal color v2 analysis error:', error);
    return internalError(
      '분석 중 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * 최근 PC-2 분석 결과 조회 API
 *
 * GET /api/analyze/personal-color-v2
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError();
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('personal_color_assessments')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[PC-2] Database query error:', error);
      return dbError('분석 결과를 불러오는데 실패했습니다.', error.message);
    }

    return NextResponse.json({
      success: true,
      data: data || null,
      hasResult: !!data,
    });
  } catch (error) {
    console.error('[PC-2] Get personal color v2 error:', error);
    return internalError(
      '분석 결과 조회 중 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
  }
}

// =============================================================================
// 헬퍼 함수
// =============================================================================

function mapSeasonToDb(season: string): string {
  const map: Record<string, string> = {
    spring: 'Spring',
    summer: 'Summer',
    autumn: 'Autumn',
    winter: 'Winter',
  };
  return map[season] || season;
}

function mapUndertoneToDb(undertone: string): string {
  const map: Record<string, string> = {
    warm: 'Warm',
    cool: 'Cool',
    neutral: 'Neutral',
  };
  return map[undertone] || undertone;
}

function generateSeasonScores(season: string, confidence: number): Record<string, number> {
  const seasons = ['spring', 'summer', 'autumn', 'winter'];
  const scores: Record<string, number> = {};

  for (const s of seasons) {
    scores[s] = s === season ? confidence : Math.max(0, 100 - confidence - Math.random() * 20);
  }

  return scores;
}

function generateMakeupRecommendations(tone: TwelveTone): {
  lipColors: string[];
  eyeColors: string[];
  blushColors: string[];
} {
  // 톤별 메이크업 추천 (간략화)
  const warmTones: TwelveTone[] = [
    'light-spring',
    'true-spring',
    'bright-spring',
    'muted-autumn',
    'true-autumn',
    'deep-autumn',
  ];

  if (warmTones.includes(tone)) {
    return {
      lipColors: ['코랄', '피치', '오렌지 레드', '웜 누드'],
      eyeColors: ['골드', '브론즈', '테라코타', '웜 브라운'],
      blushColors: ['피치', '코랄', '아프리콧'],
    };
  }

  return {
    lipColors: ['로즈', '베리', '플럼', '쿨 핑크'],
    eyeColors: ['실버', '그레이', '버건디', '쿨 브라운'],
    blushColors: ['로즈', '핑크', '라벤더'],
  };
}

function generateStylingRecommendations(tone: TwelveTone): {
  clothingColors: string[];
  accessoryColors: string[];
} {
  const warmTones: TwelveTone[] = [
    'light-spring',
    'true-spring',
    'bright-spring',
    'muted-autumn',
    'true-autumn',
    'deep-autumn',
  ];

  if (warmTones.includes(tone)) {
    return {
      clothingColors: ['아이보리', '베이지', '카멜', '테라코타', '올리브'],
      accessoryColors: ['골드', '브론즈', '앰버', '터쿼이즈'],
    };
  }

  return {
    clothingColors: ['화이트', '그레이', '네이비', '버건디', '라벤더'],
    accessoryColors: ['실버', '화이트골드', '플래티넘', '펄'],
  };
}

function determineMetals(
  undertone: 'warm' | 'cool' | 'neutral'
): ('gold' | 'silver' | 'rose-gold')[] {
  switch (undertone) {
    case 'warm':
      return ['gold', 'rose-gold'];
    case 'cool':
      return ['silver'];
    case 'neutral':
    default:
      return ['gold', 'silver', 'rose-gold'];
  }
}
