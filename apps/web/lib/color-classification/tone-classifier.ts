/**
 * 톤 분류 (웜톤/쿨톤/중립)
 *
 * @module lib/color-classification/tone-classifier
 * @description Lab 색공간 기반 톤 분류
 * @see docs/principles/color-science.md
 * @see docs/adr/ADR-034-product-color-classification.md
 */

import type { LabColor, Tone } from './types';
import { TONE_THRESHOLDS } from './types';

/**
 * Lab 색공간에서 톤 분류
 *
 * 웜톤: a* > 0 (붉은 기운) AND b* > 0 (노란 기운)
 * 쿨톤: a* < 0 (녹색 기운) OR b* < 0 (파란 기운)
 * 중립: 경계선 (a*, b* 모두 낮음)
 *
 * @param lab - Lab 색상
 * @returns 톤 분류 결과
 */
export function classifyTone(lab: LabColor): Tone {
  const { a, b } = lab;
  const { neutralThreshold } = TONE_THRESHOLDS;

  // 중립 영역: a*, b* 모두 임계값 이내
  if (Math.abs(a) < neutralThreshold && Math.abs(b) < neutralThreshold) {
    return 'neutral';
  }

  // 웜톤: 붉은 기운(a > 0) + 노란 기운(b > 0)
  if (a > 0 && b > 0) {
    return 'warm';
  }

  // 쿨톤: 그 외 (녹색/파란 기운)
  return 'cool';
}

/**
 * 상세 톤 분류 (신뢰도 포함)
 *
 * @param lab - Lab 색상
 * @returns 톤 분류 결과와 신뢰도
 */
export function classifyToneWithConfidence(lab: LabColor): {
  tone: Tone;
  confidence: number;
} {
  const { a, b } = lab;
  const { neutralThreshold } = TONE_THRESHOLDS;

  // 중립 영역 거리 계산
  const distFromNeutral = Math.sqrt(a * a + b * b);

  // 중립 영역 내
  if (distFromNeutral < neutralThreshold) {
    // 중립 영역 중심에 가까울수록 높은 신뢰도
    const confidence = Math.round(100 - (distFromNeutral / neutralThreshold) * 40);
    return { tone: 'neutral', confidence };
  }

  // 톤 결정
  const tone = a > 0 && b > 0 ? 'warm' : 'cool';

  // 신뢰도: 중립 영역에서 멀수록, 해당 톤 특성이 강할수록 높음
  // 웜톤: a+, b+ 둘 다 클수록
  // 쿨톤: a- 또는 b- 클수록

  let toneStrength: number;
  if (tone === 'warm') {
    // 웜톤 강도: a와 b의 양수 크기
    toneStrength = Math.min(a, b);
  } else {
    // 쿨톤 강도: a의 음수 크기 또는 b의 음수 크기
    toneStrength = Math.max(-a, -b);
    if (toneStrength < 0) {
      // a > 0 이고 b < 0 인 경우 (b의 음수 크기)
      toneStrength = -b;
    }
  }

  // 신뢰도 계산 (0-100)
  // toneStrength가 30 이상이면 100% 신뢰도
  const confidence = Math.min(100, Math.round(60 + (toneStrength / 30) * 40));

  return { tone, confidence };
}

/**
 * 웜톤 비율 계산
 *
 * @param lab - Lab 색상
 * @returns 웜톤 비율 (0-100, 50이 중립)
 */
export function calculateWarmRatio(lab: LabColor): number {
  const { a, b } = lab;

  // a와 b의 부호와 크기로 웜톤 비율 계산
  // 웜톤: a > 0, b > 0 → 높은 값
  // 쿨톤: a < 0 또는 b < 0 → 낮은 값

  // a와 b를 -30~30 범위로 클램핑
  const clampedA = Math.max(-30, Math.min(30, a));
  const clampedB = Math.max(-30, Math.min(30, b));

  // 웜톤 점수 (-60 ~ 60 → 0 ~ 100)
  const warmScore = clampedA + clampedB;
  const normalizedScore = ((warmScore + 60) / 120) * 100;

  return Math.round(Math.max(0, Math.min(100, normalizedScore)));
}

/**
 * 톤별 설명 텍스트 반환
 *
 * @param tone - 톤 분류 결과
 * @returns 한국어 설명
 */
export function getToneDescription(tone: Tone): string {
  const descriptions: Record<Tone, string> = {
    warm: '따뜻한 느낌의 노란/붉은 기운이 도는 색상',
    cool: '차가운 느낌의 파란/녹색 기운이 도는 색상',
    neutral: '특정 톤에 치우치지 않은 중립적인 색상',
  };

  return descriptions[tone];
}

/**
 * 톤별 추천 설명 반환
 *
 * @param tone - 톤 분류 결과
 * @param userSeason - 사용자 시즌 타입
 * @returns 추천 설명
 */
export function getToneRecommendation(
  tone: Tone,
  userSeason: 'spring' | 'summer' | 'autumn' | 'winter'
): string {
  const warmSeasons = ['spring', 'autumn'];
  const coolSeasons = ['summer', 'winter'];

  const isUserWarm = warmSeasons.includes(userSeason);

  if (tone === 'neutral') {
    return '누구에게나 무난하게 어울리는 색상입니다.';
  }

  if ((tone === 'warm' && isUserWarm) || (tone === 'cool' && !isUserWarm)) {
    return '회원님의 퍼스널컬러와 잘 어울리는 색상입니다.';
  }

  return '회원님의 퍼스널컬러와는 다른 톤이에요. 포인트로 활용해보세요.';
}
