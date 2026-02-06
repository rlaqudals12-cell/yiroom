/**
 * PC-2: 12-Tone 퍼스널컬러 분류 알고리즘
 *
 * @module lib/analysis/personal-color-v2/tone-classifier
 * @description Lab 색공간 기반 12톤 분류 로직
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 * @see docs/principles/color-science.md
 */

import type {
  LabColor,
  Season,
  Subtype,
  TwelveTone,
  Undertone,
  TwelveToneClassificationResult,
} from './types';
import { KOREAN_ADJUSTMENTS, TWELVE_TONE_REFERENCE_LAB } from './types';
import { calculateChroma, calculateHue, calculateITA, calculateCIEDE2000 } from '@/lib/color';

// ============================================
// 서브타입 임계값 (한국인 기준 최적화)
// ============================================

/**
 * 서브타입 판정 임계값
 * 한국인 피부톤 분포에 맞게 조정됨
 */
const SUBTYPE_THRESHOLDS = {
  /** Light 서브타입 판정 L* 임계값 */
  lightL: 68,
  /** Deep 서브타입 판정 L* 임계값 */
  deepL: 50,
  /** Bright 서브타입 판정 채도 임계값 */
  brightChroma: 28,
  /** Muted 서브타입 판정 채도 임계값 */
  mutedChroma: 18,
} as const;

// ============================================
// 언더톤 판정
// ============================================

/**
 * 언더톤 판정 결과
 */
interface UndertoneResult {
  /** 웜톤/쿨톤/뉴트럴 */
  undertone: Undertone;
  /** 판정 신뢰도 (0-100) */
  confidence: number;
  /** Hue 각도 */
  hue: number;
  /** 상세 설명 */
  details: string;
}

/**
 * Lab 색상에서 언더톤(웜/쿨) 판정
 *
 * 판정 기준:
 * - Hue > 60° AND b* > 19: 웜톤
 * - Hue < 60° AND b* < 19: 쿨톤
 * - 그 외: 뉴트럴 (경계 영역)
 *
 * @param lab - Lab 색상값
 * @returns 언더톤 판정 결과
 */
export function determineUndertone(lab: LabColor): UndertoneResult {
  const chroma = calculateChroma(lab);
  const hue = calculateHue(lab);
  const { warmCoolThresholdHue, warmCoolThresholdB } = KOREAN_ADJUSTMENTS;

  let undertone: Undertone;
  let confidence: number;

  // 채도가 낮으면 언더톤 판정 어려움
  if (chroma < 8) {
    undertone = 'neutral';
    confidence = 60;
  } else if (hue > warmCoolThresholdHue && lab.b > warmCoolThresholdB) {
    // 웜톤: Hue > 60° AND b* > 19
    undertone = 'warm';
    const hueMargin = hue - warmCoolThresholdHue;
    const bMargin = lab.b - warmCoolThresholdB;
    confidence = Math.min(95, 70 + hueMargin * 0.5 + bMargin * 1.5);
  } else if (hue < warmCoolThresholdHue && lab.b < warmCoolThresholdB) {
    // 쿨톤: Hue < 60° AND b* < 19
    undertone = 'cool';
    const hueMargin = warmCoolThresholdHue - hue;
    const bMargin = warmCoolThresholdB - lab.b;
    confidence = Math.min(95, 70 + hueMargin * 0.5 + bMargin * 1.5);
  } else {
    // 경계 영역: 뉴트럴
    undertone = 'neutral';
    confidence = 50 + Math.abs(hue - warmCoolThresholdHue) * 0.3;
  }

  const details = `Hue: ${hue.toFixed(1)}° (threshold: ${warmCoolThresholdHue}°), b*: ${lab.b.toFixed(1)} (threshold: ${warmCoolThresholdB})`;

  return { undertone, confidence, hue, details };
}

// ============================================
// 계절(Season) 판정
// ============================================

/**
 * 4계절 타입 판정
 *
 * 웜톤:
 * - L* > 60: Spring (밝은 웜톤)
 * - L* <= 60: Autumn (깊은 웜톤)
 *
 * 쿨톤:
 * - L* > 58: Summer (밝은 쿨톤)
 * - L* <= 58: Winter (깊은 쿨톤)
 *
 * @param lab - Lab 색상값
 * @param undertoneResult - 언더톤 판정 결과
 * @returns 계절 타입
 */
export function determineSeason(lab: LabColor, undertoneResult: UndertoneResult): Season {
  // 웜톤/쿨톤별 밝기 경계값 (한국인 피부톤 기준)
  const SPRING_AUTUMN_BOUNDARY_L = 60;
  const SUMMER_WINTER_BOUNDARY_L = 58;

  if (undertoneResult.undertone === 'warm') {
    return lab.L > SPRING_AUTUMN_BOUNDARY_L ? 'spring' : 'autumn';
  } else if (undertoneResult.undertone === 'cool') {
    return lab.L > SUMMER_WINTER_BOUNDARY_L ? 'summer' : 'winter';
  } else {
    // 뉴트럴: Hue 각도로 추가 판정
    if (lab.L > SPRING_AUTUMN_BOUNDARY_L) {
      return undertoneResult.hue > KOREAN_ADJUSTMENTS.warmCoolThresholdHue ? 'spring' : 'summer';
    } else {
      return undertoneResult.hue > KOREAN_ADJUSTMENTS.warmCoolThresholdHue ? 'autumn' : 'winter';
    }
  }
}

// ============================================
// 서브타입(Subtype) 판정
// ============================================

/**
 * 계절 내 서브타입 판정
 *
 * Spring: light / true / bright
 * Summer: light / true / muted
 * Autumn: muted / true / deep
 * Winter: deep / true / bright
 *
 * @param lab - Lab 색상값
 * @param season - 계절 타입
 * @returns 서브타입
 */
export function determineSubtype(lab: LabColor, season: Season): Subtype {
  const chroma = calculateChroma(lab);
  const { lightL, deepL, brightChroma, mutedChroma } = SUBTYPE_THRESHOLDS;

  switch (season) {
    case 'spring': {
      // Spring: light(밝음) > bright(선명) > true(기본)
      if (lab.L > lightL) return 'light';
      if (chroma > brightChroma) return 'bright';
      return 'true';
    }

    case 'summer': {
      // Summer: light(밝음) > muted(탁함) > true(기본)
      if (lab.L > lightL) return 'light';
      if (chroma < mutedChroma) return 'muted';
      return 'true';
    }

    case 'autumn': {
      // Autumn: deep(깊음) > muted(탁함) > true(기본)
      if (lab.L < deepL) return 'deep';
      if (chroma < mutedChroma) return 'muted';
      return 'true';
    }

    case 'winter': {
      // Winter: deep(깊음) > bright(선명) > true(기본)
      if (lab.L < deepL) return 'deep';
      if (chroma > brightChroma) return 'bright';
      return 'true';
    }

    default:
      return 'true';
  }
}

// ============================================
// 12톤 조합
// ============================================

/**
 * Season + Subtype을 12톤으로 조합
 *
 * @param season - 계절 타입
 * @param subtype - 서브타입
 * @returns 12톤 문자열
 */
export function composeTwelveTone(season: Season, subtype: Subtype): TwelveTone {
  return `${subtype}-${season}` as TwelveTone;
}

/**
 * 12톤 문자열을 Season + Subtype으로 분해
 *
 * @param tone - 12톤 문자열
 * @returns Season과 Subtype 객체
 */
export function parseTwelveTone(tone: TwelveTone): {
  season: Season;
  subtype: Subtype;
} {
  const parts = tone.split('-');
  return {
    subtype: parts[0] as Subtype,
    season: parts[1] as Season,
  };
}

// ============================================
// 톤 점수 계산
// ============================================

/**
 * 각 12톤 레퍼런스와의 거리 기반 점수 계산
 *
 * 점수 = 100 - deltaE * 가중치
 * 가중치는 CIEDE2000 기준 2.5 사용
 *
 * @param lab - 측정된 Lab 색상
 * @returns 각 톤별 점수 (높을수록 유사)
 */
export function calculateToneScores(lab: LabColor): Record<TwelveTone, number> {
  const scores: Partial<Record<TwelveTone, number>> = {};
  const tones = Object.keys(TWELVE_TONE_REFERENCE_LAB) as TwelveTone[];

  for (const tone of tones) {
    const refLab = TWELVE_TONE_REFERENCE_LAB[tone];
    const deltaE = calculateCIEDE2000(lab, refLab);
    // deltaE가 0이면 100점, 40 이상이면 0점
    const score = Math.max(0, 100 - deltaE * 2.5);
    scores[tone] = Math.round(score * 10) / 10;
  }

  return scores as Record<TwelveTone, number>;
}

// ============================================
// 메인 분류 함수
// ============================================

/**
 * 12톤 퍼스널컬러 분류 (메인 함수)
 *
 * 분류 과정:
 * 1. 언더톤 판정 (웜/쿨/뉴트럴)
 * 2. 계절 판정 (Spring/Summer/Autumn/Winter)
 * 3. 서브타입 판정 (Light/True/Bright/Muted/Deep)
 * 4. 12톤 조합
 * 5. 레퍼런스와의 거리 계산
 * 6. 신뢰도 산출
 *
 * @param lab - 피부톤 Lab 측정값
 * @returns 12톤 분류 결과
 *
 * @example
 * const skinLab = { L: 68, a: 10, b: 22 };
 * const result = classifyTone(skinLab);
 * // { tone: 'true-spring', season: 'spring', ... }
 */
export function classifyTone(lab: LabColor): TwelveToneClassificationResult {
  // 1. 언더톤 판정
  const undertoneResult = determineUndertone(lab);

  // 2. 계절 판정
  const season = determineSeason(lab, undertoneResult);

  // 3. 서브타입 판정
  const subtype = determineSubtype(lab, season);

  // 4. 12톤 조합
  const tone = composeTwelveTone(season, subtype);

  // 5. 각 톤별 점수 계산
  const toneScores = calculateToneScores(lab);

  // 6. 레퍼런스와의 거리 (CIEDE2000)
  const refLab = TWELVE_TONE_REFERENCE_LAB[tone];
  const labDistance = calculateCIEDE2000(lab, refLab);

  // 7. 신뢰도 산출
  // 거리 기반 신뢰도: deltaE 0=100점, 40=0점
  const distanceConfidence = Math.max(0, 100 - labDistance * 2.5);
  // 언더톤 신뢰도와 거리 신뢰도의 평균
  const confidence = Math.round((undertoneResult.confidence + distanceConfidence) / 2);

  return {
    tone,
    season,
    subtype,
    undertone: undertoneResult.undertone,
    confidence,
    toneScores,
    measuredLab: { ...lab },
  };
}

// ============================================
// 보조 함수
// ============================================

/**
 * 특정 톤의 레퍼런스 Lab 값 조회
 *
 * @param tone - 12톤 타입
 * @returns 레퍼런스 Lab 값
 */
export function getReferenceLab(tone: TwelveTone): LabColor {
  return { ...TWELVE_TONE_REFERENCE_LAB[tone] };
}

/**
 * ITA 기반 피부 밝기 분류
 *
 * | ITA | 분류 |
 * |-----|------|
 * | > 55 | Very Light |
 * | 41-55 | Light |
 * | 28-41 | Intermediate (한국인 대부분) |
 * | 10-28 | Tan |
 * | < 10 | Dark |
 *
 * @param lab - Lab 색상값
 * @returns 밝기 분류 문자열
 */
export function classifySkinBrightness(
  lab: LabColor
): 'very-light' | 'light' | 'intermediate' | 'tan' | 'dark' {
  const ita = calculateITA(lab);

  if (ita > 55) return 'very-light';
  if (ita > 41) return 'light';
  if (ita > 28) return 'intermediate';
  if (ita > 10) return 'tan';
  return 'dark';
}

/**
 * 두 톤 간의 유사도 계산
 *
 * @param tone1 - 첫 번째 톤
 * @param tone2 - 두 번째 톤
 * @returns 유사도 (0-100, 높을수록 유사)
 */
export function calculateToneSimilarity(tone1: TwelveTone, tone2: TwelveTone): number {
  const lab1 = TWELVE_TONE_REFERENCE_LAB[tone1];
  const lab2 = TWELVE_TONE_REFERENCE_LAB[tone2];
  const deltaE = calculateCIEDE2000(lab1, lab2);

  return Math.max(0, 100 - deltaE * 2);
}

/**
 * 가장 유사한 인접 톤 추천
 *
 * @param tone - 현재 톤
 * @param count - 추천할 개수 (기본 2)
 * @returns 유사 톤 배열 (유사도 내림차순)
 */
export function getAdjacentTones(tone: TwelveTone, count: number = 2): TwelveTone[] {
  const tones = Object.keys(TWELVE_TONE_REFERENCE_LAB) as TwelveTone[];

  const similarities = tones
    .filter((t) => t !== tone)
    .map((t) => ({
      tone: t,
      similarity: calculateToneSimilarity(tone, t),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, count).map((s) => s.tone);
}
