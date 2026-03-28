/**
 * P1-2 테스트: overlay-tokens 디자인 토큰 및 점수→스타일 매핑
 */
import { describe, it, expect } from 'vitest';
import {
  OVERLAY_TOKENS,
  SCORE_COLORS,
  getZoneStyle,
} from '@/components/analysis/overlay/internal/overlay-tokens';
import type { OverlayMode } from '@/components/analysis/overlay/internal/overlay-tokens';

describe('OVERLAY_TOKENS', () => {
  it('should have required color tokens', () => {
    expect(OVERLAY_TOKENS.strengthColor).toContain('rgba');
    expect(OVERLAY_TOKENS.weaknessColor).toContain('rgba');
    expect(OVERLAY_TOKENS.neutralColor).toContain('rgba');
  });

  it('should have line width definitions', () => {
    expect(OVERLAY_TOKENS.lineWidth.active).toBeGreaterThan(0);
    expect(OVERLAY_TOKENS.lineWidth.inactive).toBeGreaterThan(0);
    expect(OVERLAY_TOKENS.lineWidth.active).toBeGreaterThan(OVERLAY_TOKENS.lineWidth.inactive);
  });
});

describe('SCORE_COLORS', () => {
  it('should have all five tiers', () => {
    expect(Object.keys(SCORE_COLORS)).toEqual(['critical', 'poor', 'fair', 'good', 'excellent']);
  });

  it('should have fill/stroke/label for each tier', () => {
    for (const tier of Object.values(SCORE_COLORS)) {
      expect(tier.fill).toContain('rgba');
      expect(tier.stroke).toMatch(/^#[0-9A-F]{6}$/i);
      expect(tier.label).toBeTruthy();
    }
  });
});

describe('getZoneStyle', () => {
  describe('full mode', () => {
    const mode: OverlayMode = 'full';

    it('should return critical style for score 0-30', () => {
      const style = getZoneStyle(15, mode);
      expect(style.fill).toBe(SCORE_COLORS.critical.fill);
      expect(style.stroke).toBe(SCORE_COLORS.critical.stroke);
    });

    it('should return poor style for score 31-50', () => {
      const style = getZoneStyle(40, mode);
      expect(style.fill).toBe(SCORE_COLORS.poor.fill);
    });

    it('should return fair style for score 51-65', () => {
      const style = getZoneStyle(60, mode);
      expect(style.fill).toBe(SCORE_COLORS.fair.fill);
    });

    it('should return good style for score 66-80', () => {
      const style = getZoneStyle(75, mode);
      expect(style.fill).toBe(SCORE_COLORS.good.fill);
      expect(style.icon).toBe(OVERLAY_TOKENS.strengthIcon);
    });

    it('should return excellent style for score 81-100', () => {
      const style = getZoneStyle(90, mode);
      expect(style.fill).toBe(SCORE_COLORS.excellent.fill);
      expect(style.icon).toBe(OVERLAY_TOKENS.strengthIcon);
    });
  });

  describe('strength mode', () => {
    const mode: OverlayMode = 'strength';

    it('should show neutral for low scores', () => {
      const style = getZoneStyle(20, mode);
      expect(style.fill).toBe(OVERLAY_TOKENS.neutralColor);
      expect(style.stroke).toBe(OVERLAY_TOKENS.neutralBorder);
      expect(style.strokeDasharray).toBe('4 2');
    });

    it('should show neutral for fair scores', () => {
      const style = getZoneStyle(60, mode);
      expect(style.fill).toBe(OVERLAY_TOKENS.neutralColor);
    });

    it('should highlight good scores', () => {
      const style = getZoneStyle(75, mode);
      expect(style.fill).toBe(SCORE_COLORS.good.fill);
      expect(style.strokeDasharray).toBeUndefined();
    });

    it('should highlight excellent scores', () => {
      const style = getZoneStyle(95, mode);
      expect(style.fill).toBe(SCORE_COLORS.excellent.fill);
    });
  });

  describe('edge cases', () => {
    it('should clamp score below 0', () => {
      const style = getZoneStyle(-10, 'full');
      expect(style.fill).toBe(SCORE_COLORS.critical.fill);
    });

    it('should clamp score above 100', () => {
      const style = getZoneStyle(150, 'full');
      expect(style.fill).toBe(SCORE_COLORS.excellent.fill);
    });

    it('should handle boundary score 30', () => {
      const style = getZoneStyle(30, 'full');
      expect(style.fill).toBe(SCORE_COLORS.critical.fill);
    });

    it('should handle boundary score 31', () => {
      const style = getZoneStyle(31, 'full');
      expect(style.fill).toBe(SCORE_COLORS.poor.fill);
    });
  });
});
