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
  LabColor,
} from '@/types/oral-health';

// 요청 스키마
const requestSchema = z.object({
  imageBase64: z.string().min(1, '이미지가 필요합니다'),
  analysisType: z.enum(['tooth_color', 'gum_health', 'full']),
  personalColorSeason: z
    .enum(['spring', 'summer', 'autumn', 'winter'])
    .optional(),
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
    console.log('[OH-1] Using mock fallback');
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
        alternativeMatches: gemini.toothColor.alternativeShades
          .slice(0, 3)
          .map((shade) => ({
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
        recommendations: gemini.recommendations.filter((r) =>
          r.includes('잇몸') || r.includes('치주') || r.includes('치과')
        ),
        affectedAreas: gemini.gumHealth.affectedAreas.map((area) => ({
          region: area,
          severity: mapInflammationToSeverity(gemini.gumHealth.inflammationScore),
        })),
      }
    : undefined;

  // 미백 목표 계산
  const whiteningGoal = includeWhiteningGoal && personalColorSeason && toothColor
    ? {
        targetShade: calculateTargetShade(toothColor.matchedShade, personalColorSeason),
        personalColorSeason,
        shadeStepsNeeded: calculateShadeSteps(toothColor.matchedShade, personalColorSeason),
        isOverWhitening: checkOverWhitening(toothColor.matchedShade, personalColorSeason),
        harmonySuggestion: generateHarmonySuggestion(toothColor.matchedShade, personalColorSeason),
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

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * VITA 셰이드에 대한 Lab 색상값 반환 (간소화된 참조 테이블)
 */
function getLabForShade(shade: VitaShade): LabColor {
  const labValues: Record<VitaShade, LabColor> = {
    'B1': { L: 71, a: 1.5, b: 15 },
    'A1': { L: 70, a: 2, b: 16 },
    'B2': { L: 68.5, a: 2, b: 17 },
    'D2': { L: 68, a: 1.5, b: 14 },
    'A2': { L: 67, a: 2.5, b: 18 },
    'C1': { L: 66, a: 1, b: 12 },
    'C2': { L: 65, a: 1.5, b: 14 },
    'D4': { L: 64, a: 2, b: 16 },
    'A3': { L: 63, a: 3, b: 20 },
    'D3': { L: 62, a: 2, b: 15 },
    'B3': { L: 61, a: 2.5, b: 19 },
    'A3.5': { L: 60, a: 3.5, b: 22 },
    'B4': { L: 58, a: 3, b: 21 },
    'C3': { L: 57, a: 2, b: 16 },
    'A4': { L: 55, a: 4, b: 24 },
    'C4': { L: 54, a: 2.5, b: 18 },
    '0M1': { L: 80, a: 0, b: 8 },
    '0M2': { L: 78, a: 0.5, b: 10 },
    '0M3': { L: 76, a: 1, b: 12 },
  };
  return labValues[shade] || { L: 65, a: 2, b: 16 };
}

/**
 * 붉은기 레벨에서 a* 평균값 추정
 */
function getAStarFromRedness(redness: 'normal' | 'slightly_red' | 'red' | 'very_red'): number {
  const values = { normal: 12, slightly_red: 18, red: 25, very_red: 35 };
  return values[redness];
}

/**
 * 붉은기 레벨에서 붉은 영역 비율 추정
 */
function getRednessPercentage(redness: 'normal' | 'slightly_red' | 'red' | 'very_red'): number {
  const values = { normal: 5, slightly_red: 15, red: 30, very_red: 50 };
  return values[redness];
}

/**
 * 부종 레벨에서 부종 지표 추정
 */
function getSwellingIndicator(swelling: 'none' | 'mild' | 'moderate' | 'severe'): number {
  const values = { none: 0, mild: 25, moderate: 50, severe: 80 };
  return values[swelling];
}

/**
 * 염증 점수를 심각도로 매핑
 */
function mapInflammationToSeverity(score: number): 'mild' | 'moderate' | 'severe' {
  if (score < 30) return 'mild';
  if (score < 60) return 'moderate';
  return 'severe';
}

/**
 * 퍼스널컬러 기반 목표 셰이드 계산
 */
function calculateTargetShade(
  currentShade: VitaShade,
  season: PersonalColorSeason
): VitaShade {
  // 퍼스널컬러별 권장 셰이드 범위
  const seasonTargets: Record<PersonalColorSeason, VitaShade[]> = {
    spring: ['B1', 'A1', 'B2'], // 밝고 따뜻한 톤
    summer: ['B1', 'C1', 'D2'], // 밝고 차가운 톤
    autumn: ['A2', 'B2', 'D2'], // 중간 밝기 따뜻한 톤
    winter: ['B1', 'C1', 'C2'], // 밝고 선명한 톤
  };

  const targets = seasonTargets[season];
  // 현재 셰이드보다 밝은 목표 중 첫 번째 선택
  return targets[0];
}

/**
 * 필요한 셰이드 단계 수 계산
 */
function calculateShadeSteps(currentShade: VitaShade, _season: PersonalColorSeason): number {
  const shadeRanks: Record<VitaShade, number> = {
    'B1': 1, 'A1': 2, 'B2': 3, 'D2': 4, 'A2': 5, 'C1': 6, 'C2': 7, 'D4': 8,
    'A3': 9, 'D3': 10, 'B3': 11, 'A3.5': 12, 'B4': 13, 'C3': 14, 'A4': 15, 'C4': 16,
    '0M1': 0, '0M2': 0, '0M3': 0,
  };

  const currentRank = shadeRanks[currentShade];
  const targetRank = 2; // 일반적으로 A1/B1 수준 목표

  return Math.max(0, currentRank - targetRank);
}

/**
 * 과도한 미백 여부 확인
 */
function checkOverWhitening(currentShade: VitaShade, _season: PersonalColorSeason): boolean {
  // 이미 매우 밝은 셰이드이거나 Bleached 셰이드면 과도한 미백 경고
  const brightShades: VitaShade[] = ['B1', 'A1', '0M1', '0M2', '0M3'];
  return brightShades.includes(currentShade);
}

/**
 * 조화 제안 생성
 */
function generateHarmonySuggestion(
  currentShade: VitaShade,
  season: PersonalColorSeason
): string {
  const suggestions: Record<PersonalColorSeason, string> = {
    spring: '봄 웜톤에는 따뜻하고 밝은 아이보리 계열의 치아색이 자연스럽습니다. 과도하게 하얀 치아보다 약간의 따뜻함이 있는 B1-A1 셰이드를 권장합니다.',
    summer: '여름 쿨톤에는 핑크빛이 도는 밝은 치아색이 어울립니다. 회색 기가 있는 C1-D2 계열도 자연스러운 조화를 이룹니다.',
    autumn: '가을 웜톤에는 너무 하얀 치아보다 자연스러운 아이보리 톤이 어울립니다. A2-B2 셰이드가 피부톤과 조화롭습니다.',
    winter: '겨울 쿨톤에는 선명하고 밝은 치아색이 잘 어울립니다. B1-C1 셰이드로 깨끗한 이미지를 연출할 수 있습니다.',
  };

  return suggestions[season];
}
