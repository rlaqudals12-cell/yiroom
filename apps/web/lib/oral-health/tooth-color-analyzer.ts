/**
 * 치아 색상 분석기
 *
 * @module lib/oral-health/tooth-color-analyzer
 * @description VITA 셰이드 기반 치아 색상 분석
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 */

import type { ToothColorInput, ToothColorResult, LabColor, VitaSeries } from '@/types/oral-health';
import { rgbToLab, calculateAverageLabFromPixels } from './internal/lab-converter';
import { findBestShadeMatch, interpretBrightness, interpretYellowness } from './internal/vita-database';
import { interpretColorDifference } from './internal/ciede2000';
import {
  getGeminiOralAnalysis,
  convertGeminiToothColorResult,
  extractToothLabWithGemini,
} from './internal/gemini-bridge';

/**
 * 치아 색상 분석
 *
 * @param input - 분석 입력
 * @param useGemini - Gemini Vision 사용 여부 (기본: true)
 * @returns 치아 색상 분석 결과
 */
export async function analyzeToothColor(
  input: ToothColorInput,
  useGemini: boolean = true
): Promise<ToothColorResult & { usedFallback: boolean }> {
  // Gemini 사용 시 직접 분석 결과 반환
  if (useGemini) {
    const { data, usedFallback } = await getGeminiOralAnalysis(input.imageBase64);

    if (!usedFallback && data) {
      console.log('[OH-1 Tooth] Using Gemini analysis result');
      const result = convertGeminiToothColorResult(data);
      return { ...result, usedFallback: false };
    }
    console.log('[OH-1 Tooth] Gemini unavailable, falling back to mock');
  }

  // 폴백: 이미지에서 치아 영역 Lab 값 추출 (Mock)
  const measuredLab = await extractToothLabFromImage(input.imageBase64, input.regionOfInterest);

  // VITA 셰이드 매칭
  const matchResult = findBestShadeMatch(measuredLab);

  // 색차 해석
  const colorDiffInterpretation = interpretColorDifference(matchResult.deltaE);

  // 밝기 해석
  const brightnessInterpretation = interpretBrightness(matchResult.shade);

  // 황색도 해석
  const yellownessInterpretation = interpretYellowness(measuredLab);

  // 신뢰도 계산 (색차가 작을수록 높음)
  const confidence = calculateConfidence(matchResult.deltaE, colorDiffInterpretation.isAcceptable);

  return {
    measuredLab,
    matchedShade: matchResult.shade,
    deltaE: Math.round(matchResult.deltaE * 100) / 100,
    confidence,
    alternativeMatches: matchResult.alternativeMatches.map(m => ({
      shade: m.shade,
      deltaE: Math.round(m.deltaE * 100) / 100,
    })),
    interpretation: {
      brightness: brightnessInterpretation.level,
      yellowness: yellownessInterpretation.level,
      series: matchResult.reference.series,
    },
    usedFallback: true,
  };
}

/**
 * 이미지에서 치아 영역 Lab 값 추출
 *
 * @description
 * Gemini Vision을 통해 VITA 셰이드를 판별하고,
 * 해당 셰이드의 Lab 참조값을 반환합니다.
 * Gemini 사용 불가 시 Mock 데이터로 폴백.
 *
 * @param imageBase64 - Base64 인코딩된 이미지
 * @param roi - 관심 영역 (선택)
 * @returns Lab 색상
 */
async function extractToothLabFromImage(
  imageBase64: string,
  roi?: { x: number; y: number; width: number; height: number }
): Promise<LabColor> {
  // Gemini 브릿지를 통한 Lab 추출 시도
  const geminiResult = await extractToothLabWithGemini(imageBase64);

  if (geminiResult && !geminiResult.usedFallback) {
    console.log('[OH-1 Tooth] Extracted Lab via Gemini bridge');
    return geminiResult.lab;
  }

  // 폴백: Mock Lab 값 생성
  console.log('[OH-1 Tooth] Using mock tooth Lab');
  // Mock: 일반적인 A2~A3 범위의 치아 색상
  return {
    L: 65 + Math.random() * 6,
    a: 2 + Math.random() * 2,
    b: 18 + Math.random() * 4,
  };
}

/**
 * 신뢰도 계산
 */
function calculateConfidence(deltaE: number, isAcceptableMatch: boolean): number {
  // 기본 신뢰도
  let confidence = 85;

  // 색차에 따른 조정
  if (deltaE < 1.0) {
    confidence = 95;
  } else if (deltaE < 2.0) {
    confidence = 90;
  } else if (deltaE < 3.0) {
    confidence = 80;
  } else if (deltaE < 4.0) {
    confidence = 70;
  } else {
    confidence = 60;
  }

  // 허용 범위 벗어난 경우 패널티
  if (!isAcceptableMatch) {
    confidence = Math.max(50, confidence - 15);
  }

  return confidence;
}

/**
 * 치아 색상 결과 요약 텍스트 생성
 */
export function generateToothColorSummary(result: ToothColorResult): string {
  const { matchedShade, interpretation, confidence } = result;

  const brightnessTexts = {
    very_bright: '매우 밝은',
    bright: '밝은',
    medium: '중간 밝기의',
    dark: '다소 어두운',
    very_dark: '어두운',
  };

  const yellownessTexts = {
    minimal: '황색기가 거의 없는',
    mild: '자연스러운 아이보리톤의',
    moderate: '중간 정도 황색기가 있는',
    significant: '뚜렷한 황색기가 있는',
  };

  const seriesTexts: Record<VitaSeries, string> = {
    A: '황갈색 계열',
    B: '황색 계열',
    C: '회색 계열',
    D: '적회색 계열',
  };

  const brightness = brightnessTexts[interpretation.brightness];
  const yellowness = yellownessTexts[interpretation.yellowness];
  const series = seriesTexts[interpretation.series];

  return `현재 치아 색상은 VITA ${matchedShade}로, ${brightness} ${yellowness} ${series}입니다. (신뢰도 ${confidence}%)`;
}
