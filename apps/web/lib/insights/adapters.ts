/**
 * 인사이트 데이터 어댑터
 *
 * @module lib/insights/adapters
 * @description AnalysisSummary (UI) ↔ AnalysisDataBundle (인사이트) 변환
 */

import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import type { AnalysisDataBundle, PersonalColorData, SkinData, BodyData, HairData } from './types';

// ============================================
// 시즌 매핑
// ============================================

const SEASON_UNDERTONE_MAP: Record<string, { undertone: 'warm' | 'cool'; subType?: string }> = {
  Spring: { undertone: 'warm', subType: 'bright' },
  spring: { undertone: 'warm', subType: 'bright' },
  Summer: { undertone: 'cool', subType: 'light' },
  summer: { undertone: 'cool', subType: 'light' },
  Autumn: { undertone: 'warm', subType: 'muted' },
  autumn: { undertone: 'warm', subType: 'muted' },
  Winter: { undertone: 'cool', subType: 'dark' },
  winter: { undertone: 'cool', subType: 'dark' },
};

// ============================================
// 변환 함수
// ============================================

/**
 * AnalysisSummary 배열을 AnalysisDataBundle로 변환
 *
 * @param analyses - UI에서 사용하는 분석 요약 배열
 * @returns 인사이트 생성에 사용할 데이터 번들
 *
 * @example
 * ```typescript
 * const dataBundle = analysisToDataBundle(analyses);
 * const insights = generateInsights(dataBundle);
 * ```
 */
export function analysisToDataBundle(analyses: AnalysisSummary[]): AnalysisDataBundle {
  const bundle: AnalysisDataBundle = {};

  for (const analysis of analyses) {
    switch (analysis.type) {
      case 'personal-color':
        bundle.personalColor = extractPersonalColorData(analysis);
        break;
      case 'skin':
        bundle.skin = extractSkinData(analysis);
        break;
      case 'body':
        bundle.body = extractBodyData(analysis);
        break;
      case 'hair':
        bundle.hair = extractHairData(analysis);
        break;
      // makeup은 현재 insights에서 미사용
    }
  }

  return bundle;
}

/**
 * 퍼스널컬러 데이터 추출
 */
function extractPersonalColorData(analysis: AnalysisSummary): PersonalColorData | null {
  if (!analysis.seasonType) return null;

  const mapping = SEASON_UNDERTONE_MAP[analysis.seasonType];

  return {
    season: analysis.seasonType.toLowerCase(),
    undertone: mapping?.undertone ?? 'warm',
    confidence: 80, // 기본 신뢰도 (UI에서 신뢰도를 별도로 전달하지 않음)
    subType: mapping?.subType,
  };
}

/**
 * 피부 데이터 추출
 */
function extractSkinData(analysis: AnalysisSummary): SkinData | null {
  const score = analysis.skinScore ?? 50;

  // 점수 기반으로 피부 타입 추정
  let skinType: string;
  if (score >= 80) {
    skinType = 'normal';
  } else if (score >= 60) {
    skinType = 'combination';
  } else if (score >= 40) {
    skinType = 'oily';
  } else {
    skinType = 'sensitive';
  }

  return {
    skinType,
    hydrationLevel: score,
    oilLevel: 100 - score,
  };
}

/**
 * 체형 데이터 추출
 */
function extractBodyData(analysis: AnalysisSummary): BodyData | null {
  if (!analysis.bodyType) return null;

  return {
    bodyType: analysis.bodyType,
  };
}

/**
 * 모발 데이터 추출
 */
function extractHairData(analysis: AnalysisSummary): HairData | null {
  if (!analysis.hairType) return null;

  // 점수로 상태 추정
  const score = analysis.hairScore ?? 50;
  let hairCondition: string;
  if (score >= 70) {
    hairCondition = 'healthy';
  } else if (score >= 40) {
    hairCondition = 'normal';
  } else {
    hairCondition = 'damaged';
  }

  return {
    hairType: analysis.hairType,
    hairCondition,
  };
}

/**
 * 분석 진행률 빠른 계산 (DB 호출 없이)
 *
 * @param hasPC - 퍼스널컬러 완료 여부
 * @param hasSkin - 피부 분석 완료 여부
 * @param hasBody - 체형 분석 완료 여부
 * @returns 진행률 정보
 */
export function calculateProgressFromFlags(
  hasPC: boolean,
  hasSkin: boolean,
  hasBody: boolean
): { completed: number; total: number; percentage: number } {
  const completed = [hasPC, hasSkin, hasBody].filter(Boolean).length;
  const total = 3; // 현재 UI에서 추적하는 주요 분석 3개

  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
}
