/**
 * OH-1 API 라우트 헬퍼 함수
 *
 * @module lib/oral-health/internal/route-helpers
 * @description route.ts에서 사용하는 변환/매핑 헬퍼 함수 모음
 * @internal API route에서만 import (barrel export 대상 아님 — P8)
 */

import type { LabColor, PersonalColorSeason, VitaShade } from '@/types/oral-health';
import { VITA_SHADE_DATABASE } from './vita-database';

// VITA_SHADE_DATABASE에서 shade → Lab 빠른 조회를 위한 맵 생성
const shadeLabMap = new Map<VitaShade, LabColor>(
  VITA_SHADE_DATABASE.map((ref) => [ref.shade, ref.lab])
);

// Lab 조회 실패 시 사용하는 기본값
const DEFAULT_LAB: LabColor = { L: 65, a: 2, b: 16 };

/**
 * VITA 셰이드에 대한 Lab 색상값 반환 (VITA_SHADE_DATABASE SSOT 참조)
 */
export function getLabForShade(shade: VitaShade): LabColor {
  return shadeLabMap.get(shade) ?? DEFAULT_LAB;
}

/**
 * 붉은기 레벨에서 a* 평균값 추정
 */
export function getAStarFromRedness(
  redness: 'normal' | 'slightly_red' | 'red' | 'very_red'
): number {
  const values = { normal: 12, slightly_red: 18, red: 25, very_red: 35 };
  return values[redness];
}

/**
 * 붉은기 레벨에서 붉은 영역 비율 추정
 */
export function getRednessPercentage(
  redness: 'normal' | 'slightly_red' | 'red' | 'very_red'
): number {
  const values = { normal: 5, slightly_red: 15, red: 30, very_red: 50 };
  return values[redness];
}

/**
 * 부종 레벨에서 부종 지표 추정
 */
export function getSwellingIndicator(swelling: 'none' | 'mild' | 'moderate' | 'severe'): number {
  const values = { none: 0, mild: 25, moderate: 50, severe: 80 };
  return values[swelling];
}

/**
 * 염증 점수를 심각도로 매핑
 */
export function mapInflammationToSeverity(score: number): 'mild' | 'moderate' | 'severe' {
  if (score < 30) return 'mild';
  if (score < 60) return 'moderate';
  return 'severe';
}

/**
 * 퍼스널컬러 기반 목표 셰이드 계산
 */
export function calculateTargetShade(
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
export function calculateRouteShadeSteps(
  currentShade: VitaShade,
  _season: PersonalColorSeason
): number {
  const shadeRanks: Record<VitaShade, number> = {
    B1: 1,
    A1: 2,
    B2: 3,
    D2: 4,
    A2: 5,
    C1: 6,
    C2: 7,
    D4: 8,
    A3: 9,
    D3: 10,
    B3: 11,
    'A3.5': 12,
    B4: 13,
    C3: 14,
    A4: 15,
    C4: 16,
    '0M1': 0,
    '0M2': 0,
    '0M3': 0,
  };

  const currentRank = shadeRanks[currentShade];
  const targetRank = 2; // 일반적으로 A1/B1 수준 목표

  return Math.max(0, currentRank - targetRank);
}

/**
 * 과도한 미백 여부 확인
 */
export function checkOverWhitening(currentShade: VitaShade, _season: PersonalColorSeason): boolean {
  // 이미 매우 밝은 셰이드이거나 Bleached 셰이드면 과도한 미백 경고
  const brightShades: VitaShade[] = ['B1', 'A1', '0M1', '0M2', '0M3'];
  return brightShades.includes(currentShade);
}

/**
 * 조화 제안 생성
 */
export function generateHarmonySuggestion(
  currentShade: VitaShade,
  season: PersonalColorSeason
): string {
  const suggestions: Record<PersonalColorSeason, string> = {
    spring:
      '봄 웜톤에는 따뜻하고 밝은 아이보리 계열의 치아색이 자연스러워요. 과도하게 하얀 치아보다 약간의 따뜻함이 있는 B1-A1 셰이드를 권장해요.',
    summer:
      '여름 쿨톤에는 핑크빛이 도는 밝은 치아색이 어울려요. 회색 기가 있는 C1-D2 계열도 자연스러운 조화를 이뤄요.',
    autumn:
      '가을 웜톤에는 너무 하얀 치아보다 자연스러운 아이보리 톤이 어울려요. A2-B2 셰이드가 피부톤과 조화로워요.',
    winter:
      '겨울 쿨톤에는 선명하고 밝은 치아색이 잘 어울려요. B1-C1 셰이드로 깨끗한 이미지를 연출할 수 있어요.',
  };

  return suggestions[season];
}
