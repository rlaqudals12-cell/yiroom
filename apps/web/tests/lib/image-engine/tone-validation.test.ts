import { describe, it, expect } from 'vitest';
import {
  calculateToneValidationModifiers,
  type PersonalColorAIResult,
} from '@/lib/image-engine/pipeline/hybrid';

// 기본 AI 결과 팩토리
function createAIResult(overrides: Partial<PersonalColorAIResult> = {}): PersonalColorAIResult {
  return {
    confidence: 85,
    season: 'spring',
    undertone: 'warm',
    tone: 'true-spring',
    measuredLab: { L: 68, a: 10, b: 22 },
    analysisEvidence: {
      veinColor: 'green',
      skinUndertone: 'yellow',
      skinHairContrast: 'medium',
    },
    ...overrides,
  };
}

describe('calculateToneValidationModifiers', () => {
  describe('Lab 값 없을 때', () => {
    it('measuredLab이 없으면 빈 배열 반환', () => {
      const result = calculateToneValidationModifiers({ confidence: 85 });
      expect(result).toEqual([]);
    });

    it('L이 number가 아니면 빈 배열 반환', () => {
      const result = calculateToneValidationModifiers({
        measuredLab: { L: undefined as unknown as number, a: 10, b: 22 },
      });
      expect(result).toEqual([]);
    });
  });

  describe('1. 언더톤 검증 (h° vs AI)', () => {
    it('h° < 55이고 AI가 웜톤이면 -15 감소', () => {
      // h° = atan2(12, 3) ≈ 76° → 웜 영역이지만 b가 낮으면 달라짐
      // h° = atan2(10, 15) ≈ 33.7° → 쿨 영역
      const result = calculateToneValidationModifiers(
        createAIResult({
          undertone: 'warm',
          measuredLab: { L: 65, a: 15, b: 10 }, // h° ≈ 33.7° (쿨 영역)
        })
      );
      const undertoneModifier = result.find((m) => m.reason.includes('쿨 영역'));
      expect(undertoneModifier).toBeDefined();
      expect(undertoneModifier!.adjustment).toBe(-15);
    });

    it('h° > 60이고 AI가 쿨톤이면 -15 감소', () => {
      const result = calculateToneValidationModifiers(
        createAIResult({
          undertone: 'cool',
          measuredLab: { L: 65, a: 8, b: 22 }, // h° ≈ 70° (웜 영역)
        })
      );
      const undertoneModifier = result.find((m) => m.reason.includes('웜 영역'));
      expect(undertoneModifier).toBeDefined();
      expect(undertoneModifier!.adjustment).toBe(-15);
    });

    it('h° 55-60 (뉴트럴)이면 -8 감소', () => {
      // h° ≈ 57° → atan2(b, a) = 57° → tan(57°) ≈ 1.54 → b/a = 1.54
      // a=10, b=15.4 → h° ≈ 57°
      const result = calculateToneValidationModifiers(
        createAIResult({
          measuredLab: { L: 65, a: 10, b: 15.4 }, // h° ≈ 57°
        })
      );
      const neutralModifier = result.find((m) => m.reason.includes('뉴트럴'));
      expect(neutralModifier).toBeDefined();
      expect(neutralModifier!.adjustment).toBe(-8);
    });
  });

  describe('2. 계절 검증 (L* vs AI)', () => {
    it('Spring인데 L* ≤ 55이면 -10 감소', () => {
      const result = calculateToneValidationModifiers(
        createAIResult({
          season: 'spring',
          measuredLab: { L: 50, a: 10, b: 22 },
        })
      );
      const seasonModifier = result.find((m) => m.reason.includes('Autumn일 가능성'));
      expect(seasonModifier).toBeDefined();
      expect(seasonModifier!.adjustment).toBe(-10);
    });

    it('Winter인데 L* > 65이면 -10 감소', () => {
      const result = calculateToneValidationModifiers(
        createAIResult({
          season: 'winter',
          measuredLab: { L: 70, a: 5, b: 10 },
        })
      );
      const seasonModifier = result.find((m) => m.reason.includes('Summer일 가능성'));
      expect(seasonModifier).toBeDefined();
    });
  });

  describe('3. 서브톤 검증 (C* vs AI)', () => {
    it('Bright인데 C* < 14이면 -10 감소', () => {
      // C* = sqrt(5² + 10²) ≈ 11.2
      const result = calculateToneValidationModifiers(
        createAIResult({
          tone: 'bright-spring',
          measuredLab: { L: 68, a: 5, b: 10 },
        })
      );
      const chromaModifier = result.find((m) => m.reason.includes('Muted일 가능성'));
      expect(chromaModifier).toBeDefined();
      expect(chromaModifier!.adjustment).toBe(-10);
    });

    it('Muted인데 C* > 22이면 -10 감소', () => {
      // C* = sqrt(12² + 20²) ≈ 23.3
      const result = calculateToneValidationModifiers(
        createAIResult({
          tone: 'muted-summer',
          measuredLab: { L: 65, a: 12, b: 20 },
        })
      );
      const chromaModifier = result.find((m) => m.reason.includes('Bright일 가능성'));
      expect(chromaModifier).toBeDefined();
    });
  });

  describe('4. 혈관색 검증', () => {
    it('쿨 혈관(blue)인데 웜톤이면 -20 감소', () => {
      const result = calculateToneValidationModifiers(
        createAIResult({
          undertone: 'warm',
          analysisEvidence: { veinColor: 'blue' },
          measuredLab: { L: 65, a: 8, b: 22 },
        })
      );
      const veinModifier = result.find((m) => m.reason.includes('혈관색'));
      expect(veinModifier).toBeDefined();
      expect(veinModifier!.adjustment).toBe(-20);
    });

    it('웜 혈관(green)이고 웜톤이면 +5 보너스', () => {
      const result = calculateToneValidationModifiers(
        createAIResult({
          undertone: 'warm',
          analysisEvidence: { veinColor: 'green' },
          measuredLab: { L: 68, a: 10, b: 22 },
        })
      );
      const veinModifier = result.find((m) => m.reason.includes('일치'));
      expect(veinModifier).toBeDefined();
      expect(veinModifier!.adjustment).toBe(5);
    });
  });

  describe('5. 완전 일치 보너스', () => {
    it('모든 검증 통과 시 일치 보너스 +5', () => {
      // 웜톤 + h° > 60° + Spring + L* > 60 + true(C* 14-20) + green 혈관
      const result = calculateToneValidationModifiers(
        createAIResult({
          undertone: 'warm',
          season: 'spring',
          tone: 'true-spring',
          measuredLab: { L: 68, a: 10, b: 22 }, // h° ≈ 65.6°, C* ≈ 24.2
          analysisEvidence: { veinColor: 'green' },
        })
      );
      const bonusModifier = result.find(
        (m) => m.reason.includes('일치') && m.source === 'cross-validation'
      );
      expect(bonusModifier).toBeDefined();
      expect(bonusModifier!.adjustment).toBeGreaterThanOrEqual(5);
    });
  });
});
