import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { applyRateLimit } from '@/lib/security/rate-limit';
import { analyzeBody, type GeminiBodyAnalysisResult } from '@/lib/gemini';
import { generateMockBodyAnalysis3, BODY_TYPES_3, type BodyType3 } from '@/lib/mock/body-analysis';
import { generateColorRecommendations, getColorTipsForBodyType } from '@/lib/color-recommendations';
import {
  awardAnalysisBadge,
  checkAndAwardAllAnalysisBadge,
  addXp,
  type BadgeAwardResult,
} from '@/lib/gamification';
import { checkConsentAndUploadImages } from '@/lib/api/image-consent';
import {
  unauthorizedError,
  badRequestError,
  dbError,
  internalError,
} from '@/lib/api/error-response';

// XP 보상 상수
const XP_ANALYSIS_COMPLETE = 10;

// 환경변수: Mock 모드 강제 여부 (개발/테스트용)
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

// Base64 이미지 검증: data:image/ 프리픽스 또는 순수 Base64
const base64ImageSchema = z.string().min(100, '이미지 데이터가 너무 짧아요');

// 입력 스키마
const bodyAnalysisSchema = z.object({
  imageBase64: base64ImageSchema.optional(),
  frontImageBase64: base64ImageSchema.optional(),
  sideImageBase64: base64ImageSchema.optional(),
  leftSideImageBase64: base64ImageSchema.optional(),
  rightSideImageBase64: base64ImageSchema.optional(),
  backImageBase64: base64ImageSchema.optional(),
  userInput: z
    .object({
      height: z.number().min(50).max(300),
      weight: z.number().min(10).max(500),
      targetWeight: z.number().min(10).max(500).optional(),
      bodyType: z.string().optional(),
      gender: z.string().optional(),
    })
    .optional(),
  useMock: z.boolean().optional().default(false),
});

/**
 * C-1 체형 분석 API (Real AI + Mock Fallback)
 *
 * POST /api/analyze/body
 * Body: {
 *   imageBase64?: string,             // 체형 이미지 (기존 호환)
 *   frontImageBase64?: string,        // 정면 이미지 (다각도 촬영)
 *   leftSideImageBase64?: string,     // 좌측면 이미지 (선택)
 *   rightSideImageBase64?: string,    // 우측면 이미지 (선택)
 *   sideImageBase64?: string,         // 측면 이미지 (하위 호환 → leftSide로 매핑)
 *   backImageBase64?: string,         // 후면 이미지 (선택)
 *   userInput?: UserBodyInput,        // 사용자 입력 (키, 체중)
 *   useMock?: boolean                 // Mock 모드 강제 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   data: BodyAnalysis,               // DB 저장된 데이터
 *   result: BodyAnalysisResult,       // AI 분석 결과
 *   personalColorSeason: string | null,
 *   imagesAnalyzed: { front, leftSide, rightSide, back },
 *   usedMock: boolean                 // Mock 사용 여부
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

    const rawBody = await req.json();
    const parsed = bodyAnalysisSchema.safeParse(rawBody);
    if (!parsed.success) {
      return badRequestError(parsed.error.errors[0]?.message || '입력 정보를 확인해주세요.');
    }
    const {
      imageBase64,
      frontImageBase64,
      sideImageBase64,
      leftSideImageBase64,
      rightSideImageBase64,
      backImageBase64,
      userInput,
      useMock,
    } = parsed.data;

    // 다각도 이미지 또는 단일 이미지 (하위 호환)
    const primaryImage = frontImageBase64 || imageBase64;

    if (!primaryImage) {
      return badRequestError('이미지가 필요합니다.');
    }

    // 하위 호환: 기존 sideImageBase64 → leftSideImageBase64로 매핑
    const resolvedLeftSide = leftSideImageBase64 || sideImageBase64 || undefined;
    const resolvedRightSide = rightSideImageBase64 || undefined;
    const resolvedBack = backImageBase64 || undefined;

    // 분석에 사용된 이미지 현황
    const imagesAnalyzed = {
      front: !!primaryImage,
      leftSide: !!resolvedLeftSide,
      rightSide: !!resolvedRightSide,
      back: !!resolvedBack,
    };
    const imageCount = Object.values(imagesAnalyzed).filter(Boolean).length;

    // AI 분석 실행 (Real AI 또는 Mock)
    let result: GeminiBodyAnalysisResult;
    let usedMock = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드 (3타입 시스템)
      const mockResult = generateMockBodyAnalysis3(userInput);
      result = {
        bodyType: mockResult.bodyType,
        bodyTypeLabel: mockResult.bodyTypeLabel,
        bodyTypeLabelEn: mockResult.bodyTypeLabelEn,
        bodyTypeDescription: mockResult.bodyTypeDescription,
        characteristics: mockResult.characteristics,
        keywords: mockResult.keywords,
        measurements: mockResult.measurements,
        strengths: mockResult.strengths,
        avoidStyles: mockResult.avoidStyles,
        insight: mockResult.insight,
        styleRecommendations: mockResult.styleRecommendations,
        confidence: 85,
        matchedFeatures: 4,
        // 분석 근거 데이터 (Mock)
        analysisEvidence: {
          shoulderLine:
            mockResult.bodyType === 'S'
              ? 'angular'
              : mockResult.bodyType === 'W'
                ? 'rounded'
                : 'wide',
          waistDefinition: mockResult.bodyType === 'W' ? 'defined' : 'straight',
          hipLine: mockResult.bodyType === 'W' ? 'curved' : 'straight',
          boneStructure: mockResult.bodyType === 'N' ? 'large' : 'medium',
          muscleAttachment: mockResult.bodyType === 'S' ? 'easy' : 'moderate',
          upperLowerBalance:
            mockResult.bodyType === 'S'
              ? 'upper_dominant'
              : mockResult.bodyType === 'W'
                ? 'lower_dominant'
                : 'balanced',
          silhouette: mockResult.bodyType === 'S' ? 'I' : mockResult.bodyType === 'W' ? 'S' : 'H',
        },
        imageQuality: {
          angle: 'front',
          poseNatural: true,
          clothingFit: 'fitted',
          analysisReliability: 'medium',
        },
      };
      usedMock = true;
      console.log('[C-1] Using mock analysis (3-type system)');
    } else {
      // Real AI 분석 (다각도 지원)
      try {
        console.log(`[C-1] Starting Gemini analysis (${imageCount} image(s), 3-type system)...`);
        result = await analyzeBody(primaryImage, resolvedLeftSide, resolvedRightSide, resolvedBack);
        console.log('[C-1] Gemini analysis completed');

        // 다각도 분석 시 신뢰도 보정
        if (imageCount >= 2 && result.imageQuality) {
          result.imageQuality.analysisReliability =
            imageCount >= 4 ? 'high' : imageCount >= 3 ? 'high' : 'medium';
        }
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백 (3타입 시스템)
        console.error('[C-1] Gemini error, falling back to mock:', aiError);
        const mockResult = generateMockBodyAnalysis3(userInput);
        result = {
          bodyType: mockResult.bodyType,
          bodyTypeLabel: mockResult.bodyTypeLabel,
          bodyTypeLabelEn: mockResult.bodyTypeLabelEn,
          bodyTypeDescription: mockResult.bodyTypeDescription,
          characteristics: mockResult.characteristics,
          keywords: mockResult.keywords,
          measurements: mockResult.measurements,
          strengths: mockResult.strengths,
          avoidStyles: mockResult.avoidStyles,
          insight: mockResult.insight,
          styleRecommendations: mockResult.styleRecommendations,
          confidence: 85,
          matchedFeatures: 4,
          // 분석 근거 데이터 (Mock)
          analysisEvidence: {
            shoulderLine:
              mockResult.bodyType === 'S'
                ? 'angular'
                : mockResult.bodyType === 'W'
                  ? 'rounded'
                  : 'wide',
            waistDefinition: mockResult.bodyType === 'W' ? 'defined' : 'straight',
            hipLine: mockResult.bodyType === 'W' ? 'curved' : 'straight',
            boneStructure: mockResult.bodyType === 'N' ? 'large' : 'medium',
            muscleAttachment: mockResult.bodyType === 'S' ? 'easy' : 'moderate',
            upperLowerBalance:
              mockResult.bodyType === 'S'
                ? 'upper_dominant'
                : mockResult.bodyType === 'W'
                  ? 'lower_dominant'
                  : 'balanced',
            silhouette: mockResult.bodyType === 'S' ? 'I' : mockResult.bodyType === 'W' ? 'S' : 'H',
          },
          imageQuality: {
            angle: 'front',
            poseNatural: true,
            clothingFit: 'fitted',
            analysisReliability: 'medium',
          },
        };
        usedMock = true;
      }
    }

    const supabase = createServiceRoleClient();

    // 이미지 저장 동의 확인 + 업로드 (PIPA 준수)
    const { hasConsent, uploadedImages } = await checkConsentAndUploadImages(
      supabase,
      userId,
      'body',
      'body-images',
      {
        front: primaryImage,
        left_side: resolvedLeftSide,
        right_side: resolvedRightSide,
        back: resolvedBack,
      }
    );

    // 정면 이미지 URL (하위 호환성)
    const imageUrl = uploadedImages.front || null;
    console.log(
      `[C-1] Image consent: ${hasConsent ? 'granted' : 'not granted'}, frontImage: ${imageUrl ? 'uploaded' : 'none'}`
    );

    // 퍼스널 컬러 조회 (자동 연동)
    const { data: pcData } = await supabase
      .from('personal_color_assessments')
      .select('season, best_colors')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const personalColorSeason = pcData?.season || null;

    // measurements에서 어깨/허리/골반 추출
    const measurements = result.measurements || [];
    const getMeasurement = (name: string) =>
      measurements.find((m: { name: string; value: number }) => m.name === name)?.value || null;

    // 퍼스널 컬러 + 체형 기반 코디 색상 추천 생성
    const colorRecommendations = generateColorRecommendations(personalColorSeason, result.bodyType);
    const colorTips = getColorTipsForBodyType(result.bodyType);

    console.log(
      `[C-1] Generated color recommendations for ${personalColorSeason || 'no PC'} + ${result.bodyType} body type`
    );

    // DB에 저장
    const { data, error } = await supabase
      .from('body_analyses')
      .insert({
        clerk_user_id: userId,
        image_url: imageUrl || '',
        left_side_image_url: uploadedImages.left_side || null,
        right_side_image_url: uploadedImages.right_side || null,
        back_image_url: uploadedImages.back || null,
        height: userInput?.height || null,
        weight: userInput?.weight || null,
        body_type: result.bodyType,
        shoulder: getMeasurement('어깨'),
        waist: getMeasurement('허리'),
        hip: getMeasurement('골반'),
        strengths: result.strengths,
        style_recommendations: {
          items: result.styleRecommendations,
          insight: result.insight,
          colorTips,
          // 분석 근거 및 이미지 품질 정보 (신뢰성 리포트용)
          analysisEvidence: result.analysisEvidence || null,
          imageQuality: result.imageQuality || null,
          confidence: result.confidence || null,
          matchedFeatures: result.matchedFeatures || null,
        },
        personal_color_season: personalColorSeason,
        // 퍼스널 컬러 + 체형 기반 색상 추천 (문서 구조에 맞춤)
        color_recommendations: colorRecommendations,
        target_weight: userInput?.targetWeight || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[C-1] Database insert error:', error);
      return dbError('분석 결과 저장에 실패했습니다.', error.message);
    }

    // BMI 계산 (userInput이 있는 경우)
    let bmi: number | undefined;
    let bmiCategory: string | undefined;

    if (userInput?.height && userInput?.weight) {
      bmi = userInput.weight / (userInput.height / 100) ** 2;
      if (bmi < 18.5) bmiCategory = '저체중';
      else if (bmi < 23) bmiCategory = '정상';
      else if (bmi < 25) bmiCategory = '과체중';
      else bmiCategory = '비만';
    }

    // 체형 정보 보완 (BODY_TYPES_3에서 가져오기 - 3타입 시스템)
    const bodyTypeInfo = BODY_TYPES_3[result.bodyType as BodyType3];

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

      // 체형 분석 완료 배지
      const bodyBadge = await awardAnalysisBadge(supabase, userId, 'body');
      if (bodyBadge) {
        gamificationResult.badgeResults.push(bodyBadge);
      }

      // 모든 분석 완료 여부 체크
      const allBadge = await checkAndAwardAllAnalysisBadge(supabase, userId);
      if (allBadge) {
        gamificationResult.badgeResults.push(allBadge);
      }
    } catch (gamificationError) {
      console.error('[C-1] Gamification error:', gamificationError);
    }

    return NextResponse.json({
      success: true,
      data: data,
      result: {
        ...result,
        bodyTypeLabel: result.bodyTypeLabel || bodyTypeInfo?.label,
        bodyTypeLabelEn: result.bodyTypeLabelEn || bodyTypeInfo?.labelEn,
        bodyTypeDescription: result.bodyTypeDescription || bodyTypeInfo?.description,
        characteristics: result.characteristics || bodyTypeInfo?.characteristics,
        keywords: result.keywords || bodyTypeInfo?.keywords,
        avoidStyles: result.avoidStyles || bodyTypeInfo?.avoidStyles,
        userInput,
        bmi,
        bmiCategory,
        analyzedAt: new Date().toISOString(),
      },
      personalColorSeason,
      colorRecommendations,
      colorTips,
      imagesAnalyzed,
      usedMock,
      gamification: gamificationResult,
    });
  } catch (error) {
    console.error('[C-1] Body analysis error:', error);
    return internalError(
      '체형 분석 중 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * 최근 C-1 분석 결과 목록 조회 API
 *
 * GET /api/analyze/body
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedError();
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('body_analyses')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[C-1] Database query error:', error);
      return dbError('분석 기록 조회에 실패했습니다.', error.message);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('[C-1] Get body analyses error:', error);
    return internalError(
      '체형 분석 기록 조회 중 오류가 발생했습니다.',
      error instanceof Error ? error.message : undefined
    );
  }
}
