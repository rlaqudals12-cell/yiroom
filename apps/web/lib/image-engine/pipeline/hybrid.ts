/**
 * Gemini 하이브리드 파이프라인
 * 로컬 CIE 분석 + Gemini AI를 결합한 신뢰도 강화 파이프라인
 *
 * @module lib/image-engine/pipeline/hybrid
 * @description CIE 품질 점수로 AI 신뢰도를 조정하고 통합 trust score 산출
 * @see docs/adr/ADR-001-core-image-engine.md
 */

import type { PipelineResult, PipelineOptions } from './types';

// ============================================================================
// 타입 정의
// ============================================================================

/** AI 분석 결과의 최소 인터페이스 */
export interface AIAnalysisBase {
  confidence?: number;
  imageQuality?: {
    analysisReliability?: 'high' | 'medium' | 'low';
    lightingCondition?: string;
    makeupDetected?: boolean;
  };
}

/** 신뢰도 조정 사유 */
export interface ConfidenceModifier {
  reason: string;
  /** -20 ~ +10 범위의 조정 점수 */
  adjustment: number;
  source: 'cie' | 'ai' | 'cross-validation';
}

/** 하이브리드 분석 결과 */
export interface HybridAnalysisResult<T extends AIAnalysisBase> {
  /** 로컬 CIE 파이프라인 결과 */
  cieResult: PipelineResult | null;

  /** AI 분석 결과 */
  aiResult: T;

  /** Mock fallback 사용 여부 */
  usedFallback: boolean;

  /** 통합 신뢰도 점수 (0-100) */
  trustScore: number;

  /** 품질 경고 */
  qualityWarnings: string[];

  /** 신뢰도 조정 상세 */
  confidenceModifiers: ConfidenceModifier[];

  /** 이미지 개선 제안 (품질 낮을 때) */
  suggestedImprovement?: string;

  /** 총 처리 시간 (ms) */
  totalProcessingTime: number;
}

/** 하이브리드 파이프라인 옵션 */
export interface HybridPipelineOptions {
  /** CIE 파이프라인 옵션 */
  cieOptions?: PipelineOptions;
  /** CIE 실패 시에도 AI 분석 계속 */
  continueOnCIEFail?: boolean;
  /** AI 분석 최소 품질 점수 (기본 30) */
  minQualityForAI?: number;
  /** CIE 파이프라인 건너뛰기 (AI만 실행) */
  skipCIE?: boolean;
}

// ============================================================================
// 신뢰도 조정 로직
// ============================================================================

/** CIE 품질 점수 기반 AI 신뢰도 조정 */
export function calculateCIEModifiers(cieResult: PipelineResult): ConfidenceModifier[] {
  const modifiers: ConfidenceModifier[] = [];
  const quality = cieResult.metadata.overallQualityScore;

  // CIE-1 품질 기반
  if (quality >= 80) {
    modifiers.push({
      reason: '높은 이미지 품질 (CIE-1)',
      adjustment: 5,
      source: 'cie',
    });
  } else if (quality < 50) {
    modifiers.push({
      reason: '낮은 이미지 품질 (CIE-1)',
      adjustment: -15,
      source: 'cie',
    });
  } else if (quality < 65) {
    modifiers.push({
      reason: '보통 이미지 품질 (CIE-1)',
      adjustment: -5,
      source: 'cie',
    });
  }

  // CIE-4 조명 분석 기반
  if (cieResult.cie4) {
    const lightingScore = cieResult.cie4.overallScore ?? 0;
    if (lightingScore < 40) {
      modifiers.push({
        reason: '불균일한 조명 감지 (CIE-4)',
        adjustment: -10,
        source: 'cie',
      });
    } else if (lightingScore >= 80) {
      modifiers.push({
        reason: '균일한 조명 (CIE-4)',
        adjustment: 3,
        source: 'cie',
      });
    }
  }

  // 얼굴 감지 실패
  if (cieResult.cie2 && !cieResult.cie2.success) {
    modifiers.push({
      reason: '얼굴 감지 실패 (CIE-2)',
      adjustment: -10,
      source: 'cie',
    });
  }

  return modifiers;
}

/** AI 자체 신뢰도 신호 기반 조정 */
export function calculateAIModifiers(aiResult: AIAnalysisBase): ConfidenceModifier[] {
  const modifiers: ConfidenceModifier[] = [];

  if (aiResult.imageQuality) {
    const { analysisReliability, makeupDetected } = aiResult.imageQuality;

    if (analysisReliability === 'low') {
      modifiers.push({
        reason: 'AI가 낮은 분석 신뢰도 보고',
        adjustment: -10,
        source: 'ai',
      });
    } else if (analysisReliability === 'high') {
      modifiers.push({
        reason: 'AI가 높은 분석 신뢰도 보고',
        adjustment: 5,
        source: 'ai',
      });
    }

    if (makeupDetected) {
      modifiers.push({
        reason: '메이크업 감지 — 피부톤 판정 불확실성 증가',
        adjustment: -5,
        source: 'ai',
      });
    }
  }

  return modifiers;
}

/** CIE-AI 교차 검증 조정 */
export function calculateCrossValidationModifiers(
  cieResult: PipelineResult,
  aiResult: AIAnalysisBase
): ConfidenceModifier[] {
  const modifiers: ConfidenceModifier[] = [];

  // CIE가 조명 문제를 감지했는데 AI는 "자연광"이라고 판단한 경우
  if (
    cieResult.cie4 &&
    (cieResult.cie4.overallScore ?? 100) < 40 &&
    aiResult.imageQuality?.lightingCondition === 'natural'
  ) {
    modifiers.push({
      reason: 'CIE-AI 조명 판단 불일치',
      adjustment: -5,
      source: 'cross-validation',
    });
  }

  // CIE 품질 높고 AI 신뢰도도 높으면 보너스
  if (
    cieResult.metadata.overallQualityScore >= 75 &&
    aiResult.imageQuality?.analysisReliability === 'high'
  ) {
    modifiers.push({
      reason: 'CIE-AI 품질 판단 일치 (모두 높음)',
      adjustment: 5,
      source: 'cross-validation',
    });
  }

  return modifiers;
}

// ============================================================================
// Trust Score 계산
// ============================================================================

/** 통합 trust score 계산 */
export function calculateTrustScore(
  cieResult: PipelineResult | null,
  aiResult: AIAnalysisBase,
  modifiers: ConfidenceModifier[]
): number {
  // 기본 점수: AI confidence (없으면 50)
  const aiConfidence = aiResult.confidence ?? 50;

  // CIE 품질 가중치 (CIE 없으면 AI만 사용)
  let baseScore: number;
  if (cieResult) {
    const cieQuality = cieResult.metadata.overallQualityScore;
    // 가중 결합: AI 60% + CIE 40%
    baseScore = aiConfidence * 0.6 + cieQuality * 0.4;
  } else {
    baseScore = aiConfidence;
  }

  // 조정 적용
  const totalAdjustment = modifiers.reduce((sum, m) => sum + m.adjustment, 0);
  const adjustedScore = baseScore + totalAdjustment;

  return Math.round(Math.max(0, Math.min(100, adjustedScore)));
}

// ============================================================================
// 품질 경고 생성
// ============================================================================

/** 품질 경고 메시지 생성 */
export function generateQualityWarnings(
  cieResult: PipelineResult | null,
  aiResult: AIAnalysisBase
): string[] {
  const warnings: string[] = [];

  if (cieResult) {
    if (!cieResult.isSuitableForAnalysis) {
      warnings.push('이미지 품질이 분석에 부적합합니다.');
    }

    if (cieResult.metadata.overallQualityScore < 50) {
      warnings.push('이미지 품질이 낮아 결과의 정확도가 떨어질 수 있습니다.');
    }

    if (cieResult.cie4 && (cieResult.cie4.overallScore ?? 100) < 40) {
      warnings.push('조명이 불균일합니다. 자연광에서 촬영하면 더 정확한 결과를 얻을 수 있습니다.');
    }
  }

  if (aiResult.imageQuality?.makeupDetected) {
    warnings.push('메이크업이 감지되었습니다. 맨 얼굴로 촬영하면 더 정확합니다.');
  }

  if (aiResult.imageQuality?.analysisReliability === 'low') {
    warnings.push('AI 분석 신뢰도가 낮습니다. 다른 사진으로 다시 시도해주세요.');
  }

  return warnings;
}

/** 이미지 개선 제안 생성 */
export function generateImprovementSuggestion(
  cieResult: PipelineResult | null
): string | undefined {
  if (!cieResult) return undefined;

  const quality = cieResult.metadata.overallQualityScore;

  if (quality >= 70) return undefined;

  if (cieResult.cie1) {
    const sharpness = cieResult.cie1.sharpness?.score ?? 100;
    if (sharpness < 40) {
      return '사진이 흐릿합니다. 카메라를 고정하고 다시 촬영해주세요.';
    }
  }

  if (cieResult.cie4 && (cieResult.cie4.overallScore ?? 100) < 40) {
    return '조명이 균일하지 않습니다. 자연광이 들어오는 곳에서 촬영해주세요.';
  }

  if (quality < 50) {
    return '이미지 품질을 높이면 더 정확한 분석이 가능합니다. 밝은 곳에서 정면으로 촬영해주세요.';
  }

  return undefined;
}

// ============================================================================
// 하이브리드 파이프라인 실행
// ============================================================================

/**
 * 하이브리드 분석 실행
 *
 * @param runCIE - CIE 파이프라인 실행 함수
 * @param runAI - AI 분석 실행 함수
 * @param runMock - Mock fallback 생성 함수
 * @param options - 파이프라인 옵션
 *
 * @example
 * ```ts
 * const result = await runHybridAnalysis(
 *   () => runCIEPipeline(imageData, { onProgress }),
 *   () => analyzePersonalColor(input),
 *   () => generateMockResult(input),
 *   { minQualityForAI: 40 }
 * );
 * ```
 */
export async function runHybridAnalysis<T extends AIAnalysisBase>(
  runCIE: () => Promise<PipelineResult>,
  runAI: () => Promise<T>,
  runMock: () => T,
  options: HybridPipelineOptions = {}
): Promise<HybridAnalysisResult<T>> {
  const { continueOnCIEFail = true, minQualityForAI = 30, skipCIE = false } = options;

  const startTime = Date.now();
  let cieResult: PipelineResult | null = null;
  let aiResult: T;
  let usedFallback = false;

  // 1단계: CIE 로컬 분석
  if (!skipCIE) {
    try {
      cieResult = await runCIE();
    } catch {
      // CIE 실패 — 무시하고 AI만 실행
      cieResult = null;
    }

    // 품질 임계값 미달 시 AI 건너뛰기 (continueOnCIEFail이 false일 때)
    if (
      cieResult &&
      !continueOnCIEFail &&
      cieResult.metadata.overallQualityScore < minQualityForAI
    ) {
      aiResult = runMock();
      usedFallback = true;

      return {
        cieResult,
        aiResult,
        usedFallback,
        trustScore: 0,
        qualityWarnings: ['이미지 품질이 너무 낮아 AI 분석을 건너뛰었습니다.'],
        confidenceModifiers: [],
        suggestedImprovement: generateImprovementSuggestion(cieResult),
        totalProcessingTime: Date.now() - startTime,
      };
    }
  }

  // 2단계: AI 분석
  try {
    aiResult = await runAI();
  } catch {
    aiResult = runMock();
    usedFallback = true;
  }

  // 3단계: 신뢰도 조정
  const modifiers: ConfidenceModifier[] = [];

  if (cieResult) {
    modifiers.push(...calculateCIEModifiers(cieResult));
    modifiers.push(...calculateCrossValidationModifiers(cieResult, aiResult));
  }
  modifiers.push(...calculateAIModifiers(aiResult));

  if (usedFallback) {
    modifiers.push({
      reason: 'AI Fallback 사용 (Mock 데이터)',
      adjustment: -20,
      source: 'ai',
    });
  }

  // 4단계: Trust Score 계산
  const trustScore = calculateTrustScore(cieResult, aiResult, modifiers);

  // 5단계: 경고 + 개선 제안
  const qualityWarnings = generateQualityWarnings(cieResult, aiResult);
  const suggestedImprovement = generateImprovementSuggestion(cieResult);

  return {
    cieResult,
    aiResult,
    usedFallback,
    trustScore,
    qualityWarnings,
    confidenceModifiers: modifiers,
    suggestedImprovement,
    totalProcessingTime: Date.now() - startTime,
  };
}
