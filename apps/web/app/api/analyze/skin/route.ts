import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { applyRateLimit } from '@/lib/security/rate-limit';
import { analyzeSkin, type GeminiSkinAnalysisResult } from '@/lib/gemini';
import { generateMockAnalysisResult, FOUNDATION_FORMULAS } from '@/lib/mock/skin-analysis';
import { MOCK_PROBLEM_AREAS } from '@/lib/mock/skin-problem-areas';
import { getWarningIngredientsForSkinType, type SkinType } from '@/lib/ingredients';
import { generateProductRecommendations, formatProductsForDB } from '@/lib/product-recommendations';
import {
  awardAnalysisBadge,
  checkAndAwardAllAnalysisBadge,
  addXp,
  type BadgeAwardResult,
} from '@/lib/gamification';
import {
  unauthorizedError,
  validationError,
  internalError,
  dbError,
} from '@/lib/api/error-response';

// XP 보상 상수
const XP_ANALYSIS_COMPLETE = 10;

// 환경변수: Mock 모드 강제 여부 (개발/테스트용)
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

/**
 * S-1 피부 분석 API (Real AI + Mock Fallback)
 *
 * POST /api/analyze/skin
 * Body: {
 *   imageBase64: string,              // 정면 피부 이미지 (필수) - 하위 호환
 *   frontImageBase64?: string,        // 정면 피부 이미지 (새 API)
 *   leftImageBase64?: string,         // 좌측 피부 이미지 (선택)
 *   rightImageBase64?: string,        // 우측 피부 이미지 (선택)
 *   useMock?: boolean                 // Mock 모드 강제 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   data: SkinAnalysis,          // DB 저장된 데이터
 *   result: SkinAnalysisResult,  // AI 분석 결과
 *   personalColorSeason: string | null,
 *   usedMock: boolean            // Mock 사용 여부
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
      frontImageBase64,
      leftImageBase64,
      rightImageBase64,
      useMock = false,
    } = body;

    // 하위 호환: imageBase64 또는 frontImageBase64 중 하나 필수
    const primaryImage = frontImageBase64 || imageBase64;

    if (!primaryImage) {
      return validationError('이미지가 필요해요');
    }

    // 다각도 이미지 수 계산
    const imagesCount = [primaryImage, leftImageBase64, rightImageBase64].filter(Boolean).length;
    console.log(
      `[S-1] Multi-angle images: ${imagesCount} (front: 1, left: ${leftImageBase64 ? 1 : 0}, right: ${rightImageBase64 ? 1 : 0})`
    );

    // 분석 신뢰도 결정
    const analysisReliability = imagesCount === 3 ? 'high' : imagesCount === 2 ? 'medium' : 'low';

    // AI 분석 실행 (Real AI 또는 Mock)
    let result: GeminiSkinAnalysisResult;
    let usedMock = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      const mockResult = generateMockAnalysisResult();
      result = {
        overallScore: mockResult.overallScore,
        metrics: mockResult.metrics,
        insight: mockResult.insight,
        recommendedIngredients: mockResult.recommendedIngredients,
        skinType: 'normal',
        skinTypeLabel: '중성',
        sensitivityLevel: 'medium',
        concernAreas: ['T존', '눈가'],
        // 분석 근거 데이터 (Mock)
        analysisEvidence: {
          tZoneOiliness: 'normal',
          uZoneHydration: 'normal',
          poreVisibility: 'visible',
          skinTexture: 'smooth',
          rednessLevel: 'none',
          pigmentationPattern: 'even',
          wrinkleDepth: 'none',
          elasticityObservation: 'firm',
        },
        imageQuality: {
          lightingCondition: 'natural',
          makeupDetected: false,
          analysisReliability: analysisReliability as 'high' | 'medium' | 'low',
        },
        // 다각도 분석 메타데이터 (Mock)
        multiAngleMeta: {
          imagesAnalyzed: {
            front: true,
            left: !!leftImageBase64,
            right: !!rightImageBase64,
          },
          asymmetryDetected: false,
        },
        // Phase E: 문제 영역 좌표 (Mock)
        problemAreas: MOCK_PROBLEM_AREAS,
      };
      usedMock = true;
      console.log('[S-1] Using mock analysis');
    } else {
      // Real AI 분석
      try {
        console.log('[S-1] Starting Gemini analysis...');
        // 현재: 정면 이미지 기반 분석 (다각도 이미지는 메타데이터로 활용)
        result = await analyzeSkin(primaryImage);
        // 다각도 메타데이터 추가
        result.multiAngleMeta = {
          imagesAnalyzed: {
            front: true,
            left: !!leftImageBase64,
            right: !!rightImageBase64,
          },
          asymmetryDetected: false, // P2: 좌우 비대칭 AI 감지 (12존 분석 확장 시)
        };
        // 신뢰도 오버라이드 (다각도 촬영 시 향상)
        if (result.imageQuality && imagesCount >= 2) {
          result.imageQuality.analysisReliability = analysisReliability as
            | 'high'
            | 'medium'
            | 'low';
        }
        console.log('[S-1] Gemini analysis completed');
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백
        console.error('[S-1] Gemini error, falling back to mock:', aiError);
        const mockResult = generateMockAnalysisResult();
        result = {
          overallScore: mockResult.overallScore,
          metrics: mockResult.metrics,
          insight: mockResult.insight,
          recommendedIngredients: mockResult.recommendedIngredients,
          skinType: 'normal',
          skinTypeLabel: '중성',
          sensitivityLevel: 'medium',
          concernAreas: ['T존', '눈가'],
          // 분석 근거 데이터 (Mock)
          analysisEvidence: {
            tZoneOiliness: 'normal',
            uZoneHydration: 'normal',
            poreVisibility: 'visible',
            skinTexture: 'smooth',
            rednessLevel: 'none',
            pigmentationPattern: 'even',
            wrinkleDepth: 'none',
            elasticityObservation: 'firm',
          },
          imageQuality: {
            lightingCondition: 'artificial',
            makeupDetected: false,
            analysisReliability: analysisReliability as 'high' | 'medium' | 'low',
          },
          // 다각도 분석 메타데이터 (Mock)
          multiAngleMeta: {
            imagesAnalyzed: {
              front: true,
              left: !!leftImageBase64,
              right: !!rightImageBase64,
            },
            asymmetryDetected: false,
          },
          // Phase E: 문제 영역 좌표 (Mock)
          problemAreas: MOCK_PROBLEM_AREAS,
        };
        usedMock = true;
      }
    }

    const supabase = createServiceRoleClient();

    // 이미지 저장 동의 확인 (PIPA 준수)
    const { data: consentData } = await supabase
      .from('image_consents')
      .select('consent_given')
      .eq('clerk_user_id', userId)
      .eq('analysis_type', 'skin')
      .maybeSingle();

    const hasImageConsent = consentData?.consent_given === true;
    console.log(`[S-1] Image consent status: ${hasImageConsent ? 'granted' : 'not granted'}`);

    // 이미지 업로드 헬퍼 (동의가 있는 경우에만 사용)
    // 반환값: Storage 경로 (private bucket이므로 결과 페이지에서 signed URL 생성)
    const uploadImage = async (base64: string, suffix: string): Promise<string | null> => {
      if (!hasImageConsent) return null;

      const fileName = `${userId}/${Date.now()}_${suffix}.jpg`;
      const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const { data, error } = await supabase.storage.from('skin-images').upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

      if (error) {
        console.error(`Image upload error (${suffix}):`, error);
        return null;
      }

      // Private bucket이므로 경로만 저장 (결과 페이지에서 signed URL 생성)
      return data.path;
    };

    // 다각도 이미지 업로드 (동의가 있는 경우에만)
    let frontImageUrl: string | null = null;
    let _leftImageUrl: string | null = null;
    let _rightImageUrl: string | null = null;

    if (hasImageConsent) {
      console.log('[S-1] 동의 있음 - 이미지 업로드 시작');
      // 정면 이미지 업로드
      if (primaryImage) {
        frontImageUrl = await uploadImage(primaryImage, 'front');
        console.log('[S-1] 정면 이미지 업로드 결과:', frontImageUrl ? '성공' : '실패');
      }

      // 좌측 이미지 업로드 (선택) - 미래 다각도 분석용
      if (leftImageBase64) {
        _leftImageUrl = await uploadImage(leftImageBase64, 'left');
      }

      // 우측 이미지 업로드 (선택) - 미래 다각도 분석용
      if (rightImageBase64) {
        _rightImageUrl = await uploadImage(rightImageBase64, 'right');
      }
    } else {
      console.log('[S-1] 동의 없음 - 이미지 업로드 건너뜀');
    }

    // 하위 호환: 기존 imageUrl은 frontImageUrl 사용
    const imageUrl = frontImageUrl;
    console.log('[S-1] 최종 imageUrl:', imageUrl || '(없음)');

    // 퍼스널 컬러 조회 (자동 연동 + 파운데이션 추천)
    const { data: pcData } = await supabase
      .from('personal_color_assessments')
      .select('season, makeup_recommendations')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const personalColorSeason = pcData?.season || null;

    // 퍼스널 컬러 기반 파운데이션 추천 생성
    let foundationRecommendation: string | null = null;
    if (pcData?.makeup_recommendations?.foundation) {
      // PC-1 결과에서 파운데이션 추천이 있으면 사용
      foundationRecommendation = pcData.makeup_recommendations.foundation;
    } else if (personalColorSeason) {
      // 없으면 시즌 기반 기본 추천
      const seasonFoundationMap: Record<string, string> = {
        Spring: '웜톤 베이지 계열 (피치 베이지, 골드 베이지)',
        Summer: '쿨톤 베이지 계열 (핑크 베이지, 로즈 베이지)',
        Autumn: '웜톤 베이지 계열 (옐로우 베이지, 카멜 베이지)',
        Winter: '쿨톤 베이지 계열 (뉴트럴 베이지, 아이보리)',
      };
      foundationRecommendation = seasonFoundationMap[personalColorSeason] || null;
    }

    // metrics에서 각 지표 추출
    // Mock 데이터 ID: hydration, oil, pores, wrinkles, elasticity, pigmentation, trouble
    const metrics = result.metrics || [];
    const getMetricValue = (id: string, fallbackId?: string) => {
      const found = metrics.find((m: { id: string; value: number }) => m.id === id);
      if (found) return found.value;
      // fallback ID로 재시도 (sensitivity → trouble 매핑)
      if (fallbackId) {
        const fallback = metrics.find((m: { id: string; value: number }) => m.id === fallbackId);
        return fallback?.value ?? null;
      }
      return null;
    };

    // 피부 타입 결정 (유분도 + 민감도 기반)
    const oilLevel = getMetricValue('oil') || 50;
    const sensitivityLevel = getMetricValue('sensitivity', 'trouble') || 50;

    let skinType: SkinType = 'normal';
    if (sensitivityLevel >= 70) {
      // 민감도가 높으면 민감성 피부 우선
      skinType = 'sensitive';
    } else if (oilLevel >= 60) {
      skinType = 'oily';
    } else if (oilLevel <= 40) {
      skinType = 'dry';
    } else if (oilLevel >= 45 && oilLevel <= 55) {
      // T존과 U존 차이가 있는 경우 복합성
      skinType = 'combination';
    }

    // 피부 타입별 주의 성분 조회 (하이브리드 성분 분석)
    console.log(`[S-1] Fetching warning ingredients for ${skinType} skin`);
    const warningIngredients = await getWarningIngredientsForSkinType(skinType);

    // 피부 타입별 warning 레벨 계산 헬퍼
    const getWarningLevelForSkinType = (
      ing: (typeof warningIngredients)[0],
      type: SkinType
    ): 'high' | 'medium' | 'low' => {
      let warningValue: number;

      switch (type) {
        case 'sensitive':
          warningValue = ing.warning_sensitive;
          break;
        case 'dry':
          warningValue = ing.warning_dry;
          break;
        case 'oily':
          warningValue = ing.warning_oily;
          break;
        case 'combination':
          warningValue = ing.warning_combination;
          break;
        case 'normal':
        default:
          // normal 피부: 모든 타입의 평균값 사용
          warningValue = Math.round(
            (ing.warning_sensitive + ing.warning_dry + ing.warning_oily + ing.warning_combination) /
              4
          );
          break;
      }

      if (warningValue >= 4) return 'high';
      if (warningValue >= 3) return 'medium';
      return 'low';
    };

    // ingredient_warnings 형식으로 변환
    const ingredientWarnings = warningIngredients.map((ing) => ({
      ingredient: ing.name_ko,
      ingredientEn: ing.name_en,
      level: getWarningLevelForSkinType(ing, skinType),
      ewgGrade: ing.ewg_grade,
      reason: ing.side_effects || '주의가 필요한 성분입니다.',
      alternatives: ing.alternatives,
      category: ing.category,
    }));

    console.log(
      `[S-1] Found ${ingredientWarnings.length} warning ingredients for ${skinType} skin`
    );

    // 제품 추천 생성
    const metricsForProducts = {
      hydration: getMetricValue('hydration'),
      oil_level: getMetricValue('oil'),
      pores: getMetricValue('pores'),
      pigmentation: getMetricValue('pigmentation'),
      wrinkles: getMetricValue('wrinkles'),
      sensitivity: getMetricValue('sensitivity', 'trouble'),
    };

    const productRecommendations = generateProductRecommendations(
      skinType,
      metricsForProducts,
      personalColorSeason
    );

    // products 필드 형식으로 변환
    const productsForDB = formatProductsForDB(productRecommendations);

    console.log(
      `[S-1] Generated ${productRecommendations.routine.length} routine steps, ${productRecommendations.specialCare.length} special care products`
    );

    // DB에 저장
    const { data, error } = await supabase
      .from('skin_analyses')
      .insert({
        clerk_user_id: userId,
        image_url: imageUrl || '',
        skin_type: skinType,
        hydration: getMetricValue('hydration'),
        oil_level: getMetricValue('oil'),
        pores: getMetricValue('pores'),
        pigmentation: getMetricValue('pigmentation'),
        wrinkles: getMetricValue('wrinkles'),
        sensitivity: getMetricValue('sensitivity', 'trouble'),
        overall_score: result.overallScore,
        recommendations: {
          insight: result.insight,
          ingredients: result.recommendedIngredients,
          // 문서 구조에 맞춘 루틴 정보
          morning_routine: [productRecommendations.skincareRoutine.morning],
          evening_routine: [productRecommendations.skincareRoutine.evening],
          weekly_care: productRecommendations.careTips.weeklyCare,
          lifestyle_tips: productRecommendations.careTips.lifestyleTips,
          // 분석 근거 및 이미지 품질 정보 (신뢰성 리포트용)
          analysisEvidence: result.analysisEvidence || null,
          imageQuality: result.imageQuality || null,
        },
        // 제품 추천 (피부 타입별 루틴 + 특화 제품)
        products: productsForDB,
        // 성분 분석 (화해 스타일) - 피부 타입별 주의 성분
        ingredient_warnings: ingredientWarnings,
        // 퍼스널 컬러 연동
        personal_color_season: personalColorSeason,
        foundation_recommendation: foundationRecommendation,
        // Phase E: 문제 영역 좌표
        problem_areas: result.problemAreas || [],
      })
      .select()
      .single();

    if (error) {
      console.error('[S-1] Database insert error:', error);
      return dbError();
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

      // 피부 분석 완료 배지
      const skinBadge = await awardAnalysisBadge(supabase, userId, 'skin');
      if (skinBadge) {
        gamificationResult.badgeResults.push(skinBadge);
      }

      // 모든 분석 완료 여부 체크
      const allBadge = await checkAndAwardAllAnalysisBadge(supabase, userId);
      if (allBadge) {
        gamificationResult.badgeResults.push(allBadge);
      }
    } catch (gamificationError) {
      console.error('[S-1] Gamification error:', gamificationError);
    }

    // 피부 타입 기반 파운데이션 제형 추천 (S-1 전용)
    // skinType을 SkinTypeId로 매핑 (SkinType과 SkinTypeId가 동일)
    const foundationFormula =
      FOUNDATION_FORMULAS[skinType as keyof typeof FOUNDATION_FORMULAS] || null;

    return NextResponse.json({
      success: true,
      data: data,
      result: {
        ...result,
        analyzedAt: new Date().toISOString(),
        // 피부 타입 기반 파운데이션 제형 추천
        foundationFormula,
      },
      personalColorSeason,
      foundationRecommendation, // deprecated, PC-1으로 이동
      foundationFormula, // 피부 타입 기반 제형 추천 (S-1 전용)
      ingredientWarnings,
      productRecommendations,
      usedMock,
      gamification: gamificationResult,
    });
  } catch (error) {
    console.error('[S-1] Skin analysis error:', error);
    return internalError();
  }
}

/**
 * 최근 S-1 분석 결과 목록 조회 API
 *
 * GET /api/analyze/skin
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError();
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('skin_analyses')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[S-1] Database query error:', error);
      return dbError();
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('[S-1] Get skin analyses error:', error);
    return internalError();
  }
}
