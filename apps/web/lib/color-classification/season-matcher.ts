/**
 * 시즌 매칭 계산
 *
 * @module lib/color-classification/season-matcher
 * @description Lab 색공간 기반 4계절 매칭
 * @see docs/principles/color-science.md
 * @see docs/adr/ADR-034-product-color-classification.md
 */

import type { LabColor, Season, SeasonMatchScores, SeasonLabRange } from './types';
import { SEASON_LAB_RANGES } from './types';

/**
 * 범위 점수 계산
 * 범위 내: 100점
 * 범위 밖: 거리에 따라 감점
 *
 * @param value - 측정값
 * @param min - 최소값
 * @param max - 최대값
 * @returns 점수 (0-100)
 */
function rangeScore(value: number, min: number, max: number): number {
  if (value >= min && value <= max) {
    return 100;
  }

  // 범위 밖: 거리에 따라 감점
  const distance = value < min ? min - value : value - max;
  return Math.max(0, 100 - distance * 5);
}

/**
 * 시즌별 매칭률 계산
 *
 * @param lab - Lab 색상
 * @returns 시즌별 매칭 점수 (0-100)
 */
export function calculateSeasonMatch(lab: LabColor): SeasonMatchScores {
  const { L, a, b } = lab;

  const scores: SeasonMatchScores = {
    spring: 0,
    summer: 0,
    autumn: 0,
    winter: 0,
  };

  const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];

  for (const season of seasons) {
    const range = SEASON_LAB_RANGES[season];

    const lScore = rangeScore(L, range.L[0], range.L[1]);
    const aScore = rangeScore(a, range.a[0], range.a[1]);
    const bScore = rangeScore(b, range.b[0], range.b[1]);

    // 가중 평균 (b* 가중치 높음 - 톤 결정에 중요)
    scores[season] = Math.round(lScore * 0.2 + aScore * 0.3 + bScore * 0.5);
  }

  return scores;
}

/**
 * 최적 시즌 찾기
 *
 * @param scores - 시즌별 매칭 점수
 * @returns 최적 시즌과 점수
 */
export function getBestSeasonMatch(scores: SeasonMatchScores): {
  season: Season;
  score: number;
} {
  const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];

  let bestSeason: Season = 'spring';
  let bestScore = 0;

  for (const season of seasons) {
    if (scores[season] > bestScore) {
      bestScore = scores[season];
      bestSeason = season;
    }
  }

  return { season: bestSeason, score: bestScore };
}

/**
 * 사용자 시즌과의 매칭률 계산
 *
 * @param lab - Lab 색상
 * @param userSeason - 사용자 시즌
 * @returns 매칭률 (0-100)
 */
export function calculateUserSeasonMatch(lab: LabColor, userSeason: Season): number {
  const scores = calculateSeasonMatch(lab);
  return scores[userSeason];
}

/**
 * 매칭 등급 반환
 *
 * @param score - 매칭 점수 (0-100)
 * @returns 등급
 */
export function getMatchGrade(score: number): {
  grade: 'excellent' | 'good' | 'fair' | 'poor';
  label: string;
  color: string;
} {
  if (score >= 80) {
    return { grade: 'excellent', label: '아주 잘 어울려요', color: 'green' };
  }
  if (score >= 60) {
    return { grade: 'good', label: '잘 어울려요', color: 'blue' };
  }
  if (score >= 40) {
    return { grade: 'fair', label: '보통이에요', color: 'yellow' };
  }
  return { grade: 'poor', label: '추천하지 않아요', color: 'gray' };
}

/**
 * 시즌별 설명 반환
 *
 * @param season - 시즌
 * @returns 한국어 설명
 */
export function getSeasonDescription(season: Season): string {
  const descriptions: Record<Season, string> = {
    spring: '밝고 따뜻한 봄 컬러. 코랄, 피치, 아이보리 계열',
    summer: '부드럽고 차분한 여름 컬러. 라벤더, 로즈, 스카이블루 계열',
    autumn: '깊고 풍부한 가을 컬러. 테라코타, 머스타드, 카키 계열',
    winter: '선명하고 강한 겨울 컬러. 버건디, 네이비, 퓨어화이트 계열',
  };

  return descriptions[season];
}

/**
 * 시즌 호환성 매트릭스
 * 대각선: 최고 호환
 * 같은 톤(웜/쿨): 중간 호환
 * 반대 톤: 낮은 호환
 */
export const SEASON_COMPATIBILITY: Record<Season, Record<Season, number>> = {
  spring: { spring: 100, autumn: 70, summer: 40, winter: 30 },
  summer: { summer: 100, winter: 70, spring: 40, autumn: 30 },
  autumn: { autumn: 100, spring: 70, winter: 40, summer: 30 },
  winter: { winter: 100, summer: 70, autumn: 40, spring: 30 },
};

/**
 * 시즌 간 호환성 점수 반환
 *
 * @param productSeason - 상품의 최적 시즌
 * @param userSeason - 사용자 시즌
 * @returns 호환성 점수 (0-100)
 */
export function getSeasonCompatibility(
  productSeason: Season,
  userSeason: Season
): number {
  return SEASON_COMPATIBILITY[userSeason][productSeason];
}
