/**
 * PC-2 12-Tone 퍼스널컬러 분류 테스트
 *
 * @module tests/lib/analysis/personal-color-v2/tone-classifier
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 */

import { describe, it, expect } from 'vitest';
import {
  classifyTone,
  determineUndertone,
  determineSeason,
  determineSubtype,
  composeTwelveTone,
  parseTwelveTone,
  calculateToneScores,
  getReferenceLab,
  classifySkinBrightness,
  calculateToneSimilarity,
  getAdjacentTones,
  TWELVE_TONE_REFERENCE_LAB,
  KOREAN_ADJUSTMENTS,
} from '@/lib/analysis/personal-color-v2';
import type {
  LabColor,
  Season,
  Subtype,
  TwelveTone,
} from '@/lib/analysis/personal-color-v2';

describe('PC-2 Tone Classifier', () => {
  // ==========================================================================
  // determineUndertone
  // ==========================================================================
  describe('determineUndertone', () => {
    it('should identify warm undertone (high b*, high hue)', () => {
      // 웜톤: Hue > 60° AND b* > 19
      const warmLab: LabColor = { L: 65, a: 12, b: 25 };
      const result = determineUndertone(warmLab);

      expect(result.undertone).toBe('warm');
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should identify cool undertone (low b*, low hue)', () => {
      // 쿨톤: Hue < 60° AND b* < 19
      const coolLab: LabColor = { L: 65, a: 8, b: 10 };
      const result = determineUndertone(coolLab);

      expect(result.undertone).toBe('cool');
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should identify neutral undertone (borderline values)', () => {
      // 뉴트럴: 경계 영역
      const neutralLab: LabColor = { L: 65, a: 10, b: 18 };
      const result = determineUndertone(neutralLab);

      expect(result.undertone).toBe('neutral');
    });

    it('should return neutral for low chroma (achromatic)', () => {
      // 채도가 낮으면 언더톤 판정 어려움
      const grayLab: LabColor = { L: 50, a: 2, b: 3 };
      const result = determineUndertone(grayLab);

      expect(result.undertone).toBe('neutral');
      expect(result.confidence).toBeLessThan(70);
    });

    it('should include hue in result', () => {
      const lab: LabColor = { L: 65, a: 10, b: 20 };
      const result = determineUndertone(lab);

      expect(result.hue).toBeDefined();
      expect(result.hue).toBeGreaterThanOrEqual(0);
      expect(result.hue).toBeLessThan(360);
    });
  });

  // ==========================================================================
  // determineSeason
  // ==========================================================================
  describe('determineSeason', () => {
    it('should classify bright warm as Spring', () => {
      const lab: LabColor = { L: 68, a: 12, b: 25 };
      const undertoneResult = determineUndertone(lab);
      const season = determineSeason(lab, undertoneResult);

      expect(season).toBe('spring');
    });

    it('should classify deep warm as Autumn', () => {
      // 깊은 웜톤: L* 낮고, b* 높음 (웜톤 조건 충족)
      const lab: LabColor = { L: 55, a: 14, b: 26 };
      const undertoneResult = determineUndertone(lab);
      const season = determineSeason(lab, undertoneResult);

      expect(season).toBe('autumn');
    });

    it('should classify bright cool as Summer', () => {
      const lab: LabColor = { L: 65, a: 6, b: 10 };
      const undertoneResult = determineUndertone(lab);
      const season = determineSeason(lab, undertoneResult);

      expect(season).toBe('summer');
    });

    it('should classify deep cool as Winter', () => {
      const lab: LabColor = { L: 45, a: 5, b: 5 };
      const undertoneResult = determineUndertone(lab);
      const season = determineSeason(lab, undertoneResult);

      expect(season).toBe('winter');
    });

    it('should handle neutral undertone by using hue', () => {
      // 뉴트럴이지만 Hue로 추가 판정
      const neutralLab: LabColor = { L: 65, a: 8, b: 18 };
      const undertoneResult = determineUndertone(neutralLab);
      const season = determineSeason(neutralLab, undertoneResult);

      // 결과는 hue 각도에 따라 결정됨
      expect(['spring', 'summer', 'autumn', 'winter']).toContain(season);
    });
  });

  // ==========================================================================
  // determineSubtype
  // ==========================================================================
  describe('determineSubtype', () => {
    describe('Spring subtypes', () => {
      it('should classify high L* as light-spring', () => {
        const lightLab: LabColor = { L: 75, a: 10, b: 22 };
        const subtype = determineSubtype(lightLab, 'spring');

        expect(subtype).toBe('light');
      });

      it('should classify high chroma as bright-spring', () => {
        const brightLab: LabColor = { L: 60, a: 20, b: 35 };
        const subtype = determineSubtype(brightLab, 'spring');

        expect(subtype).toBe('bright');
      });

      it('should classify moderate values as true-spring', () => {
        const trueLab: LabColor = { L: 60, a: 12, b: 20 };
        const subtype = determineSubtype(trueLab, 'spring');

        expect(subtype).toBe('true');
      });
    });

    describe('Summer subtypes', () => {
      it('should classify high L* as light-summer', () => {
        const lightLab: LabColor = { L: 72, a: 5, b: 12 };
        const subtype = determineSubtype(lightLab, 'summer');

        expect(subtype).toBe('light');
      });

      it('should classify low chroma as muted-summer', () => {
        const mutedLab: LabColor = { L: 60, a: 5, b: 8 };
        const subtype = determineSubtype(mutedLab, 'summer');

        expect(subtype).toBe('muted');
      });

      it('should classify moderate values as true-summer', () => {
        // 중간 채도: mutedChroma(18) < chroma < brightChroma
        const trueLab: LabColor = { L: 62, a: 12, b: 18 };
        const subtype = determineSubtype(trueLab, 'summer');

        expect(subtype).toBe('true');
      });
    });

    describe('Autumn subtypes', () => {
      it('should classify low L* as deep-autumn', () => {
        const deepLab: LabColor = { L: 45, a: 12, b: 20 };
        const subtype = determineSubtype(deepLab, 'autumn');

        expect(subtype).toBe('deep');
      });

      it('should classify low chroma as muted-autumn', () => {
        const mutedLab: LabColor = { L: 55, a: 8, b: 12 };
        const subtype = determineSubtype(mutedLab, 'autumn');

        expect(subtype).toBe('muted');
      });

      it('should classify moderate values as true-autumn', () => {
        const trueLab: LabColor = { L: 55, a: 14, b: 24 };
        const subtype = determineSubtype(trueLab, 'autumn');

        expect(subtype).toBe('true');
      });
    });

    describe('Winter subtypes', () => {
      it('should classify low L* as deep-winter', () => {
        const deepLab: LabColor = { L: 40, a: 6, b: 4 };
        const subtype = determineSubtype(deepLab, 'winter');

        expect(subtype).toBe('deep');
      });

      it('should classify high chroma as bright-winter', () => {
        // 높은 채도: chroma > brightChroma(28)
        // chroma = sqrt(a^2 + b^2) > 28
        const brightLab: LabColor = { L: 55, a: 25, b: 15 };
        const subtype = determineSubtype(brightLab, 'winter');

        expect(subtype).toBe('bright');
      });

      it('should classify moderate values as true-winter', () => {
        const trueLab: LabColor = { L: 52, a: 8, b: 6 };
        const subtype = determineSubtype(trueLab, 'winter');

        expect(subtype).toBe('true');
      });
    });
  });

  // ==========================================================================
  // composeTwelveTone & parseTwelveTone
  // ==========================================================================
  describe('composeTwelveTone', () => {
    it('should compose subtype and season correctly', () => {
      expect(composeTwelveTone('spring', 'light')).toBe('light-spring');
      expect(composeTwelveTone('summer', 'true')).toBe('true-summer');
      expect(composeTwelveTone('autumn', 'deep')).toBe('deep-autumn');
      expect(composeTwelveTone('winter', 'bright')).toBe('bright-winter');
    });
  });

  describe('parseTwelveTone', () => {
    it('should parse twelve tone into season and subtype', () => {
      const result1 = parseTwelveTone('light-spring');
      expect(result1.season).toBe('spring');
      expect(result1.subtype).toBe('light');

      const result2 = parseTwelveTone('deep-winter');
      expect(result2.season).toBe('winter');
      expect(result2.subtype).toBe('deep');
    });

    it('should roundtrip compose -> parse', () => {
      const tone = composeTwelveTone('autumn', 'muted');
      const parsed = parseTwelveTone(tone);

      expect(parsed.season).toBe('autumn');
      expect(parsed.subtype).toBe('muted');
    });
  });

  // ==========================================================================
  // calculateToneScores
  // ==========================================================================
  describe('calculateToneScores', () => {
    it('should return scores for all 12 tones', () => {
      const lab: LabColor = { L: 65, a: 10, b: 20 };
      const scores = calculateToneScores(lab);

      const tones = Object.keys(TWELVE_TONE_REFERENCE_LAB) as TwelveTone[];
      expect(Object.keys(scores).length).toBe(tones.length);

      for (const tone of tones) {
        expect(scores[tone]).toBeDefined();
        expect(scores[tone]).toBeGreaterThanOrEqual(0);
        expect(scores[tone]).toBeLessThanOrEqual(100);
      }
    });

    it('should give highest score to matching reference', () => {
      // true-spring 레퍼런스와 동일한 Lab
      const trueSpringRef = TWELVE_TONE_REFERENCE_LAB['true-spring'];
      const scores = calculateToneScores(trueSpringRef);

      // 동일 색상이므로 거의 100점
      expect(scores['true-spring']).toBeGreaterThan(95);
    });

    it('should give lower scores to distant tones', () => {
      // Spring 계열 Lab
      const springLab: LabColor = { L: 68, a: 12, b: 28 };
      const scores = calculateToneScores(springLab);

      // Spring 점수가 Winter보다 높아야 함
      const springScore = Math.max(
        scores['light-spring'],
        scores['true-spring'],
        scores['bright-spring']
      );
      const winterScore = Math.max(
        scores['deep-winter'],
        scores['true-winter'],
        scores['bright-winter']
      );

      expect(springScore).toBeGreaterThan(winterScore);
    });
  });

  // ==========================================================================
  // classifyTone (메인 함수)
  // ==========================================================================
  describe('classifyTone', () => {
    it('should return complete classification result', () => {
      const lab: LabColor = { L: 68, a: 12, b: 25 };
      const result = classifyTone(lab);

      expect(result.tone).toBeDefined();
      expect(result.season).toBeDefined();
      expect(result.subtype).toBeDefined();
      expect(result.undertone).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.toneScores).toBeDefined();
      expect(result.measuredLab).toEqual(lab);
    });

    it('should classify warm bright skin as Spring', () => {
      // 밝고 따뜻한 피부
      const warmBrightLab: LabColor = { L: 70, a: 12, b: 26 };
      const result = classifyTone(warmBrightLab);

      expect(result.season).toBe('spring');
      expect(result.undertone).toBe('warm');
    });

    it('should classify cool soft skin as Summer', () => {
      // 차분하고 부드러운 피부
      const coolSoftLab: LabColor = { L: 65, a: 6, b: 10 };
      const result = classifyTone(coolSoftLab);

      expect(result.season).toBe('summer');
      expect(result.undertone).toBe('cool');
    });

    it('should classify deep warm skin as Autumn', () => {
      // 깊고 따뜻한 피부: L* < 60, b* > 19
      const deepWarmLab: LabColor = { L: 55, a: 14, b: 26 };
      const result = classifyTone(deepWarmLab);

      expect(result.season).toBe('autumn');
      expect(result.undertone).toBe('warm');
    });

    it('should classify deep cool skin as Winter', () => {
      // 깊고 차가운 피부: L* < 58, b* < 19, chroma > 8
      const deepCoolLab: LabColor = { L: 50, a: 8, b: 10 };
      const result = classifyTone(deepCoolLab);

      expect(result.season).toBe('winter');
      expect(result.undertone).toBe('cool');
    });

    it('should have confidence between 0 and 100', () => {
      const lab: LabColor = { L: 65, a: 10, b: 20 };
      const result = classifyTone(lab);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should match tone composition', () => {
      const lab: LabColor = { L: 68, a: 12, b: 25 };
      const result = classifyTone(lab);

      const expectedTone = composeTwelveTone(result.season, result.subtype);
      expect(result.tone).toBe(expectedTone);
    });
  });

  // ==========================================================================
  // getReferenceLab
  // ==========================================================================
  describe('getReferenceLab', () => {
    it('should return reference Lab for valid tone', () => {
      const ref = getReferenceLab('true-spring');

      expect(ref).toEqual(TWELVE_TONE_REFERENCE_LAB['true-spring']);
    });

    it('should return a copy (not modify original)', () => {
      const ref = getReferenceLab('true-spring');
      ref.L = 0;

      expect(TWELVE_TONE_REFERENCE_LAB['true-spring'].L).not.toBe(0);
    });
  });

  // ==========================================================================
  // classifySkinBrightness
  // ==========================================================================
  describe('classifySkinBrightness', () => {
    it('should classify very light skin (ITA > 55)', () => {
      const veryLightLab: LabColor = { L: 80, a: 5, b: 10 };
      const brightness = classifySkinBrightness(veryLightLab);

      expect(brightness).toBe('very-light');
    });

    it('should classify light skin (ITA 41-55)', () => {
      const lightLab: LabColor = { L: 72, a: 8, b: 18 };
      const brightness = classifySkinBrightness(lightLab);

      expect(['light', 'very-light']).toContain(brightness);
    });

    it('should classify intermediate skin (ITA 28-41, Korean average)', () => {
      const intermediateLab: LabColor = { L: 65, a: 10, b: 22 };
      const brightness = classifySkinBrightness(intermediateLab);

      expect(['intermediate', 'light']).toContain(brightness);
    });

    it('should classify tan skin (ITA 10-28)', () => {
      // ITA = arctan[(L - 50) / b] * 180/PI
      // ITA 20: L=55, b=10 -> arctan(5/10) = 26.6°
      const tanLab: LabColor = { L: 58, a: 12, b: 25 };
      const brightness = classifySkinBrightness(tanLab);

      expect(['tan', 'intermediate']).toContain(brightness);
    });

    it('should classify dark skin (ITA < 10)', () => {
      const darkLab: LabColor = { L: 40, a: 10, b: 20 };
      const brightness = classifySkinBrightness(darkLab);

      expect(['dark', 'tan']).toContain(brightness);
    });
  });

  // ==========================================================================
  // calculateToneSimilarity
  // ==========================================================================
  describe('calculateToneSimilarity', () => {
    it('should return 100 for identical tones', () => {
      const similarity = calculateToneSimilarity('true-spring', 'true-spring');

      expect(similarity).toBe(100);
    });

    it('should return high similarity for adjacent tones', () => {
      // 같은 계절 내 서브타입
      const similarity = calculateToneSimilarity('true-spring', 'light-spring');

      expect(similarity).toBeGreaterThan(50);
    });

    it('should return low similarity for opposite tones', () => {
      // 반대 계절
      const similarity = calculateToneSimilarity('bright-spring', 'deep-winter');

      expect(similarity).toBeLessThan(50);
    });
  });

  // ==========================================================================
  // getAdjacentTones
  // ==========================================================================
  describe('getAdjacentTones', () => {
    it('should return requested number of tones', () => {
      const adjacent = getAdjacentTones('true-spring', 3);

      expect(adjacent.length).toBe(3);
    });

    it('should not include the original tone', () => {
      const adjacent = getAdjacentTones('true-spring', 5);

      expect(adjacent).not.toContain('true-spring');
    });

    it('should return tones sorted by similarity', () => {
      const adjacent = getAdjacentTones('true-spring', 2);

      // 첫 번째가 가장 유사
      const similarity1 = calculateToneSimilarity('true-spring', adjacent[0]);
      const similarity2 = calculateToneSimilarity('true-spring', adjacent[1]);

      expect(similarity1).toBeGreaterThanOrEqual(similarity2);
    });

    it('should default to 2 adjacent tones', () => {
      const adjacent = getAdjacentTones('true-summer');

      expect(adjacent.length).toBe(2);
    });
  });

  // ==========================================================================
  // 통합 테스트: 한국인 피부톤 시나리오
  // ==========================================================================
  describe('Integration: Korean Skin Tone Classification', () => {
    it('should classify typical Korean warm skin correctly', () => {
      // 한국인 웜톤 (봄 또는 가을)
      const koreanWarmLab: LabColor = { L: 67, a: 11, b: 23 };
      const result = classifyTone(koreanWarmLab);

      expect(result.undertone).toBe('warm');
      expect(['spring', 'autumn']).toContain(result.season);
    });

    it('should classify typical Korean cool skin correctly', () => {
      // 한국인 쿨톤 (여름 또는 겨울)
      const koreanCoolLab: LabColor = { L: 65, a: 7, b: 12 };
      const result = classifyTone(koreanCoolLab);

      expect(result.undertone).toBe('cool');
      expect(['summer', 'winter']).toContain(result.season);
    });

    it('should handle borderline Korean skin (neutral undertone)', () => {
      // 뉴트럴 한국인 피부
      const borderlineLab: LabColor = { L: 66, a: 9, b: 18 };
      const result = classifyTone(borderlineLab);

      // 뉴트럴이지만 가장 가까운 톤으로 분류
      expect(result.tone).toBeDefined();
      expect(result.confidence).toBeGreaterThan(40);
    });

    it('should use Korean-optimized thresholds', () => {
      // 한국인 임계값 확인
      expect(KOREAN_ADJUSTMENTS.warmCoolThresholdB).toBe(19);
      expect(KOREAN_ADJUSTMENTS.warmCoolThresholdHue).toBe(60);
    });
  });
});
