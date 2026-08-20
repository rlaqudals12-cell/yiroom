/**
 * 디자인 토큰 테스트
 * 웹과 동일한 값이 올바르게 정의되었는지 검증
 */

import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
  needsLegacyAndroidShadow,
} from '../../../lib/theme/tokens';

describe('디자인 토큰', () => {
  describe('brand', () => {
    it('primary 색상이 ADR-120의 절제된 rose여야 한다', () => {
      expect(brand.primary).toBe('#C56A84');
    });

    it('primaryForeground는 rose 위 일반 텍스트 AA를 만족하는 잉크여야 한다', () => {
      expect(brand.primaryForeground).toBe('#1C1C1E');
    });

    it('gradient 호환 키도 primary 단색으로 고정되어야 한다', () => {
      expect(brand.gradientStart).toBe(brand.primary);
      expect(brand.gradientEnd).toBe(brand.gradientStart);
    });
  });

  describe('lightColors', () => {
    it('모든 시맨틱 색상이 정의되어야 한다', () => {
      const requiredKeys = [
        'background',
        'foreground',
        'card',
        'cardForeground',
        'secondary',
        'muted',
        'mutedForeground',
        'destructive',
        'border',
        'input',
        'ring',
      ];

      for (const key of requiredKeys) {
        expect(lightColors).toHaveProperty(key);
        expect(typeof lightColors[key as keyof typeof lightColors]).toBe('string');
      }
    });

    it('background는 ADR-120의 크림 지면이어야 한다', () => {
      expect(lightColors.background).toBe('#FBF3F1');
    });

    it('ring이 brand primary와 일치해야 한다', () => {
      expect(lightColors.ring).toBe(brand.primary);
    });
  });

  describe('darkColors', () => {
    it('lightColors와 동일한 키를 가져야 한다', () => {
      const lightKeys = Object.keys(lightColors).sort();
      const darkKeys = Object.keys(darkColors).sort();
      expect(darkKeys).toEqual(lightKeys);
    });

    it('background는 어두운 색이어야 한다', () => {
      expect(darkColors.background).toBe('#0F0F0F');
    });

    it('foreground는 밝은 색이어야 한다', () => {
      expect(darkColors.foreground).toBe('#FFFFFF');
    });
  });

  describe('moduleColors', () => {
    it('모든 모듈 색상이 base/light/dark 구조를 가져야 한다', () => {
      const modules = Object.keys(moduleColors) as (keyof typeof moduleColors)[];

      for (const mod of modules) {
        expect(moduleColors[mod]).toHaveProperty('base');
        expect(moduleColors[mod]).toHaveProperty('light');
        expect(moduleColors[mod]).toHaveProperty('dark');
      }
    });

    it('필수 모듈이 정의되어야 한다', () => {
      expect(moduleColors).toHaveProperty('workout');
      expect(moduleColors).toHaveProperty('nutrition');
      expect(moduleColors).toHaveProperty('skin');
      expect(moduleColors).toHaveProperty('body');
      expect(moduleColors).toHaveProperty('personalColor');
    });
  });

  describe('statusColors', () => {
    it('success/warning/error/info가 정의되어야 한다', () => {
      expect(statusColors.success).toBeDefined();
      expect(statusColors.warning).toBeDefined();
      expect(statusColors.error).toBeDefined();
      expect(statusColors.info).toBeDefined();
    });
  });

  describe('spacing', () => {
    it('숫자 값이어야 한다', () => {
      const values = Object.values(spacing);
      for (const v of values) {
        expect(typeof v).toBe('number');
      }
    });

    it('xs < sm < md < lg < xl 순서여야 한다', () => {
      expect(spacing.xs).toBeLessThan(spacing.sm);
      expect(spacing.sm).toBeLessThan(spacing.md);
      expect(spacing.md).toBeLessThan(spacing.lg);
      expect(spacing.lg).toBeLessThan(spacing.xl);
    });
  });

  describe('radii', () => {
    it('기본 반지름이 정의되어야 한다', () => {
      expect(radii).toHaveProperty('sm');
      expect(radii).toHaveProperty('md');
      expect(radii).toHaveProperty('lg');
      expect(radii).toHaveProperty('xl');
      expect(radii).toHaveProperty('full');
    });

    it('full이 가장 커야 한다', () => {
      expect(radii.full).toBeGreaterThan(radii.xl);
    });
  });

  describe('shadows', () => {
    it('Android API 28 미만에서만 elevation 폴백을 선택해야 한다', () => {
      expect(needsLegacyAndroidShadow('android', 27)).toBe(true);
      expect(needsLegacyAndroidShadow('android', 28)).toBe(false);
      expect(needsLegacyAndroidShadow('ios', '18.0')).toBe(false);
    });

    it('rest 그림자는 웜 브라운 두 레이어여야 한다', () => {
      expect(shadows.card.boxShadow).toEqual([
        {
          offsetX: 0,
          offsetY: 1,
          blurRadius: 2,
          spreadDistance: 0,
          color: 'rgba(93, 64, 55, 0.07)',
        },
        {
          offsetX: 0,
          offsetY: 8,
          blurRadius: 24,
          spreadDistance: 0,
          color: 'rgba(93, 64, 55, 0.08)',
        },
      ]);
      expect(shadows.sm).toBe(shadows.card);
      expect(shadows.md).toBe(shadows.card);
    });

    it('raised 그림자는 웜 브라운 두 레이어여야 한다', () => {
      expect(shadows.lg.boxShadow).toEqual([
        {
          offsetX: 0,
          offsetY: 2,
          blurRadius: 4,
          spreadDistance: 0,
          color: 'rgba(93, 64, 55, 0.08)',
        },
        {
          offsetX: 0,
          offsetY: 16,
          blurRadius: 40,
          spreadDistance: 0,
          color: 'rgba(93, 64, 55, 0.12)',
        },
      ]);
      expect(shadows.xl).toBe(shadows.lg);
    });
  });

  describe('typography', () => {
    it('size 스케일이 정의되어야 한다', () => {
      expect(typography).toHaveProperty('size');
      expect(typography.size).toHaveProperty('sm');
      expect(typography.size).toHaveProperty('base');
      expect(typography.size).toHaveProperty('lg');
    });

    it('weight가 정의되어야 한다', () => {
      expect(typography).toHaveProperty('weight');
      expect(typography.weight).toHaveProperty('normal');
      expect(typography.weight).toHaveProperty('semibold');
      expect(typography.weight).toHaveProperty('bold');
    });

    it('lineHeight가 정의되어야 한다', () => {
      expect(typography).toHaveProperty('lineHeight');
      expect(typography.lineHeight).toHaveProperty('normal');
    });

    it('letterSpacing 토큰이 정의되어야 한다', () => {
      expect(typography).toHaveProperty('letterSpacing');
      expect(typography.letterSpacing).toHaveProperty('tighter');
      expect(typography.letterSpacing).toHaveProperty('tight');
      expect(typography.letterSpacing).toHaveProperty('normal');
      expect(typography.letterSpacing).toHaveProperty('wide');
      expect(typography.letterSpacing).toHaveProperty('wider');
      expect(typography.letterSpacing).toHaveProperty('widest');
    });

    it('letterSpacing tighter가 음수여야 한다', () => {
      expect(typography.letterSpacing.tighter).toBeLessThan(0);
      expect(typography.letterSpacing.tighter).toBe(-0.8);
    });

    it('letterSpacing normal이 0이어야 한다', () => {
      expect(typography.letterSpacing.normal).toBe(0);
    });
  });
});
