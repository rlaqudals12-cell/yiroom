/**
 * OH-1 API 브릿지 (모바일)
 *
 * 웹의 gemini-bridge.ts를 대체하여 웹 API 엔드포인트를 호출.
 * Gemini 호출은 서버측에서 처리하고, 모바일은 분석 결과만 수신.
 *
 * @module lib/oral-health/internal/api-bridge
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 */

import type {
  LabColor,
  VitaShade,
  ToothColorResult,
  GumHealthResult,
  GumHealthStatus,
  GumHealthMetrics,
  GeminiOralHealthResponse,
} from '../types';
import { getShadeReference } from './vita-database';
import { calculateCIEDE2000 } from './ciede2000';

// 웹 API 기본 URL (환경변수에서 설정)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://yiroom.vercel.app';

/**
 * 분석 결과 캐시 (같은 세션 내 재사용)
 */
let cachedResult: {
  imageHash: string;
  data: GeminiOralHealthResponse | null;
  usedFallback: boolean;
} | null = null;

/**
 * 이미지 해시 생성 (간단한 체크섬)
 */
function generateImageHash(imageBase64: string): string {
  // 이미지 앞부분 100자로 간단한 해시 생성
  return imageBase64.slice(0, 100);
}

/**
 * 웹 API를 통한 구강 분석 실행
 *
 * @param imageBase64 - Base64 이미지
 * @returns 분석 응답 또는 null
 */
export async function getGeminiOralAnalysis(
  imageBase64: string
): Promise<{ data: GeminiOralHealthResponse | null; usedFallback: boolean }> {
  const imageHash = generateImageHash(imageBase64);

  // 캐시된 결과가 있으면 재사용
  if (cachedResult && cachedResult.imageHash === imageHash) {
    return { data: cachedResult.data, usedFallback: cachedResult.usedFallback };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze/oral-health`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        analysisType: 'full',
      }),
    });

    if (!response.ok) {
      console.warn('[OH-1 Mobile] API 응답 실패, 폴백 사용:', response.status);
      cachedResult = { imageHash, data: null, usedFallback: true };
      return { data: null, usedFallback: true };
    }

    const json = await response.json();

    if (!json.success || !json.data) {
      console.warn('[OH-1 Mobile] API 응답 데이터 없음, 폴백 사용');
      cachedResult = { imageHash, data: null, usedFallback: true };
      return { data: null, usedFallback: true };
    }

    // API 응답에서 Gemini 형태 데이터 추출
    // 웹 API가 이미 처리된 결과를 반환하므로, 원본 Gemini 응답은 없을 수 있음
    // 이 경우 assessment 데이터에서 역변환
    const assessment = json.data.assessment;
    if (!assessment) {
      cachedResult = { imageHash, data: null, usedFallback: true };
      return { data: null, usedFallback: true };
    }

    // assessment에서 GeminiOralHealthResponse 형태로 변환
    const geminiLikeData = reconstructGeminiResponse(assessment);

    cachedResult = {
      imageHash,
      data: geminiLikeData,
      usedFallback: assessment.usedFallback ?? false,
    };

    return {
      data: cachedResult.data,
      usedFallback: cachedResult.usedFallback,
    };
  } catch (error) {
    console.error('[OH-1 Mobile] API 호출 실패, 폴백 사용:', error);
    cachedResult = { imageHash, data: null, usedFallback: true };
    return { data: null, usedFallback: true };
  }
}

/**
 * Assessment 데이터에서 GeminiOralHealthResponse 형태로 재구성
 *
 * 웹 API가 이미 처리된 결과를 반환하므로,
 * 모바일 내부 로직과 호환되도록 원본 형태를 재구성.
 */
function reconstructGeminiResponse(assessment: Record<string, unknown>): GeminiOralHealthResponse | null {
  try {
    const toothColor = assessment.toothColor as ToothColorResult | undefined;
    const gumHealth = assessment.gumHealth as GumHealthResult | undefined;

    if (!toothColor && !gumHealth) {
      return null;
    }

    return {
      canAnalyze: true,
      confidence: 85,
      toothColor: {
        detectedShade: toothColor?.matchedShade ?? 'A2',
        brightness: toothColor?.interpretation?.brightness ?? 'medium',
        yellowness: toothColor?.interpretation?.yellowness ?? 'mild',
        series: toothColor?.interpretation?.series ?? 'A',
        confidence: toothColor?.confidence ?? 80,
        alternativeShades: toothColor?.alternativeMatches?.map(m => m.shade) ?? [],
      },
      gumHealth: {
        overallStatus: gumHealth?.healthStatus ?? 'healthy',
        inflammationScore: gumHealth?.inflammationScore ?? 20,
        rednessLevel: mapInflammationToRedness(gumHealth?.inflammationScore ?? 20),
        swellingLevel: mapInflammationToSwelling(gumHealth?.inflammationScore ?? 20),
        needsDentalVisit: gumHealth?.needsDentalVisit ?? false,
        affectedAreas: (gumHealth?.affectedAreas?.map(a => a.region) ?? []) as Array<'upper_front' | 'lower_front' | 'upper_back' | 'lower_back'>,
      },
      overallScore: (assessment.overallScore as number) ?? 75,
      recommendations: (assessment.recommendations as string[]) ?? [],
      imageQuality: {
        lightingCondition: 'natural',
        teethVisible: true,
        gumsVisible: true,
        colorAccuracy: 'medium',
      },
    };
  } catch {
    return null;
  }
}

/**
 * 염증 점수에서 붉은기 레벨 추정
 */
function mapInflammationToRedness(score: number): 'normal' | 'slightly_red' | 'red' | 'very_red' {
  if (score < 25) return 'normal';
  if (score < 50) return 'slightly_red';
  if (score < 75) return 'red';
  return 'very_red';
}

/**
 * 염증 점수에서 부종 레벨 추정
 */
function mapInflammationToSwelling(score: number): 'none' | 'mild' | 'moderate' | 'severe' {
  if (score < 25) return 'none';
  if (score < 50) return 'mild';
  if (score < 75) return 'moderate';
  return 'severe';
}

/**
 * 캐시 초기화 (새 분석 시작 시)
 */
export function clearAnalysisCache(): void {
  cachedResult = null;
}

/**
 * Gemini 치아 색상 응답 -> ToothColorResult 변환
 *
 * @param geminiResponse - Gemini 응답
 * @returns 치아 색상 분석 결과
 */
export function convertGeminiToothColorResult(
  geminiResponse: GeminiOralHealthResponse
): ToothColorResult {
  const { toothColor } = geminiResponse;
  const shade = toothColor.detectedShade as VitaShade;

  // VITA 데이터베이스에서 참조 Lab 값 조회
  const reference = getShadeReference(shade);
  const measuredLab: LabColor = reference?.lab ?? { L: 65, a: 2.5, b: 19 };

  // deltaE는 0 (완벽한 매칭으로 간주, Gemini가 직접 판별했으므로)
  // 대체 셰이드에 대한 deltaE 계산
  const alternativeMatches = toothColor.alternativeShades.slice(0, 3).map((altShade) => {
    const altRef = getShadeReference(altShade as VitaShade);
    const deltaE = altRef ? calculateCIEDE2000(measuredLab, altRef.lab) : 5.0;
    return {
      shade: altShade as VitaShade,
      deltaE: Math.round(deltaE * 100) / 100,
    };
  });

  return {
    measuredLab,
    matchedShade: shade,
    deltaE: 0, // Gemini 직접 매칭이므로 0
    confidence: toothColor.confidence,
    alternativeMatches,
    interpretation: {
      brightness: toothColor.brightness,
      yellowness: toothColor.yellowness,
      series: toothColor.series,
    },
  };
}

/**
 * Gemini 잇몸 건강 응답 -> GumHealthResult 변환
 *
 * @param geminiResponse - Gemini 응답
 * @returns 잇몸 건강 분석 결과
 */
export function convertGeminiGumHealthResult(
  geminiResponse: GeminiOralHealthResponse
): GumHealthResult {
  const { gumHealth, recommendations } = geminiResponse;

  // 상태에 따른 Lab a* 값 역추정 (염증 지표로 활용)
  const aStarMean = estimateAStarFromStatus(gumHealth.overallStatus);
  const aStarStd = gumHealth.overallStatus === 'healthy' ? 2 : 4;

  // rednessLevel -> rednessPercentage 변환
  const rednessPercentage = convertRednessLevelToPercentage(gumHealth.rednessLevel);

  // swellingLevel -> swellingIndicator 변환
  const swellingIndicator = convertSwellingLevelToIndicator(gumHealth.swellingLevel);

  const metrics: GumHealthMetrics = {
    aStarMean,
    aStarStd,
    rednessPercentage,
    swellingIndicator,
  };

  // 영향 영역 변환
  const affectedAreas = gumHealth.affectedAreas.map((region) => ({
    region,
    severity: estimateSeverityFromInflammation(gumHealth.inflammationScore) as
      | 'mild'
      | 'moderate'
      | 'severe',
  }));

  return {
    healthStatus: gumHealth.overallStatus,
    inflammationScore: gumHealth.inflammationScore,
    needsDentalVisit: gumHealth.needsDentalVisit,
    metrics,
    recommendations,
    affectedAreas: affectedAreas.length > 0 ? affectedAreas : undefined,
  };
}

/**
 * 잇몸 상태에서 a* 값 추정
 * 건강한 잇몸: a* ~ 8-12 (분홍)
 * 염증 잇몸: a* ~ 15-25 (붉은색)
 */
function estimateAStarFromStatus(status: GumHealthStatus): number {
  switch (status) {
    case 'healthy':
      return 10 + Math.random() * 2;
    case 'mild_gingivitis':
      return 13 + Math.random() * 2;
    case 'moderate_gingivitis':
      return 16 + Math.random() * 3;
    case 'severe_inflammation':
      return 20 + Math.random() * 4;
    default:
      return 12;
  }
}

/**
 * 붉은기 레벨 -> 퍼센티지 변환
 */
function convertRednessLevelToPercentage(level: string): number {
  switch (level) {
    case 'normal':
      return 10 + Math.random() * 10;
    case 'slightly_red':
      return 25 + Math.random() * 15;
    case 'red':
      return 45 + Math.random() * 20;
    case 'very_red':
      return 70 + Math.random() * 20;
    default:
      return 15;
  }
}

/**
 * 부종 레벨 -> 지표 변환
 */
function convertSwellingLevelToIndicator(level: string): number {
  switch (level) {
    case 'none':
      return 0 + Math.random() * 5;
    case 'mild':
      return 15 + Math.random() * 15;
    case 'moderate':
      return 35 + Math.random() * 20;
    case 'severe':
      return 60 + Math.random() * 30;
    default:
      return 10;
  }
}

/**
 * 염증 점수에서 심각도 추정
 */
function estimateSeverityFromInflammation(score: number): string {
  if (score < 30) return 'mild';
  if (score < 60) return 'moderate';
  return 'severe';
}

/**
 * API를 사용하여 치아 Lab 값 추출
 *
 * @param imageBase64 - Base64 이미지
 * @returns Lab 색상 또는 null (폴백 필요)
 */
export async function extractToothLabWithApi(
  imageBase64: string
): Promise<{ lab: LabColor; usedFallback: boolean } | null> {
  const { data, usedFallback } = await getGeminiOralAnalysis(imageBase64);

  if (usedFallback || !data) {
    return null; // 폴백 데이터 사용 필요
  }

  const shade = data.toothColor.detectedShade as VitaShade;
  const reference = getShadeReference(shade);

  if (!reference) {
    return null;
  }

  return {
    lab: reference.lab,
    usedFallback: false,
  };
}

/**
 * API를 사용하여 잇몸 Lab 픽셀 추출
 *
 * @param imageBase64 - Base64 이미지
 * @returns Lab 픽셀 배열 또는 null (폴백 필요)
 */
export async function extractGumPixelsWithApi(
  imageBase64: string
): Promise<{ pixels: LabColor[]; usedFallback: boolean } | null> {
  const { data, usedFallback } = await getGeminiOralAnalysis(imageBase64);

  if (usedFallback || !data) {
    return null; // 폴백 데이터 사용 필요
  }

  // API 응답에서 Lab 픽셀 시뮬레이션 생성
  // 실제 픽셀은 없지만, 상태 기반으로 통계적으로 유사한 분포 생성
  const aStarMean = estimateAStarFromStatus(data.gumHealth.overallStatus);
  const aStarStd = data.gumHealth.overallStatus === 'healthy' ? 2 : 4;

  const pixelCount = 100 + Math.floor(Math.random() * 50);
  const pixels: LabColor[] = [];

  for (let i = 0; i < pixelCount; i++) {
    // 정규 분포 근사 (Box-Muller 변환 간소화)
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const aValue = aStarMean + z * aStarStd;

    pixels.push({
      L: 55 + Math.random() * 15,
      a: Math.max(5, Math.min(30, aValue)), // 클램프
      b: 10 + Math.random() * 8,
    });
  }

  return {
    pixels,
    usedFallback: false,
  };
}
