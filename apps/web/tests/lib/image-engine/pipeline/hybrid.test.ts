/**
 * T4.4.8 Gemini 하이브리드 파이프라인 테스트
 *
 * @module tests/lib/image-engine/pipeline/hybrid
 */

import { describe, it, expect, vi } from 'vitest';
import {
  calculateCIEModifiers,
  calculateAIModifiers,
  calculateCrossValidationModifiers,
  calculateTrustScore,
  generateQualityWarnings,
  generateImprovementSuggestion,
  runHybridAnalysis,
} from '@/lib/image-engine/pipeline/hybrid';
import type { AIAnalysisBase, ConfidenceModifier } from '@/lib/image-engine/pipeline/hybrid';
import type { PipelineResult } from '@/lib/image-engine/pipeline/types';

// ============================================================================
// 헬퍼
// ============================================================================

/** CIE 파이프라인 결과 Mock 생성 */
function createMockCIEResult(
  overrides: Partial<{
    qualityScore: number;
    cie4Score: number | null;
    cie2Success: boolean;
    isSuitable: boolean;
    cie1Sharpness: number | null;
  }> = {}
): PipelineResult {
  const {
    qualityScore = 75,
    cie4Score = 70,
    cie2Success = true,
    isSuitable = true,
    cie1Sharpness = null,
  } = overrides;

  return {
    metadata: {
      overallQualityScore: qualityScore,
      overallConfidence: qualityScore / 100,
      processedStages: ['cie1', 'cie2', 'cie3', 'cie4'],
      totalProcessingTime: 100,
      imageInfo: { width: 640, height: 480, aspectRatio: 4 / 3 },
    },
    isSuitableForAnalysis: isSuitable,
    cie1:
      cie1Sharpness !== null
        ? ({
            sharpness: { score: cie1Sharpness, isSharp: cie1Sharpness >= 40 },
          } as PipelineResult['cie1'])
        : undefined,
    cie2: cie2Success
      ? ({ success: true } as PipelineResult['cie2'])
      : ({ success: false } as PipelineResult['cie2']),
    cie3: undefined,
    cie4: cie4Score !== null ? ({ overallScore: cie4Score } as PipelineResult['cie4']) : undefined,
  } as PipelineResult;
}

/** AI 분석 결과 Mock 생성 */
function createMockAIResult(
  overrides: Partial<{
    confidence: number;
    reliability: 'high' | 'medium' | 'low';
    lightingCondition: string;
    makeupDetected: boolean;
  }> = {}
): AIAnalysisBase {
  const { confidence = 80, reliability, lightingCondition, makeupDetected } = overrides;

  const result: AIAnalysisBase = { confidence };

  if (reliability || lightingCondition || makeupDetected !== undefined) {
    result.imageQuality = {};
    if (reliability) result.imageQuality.analysisReliability = reliability;
    if (lightingCondition) result.imageQuality.lightingCondition = lightingCondition;
    if (makeupDetected !== undefined) result.imageQuality.makeupDetected = makeupDetected;
  }

  return result;
}

// ============================================================================
// calculateCIEModifiers
// ============================================================================

describe('calculateCIEModifiers', () => {
  it('높은 품질(80+)에서 +5 보너스', () => {
    const cie = createMockCIEResult({ qualityScore: 85 });
    const mods = calculateCIEModifiers(cie);

    const qualityMod = mods.find((m) => m.reason.includes('높은 이미지 품질'));
    expect(qualityMod).toBeDefined();
    expect(qualityMod!.adjustment).toBe(5);
    expect(qualityMod!.source).toBe('cie');
  });

  it('낮은 품질(<50)에서 -15 패널티', () => {
    const cie = createMockCIEResult({ qualityScore: 30 });
    const mods = calculateCIEModifiers(cie);

    const qualityMod = mods.find((m) => m.reason.includes('낮은 이미지 품질'));
    expect(qualityMod).toBeDefined();
    expect(qualityMod!.adjustment).toBe(-15);
  });

  it('보통 품질(50-64)에서 -5 패널티', () => {
    const cie = createMockCIEResult({ qualityScore: 55 });
    const mods = calculateCIEModifiers(cie);

    const qualityMod = mods.find((m) => m.reason.includes('보통 이미지 품질'));
    expect(qualityMod).toBeDefined();
    expect(qualityMod!.adjustment).toBe(-5);
  });

  it('중간 품질(65-79)에서 품질 관련 조정 없음', () => {
    const cie = createMockCIEResult({ qualityScore: 70 });
    const mods = calculateCIEModifiers(cie);

    const qualityMod = mods.find((m) => m.reason.includes('이미지 품질'));
    expect(qualityMod).toBeUndefined();
  });

  it('낮은 조명(<40)에서 -10 패널티', () => {
    const cie = createMockCIEResult({ cie4Score: 30 });
    const mods = calculateCIEModifiers(cie);

    const lightingMod = mods.find((m) => m.reason.includes('불균일한 조명'));
    expect(lightingMod).toBeDefined();
    expect(lightingMod!.adjustment).toBe(-10);
  });

  it('높은 조명(80+)에서 +3 보너스', () => {
    const cie = createMockCIEResult({ cie4Score: 85 });
    const mods = calculateCIEModifiers(cie);

    const lightingMod = mods.find((m) => m.reason.includes('균일한 조명'));
    expect(lightingMod).toBeDefined();
    expect(lightingMod!.adjustment).toBe(3);
  });

  it('얼굴 감지 실패 시 -10 패널티', () => {
    const cie = createMockCIEResult({ cie2Success: false });
    const mods = calculateCIEModifiers(cie);

    const faceMod = mods.find((m) => m.reason.includes('얼굴 감지 실패'));
    expect(faceMod).toBeDefined();
    expect(faceMod!.adjustment).toBe(-10);
  });

  it('CIE-4 없으면 조명 조정 없음', () => {
    const cie = createMockCIEResult({ cie4Score: null });
    const mods = calculateCIEModifiers(cie);

    const lightingMod = mods.find((m) => m.source === 'cie' && m.reason.includes('조명'));
    expect(lightingMod).toBeUndefined();
  });
});

// ============================================================================
// calculateAIModifiers
// ============================================================================

describe('calculateAIModifiers', () => {
  it('낮은 AI 신뢰도에서 -10 패널티', () => {
    const ai = createMockAIResult({ reliability: 'low' });
    const mods = calculateAIModifiers(ai);

    const reliabilityMod = mods.find((m) => m.reason.includes('낮은 분석 신뢰도'));
    expect(reliabilityMod).toBeDefined();
    expect(reliabilityMod!.adjustment).toBe(-10);
  });

  it('높은 AI 신뢰도에서 +5 보너스', () => {
    const ai = createMockAIResult({ reliability: 'high' });
    const mods = calculateAIModifiers(ai);

    const reliabilityMod = mods.find((m) => m.reason.includes('높은 분석 신뢰도'));
    expect(reliabilityMod).toBeDefined();
    expect(reliabilityMod!.adjustment).toBe(5);
  });

  it('메이크업 감지 시 -5 패널티', () => {
    const ai = createMockAIResult({ makeupDetected: true });
    const mods = calculateAIModifiers(ai);

    const makeupMod = mods.find((m) => m.reason.includes('메이크업'));
    expect(makeupMod).toBeDefined();
    expect(makeupMod!.adjustment).toBe(-5);
  });

  it('imageQuality 없으면 빈 배열', () => {
    const ai: AIAnalysisBase = { confidence: 80 };
    const mods = calculateAIModifiers(ai);
    expect(mods).toHaveLength(0);
  });
});

// ============================================================================
// calculateCrossValidationModifiers
// ============================================================================

describe('calculateCrossValidationModifiers', () => {
  it('CIE 조명 낮은데 AI가 자연광이면 -5 불일치', () => {
    const cie = createMockCIEResult({ cie4Score: 30 });
    const ai = createMockAIResult({ lightingCondition: 'natural' });

    const mods = calculateCrossValidationModifiers(cie, ai);
    const mismatch = mods.find((m) => m.reason.includes('불일치'));
    expect(mismatch).toBeDefined();
    expect(mismatch!.adjustment).toBe(-5);
    expect(mismatch!.source).toBe('cross-validation');
  });

  it('CIE 품질 높고 AI 신뢰도 높으면 +5 보너스', () => {
    const cie = createMockCIEResult({ qualityScore: 80 });
    const ai = createMockAIResult({ reliability: 'high' });

    const mods = calculateCrossValidationModifiers(cie, ai);
    const bonus = mods.find((m) => m.reason.includes('일치'));
    expect(bonus).toBeDefined();
    expect(bonus!.adjustment).toBe(5);
  });

  it('CIE 품질 낮으면 일치 보너스 없음', () => {
    const cie = createMockCIEResult({ qualityScore: 60 });
    const ai = createMockAIResult({ reliability: 'high' });

    const mods = calculateCrossValidationModifiers(cie, ai);
    const bonus = mods.find((m) => m.reason.includes('일치'));
    expect(bonus).toBeUndefined();
  });
});

// ============================================================================
// calculateTrustScore
// ============================================================================

describe('calculateTrustScore', () => {
  it('CIE + AI 가중 결합 (AI 60% + CIE 40%)', () => {
    const cie = createMockCIEResult({ qualityScore: 80 });
    const ai = createMockAIResult({ confidence: 90 });

    // baseScore = 90*0.6 + 80*0.4 = 54 + 32 = 86
    const score = calculateTrustScore(cie, ai, []);
    expect(score).toBe(86);
  });

  it('CIE 없으면 AI confidence만 사용', () => {
    const ai = createMockAIResult({ confidence: 75 });
    const score = calculateTrustScore(null, ai, []);
    expect(score).toBe(75);
  });

  it('AI confidence 없으면 기본 50', () => {
    const ai: AIAnalysisBase = {};
    const score = calculateTrustScore(null, ai, []);
    expect(score).toBe(50);
  });

  it('조정 적용', () => {
    const ai = createMockAIResult({ confidence: 80 });
    const modifiers: ConfidenceModifier[] = [
      { reason: 'test+', adjustment: 10, source: 'cie' },
      { reason: 'test-', adjustment: -5, source: 'ai' },
    ];
    // 80 + 10 - 5 = 85
    const score = calculateTrustScore(null, ai, modifiers);
    expect(score).toBe(85);
  });

  it('점수는 0-100 범위로 클램핑', () => {
    const ai = createMockAIResult({ confidence: 95 });
    const highMods: ConfidenceModifier[] = [{ reason: 'big+', adjustment: 20, source: 'cie' }];
    expect(calculateTrustScore(null, ai, highMods)).toBe(100);

    const lowMods: ConfidenceModifier[] = [{ reason: 'big-', adjustment: -200, source: 'cie' }];
    expect(calculateTrustScore(null, ai, lowMods)).toBe(0);
  });
});

// ============================================================================
// generateQualityWarnings
// ============================================================================

describe('generateQualityWarnings', () => {
  it('CIE 부적합 이미지 경고', () => {
    const cie = createMockCIEResult({ isSuitable: false, qualityScore: 80 });
    const warnings = generateQualityWarnings(cie, createMockAIResult());
    expect(warnings.some((w) => w.includes('부적합'))).toBe(true);
  });

  it('낮은 품질 경고', () => {
    const cie = createMockCIEResult({ qualityScore: 40 });
    const warnings = generateQualityWarnings(cie, createMockAIResult());
    expect(warnings.some((w) => w.includes('품질이 낮아'))).toBe(true);
  });

  it('조명 불균일 경고', () => {
    const cie = createMockCIEResult({ cie4Score: 30 });
    const warnings = generateQualityWarnings(cie, createMockAIResult());
    expect(warnings.some((w) => w.includes('조명'))).toBe(true);
  });

  it('메이크업 감지 경고', () => {
    const ai = createMockAIResult({ makeupDetected: true });
    const warnings = generateQualityWarnings(null, ai);
    expect(warnings.some((w) => w.includes('메이크업'))).toBe(true);
  });

  it('낮은 AI 신뢰도 경고', () => {
    const ai = createMockAIResult({ reliability: 'low' });
    const warnings = generateQualityWarnings(null, ai);
    expect(warnings.some((w) => w.includes('AI 분석 신뢰도'))).toBe(true);
  });

  it('정상 이미지에서 경고 없음', () => {
    const cie = createMockCIEResult({ qualityScore: 80, cie4Score: 80, isSuitable: true });
    const ai = createMockAIResult({ reliability: 'high' });
    const warnings = generateQualityWarnings(cie, ai);
    expect(warnings).toHaveLength(0);
  });
});

// ============================================================================
// generateImprovementSuggestion
// ============================================================================

describe('generateImprovementSuggestion', () => {
  it('CIE 없으면 undefined', () => {
    expect(generateImprovementSuggestion(null)).toBeUndefined();
  });

  it('높은 품질(70+)이면 undefined', () => {
    const cie = createMockCIEResult({ qualityScore: 80 });
    expect(generateImprovementSuggestion(cie)).toBeUndefined();
  });

  it('흐릿한 이미지 제안', () => {
    const cie = createMockCIEResult({ qualityScore: 50, cie1Sharpness: 30 });
    const suggestion = generateImprovementSuggestion(cie);
    expect(suggestion).toContain('흐릿');
  });

  it('조명 불균일 제안', () => {
    const cie = createMockCIEResult({ qualityScore: 50, cie4Score: 30 });
    const suggestion = generateImprovementSuggestion(cie);
    expect(suggestion).toContain('조명');
  });

  it('일반 낮은 품질 제안', () => {
    const cie = createMockCIEResult({ qualityScore: 40, cie4Score: 60, cie1Sharpness: null });
    const suggestion = generateImprovementSuggestion(cie);
    expect(suggestion).toContain('이미지 품질');
  });
});

// ============================================================================
// runHybridAnalysis
// ============================================================================

describe('runHybridAnalysis', () => {
  it('CIE + AI 모두 성공', async () => {
    const cie = createMockCIEResult({ qualityScore: 80 });
    const ai = createMockAIResult({ confidence: 85, reliability: 'high' });

    const result = await runHybridAnalysis(
      () => Promise.resolve(cie),
      () => Promise.resolve(ai),
      () => createMockAIResult({ confidence: 50 })
    );

    expect(result.cieResult).toBe(cie);
    expect(result.aiResult).toBe(ai);
    expect(result.usedFallback).toBe(false);
    expect(result.trustScore).toBeGreaterThan(0);
    expect(result.trustScore).toBeLessThanOrEqual(100);
    expect(result.totalProcessingTime).toBeGreaterThanOrEqual(0);
  });

  it('CIE 실패 시 AI만 실행', async () => {
    const ai = createMockAIResult({ confidence: 80 });

    const result = await runHybridAnalysis(
      () => Promise.reject(new Error('CIE failed')),
      () => Promise.resolve(ai),
      () => createMockAIResult({ confidence: 50 })
    );

    expect(result.cieResult).toBeNull();
    expect(result.aiResult).toBe(ai);
    expect(result.usedFallback).toBe(false);
  });

  it('AI 실패 시 Mock fallback', async () => {
    const cie = createMockCIEResult({ qualityScore: 80 });
    const mockAI = createMockAIResult({ confidence: 50 });

    const result = await runHybridAnalysis(
      () => Promise.resolve(cie),
      () => Promise.reject(new Error('AI failed')),
      () => mockAI
    );

    expect(result.aiResult).toBe(mockAI);
    expect(result.usedFallback).toBe(true);
    // fallback 사용 시 -20 패널티
    const fallbackMod = result.confidenceModifiers.find((m) => m.reason.includes('Fallback'));
    expect(fallbackMod).toBeDefined();
    expect(fallbackMod!.adjustment).toBe(-20);
  });

  it('skipCIE 옵션', async () => {
    const ai = createMockAIResult({ confidence: 80 });
    const cieFn = vi.fn();

    const result = await runHybridAnalysis(
      cieFn,
      () => Promise.resolve(ai),
      () => createMockAIResult({ confidence: 50 }),
      { skipCIE: true }
    );

    expect(cieFn).not.toHaveBeenCalled();
    expect(result.cieResult).toBeNull();
  });

  it('품질 미달 + continueOnCIEFail=false → AI 건너뛰기', async () => {
    const cie = createMockCIEResult({ qualityScore: 20 });
    const aiFn = vi.fn();

    const result = await runHybridAnalysis(
      () => Promise.resolve(cie),
      aiFn,
      () => createMockAIResult({ confidence: 50 }),
      { continueOnCIEFail: false, minQualityForAI: 30 }
    );

    expect(aiFn).not.toHaveBeenCalled();
    expect(result.usedFallback).toBe(true);
    expect(result.trustScore).toBe(0);
    expect(result.qualityWarnings).toHaveLength(1);
    expect(result.qualityWarnings[0]).toContain('건너뛰었습니다');
  });

  it('품질 충분 + continueOnCIEFail=false → AI 실행', async () => {
    const cie = createMockCIEResult({ qualityScore: 60 });
    const ai = createMockAIResult({ confidence: 80 });

    const result = await runHybridAnalysis(
      () => Promise.resolve(cie),
      () => Promise.resolve(ai),
      () => createMockAIResult({ confidence: 50 }),
      { continueOnCIEFail: false, minQualityForAI: 30 }
    );

    expect(result.aiResult).toBe(ai);
    expect(result.usedFallback).toBe(false);
  });

  it('신뢰도 조정이 올바르게 적용됨', async () => {
    // 높은 품질 CIE + 높은 AI → 여러 보너스
    const cie = createMockCIEResult({ qualityScore: 85, cie4Score: 85 });
    const ai = createMockAIResult({ confidence: 90, reliability: 'high' });

    const result = await runHybridAnalysis(
      () => Promise.resolve(cie),
      () => Promise.resolve(ai),
      () => createMockAIResult({ confidence: 50 })
    );

    // CIE 높은 품질(+5) + CIE 균일 조명(+3) + AI 높은 신뢰도(+5) + 교차검증 일치(+5)
    const totalAdj = result.confidenceModifiers.reduce((sum, m) => sum + m.adjustment, 0);
    expect(totalAdj).toBeGreaterThan(0);
    expect(result.confidenceModifiers.length).toBeGreaterThanOrEqual(3);
  });

  it('totalProcessingTime이 기록됨', async () => {
    const result = await runHybridAnalysis(
      () => Promise.resolve(createMockCIEResult()),
      () => Promise.resolve(createMockAIResult()),
      () => createMockAIResult()
    );

    expect(result.totalProcessingTime).toBeGreaterThanOrEqual(0);
  });
});
