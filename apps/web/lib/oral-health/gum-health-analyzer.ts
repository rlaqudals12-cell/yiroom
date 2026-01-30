/**
 * 잇몸 건강 분석기
 *
 * @module lib/oral-health/gum-health-analyzer
 * @description 이미지 기반 잇몸 염증 탐지
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 */

import type { GumHealthInput, GumHealthResult, LabColor } from '@/types/oral-health';
import {
  detectGumInflammation,
  classifyGumHealth,
  generateGumHealthRecommendations,
} from './internal/inflammation-detector';
import {
  getGeminiOralAnalysis,
  convertGeminiGumHealthResult,
  extractGumPixelsWithGemini,
} from './internal/gemini-bridge';

/**
 * 잇몸 건강 분석
 *
 * @param input - 분석 입력
 * @param useGemini - Gemini Vision 사용 여부 (기본: true)
 * @returns 잇몸 건강 분석 결과
 */
export async function analyzeGumHealth(
  input: GumHealthInput,
  useGemini: boolean = true
): Promise<GumHealthResult & { usedFallback: boolean }> {
  // Gemini 사용 시 직접 분석 결과 반환
  if (useGemini) {
    const { data, usedFallback } = await getGeminiOralAnalysis(input.imageBase64);

    if (!usedFallback && data) {
      console.log('[OH-1 Gum] Using Gemini analysis result');
      const result = convertGeminiGumHealthResult(data);
      return { ...result, usedFallback: false };
    }
    console.log('[OH-1 Gum] Gemini unavailable, falling back to mock');
  }

  // 폴백: 이미지에서 잇몸 영역 Lab 값 추출 (Mock)
  const gumPixels = await extractGumPixelsFromImage(input.imageBase64);

  // 염증 지표 계산
  const metrics = detectGumInflammation(gumPixels);

  // 상태 분류
  const classification = classifyGumHealth(metrics);

  // 권장 사항 생성
  const recommendations = generateGumHealthRecommendations(classification.status);

  // 영향 받는 영역 분석 (상세 분석 시)
  const affectedAreas = analyzeAffectedAreas(gumPixels);

  return {
    healthStatus: classification.status,
    inflammationScore: classification.inflammationScore,
    needsDentalVisit: classification.needsDentalVisit,
    metrics,
    recommendations,
    affectedAreas: affectedAreas.length > 0 ? affectedAreas : undefined,
    usedFallback: true,
  };
}

/**
 * 이미지에서 잇몸 영역 픽셀 추출
 *
 * @description
 * Gemini Vision을 통한 분석 결과를 기반으로 Lab 픽셀 분포 생성.
 * Gemini 사용 불가 시 Mock 데이터로 폴백.
 *
 * @param imageBase64 - Base64 인코딩된 이미지
 * @returns Lab 색상 배열
 */
async function extractGumPixelsFromImage(imageBase64: string): Promise<LabColor[]> {
  // Gemini 브릿지를 통한 픽셀 추출 시도
  const geminiResult = await extractGumPixelsWithGemini(imageBase64);

  if (geminiResult && !geminiResult.usedFallback) {
    console.log('[OH-1 Gum] Extracted pixels via Gemini bridge');
    return geminiResult.pixels;
  }

  // 폴백: Mock 픽셀 생성
  console.log('[OH-1 Gum] Using mock gum pixels');
  const pixelCount = 100 + Math.floor(Math.random() * 100);
  const pixels: LabColor[] = [];

  // 건강한 잇몸~경미한 염증 범위의 Mock 데이터
  for (let i = 0; i < pixelCount; i++) {
    pixels.push({
      L: 55 + Math.random() * 15,  // 55-70 (밝기)
      a: 8 + Math.random() * 8,     // 8-16 (붉은기, 건강~경미 염증)
      b: 10 + Math.random() * 8,    // 10-18 (황색기)
    });
  }

  return pixels;
}

/**
 * 영향 받는 영역 분석
 *
 * @description
 * Gemini Vision 사용 시 직접 영역 정보 반환.
 * 폴백 시 전체 a* 평균에서 추정.
 *
 * @param gumPixels - 잇몸 Lab 픽셀 배열
 * @returns 영향 받는 영역 배열
 */
function analyzeAffectedAreas(
  gumPixels: LabColor[]
): Array<{
  region: 'upper_front' | 'upper_back' | 'lower_front' | 'lower_back';
  severity: 'mild' | 'moderate' | 'severe';
}> {
  // 폴백 로직: 전체 분석 결과 기반으로 추정

  const avgA = gumPixels.reduce((sum, p) => sum + p.a, 0) / gumPixels.length;

  if (avgA < 12) {
    return [];  // 건강한 경우 영향 영역 없음
  }

  // 경미한 염증 시 일부 영역 반환
  const areas: Array<{
    region: 'upper_front' | 'upper_back' | 'lower_front' | 'lower_back';
    severity: 'mild' | 'moderate' | 'severe';
  }> = [];

  if (avgA >= 12) {
    areas.push({ region: 'lower_front', severity: 'mild' });
  }
  if (avgA >= 15) {
    areas.push({ region: 'upper_front', severity: 'mild' });
  }
  if (avgA >= 18) {
    areas[0].severity = 'moderate';
  }
  if (avgA >= 20) {
    areas.push({ region: 'lower_back', severity: 'moderate' });
  }

  return areas;
}

/**
 * 잇몸 건강 점수를 등급으로 변환
 */
export function getGumHealthGrade(inflammationScore: number): {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  description: string;
} {
  if (inflammationScore < 20) {
    return {
      grade: 'A',
      label: '매우 좋음',
      description: '잇몸이 건강한 상태입니다.',
    };
  } else if (inflammationScore < 40) {
    return {
      grade: 'B',
      label: '좋음',
      description: '잇몸 상태가 양호하나 관리가 필요합니다.',
    };
  } else if (inflammationScore < 60) {
    return {
      grade: 'C',
      label: '보통',
      description: '경미한 염증이 있어 개선이 필요합니다.',
    };
  } else if (inflammationScore < 80) {
    return {
      grade: 'D',
      label: '주의',
      description: '중등도 염증으로 치과 상담을 권장합니다.',
    };
  } else {
    return {
      grade: 'F',
      label: '위험',
      description: '심각한 염증으로 빠른 치과 방문이 필요합니다.',
    };
  }
}

/**
 * 잇몸 건강 결과 요약 텍스트 생성
 */
export function generateGumHealthSummary(result: GumHealthResult): string {
  const { healthStatus, inflammationScore, needsDentalVisit } = result;
  const grade = getGumHealthGrade(inflammationScore);

  let summary = `잇몸 건강 등급: ${grade.grade} (${grade.label})\n`;
  summary += `염증 지수: ${inflammationScore}/100\n`;
  summary += `${grade.description}`;

  if (needsDentalVisit) {
    summary += '\n\n치과 방문을 권장합니다.';
  }

  return summary;
}
