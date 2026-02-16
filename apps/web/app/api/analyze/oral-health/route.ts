/**
 * OH-1 구강건강 분석 API
 *
 * @route POST /api/analyze/oral-health
 * @description VITA 셰이드 기반 치아 색상 분석, 잇몸 건강 분석
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import { generateMockOralHealthAssessment } from '@/lib/mock/oral-health';
import { logAnalysisCreate } from '@/lib/audit/logger';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit';
import { analyzeOralWithGemini, type GeminiOralHealthResponse } from '@/lib/gemini/v2-analysis';
import type {
  OralHealthAnalysisResponse,
  OralHealthAssessment,
  PersonalColorSeason,
  VitaShade,
  ToothColorResult,
  GumHealthResult,
} from '@/types/oral-health';
import {
  getLabForShade,
  getAStarFromRedness,
  getRednessPercentage,
  getSwellingIndicator,
  mapInflammationToSeverity,
  calculateTargetShade,
  calculateRouteShadeSteps,
  checkOverWhitening,
  generateHarmonySuggestion,
} from '@/lib/oral-health/internal/route-helpers';

// 요청 스키마
const requestSchema = z.object({
  imageBase64: z.string().min(1, '이미지가 필요합니다'),
  analysisType: z.enum(['tooth_color', 'gum_health', 'full']),
  personalColorSeason: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
  oralProfile: z
    .object({
      sensitivity: z.enum(['none', 'mild', 'severe']),
      gumHealth: z.enum(['healthy', 'gingivitis', 'periodontitis']),
      cavityRisk: z.enum(['low', 'medium', 'high']),
      calculus: z.enum(['none', 'mild', 'heavy']),
      halitosis: z.boolean(),
      dentalWork: z.array(z.enum(['braces', 'implant', 'bridge', 'crown', 'veneer'])),
    })
    .optional(),
});

/**
 * POST /api/analyze/oral-health
 *
 * 구강건강 분석 수행
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<OralHealthAnalysisResponse>> {
  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: '로그인이 필요합니다.',
          },
        },
        { status: 401 }
      );
    }

    // 2. Rate Limiting
    const rateCheck = checkRateLimit(userId, 'analyze');
    if (!rateCheck.success) {
      const headers = getRateLimitHeaders(
        rateCheck.remaining,
        rateCheck.resetTime,
        rateCheck.dailyRemaining ?? 0
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_ERROR',
            message: '일일 분석 횟수를 초과했습니다. 내일 다시 시도해주세요.',
          },
        },
        { status: 429, headers }
      );
    }

    // 3. 요청 검증
    const body = await request.json();
    const validated = requestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력 정보를 확인해주세요.',
          },
        },
        { status: 400 }
      );
    }

    const { imageBase64, analysisType, personalColorSeason } = validated.data;

    // 4. 분석 수행 (Gemini + Mock Fallback)
    const assessment = await performOralHealthAnalysis(
      imageBase64,
      userId,
      analysisType,
      personalColorSeason
    );

    // 5. 감사 로그
    await logAnalysisCreate(userId, 'oral_health', assessment.id);

    // 6. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        assessment,
        productRecommendations: undefined, // 추후 프로필 기반 추천 추가
      },
    });
  } catch (error) {
    console.error('[API] POST /analyze/oral-health error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '분석 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 구강건강 분석 수행
 *
 * @param imageBase64 - Base64 인코딩된 구강 이미지
 * @param userId - 사용자 ID
 * @param analysisType - 분석 유형
 * @param personalColorSeason - 퍼스널컬러 시즌 (선택)
 * @returns 분석 결과
 */
async function performOralHealthAnalysis(
  imageBase64: string,
  userId: string,
  analysisType: 'tooth_color' | 'gum_health' | 'full',
  personalColorSeason?: PersonalColorSeason
): Promise<OralHealthAssessment> {
  const includeToothColor = analysisType === 'tooth_color' || analysisType === 'full';
  const includeGumHealth = analysisType === 'gum_health' || analysisType === 'full';
  const includeWhiteningGoal = !!personalColorSeason && includeToothColor;
  const assessmentId = `oh_${Date.now()}`;

  // Gemini Vision API 호출
  const { data: geminiResult, usedFallback } = await analyzeOralWithGemini(imageBase64);

  // Fallback: Mock 데이터 사용
  if (usedFallback || !geminiResult) {
    const assessment = generateMockOralHealthAssessment({
      id: assessmentId,
      clerkUserId: userId,
      includeToothColor,
      includeGumHealth,
      includeWhiteningGoal,
    });

    if (personalColorSeason && assessment.whiteningGoal) {
      assessment.whiteningGoal.personalColorSeason = personalColorSeason;
    }

    return assessment;
  }

  // Gemini 응답을 OralHealthAssessment로 변환
  const assessment = convertGeminiToAssessment(
    geminiResult,
    assessmentId,
    userId,
    includeToothColor,
    includeGumHealth,
    includeWhiteningGoal,
    personalColorSeason
  );

  return assessment;
}

/**
 * Gemini 응답을 OralHealthAssessment로 변환
 */
function convertGeminiToAssessment(
  gemini: GeminiOralHealthResponse,
  id: string,
  userId: string,
  includeToothColor: boolean,
  includeGumHealth: boolean,
  includeWhiteningGoal: boolean,
  personalColorSeason?: PersonalColorSeason
): OralHealthAssessment {
  // 치아 색상 결과 변환
  const toothColor: ToothColorResult | undefined = includeToothColor
    ? {
        measuredLab: getLabForShade(gemini.toothColor.detectedShade),
        matchedShade: gemini.toothColor.detectedShade,
        deltaE: 0, // Gemini 분석은 deltaE 제공 안 함
        confidence: gemini.toothColor.confidence,
        alternativeMatches: gemini.toothColor.alternativeShades.slice(0, 3).map((shade) => ({
          shade: shade as VitaShade,
          deltaE: 2.5, // 대안 셰이드 기본 deltaE
        })),
        interpretation: {
          brightness: gemini.toothColor.brightness,
          yellowness: gemini.toothColor.yellowness,
          series: gemini.toothColor.series,
        },
      }
    : undefined;

  // 잇몸 건강 결과 변환
  const gumHealth: GumHealthResult | undefined = includeGumHealth
    ? {
        healthStatus: gemini.gumHealth.overallStatus,
        inflammationScore: gemini.gumHealth.inflammationScore,
        needsDentalVisit: gemini.gumHealth.needsDentalVisit,
        metrics: {
          aStarMean: getAStarFromRedness(gemini.gumHealth.rednessLevel),
          aStarStd: 3.0, // 기본값
          rednessPercentage: getRednessPercentage(gemini.gumHealth.rednessLevel),
          swellingIndicator: getSwellingIndicator(gemini.gumHealth.swellingLevel),
        },
        recommendations: gemini.recommendations.filter(
          (r) => r.includes('잇몸') || r.includes('치주') || r.includes('치과')
        ),
        affectedAreas: gemini.gumHealth.affectedAreas.map((area) => ({
          region: area,
          severity: mapInflammationToSeverity(gemini.gumHealth.inflammationScore),
        })),
      }
    : undefined;

  // 미백 목표 계산
  const whiteningGoal =
    includeWhiteningGoal && personalColorSeason && toothColor
      ? {
          targetShade: calculateTargetShade(toothColor.matchedShade, personalColorSeason),
          personalColorSeason,
          shadeStepsNeeded: calculateRouteShadeSteps(toothColor.matchedShade, personalColorSeason),
          isOverWhitening: checkOverWhitening(toothColor.matchedShade, personalColorSeason),
          harmonySuggestion: generateHarmonySuggestion(
            toothColor.matchedShade,
            personalColorSeason
          ),
        }
      : undefined;

  return {
    id,
    clerkUserId: userId,
    createdAt: new Date().toISOString(),
    usedFallback: false,
    toothColor,
    gumHealth,
    whiteningGoal,
    overallScore: gemini.overallScore,
    recommendations: gemini.recommendations,
  };
}
