/**
 * PC-2 퍼스널컬러 v2 API (Lab 12톤 시스템)
 *
 * @description Lab 색공간 기반 12톤 퍼스널컬러 분석 API
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
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
  classifyTone,
  rgbToLab,
  generateMockResult,
  getTonePalette,
  getToneLabel,
  type TwelveTone,
  type PersonalColorV2Result,
  SEASON_DESCRIPTIONS,
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

    // CIE-1 이미지 품질 검증 (이미지 기반 분석 시에만, Mock 모드 또는 명시적 스킵 시 생략)
    if (imageBase64 && !FORCE_MOCK && !useMock && !skipQualityCheck) {
      const qualityResult = await validateImageForAnalysis(imageBase64, {
        minScore: 40,
        allowWarnings: true,
      });

      if (!qualityResult.success) {
        console.log('[PC-2] Image quality check failed:', qualityResult.error.details);
        return imageQualityError(
          qualityResult.error.userMessage,
          qualityResult.error.message
        );
      }

      // 품질 검증 결과 로깅
      logQualityResult('PC-2', qualityResult.qualityResult, {
        width: qualityResult.imageData.width,
        height: qualityResult.imageData.height,
      });
    }

    // 분석 실행 (Real AI 또는 Mock)
    let result: PersonalColorV2Result;
    let usedFallback = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      result = generateMockResult();
      usedFallback = true;
      console.log('[PC-2] Using mock analysis (12-tone system)');
    } else {
      // Real AI 분석
      try {
        console.log('[PC-2] Starting Lab-based 12-tone analysis...');

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
              contrastLevel: 'medium',
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
          console.log('[PC-2] Extracting skin color with Gemini...');

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
                contrastLevel: geminiResult.data.brightnessLevel === 'light' ? 'high' :
                               geminiResult.data.brightnessLevel === 'dark' ? 'low' : 'medium',
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

            usedFallback = false;
            console.log('[PC-2] Gemini color extraction successful:', classification.tone);
          } else {
            // Gemini 실패: Mock으로 폴백
            console.log('[PC-2] Gemini failed, using fallback');
            result = generateMockResult();
            usedFallback = true;
          }
        }

        console.log('[PC-2] Analysis completed:', result.classification.tone);
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백
        console.error('[PC-2] Analysis error, falling back to mock:', aiError);
        result = generateMockResult();
        usedFallback = true;
      }
    }

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
        season_scores: generateSeasonScores(result.classification.season, result.classification.confidence),
        image_analysis: {
          // PC-2 v2 분석 결과
          version: 2,
          tone: result.classification.tone,
          toneLabel: getToneLabel(result.classification.tone),
          subtype: result.classification.subtype,
          skinLab: result.detailedAnalysis?.skinToneLab || result.classification.measuredLab,
          palette: result.palette,
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
      return dbError('분석 결과 저장에 실패했습니다.', error.message);
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

    return NextResponse.json({
      success: true,
      data,
      result,
      usedFallback,
      gamification: gamificationResult,
    });
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

function generateSeasonScores(
  season: string,
  confidence: number
): Record<string, number> {
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
    'light-spring', 'true-spring', 'bright-spring',
    'muted-autumn', 'true-autumn', 'deep-autumn',
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
    'light-spring', 'true-spring', 'bright-spring',
    'muted-autumn', 'true-autumn', 'deep-autumn',
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

function determineMetals(undertone: 'warm' | 'cool' | 'neutral'): ('gold' | 'silver' | 'rose-gold')[] {
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
