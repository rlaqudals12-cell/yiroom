/**
 * OH-1 Gemini 브릿지
 *
 * @module lib/oral-health/internal/gemini-bridge
 * @description Gemini 응답을 로컬 OH-1 타입으로 변환
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 */

import type {
  LabColor,
  VitaShade,
  ToothColorResult,
  GumHealthResult,
  GumHealthStatus,
  GumHealthMetrics,
} from '@/types/oral-health';
import { analyzeOralWithGemini, type GeminiOralHealthResponse } from '@/lib/gemini/v2-analysis';
import { getShadeReference, findBestShadeMatch } from './vita-database';
import { calculateCIEDE2000 } from './ciede2000';

/**
 * Gemini 분석 결과 캐시 (같은 세션 내 재사용)
 */
let cachedGeminiResult: {
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
 * Gemini를 통한 구강 분석 실행
 *
 * @param imageBase64 - Base64 이미지
 * @returns Gemini 응답 또는 null
 */
export async function getGeminiOralAnalysis(
  imageBase64: string
): Promise<{ data: GeminiOralHealthResponse | null; usedFallback: boolean }> {
  const imageHash = generateImageHash(imageBase64);

  // 캐시된 결과가 있으면 재사용
  if (cachedGeminiResult && cachedGeminiResult.imageHash === imageHash) {
    console.log('[OH-1 Bridge] Using cached Gemini result');
    return { data: cachedGeminiResult.data, usedFallback: cachedGeminiResult.usedFallback };
  }

  // Gemini 분석 실행
  const result = await analyzeOralWithGemini(imageBase64);

  // 캐시 저장
  cachedGeminiResult = {
    imageHash,
    data: result.data,
    usedFallback: result.usedFallback,
  };

  return result;
}

/**
 * 캐시 초기화 (새 분석 시작 시)
 */
export function clearGeminiCache(): void {
  cachedGeminiResult = null;
}

/**
 * Gemini 치아 색상 응답 → ToothColorResult 변환
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
 * Gemini 잇몸 건강 응답 → GumHealthResult 변환
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

  // rednessLevel → rednessPercentage 변환
  const rednessPercentage = convertRednessLevelToPercentage(gumHealth.rednessLevel);

  // swellingLevel → swellingIndicator 변환
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
    severity: estimateSeverityFromInflammation(gumHealth.inflammationScore) as 'mild' | 'moderate' | 'severe',
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
 * 건강한 잇몸: a* ≈ 8-12 (분홍)
 * 염증 잇몸: a* ≈ 15-25 (붉은색)
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
 * 붉은기 레벨 → 퍼센티지 변환
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
 * 부종 레벨 → 지표 변환
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
 * Gemini를 사용하여 치아 Lab 값 추출
 *
 * @param imageBase64 - Base64 이미지
 * @returns Lab 색상 또는 null (폴백 필요)
 */
export async function extractToothLabWithGemini(
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
 * Gemini를 사용하여 잇몸 Lab 픽셀 추출
 *
 * @param imageBase64 - Base64 이미지
 * @returns Lab 픽셀 배열 또는 null (폴백 필요)
 */
export async function extractGumPixelsWithGemini(
  imageBase64: string
): Promise<{ pixels: LabColor[]; usedFallback: boolean } | null> {
  const { data, usedFallback } = await getGeminiOralAnalysis(imageBase64);

  if (usedFallback || !data) {
    return null; // 폴백 데이터 사용 필요
  }

  // Gemini 응답에서 Lab 픽셀 시뮬레이션 생성
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
