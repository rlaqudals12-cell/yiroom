/**
 * Confidence Propagation System
 * P2: Statistical confidence propagation theory
 * P3: Each function independently testable
 * P8: lib/shared/ common module
 * @module lib/shared/confidence-propagation
 * @version 1.0
 */

import type { SourceModule } from './integration-types';

export interface ConfidenceSource {
  module: SourceModule | string;
  confidence: number;
  weight?: number;
  depth?: number;
  timestamp?: string;
}

export type AggregationMethod = 'multiplicative' | 'weighted_average' | 'minimum' | 'geometric_mean';

export interface ConfidenceOptions {
  method?: AggregationMethod;
  minThreshold?: number;
  applyDepthDecay?: boolean;
  applyTimeDecay?: boolean;
  timeDecayHalfLife?: number;
}

export interface ConfidenceResult {
  finalConfidence: number;
  method: AggregationMethod;
  meetsThreshold: boolean;
  lowestSource: ConfidenceSource | null;
  appliedDecay: { depth: number; time: number };
}

export type ConfidenceGrade = 'high' | 'medium' | 'low' | 'insufficient';

export const MODULE_WEIGHTS: Record<string, number> = {
  'CIE-1': 1.0, 'CIE-2': 1.0, 'CIE-3': 1.0, 'CIE-4': 1.0,
  'PC-1': 0.9, 'PC-2': 0.9, 'S-1': 0.85, 'S-2': 0.85,
  'C-1': 0.8, 'C-2': 0.8, 'N-1': 0.75, 'W-1': 0.75, 'OH-1': 0.8,
};

export const CONFIDENCE_THRESHOLDS = {
  DISPLAY: 50,
  PRODUCT_RECOMMENDATION: 60,
  MEDICAL_ADVICE: 70,
  HIGH: 80,
} as const;

const DEPTH_DECAY_RATES = [1.0, 0.95, 0.9, 0.85];
const DEFAULT_TIME_DECAY_HALF_LIFE = 7 * 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getConfidenceDegradation(depth: number): number {
  if (depth < 0) return 1.0;
  return DEPTH_DECAY_RATES[Math.min(depth, DEPTH_DECAY_RATES.length - 1)];
}

export function calculatePropagatedConfidence(
  sources: ConfidenceSource[],
  options: ConfidenceOptions = {}
): ConfidenceResult {
  const {
    method = 'weighted_average',
    minThreshold = CONFIDENCE_THRESHOLDS.DISPLAY,
    applyDepthDecay = true,
    applyTimeDecay = false,
    timeDecayHalfLife = DEFAULT_TIME_DECAY_HALF_LIFE,
  } = options;

  if (sources.length === 0) {
    return { finalConfidence: 0, method, meetsThreshold: false, lowestSource: null, appliedDecay: { depth: 0, time: 0 } };
  }

  const processedSources = sources.map((source) => {
    let adjustedConfidence = source.confidence;
    let depthDecay = 0;
    let timeDecay = 0;

    if (applyDepthDecay && source.depth !== undefined && source.depth > 0) {
      const decayFactor = getConfidenceDegradation(source.depth);
      const orig = adjustedConfidence;
      adjustedConfidence *= decayFactor;
      depthDecay = orig - adjustedConfidence;
    }

    if (applyTimeDecay && source.timestamp) {
      const age = Date.now() - new Date(source.timestamp).getTime();
      const decayFactor = Math.pow(0.5, age / timeDecayHalfLife);
      const before = adjustedConfidence;
      adjustedConfidence *= decayFactor;
      timeDecay = before - adjustedConfidence;
    }

    const weight = source.weight ?? MODULE_WEIGHTS[source.module] ?? 1.0;
    return { ...source, adjustedConfidence, weight, depthDecay, timeDecay };
  });

  let finalConfidence: number;
  switch (method) {
    case 'multiplicative':
      finalConfidence = processedSources.reduce((acc, s) => acc * (s.adjustedConfidence / 100), 1.0) * 100;
      break;
    case 'minimum':
      finalConfidence = Math.min(...processedSources.map((s) => s.adjustedConfidence));
      break;
    case 'geometric_mean': {
      const product = processedSources.reduce((acc, s) => acc * s.adjustedConfidence, 1.0);
      finalConfidence = Math.pow(product, 1 / processedSources.length);
      break;
    }
    default: {
      const totalWeight = processedSources.reduce((acc, s) => acc + s.weight, 0);
      finalConfidence = processedSources.reduce((acc, s) => acc + (s.adjustedConfidence * s.weight) / totalWeight, 0);
      break;
    }
  }

  const totalDepthDecay = processedSources.reduce((acc, s) => acc + s.depthDecay, 0) / processedSources.length;
  const totalTimeDecay = processedSources.reduce((acc, s) => acc + s.timeDecay, 0) / processedSources.length;
  finalConfidence = clamp(finalConfidence, 0, 100);

  const lowestSource = processedSources.reduce<ConfidenceSource | null>(
    (lowest, current) => current.adjustedConfidence < (lowest?.confidence ?? Infinity) ? current : lowest,
    null
  );

  return { finalConfidence, method, meetsThreshold: finalConfidence >= minThreshold, lowestSource, appliedDecay: { depth: totalDepthDecay, time: totalTimeDecay } };
}

export function applyConfidenceWeight(baseConfidence: number, sourceConfidence: number, weight = 1.0): number {
  const clampedWeight = clamp(weight, 0, 1);
  const sourceRatio = sourceConfidence / 100;
  return clamp(baseConfidence * (sourceRatio * clampedWeight + (1 - clampedWeight)), 0, 100);
}

export function validateMinConfidenceThreshold(confidence: number, threshold = CONFIDENCE_THRESHOLDS.DISPLAY): boolean {
  return confidence >= threshold;
}

export function getConfidenceGrade(confidence: number): ConfidenceGrade {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
  if (confidence >= CONFIDENCE_THRESHOLDS.PRODUCT_RECOMMENDATION) return 'medium';
  if (confidence >= CONFIDENCE_THRESHOLDS.DISPLAY) return 'low';
  return 'insufficient';
}

export function getConfidenceGradeLabel(grade: ConfidenceGrade): string {
  const labels: Record<ConfidenceGrade, string> = { high: '높음', medium: '보통', low: '낮음', insufficient: '부족' };
  return labels[grade];
}

export function calculateCIEConfidenceModifier(
  cieConfidences: Partial<Record<'CIE-1' | 'CIE-2' | 'CIE-3' | 'CIE-4', number>>
): number {
  const sources: ConfidenceSource[] = Object.entries(cieConfidences)
    .filter(([, conf]) => conf !== undefined)
    .map(([module, conf]) => ({ module, confidence: conf as number, weight: MODULE_WEIGHTS[module] ?? 1.0 }));
  if (sources.length === 0) return 1.0;
  const result = calculatePropagatedConfidence(sources, { method: 'minimum' });
  return 0.5 + (result.finalConfidence / 100) * 0.5;
}

export function calculateWellnessConfidence(
  moduleConfidences: Partial<Record<'PC-1' | 'S-1' | 'C-1' | 'N-1' | 'W-1', number>>
): ConfidenceResult {
  const sources: ConfidenceSource[] = Object.entries(moduleConfidences)
    .filter(([, conf]) => conf !== undefined)
    .map(([module, conf]) => ({ module, confidence: conf as number, weight: MODULE_WEIGHTS[module] ?? 0.8 }));
  return calculatePropagatedConfidence(sources, { method: 'weighted_average', minThreshold: CONFIDENCE_THRESHOLDS.DISPLAY });
}

export function validateProductRecommendationConfidence(sources: ConfidenceSource[]): {
  canRecommend: boolean;
  confidence: number;
  reason?: string;
} {
  const result = calculatePropagatedConfidence(sources, {
    method: 'weighted_average',
    minThreshold: CONFIDENCE_THRESHOLDS.PRODUCT_RECOMMENDATION,
  });
  if (!result.meetsThreshold) {
    return { canRecommend: false, confidence: result.finalConfidence, reason: '신뢰도가 제품 추천 기준(' + CONFIDENCE_THRESHOLDS.PRODUCT_RECOMMENDATION + '%) 미달' };
  }
  if (result.lowestSource && result.lowestSource.confidence < CONFIDENCE_THRESHOLDS.DISPLAY) {
    return { canRecommend: false, confidence: result.finalConfidence, reason: result.lowestSource.module + ' 분석 신뢰도가 너무 낮음' };
  }
  return { canRecommend: true, confidence: result.finalConfidence };
}

export const CONFIDENCE_FLOW_GRAPH: Record<string, string[]> = {
  'CIE-1': ['PC-1', 'S-1', 'C-1', 'OH-1'],
  'CIE-2': ['PC-1', 'S-1', 'C-1', 'OH-1'],
  'CIE-3': ['PC-1', 'S-1', 'C-1', 'OH-1'],
  'CIE-4': ['PC-1', 'S-1', 'C-1', 'OH-1'],
  'PC-1': ['M-1', 'H-1', 'ProductRecommendation'],
  'S-1': ['SK-1', 'M-1', 'ProductRecommendation'],
  'C-1': ['W-2', 'ProductRecommendation'],
  'N-1': ['WellnessScore'],
  'W-1': ['WellnessScore'],
  'OH-1': ['N-1'],
};

export function calculateTargetConfidence(
  targetModule: string,
  sourceConfidences: Record<string, number>
): ConfidenceResult {
  const relevantSources: ConfidenceSource[] = [];
  for (const [sourceModule, targets] of Object.entries(CONFIDENCE_FLOW_GRAPH)) {
    if (targets.includes(targetModule) && sourceConfidences[sourceModule] !== undefined) {
      relevantSources.push({
        module: sourceModule,
        confidence: sourceConfidences[sourceModule],
        weight: MODULE_WEIGHTS[sourceModule] ?? 1.0,
        depth: sourceModule.startsWith('CIE-') ? 1 : 0,
      });
    }
  }
  return calculatePropagatedConfidence(relevantSources, { method: 'weighted_average', applyDepthDecay: true });
}
