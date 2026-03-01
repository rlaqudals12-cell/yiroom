/**
 * 시즌 색상 분류 모듈
 *
 * 퍼스널컬러 4계절 시스템 기반 색상 분류
 *
 * @module lib/color-classification
 * @see docs/principles/color-science.md
 */

import { hexToLab, calculateChroma, calculateHue, type LabColor } from '../color';

// ─── 타입 ────────────────────────────────────────────

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Tone = 'warm' | 'cool' | 'neutral';

export interface ToneResult {
  tone: Tone;
  confidence: number;
  warmRatio: number;
}

export interface SeasonMatch {
  season: Season;
  score: number;
}

export interface ColorClassification {
  hex: string;
  tone: ToneResult;
  bestSeason: SeasonMatch;
  allSeasons: SeasonMatch[];
}

// ─── 시즌별 Lab 기준값 ──────────────────────────────

// 각 시즌의 대표 색상 Lab 값
const SEASON_REFERENCES: Record<Season, LabColor[]> = {
  spring: [
    { L: 75, a: 15, b: 40 }, // 코럴
    { L: 80, a: 10, b: 30 }, // 피치
    { L: 70, a: 25, b: 35 }, // 살몬
    { L: 85, a: 5, b: 25 },  // 아이보리
  ],
  summer: [
    { L: 70, a: -5, b: -10 }, // 라벤더
    { L: 75, a: 10, b: -5 },  // 로즈
    { L: 80, a: -3, b: -15 }, // 스카이블루
    { L: 65, a: 5, b: -20 },  // 퍼플
  ],
  autumn: [
    { L: 55, a: 20, b: 35 }, // 테라코타
    { L: 60, a: 15, b: 40 }, // 오렌지
    { L: 50, a: 10, b: 30 }, // 올리브
    { L: 45, a: 25, b: 25 }, // 버건디
  ],
  winter: [
    { L: 30, a: 5, b: -10 },  // 네이비
    { L: 50, a: 40, b: 15 },  // 레드
    { L: 90, a: -2, b: 3 },   // 퓨어화이트
    { L: 15, a: 0, b: 0 },    // 블랙
  ],
};

// ─── 톤 분류 ────────────────────────────────────────

/**
 * 웜톤/쿨톤 분류
 *
 * Lab 색공간에서 b* > 0 = 웜, b* < 0 = 쿨
 * a* 양수 편향 + b* 양수 = 웜 강화
 */
export function classifyTone(lab: LabColor): ToneResult {
  // b* 기반 웜/쿨 판단
  const warmScore = lab.b > 0 ? lab.b : 0;
  const coolScore = lab.b < 0 ? Math.abs(lab.b) : 0;

  // a* 보정: 양의 a* (적색) = 웜 보정
  const aBonus = lab.a > 0 ? lab.a * 0.3 : 0;
  const adjustedWarm = warmScore + aBonus;

  const total = adjustedWarm + coolScore;
  if (total === 0) {
    return { tone: 'neutral', confidence: 0, warmRatio: 0.5 };
  }

  const warmRatio = adjustedWarm / total;

  let tone: Tone;
  let confidence: number;
  if (warmRatio > 0.6) {
    tone = 'warm';
    confidence = Math.min(100, warmRatio * 100);
  } else if (warmRatio < 0.4) {
    tone = 'cool';
    confidence = Math.min(100, (1 - warmRatio) * 100);
  } else {
    tone = 'neutral';
    confidence = Math.min(100, 50 + Math.abs(warmRatio - 0.5) * 100);
  }

  return { tone, confidence, warmRatio };
}

// ─── 시즌 매칭 ──────────────────────────────────────

/**
 * 색상의 시즌 매칭 점수 계산
 *
 * 각 시즌 대표색과의 Lab 거리 기반
 */
export function calculateSeasonMatch(lab: LabColor): SeasonMatch[] {
  const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];

  const matches = seasons.map((season) => {
    const refs = SEASON_REFERENCES[season];
    // 각 대표색과의 최소 거리
    const minDist = Math.min(
      ...refs.map((ref) =>
        Math.sqrt(
          (lab.L - ref.L) ** 2 + (lab.a - ref.a) ** 2 + (lab.b - ref.b) ** 2
        )
      )
    );
    // 거리를 점수로 변환 (0-100, 가까울수록 높음)
    const score = Math.max(0, 100 - minDist * 1.5);
    return { season, score: Math.round(score) };
  });

  return matches.sort((a, b) => b.score - a.score);
}

/**
 * 최적 시즌 반환
 */
export function getBestSeasonMatch(lab: LabColor): SeasonMatch {
  return calculateSeasonMatch(lab)[0];
}

// ─── 통합 분류 ──────────────────────────────────────

/**
 * HEX 색상의 시즌+톤 통합 분류
 */
export function classifyColor(hex: string): ColorClassification {
  const lab = hexToLab(hex);
  const tone = classifyTone(lab);
  const allSeasons = calculateSeasonMatch(lab);

  return {
    hex,
    tone,
    bestSeason: allSeasons[0],
    allSeasons,
  };
}

/**
 * 사용자 시즌과 색상의 매칭 점수
 */
export function calculateUserSeasonMatch(
  hex: string,
  userSeason: Season
): number {
  const lab = hexToLab(hex);
  const matches = calculateSeasonMatch(lab);
  const match = matches.find((m) => m.season === userSeason);
  return match?.score ?? 0;
}

// ─── 시즌 메타데이터 ────────────────────────────────

export const SEASON_LABELS: Record<Season, string> = {
  spring: '봄 웜',
  summer: '여름 쿨',
  autumn: '가을 웜',
  winter: '겨울 쿨',
};

export const SEASON_COLORS: Record<Season, string> = {
  spring: '#FF8C69',
  summer: '#87CEEB',
  autumn: '#D2691E',
  winter: '#4169E1',
};
