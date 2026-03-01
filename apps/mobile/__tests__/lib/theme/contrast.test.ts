/**
 * WCAG AA 대비율 검증 유틸리티 테스트
 */
import {
  getRelativeLuminance,
  getContrastRatio,
  meetsWcagAA,
  darkColors,
  lightColors,
  brand,
} from '../../../lib/theme';

describe('contrast utilities', () => {
  describe('getRelativeLuminance', () => {
    it('검정(#000000)의 휘도는 0', () => {
      expect(getRelativeLuminance('#000000')).toBeCloseTo(0, 4);
    });

    it('흰색(#FFFFFF)의 휘도는 1', () => {
      expect(getRelativeLuminance('#FFFFFF')).toBeCloseTo(1, 4);
    });

    it('중간 회색의 휘도는 0~1 사이', () => {
      const lum = getRelativeLuminance('#808080');
      expect(lum).toBeGreaterThan(0);
      expect(lum).toBeLessThan(1);
    });

    it('3자리 hex 지원 (#RGB)', () => {
      const lum3 = getRelativeLuminance('#fff');
      const lum6 = getRelativeLuminance('#FFFFFF');
      expect(lum3).toBeCloseTo(lum6, 4);
    });
  });

  describe('getContrastRatio', () => {
    it('검정/흰색 대비율은 21:1', () => {
      expect(getContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    });

    it('동일 색상 대비율은 1:1', () => {
      expect(getContrastRatio('#808080', '#808080')).toBeCloseTo(1, 0);
    });

    it('순서 무관 (대칭)', () => {
      const ratio1 = getContrastRatio('#FF0000', '#0000FF');
      const ratio2 = getContrastRatio('#0000FF', '#FF0000');
      expect(ratio1).toBeCloseTo(ratio2, 4);
    });
  });

  describe('meetsWcagAA', () => {
    it('검정/흰색은 모든 레벨 통과', () => {
      expect(meetsWcagAA('#000000', '#FFFFFF', 'normal')).toBe(true);
      expect(meetsWcagAA('#000000', '#FFFFFF', 'large')).toBe(true);
      expect(meetsWcagAA('#000000', '#FFFFFF', 'ui')).toBe(true);
    });

    it('동일 색상은 모든 레벨 실패', () => {
      expect(meetsWcagAA('#808080', '#808080', 'normal')).toBe(false);
    });

    it('기본 레벨은 normal', () => {
      // 대비율 ~3.5:1 → normal 실패, large 통과
      const pass = meetsWcagAA('#767676', '#FFFFFF');
      // #767676 on white = ~4.54:1 → normal 통과
      expect(pass).toBe(true);
    });
  });

  describe('다크모드 토큰 WCAG AA 검증', () => {
    it('foreground on background — AA normal 통과', () => {
      expect(
        meetsWcagAA(darkColors.foreground, darkColors.background, 'normal')
      ).toBe(true);
    });

    it('foreground on card — AA normal 통과', () => {
      expect(
        meetsWcagAA(darkColors.foreground, darkColors.card, 'normal')
      ).toBe(true);
    });

    it('mutedForeground on card — AA normal 통과', () => {
      const ratio = getContrastRatio(darkColors.mutedForeground, darkColors.card);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(
        meetsWcagAA(darkColors.mutedForeground, darkColors.card, 'normal')
      ).toBe(true);
    });

    it('mutedForeground on background — AA normal 통과', () => {
      expect(
        meetsWcagAA(darkColors.mutedForeground, darkColors.background, 'normal')
      ).toBe(true);
    });

    it('mutedForeground on muted — AA normal 통과', () => {
      expect(
        meetsWcagAA(darkColors.mutedForeground, darkColors.muted, 'normal')
      ).toBe(true);
    });

    it('cardForeground on card — AA normal 통과', () => {
      expect(
        meetsWcagAA(darkColors.cardForeground, darkColors.card, 'normal')
      ).toBe(true);
    });

    it('destructive on card — AA large 통과', () => {
      expect(
        meetsWcagAA(darkColors.destructive, darkColors.card, 'large')
      ).toBe(true);
    });
  });

  describe('라이트모드 토큰 WCAG AA 검증', () => {
    it('foreground on background — AA normal 통과', () => {
      expect(
        meetsWcagAA(lightColors.foreground, lightColors.background, 'normal')
      ).toBe(true);
    });

    it('mutedForeground on card — AA normal 통과', () => {
      expect(
        meetsWcagAA(lightColors.mutedForeground, lightColors.card, 'normal')
      ).toBe(true);
    });

    it('foreground on card — AA normal 통과', () => {
      expect(
        meetsWcagAA(lightColors.foreground, lightColors.card, 'normal')
      ).toBe(true);
    });
  });

  describe('브랜드 색상 대비 검증', () => {
    it('brand.primaryForeground on brand.primary — AA large 통과', () => {
      expect(
        meetsWcagAA(brand.primaryForeground, brand.primary, 'large')
      ).toBe(true);
    });
  });
});
