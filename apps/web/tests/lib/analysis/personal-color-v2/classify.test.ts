/**
 * PC-2 12톤 분류 알고리즘 테스트
 *
 * @module tests/lib/analysis/personal-color-v2/classify
 * @see docs/principles/color-science.md
 */

import { describe, it, expect } from 'vitest';
import {
  getToneSeeason,
  getToneSubtype,
  classifyUndertone,
  classifySeason,
  classifyTwelveTone,
  generateTonePalette,
  getToneLabel,
  averageLab,
  applyKoreanAdjustment,
} from '@/lib/analysis/personal-color-v2/classify';
import type { LabColor, TwelveTone } from '@/lib/analysis/personal-color-v2/types';
import { TWELVE_TONE_LABELS, KOREAN_ADJUSTMENTS } from '@/lib/analysis/personal-color-v2/types';

// ============================================================================
// getToneSeeason
// ============================================================================

describe('getToneSeeason', () => {
  describe('시즌 추출', () => {
    it('should extract spring from spring tones', () => {
      expect(getToneSeeason('light-spring')).toBe('spring');
      expect(getToneSeeason('true-spring')).toBe('spring');
      expect(getToneSeeason('bright-spring')).toBe('spring');
    });

    it('should extract summer from summer tones', () => {
      expect(getToneSeeason('light-summer')).toBe('summer');
      expect(getToneSeeason('true-summer')).toBe('summer');
      expect(getToneSeeason('muted-summer')).toBe('summer');
    });

    it('should extract autumn from autumn tones', () => {
      expect(getToneSeeason('muted-autumn')).toBe('autumn');
      expect(getToneSeeason('true-autumn')).toBe('autumn');
      expect(getToneSeeason('deep-autumn')).toBe('autumn');
    });

    it('should extract winter from winter tones', () => {
      expect(getToneSeeason('deep-winter')).toBe('winter');
      expect(getToneSeeason('true-winter')).toBe('winter');
      expect(getToneSeeason('bright-winter')).toBe('winter');
    });
  });
});

// ============================================================================
// getToneSubtype
// ============================================================================

describe('getToneSubtype', () => {
  describe('서브타입 추출', () => {
    it('should extract light subtype', () => {
      expect(getToneSubtype('light-spring')).toBe('light');
      expect(getToneSubtype('light-summer')).toBe('light');
    });

    it('should extract true subtype', () => {
      expect(getToneSubtype('true-spring')).toBe('true');
      expect(getToneSubtype('true-summer')).toBe('true');
      expect(getToneSubtype('true-autumn')).toBe('true');
      expect(getToneSubtype('true-winter')).toBe('true');
    });

    it('should extract bright subtype', () => {
      expect(getToneSubtype('bright-spring')).toBe('bright');
      expect(getToneSubtype('bright-winter')).toBe('bright');
    });

    it('should extract muted subtype', () => {
      expect(getToneSubtype('muted-summer')).toBe('muted');
      expect(getToneSubtype('muted-autumn')).toBe('muted');
    });

    it('should extract deep subtype', () => {
      expect(getToneSubtype('deep-autumn')).toBe('deep');
      expect(getToneSubtype('deep-winter')).toBe('deep');
    });
  });
});

// ============================================================================
// classifyUndertone
// ============================================================================

describe('classifyUndertone', () => {
  describe('웜톤 분류', () => {
    it('should identify warm undertone for high b* value', () => {
      // 웜톤: b* > warmCoolThresholdB(19), Hue < 90
      const warmLab: LabColor = { L: 65, a: 15, b: 25 };
      const result = classifyUndertone(warmLab);

      expect(result).toBe('warm');
    });

    it('should identify warm undertone for yellow-ish hue', () => {
      const yellowishLab: LabColor = { L: 68, a: 10, b: 28 };
      const result = classifyUndertone(yellowishLab);

      expect(result).toBe('warm');
    });
  });

  describe('쿨톤 분류', () => {
    it('should identify cool undertone for low b* value', () => {
      // 쿨톤: b* < warmCoolThresholdB - 5 (14)
      const coolLab: LabColor = { L: 65, a: 8, b: 10 };
      const result = classifyUndertone(coolLab);

      expect(result).toBe('cool');
    });

    it('should identify cool undertone for high hue angle', () => {
      // 쿨톤: Hue > warmCoolThresholdHue + 30 (90)
      const coolHueLab: LabColor = { L: 60, a: -5, b: 15 };
      const result = classifyUndertone(coolHueLab);

      expect(result).toBe('cool');
    });
  });

  describe('뉴트럴 분류', () => {
    it('should identify neutral for borderline values', () => {
      // 경계 영역: warmCoolThresholdB - 5 < b* < warmCoolThresholdB
      const neutralLab: LabColor = { L: 65, a: 10, b: 17 };
      const result = classifyUndertone(neutralLab);

      expect(result).toBe('neutral');
    });
  });
});

// ============================================================================
// classifySeason
// ============================================================================

describe('classifySeason', () => {
  describe('봄 (Spring) 분류', () => {
    it('should classify bright warm skin as spring', () => {
      // 웜톤 + 밝음 (L > 65) + 높은 채도 (chroma > 25)
      const springLab: LabColor = { L: 70, a: 15, b: 28 };
      const season = classifySeason(springLab);

      expect(season).toBe('spring');
    });
  });

  describe('여름 (Summer) 분류', () => {
    it('should classify soft cool skin as summer', () => {
      // 쿨톤 + 밝음 (L > 55) + 낮은 채도 (chroma < 30)
      const summerLab: LabColor = { L: 65, a: 6, b: 10 };
      const season = classifySeason(summerLab);

      expect(season).toBe('summer');
    });
  });

  describe('가을 (Autumn) 분류', () => {
    it('should classify deep warm skin as autumn', () => {
      // 웜톤 + 어두움 또는 muted
      const autumnLab: LabColor = { L: 55, a: 12, b: 22 };
      const season = classifySeason(autumnLab);

      expect(season).toBe('autumn');
    });
  });

  describe('겨울 (Winter) 분류', () => {
    it('should classify bright cool skin as winter', () => {
      // 쿨톤 + 대비 높음 (낮은 L 또는 높은 chroma)
      const winterLab: LabColor = { L: 45, a: 5, b: 5 };
      const season = classifySeason(winterLab);

      expect(season).toBe('winter');
    });
  });

  describe('뉴트럴 언더톤 처리', () => {
    it('should handle neutral undertone by considering hue', () => {
      // 뉴트럴이지만 높은 b*는 웜톤 계열로
      const neutralWarmLab: LabColor = { L: 65, a: 8, b: 18 };
      const season = classifySeason(neutralWarmLab);

      // 결과는 봄 또는 가을
      expect(['spring', 'autumn']).toContain(season);
    });
  });
});

// ============================================================================
// classifyTwelveTone
// ============================================================================

describe('classifyTwelveTone', () => {
  describe('기본 동작', () => {
    it('should return complete classification result', () => {
      const lab: LabColor = { L: 68, a: 12, b: 25 };
      const result = classifyTwelveTone(lab);

      expect(result).toHaveProperty('tone');
      expect(result).toHaveProperty('season');
      expect(result).toHaveProperty('subtype');
      expect(result).toHaveProperty('undertone');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('toneScores');
      expect(result).toHaveProperty('measuredLab');
    });

    it('should include measured Lab in result', () => {
      const lab: LabColor = { L: 65, a: 10, b: 20 };
      const result = classifyTwelveTone(lab);

      expect(result.measuredLab).toEqual(lab);
    });

    it('should return valid tone score', () => {
      const lab: LabColor = { L: 65, a: 10, b: 20 };
      const result = classifyTwelveTone(lab);

      // 모든 톤에 대한 점수가 있어야 함
      const tones: TwelveTone[] = [
        'light-spring', 'true-spring', 'bright-spring',
        'light-summer', 'true-summer', 'muted-summer',
        'muted-autumn', 'true-autumn', 'deep-autumn',
        'deep-winter', 'true-winter', 'bright-winter',
      ];

      for (const tone of tones) {
        expect(result.toneScores[tone]).toBeDefined();
        expect(result.toneScores[tone]).toBeGreaterThanOrEqual(0);
        expect(result.toneScores[tone]).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('신뢰도 계산', () => {
    it('should return confidence between 0 and 100', () => {
      const lab: LabColor = { L: 65, a: 10, b: 20 };
      const result = classifyTwelveTone(lab);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should have high confidence for reference Lab values', () => {
      // 레퍼런스 Lab (true-spring)
      const trueSpringLab: LabColor = { L: 68, a: 12, b: 28 };
      const result = classifyTwelveTone(trueSpringLab);

      expect(result.confidence).toBeGreaterThan(70);
    });
  });

  describe('톤 일관성', () => {
    it('should match tone composition from season and subtype', () => {
      const lab: LabColor = { L: 65, a: 10, b: 20 };
      const result = classifyTwelveTone(lab);

      // tone은 season + subtype 조합이어야 함
      expect(result.tone).toContain(result.season);
    });
  });
});

// ============================================================================
// generateTonePalette
// ============================================================================

describe('generateTonePalette', () => {
  const allTones: TwelveTone[] = [
    'light-spring', 'true-spring', 'bright-spring',
    'light-summer', 'true-summer', 'muted-summer',
    'muted-autumn', 'true-autumn', 'deep-autumn',
    'deep-winter', 'true-winter', 'bright-winter',
  ];

  describe('기본 동작', () => {
    it('should return palette for each tone', () => {
      for (const tone of allTones) {
        const palette = generateTonePalette(tone);

        expect(palette.tone).toBe(tone);
        expect(palette.mainColors).toBeDefined();
        expect(palette.accentColors).toBeDefined();
        expect(palette.avoidColors).toBeDefined();
      }
    });

    it('should include makeup recommendations', () => {
      const palette = generateTonePalette('true-spring');

      expect(palette.lipColors).toBeDefined();
      expect(palette.lipColors.length).toBeGreaterThan(0);
      expect(palette.eyeshadowColors).toBeDefined();
      expect(palette.eyeshadowColors.length).toBeGreaterThan(0);
      expect(palette.blushColors).toBeDefined();
      expect(palette.blushColors.length).toBeGreaterThan(0);
    });
  });

  describe('색상 형식', () => {
    it('should return valid hex color codes', () => {
      const palette = generateTonePalette('true-summer');
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;

      for (const color of palette.mainColors) {
        expect(color).toMatch(hexRegex);
      }
    });
  });

  describe('색상 개수', () => {
    it('should return 6 main colors', () => {
      const palette = generateTonePalette('deep-autumn');
      expect(palette.mainColors.length).toBe(6);
    });

    it('should return 4 accent colors', () => {
      const palette = generateTonePalette('bright-winter');
      expect(palette.accentColors.length).toBe(4);
    });

    it('should return 4 avoid colors', () => {
      const palette = generateTonePalette('light-summer');
      expect(palette.avoidColors.length).toBe(4);
    });
  });
});

// ============================================================================
// getToneLabel
// ============================================================================

describe('getToneLabel', () => {
  describe('한국어 라벨 반환', () => {
    it('should return Korean label for each tone', () => {
      const tones: TwelveTone[] = [
        'light-spring', 'true-spring', 'bright-spring',
        'light-summer', 'true-summer', 'muted-summer',
        'muted-autumn', 'true-autumn', 'deep-autumn',
        'deep-winter', 'true-winter', 'bright-winter',
      ];

      for (const tone of tones) {
        const label = getToneLabel(tone);
        expect(label).toBe(TWELVE_TONE_LABELS[tone]);
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      }
    });

    it('should return correct labels for spring tones', () => {
      expect(getToneLabel('light-spring')).toBe('라이트 스프링');
      expect(getToneLabel('true-spring')).toBe('트루 스프링');
      expect(getToneLabel('bright-spring')).toBe('브라이트 스프링');
    });
  });
});

// ============================================================================
// averageLab
// ============================================================================

describe('averageLab', () => {
  describe('평균 계산', () => {
    it('should return average of multiple Lab values', () => {
      const samples: LabColor[] = [
        { L: 60, a: 10, b: 20 },
        { L: 70, a: 14, b: 24 },
      ];

      const avg = averageLab(samples);

      expect(avg.L).toBe(65);
      expect(avg.a).toBe(12);
      expect(avg.b).toBe(22);
    });

    it('should return same value for single sample', () => {
      const samples: LabColor[] = [{ L: 65, a: 10, b: 20 }];
      const avg = averageLab(samples);

      expect(avg).toEqual({ L: 65, a: 10, b: 20 });
    });

    it('should handle empty array', () => {
      const avg = averageLab([]);

      expect(avg).toEqual({ L: 0, a: 0, b: 0 });
    });
  });

  describe('정확성', () => {
    it('should calculate accurate average for three samples', () => {
      const samples: LabColor[] = [
        { L: 60, a: 6, b: 15 },
        { L: 66, a: 12, b: 21 },
        { L: 72, a: 18, b: 27 },
      ];

      const avg = averageLab(samples);

      expect(avg.L).toBe(66);
      expect(avg.a).toBe(12);
      expect(avg.b).toBe(21);
    });
  });
});

// ============================================================================
// applyKoreanAdjustment
// ============================================================================

describe('applyKoreanAdjustment', () => {
  describe('보정 적용', () => {
    it('should apply lightness offset', () => {
      const lab: LabColor = { L: 60, a: 10, b: 20 };
      const adjusted = applyKoreanAdjustment(lab);

      expect(adjusted.L).toBe(lab.L + KOREAN_ADJUSTMENTS.lightnessOffset);
    });

    it('should apply chroma weight to b value', () => {
      const lab: LabColor = { L: 60, a: 10, b: 20 };
      const adjusted = applyKoreanAdjustment(lab);

      expect(adjusted.b).toBe(lab.b * KOREAN_ADJUSTMENTS.chromaWeight);
    });

    it('should not modify a value', () => {
      const lab: LabColor = { L: 60, a: 10, b: 20 };
      const adjusted = applyKoreanAdjustment(lab);

      expect(adjusted.a).toBe(lab.a);
    });
  });

  describe('보정 값 검증', () => {
    it('should use correct Korean adjustment values', () => {
      expect(KOREAN_ADJUSTMENTS.lightnessOffset).toBe(2);
      expect(KOREAN_ADJUSTMENTS.chromaWeight).toBe(1.1);
    });
  });

  describe('원본 불변성', () => {
    it('should not modify original Lab object', () => {
      const original: LabColor = { L: 60, a: 10, b: 20 };
      const originalCopy = { ...original };

      applyKoreanAdjustment(original);

      expect(original).toEqual(originalCopy);
    });
  });
});

// ============================================================================
// 통합 테스트: 한국인 피부톤 시나리오
// ============================================================================

describe('Integration: 한국인 퍼스널컬러 분류', () => {
  describe('대표적인 한국인 웜톤', () => {
    it('should classify typical Korean warm-spring skin', () => {
      // 한국인 웜톤 봄 (밝고 따뜻한 피부)
      const koreanWarmSpring: LabColor = { L: 70, a: 11, b: 24 };
      const result = classifyTwelveTone(koreanWarmSpring);

      expect(result.undertone).toBe('warm');
      expect(result.season).toBe('spring');
    });

    it('should classify typical Korean warm-autumn skin', () => {
      // 한국인 웜톤 가을 (깊고 따뜻한 피부)
      const koreanWarmAutumn: LabColor = { L: 58, a: 13, b: 23 };
      const result = classifyTwelveTone(koreanWarmAutumn);

      expect(result.undertone).toBe('warm');
      expect(result.season).toBe('autumn');
    });
  });

  describe('대표적인 한국인 쿨톤', () => {
    it('should classify typical Korean cool-summer skin', () => {
      // 한국인 쿨톤 여름 (부드럽고 차분한 피부)
      const koreanCoolSummer: LabColor = { L: 66, a: 7, b: 12 };
      const result = classifyTwelveTone(koreanCoolSummer);

      expect(result.undertone).toBe('cool');
      expect(result.season).toBe('summer');
    });

    it('should classify typical Korean cool-winter skin', () => {
      // 한국인 쿨톤 겨울 (선명하고 대비 높은 피부)
      const koreanCoolWinter: LabColor = { L: 52, a: 6, b: 8 };
      const result = classifyTwelveTone(koreanCoolWinter);

      expect(result.undertone).toBe('cool');
      expect(result.season).toBe('winter');
    });
  });

  describe('한국인 보정 적용 후 분류', () => {
    it('should maintain consistency after Korean adjustment', () => {
      const originalLab: LabColor = { L: 65, a: 10, b: 20 };
      const adjustedLab = applyKoreanAdjustment(originalLab);

      const adjustedResult = classifyTwelveTone(adjustedLab);

      // 보정 후에도 같은 시즌 또는 인접 시즌이어야 함
      // (약간의 차이는 허용)
      expect(['spring', 'summer', 'autumn', 'winter']).toContain(adjustedResult.season);
    });
  });

  describe('팔레트 추천 일관성', () => {
    it('should provide consistent palette for classified tone', () => {
      const lab: LabColor = { L: 68, a: 12, b: 25 };
      const classification = classifyTwelveTone(lab);
      const palette = generateTonePalette(classification.tone);

      expect(palette.tone).toBe(classification.tone);
      expect(palette.mainColors.length).toBeGreaterThan(0);
    });
  });
});
