/**
 * PC-2: 12-Tone 분류 핵심 로직
 *
 * @module lib/analysis/personal-color/classify
 * @description Lab 색공간 기반 12-Tone 퍼스널컬러 분류
 * @see {@link docs/principles/color-science.md} 12-Tone 분류 알고리즘
 */

import type {
  LabColor,
  Season,
  Subtype,
  TwelveTone,
  TwelveToneResult,
  UndertoneResult,
  Undertone,
  SkinMetrics,
} from "./types";
import { KOREAN_ADJUSTMENTS } from "./types";
import { calculateDerivedMetrics, calculateLabDistance } from "./color-space";

// ============================================
// 12-Tone Lab 범위 (color-science.md 기반)
// ============================================

/**
 * 12-Tone별 대표 Lab 값
 * @see docs/principles/color-science.md#12-tone-lab-범위
 */
const TWELVE_TONE_REFERENCE_LAB: Record<TwelveTone, LabColor> = {
  // Spring (웜톤, 밝음)
  "light-spring": { L: 72, a: 8, b: 22 },
  "true-spring": { L: 68, a: 12, b: 24 },
  "bright-spring": { L: 66, a: 14, b: 26 },

  // Summer (쿨톤, 밝음)
  "light-summer": { L: 70, a: 4, b: 12 },
  "true-summer": { L: 66, a: 6, b: 14 },
  "muted-summer": { L: 64, a: 5, b: 11 },

  // Autumn (웜톤, 어두움)
  "muted-autumn": { L: 58, a: 10, b: 18 },
  "true-autumn": { L: 54, a: 14, b: 22 },
  "deep-autumn": { L: 48, a: 16, b: 24 },

  // Winter (쿨톤, 어두움)
  "true-winter": { L: 52, a: 6, b: 10 },
  "bright-winter": { L: 56, a: 8, b: 12 },
  "deep-winter": { L: 44, a: 4, b: 8 },
};

/**
 * 12-Tone 한국어 이름
 */
const TWELVE_TONE_KOREAN_NAMES: Record<TwelveTone, string> = {
  "light-spring": "라이트 스프링",
  "true-spring": "트루 스프링",
  "bright-spring": "브라이트 스프링",
  "light-summer": "라이트 서머",
  "true-summer": "트루 서머",
  "muted-summer": "뮤트 서머",
  "muted-autumn": "뮤트 오텀",
  "true-autumn": "트루 오텀",
  "deep-autumn": "딥 오텀",
  "true-winter": "트루 윈터",
  "bright-winter": "브라이트 윈터",
  "deep-winter": "딥 윈터",
};

// ============================================
// 서브타입 판정 임계값
// ============================================

/**
 * 서브타입별 Lab 임계값
 * @see docs/principles/color-science.md#서브타입-결정-기준
 */
const SUBTYPE_THRESHOLDS = {
  lightL: 65,
  deepL: 48,
  brightChroma: KOREAN_ADJUSTMENTS.trueBrightChroma,
  mutedChroma: KOREAN_ADJUSTMENTS.mutedTrueChroma,
} as const;

// ============================================
// 언더톤 판정
// ============================================

/**
 * 언더톤(웜톤/쿨톤) 판정
 */
export function determineUndertone(lab: LabColor): UndertoneResult {
  const { chroma, hue } = calculateDerivedMetrics(lab);
  const { warmCoolThresholdHue, warmCoolThresholdB } = KOREAN_ADJUSTMENTS;

  let undertone: Undertone;
  let confidence: number;

  if (chroma < 8) {
    undertone = "neutral";
    confidence = 60;
  } else if (hue > warmCoolThresholdHue && lab.b > warmCoolThresholdB) {
    undertone = "warm";
    const hueMargin = hue - warmCoolThresholdHue;
    const bMargin = lab.b - warmCoolThresholdB;
    confidence = Math.min(95, 70 + hueMargin * 0.5 + bMargin * 1.5);
  } else if (hue < warmCoolThresholdHue && lab.b < warmCoolThresholdB) {
    undertone = "cool";
    const hueMargin = warmCoolThresholdHue - hue;
    const bMargin = warmCoolThresholdB - lab.b;
    confidence = Math.min(95, 70 + hueMargin * 0.5 + bMargin * 1.5);
  } else {
    undertone = "neutral";
    confidence = 50 + Math.abs(hue - warmCoolThresholdHue) * 0.3;
  }

  const details = `Hue: ${hue.toFixed(1)} deg (threshold: ${warmCoolThresholdHue}), b*: ${lab.b.toFixed(1)} (threshold: ${warmCoolThresholdB})`;

  return { undertone, confidence, hue, details };
}

// ============================================
// 계절 판정
// ============================================

/**
 * 4계절 타입 판정
 */
export function determineSeason(lab: LabColor, undertone: UndertoneResult): Season {
  const { springAutumnBoundaryL, summerWinterBoundaryL } = KOREAN_ADJUSTMENTS;

  if (undertone.undertone === "warm") {
    return lab.L > springAutumnBoundaryL ? "spring" : "autumn";
  } else if (undertone.undertone === "cool") {
    return lab.L > summerWinterBoundaryL ? "summer" : "winter";
  } else {
    if (lab.L > springAutumnBoundaryL) {
      const { hue } = calculateDerivedMetrics(lab);
      return hue > KOREAN_ADJUSTMENTS.warmCoolThresholdHue ? "spring" : "summer";
    } else {
      const { hue } = calculateDerivedMetrics(lab);
      return hue > KOREAN_ADJUSTMENTS.warmCoolThresholdHue ? "autumn" : "winter";
    }
  }
}

// ============================================
// 서브타입 판정
// ============================================

/**
 * 계절 내 서브타입 판정
 */
export function determineSubtype(lab: LabColor, season: Season): Subtype {
  const { chroma } = calculateDerivedMetrics(lab);

  switch (season) {
    case "spring": {
      if (lab.L > SUBTYPE_THRESHOLDS.lightL) return "light";
      if (chroma > SUBTYPE_THRESHOLDS.brightChroma) return "bright";
      return "true";
    }

    case "summer": {
      if (lab.L > SUBTYPE_THRESHOLDS.lightL) return "light";
      if (chroma < SUBTYPE_THRESHOLDS.mutedChroma) return "muted";
      return "true";
    }

    case "autumn": {
      if (lab.L < SUBTYPE_THRESHOLDS.deepL) return "deep";
      if (chroma < SUBTYPE_THRESHOLDS.mutedChroma) return "muted";
      return "true";
    }

    case "winter": {
      if (lab.L < SUBTYPE_THRESHOLDS.deepL) return "deep";
      if (chroma > SUBTYPE_THRESHOLDS.brightChroma) return "bright";
      return "true";
    }

    default:
      return "true";
  }
}

// ============================================
// 12-Tone 분류 메인 함수
// ============================================

/**
 * 12-Tone 퍼스널컬러 분류
 */
export function classify12Tone(skinMetrics: SkinMetrics): TwelveToneResult {
  const { lab } = skinMetrics;
  const warnings: string[] = [];

  const undertoneResult = determineUndertone(lab);

  if (undertoneResult.confidence < 60) {
    warnings.push("언더톤 판정이 경계 영역입니다. 드레이핑 테스트로 확인하세요.");
  }

  const season = determineSeason(lab, undertoneResult);
  const subtype = determineSubtype(lab, season);
  const tone = `${subtype}-${season}` as TwelveTone;

  const referenceLab = TWELVE_TONE_REFERENCE_LAB[tone];
  const labDistance = calculateLabDistance(lab, referenceLab);

  const distanceConfidence = Math.max(60, 100 - labDistance * 2.5);

  if (labDistance > 10) {
    warnings.push(`대표값과의 거리가 큽니다 (deltaE=${labDistance.toFixed(1)}). 인접 타입도 고려하세요.`);
  }

  const confidence = Math.round((undertoneResult.confidence + distanceConfidence) / 2);

  return {
    season,
    subtype,
    tone,
    koreanName: TWELVE_TONE_KOREAN_NAMES[tone],
    confidence,
    labDistance,
    warnings,
  };
}

// ============================================
// 유틸리티 함수
// ============================================

export function parseTwelveTone(tone: TwelveTone): { season: Season; subtype: Subtype } {
  const parts = tone.split("-");
  const subtype = parts[0] as Subtype;
  const season = parts[1] as Season;
  return { season, subtype };
}

export function composeTwelveTone(season: Season, subtype: Subtype): TwelveTone {
  return `${subtype}-${season}` as TwelveTone;
}

export function getReferenceLab(tone: TwelveTone): LabColor {
  return { ...TWELVE_TONE_REFERENCE_LAB[tone] };
}

export function getKoreanName(tone: TwelveTone): string {
  return TWELVE_TONE_KOREAN_NAMES[tone];
}
