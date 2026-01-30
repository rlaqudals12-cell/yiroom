/**
 * drape-palette.ts 테스트
 * @description 광학적 드레이프 팔레트 모듈 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  SPRING_PALETTE,
  SUMMER_PALETTE,
  AUTUMN_PALETTE,
  WINTER_PALETTE,
  FULL_DRAPE_PALETTE,
  calculateDrapeInteraction,
  analyzeWithSeason,
  analyzeFullPaletteOptical,
  getSeasonPalette,
  calculateMetalScore,
  recommendMetal,
  extractSkinToneFromImage,
  toSimpleDrapeColor,
  paletteToHexArray,
  METAL_OPTICAL_PROPERTIES,
  type SkinToneCharacteristics,
} from '@/lib/analysis/drape-palette';

describe('drape-palette', () => {
  // ============================================
  // 팔레트 데이터 검증
  // ============================================

  describe('시즌별 팔레트', () => {
    it('각 시즌 팔레트는 8개 색상을 포함해야 함', () => {
      expect(SPRING_PALETTE).toHaveLength(8);
      expect(SUMMER_PALETTE).toHaveLength(8);
      expect(AUTUMN_PALETTE).toHaveLength(8);
      expect(WINTER_PALETTE).toHaveLength(8);
    });

    it('전체 팔레트는 32개 색상을 포함해야 함', () => {
      expect(FULL_DRAPE_PALETTE).toHaveLength(32);
    });

    it('각 색상은 필수 광학 속성을 가져야 함', () => {
      FULL_DRAPE_PALETTE.forEach((drape) => {
        expect(drape.rgb).toBeDefined();
        expect(drape.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(drape.name).toBeTruthy();
        expect(['spring', 'summer', 'autumn', 'winter']).toContain(drape.season);
        expect(drape.reflectance).toBeGreaterThanOrEqual(0);
        expect(drape.reflectance).toBeLessThanOrEqual(1);
        expect(drape.warmth).toBeGreaterThanOrEqual(-1);
        expect(drape.warmth).toBeLessThanOrEqual(1);
        expect(drape.saturationBoost).toBeGreaterThanOrEqual(-0.5);
        expect(drape.saturationBoost).toBeLessThanOrEqual(0.6);
        expect(drape.muteness).toBeGreaterThanOrEqual(0);
        expect(drape.muteness).toBeLessThanOrEqual(1);
      });
    });

    it('봄 팔레트는 높은 웜톤과 반사율을 가져야 함', () => {
      const avgWarmth =
        SPRING_PALETTE.reduce((sum, d) => sum + d.warmth, 0) / SPRING_PALETTE.length;
      const avgReflectance =
        SPRING_PALETTE.reduce((sum, d) => sum + d.reflectance, 0) / SPRING_PALETTE.length;

      expect(avgWarmth).toBeGreaterThan(0.3); // 웜톤
      expect(avgReflectance).toBeGreaterThan(0.7); // 밝은 색상
    });

    it('여름 팔레트는 쿨톤과 높은 뮤트를 가져야 함', () => {
      const avgWarmth =
        SUMMER_PALETTE.reduce((sum, d) => sum + d.warmth, 0) / SUMMER_PALETTE.length;
      const avgMuteness =
        SUMMER_PALETTE.reduce((sum, d) => sum + d.muteness, 0) / SUMMER_PALETTE.length;

      expect(avgWarmth).toBeLessThan(0); // 쿨톤
      expect(avgMuteness).toBeGreaterThan(0.4); // 뮤트
    });

    it('가을 팔레트는 웜톤과 낮은 반사율을 가져야 함', () => {
      const avgWarmth =
        AUTUMN_PALETTE.reduce((sum, d) => sum + d.warmth, 0) / AUTUMN_PALETTE.length;
      const avgReflectance =
        AUTUMN_PALETTE.reduce((sum, d) => sum + d.reflectance, 0) / AUTUMN_PALETTE.length;

      expect(avgWarmth).toBeGreaterThan(0.3); // 웜톤
      expect(avgReflectance).toBeLessThan(0.6); // 깊은 색상
    });

    it('겨울 팔레트는 낮은 뮤트를 가져야 함 (선명한 색상)', () => {
      const avgMuteness =
        WINTER_PALETTE.reduce((sum, d) => sum + d.muteness, 0) / WINTER_PALETTE.length;
      expect(avgMuteness).toBeLessThan(0.15); // 비비드
    });
  });

  // ============================================
  // 드레이프 상호작용 계산
  // ============================================

  describe('calculateDrapeInteraction', () => {
    const warmSkin: SkinToneCharacteristics = {
      brightness: 0.65,
      warmth: 0.5,
      saturation: 0.35,
      redness: 0.3,
      melanin: 0.4,
    };

    const coolSkin: SkinToneCharacteristics = {
      brightness: 0.6,
      warmth: -0.3,
      saturation: 0.3,
      redness: 0.4,
      melanin: 0.3,
    };

    it('웜톤 피부에 봄 색상이 합리적인 조화 점수를 받아야 함', () => {
      const springDrape = SPRING_PALETTE[0]; // 피치
      const result = calculateDrapeInteraction(warmSkin, springDrape);

      // 광학적 계산에서 다양한 요소가 반영되므로 50점 이상이면 합리적
      expect(result.harmonyScore).toBeGreaterThanOrEqual(50);
    });

    it('쿨톤 피부에 여름 색상이 합리적인 조화 점수를 받아야 함', () => {
      const summerDrape = SUMMER_PALETTE[0]; // 라벤더
      const result = calculateDrapeInteraction(coolSkin, summerDrape);

      // 쿨톤 매칭은 되지만 홍조(redness=0.4)로 인해 페널티가 있을 수 있음
      expect(result.harmonyScore).toBeGreaterThanOrEqual(40);
    });

    it('웜톤 피부에 쿨톤 드레이프는 낮은 점수를 받아야 함', () => {
      const winterDrape = WINTER_PALETTE.find((d) => d.warmth < -0.5)!; // 네이비
      const result = calculateDrapeInteraction(warmSkin, winterDrape);

      expect(result.harmonyScore).toBeLessThan(70);
    });

    it('결과에 밝기 효과와 생기 효과가 포함되어야 함', () => {
      const drape = SPRING_PALETTE[0];
      const result = calculateDrapeInteraction(warmSkin, drape);

      expect(result.brightnessEffect).toBeDefined();
      expect(result.vitalityEffect).toBeDefined();
      expect(result.description).toBeTruthy();
    });

    it('홍조가 높은 피부에 채도 높은 드레이프는 생기 효과가 낮아야 함', () => {
      const reddishSkin: SkinToneCharacteristics = {
        ...warmSkin,
        redness: 0.7, // 높은 홍조
      };

      const vividDrape = SPRING_PALETTE.find((d) => d.saturationBoost > 0.3)!;
      const result = calculateDrapeInteraction(reddishSkin, vividDrape);

      // 홍조가 높으면 채도 부스트에 페널티
      expect(result.vitalityEffect).toBeLessThan(30);
    });
  });

  // ============================================
  // 시즌 분석
  // ============================================

  describe('analyzeWithSeason', () => {
    it('특정 시즌 팔레트로 분석 결과를 반환해야 함', () => {
      const skin: SkinToneCharacteristics = {
        brightness: 0.6,
        warmth: 0.4,
        saturation: 0.3,
        redness: 0.25,
        melanin: 0.35,
      };

      const results = analyzeWithSeason(skin, 'spring');

      expect(results).toHaveLength(8);
      expect(results[0].harmonyScore).toBeGreaterThanOrEqual(results[7].harmonyScore);
      results.forEach((r) => expect(r.drape.season).toBe('spring'));
    });
  });

  describe('analyzeFullPaletteOptical', () => {
    it('전체 팔레트 분석 후 시즌 추천을 반환해야 함', () => {
      const warmSkin: SkinToneCharacteristics = {
        brightness: 0.65,
        warmth: 0.6,
        saturation: 0.35,
        redness: 0.2,
        melanin: 0.3,
      };

      const result = analyzeFullPaletteOptical(warmSkin);

      expect(['spring', 'summer', 'autumn', 'winter']).toContain(result.recommendedSeason);
      expect(result.seasonScores).toHaveProperty('spring');
      expect(result.seasonScores).toHaveProperty('summer');
      expect(result.seasonScores).toHaveProperty('autumn');
      expect(result.seasonScores).toHaveProperty('winter');
      expect(result.topColors).toHaveLength(8);
      expect(result.avoidColors).toHaveLength(4);
    });

    it('웜톤 피부는 봄/가을 시즌이 추천되어야 함', () => {
      const warmSkin: SkinToneCharacteristics = {
        brightness: 0.65,
        warmth: 0.7,
        saturation: 0.35,
        redness: 0.2,
        melanin: 0.35,
      };

      const result = analyzeFullPaletteOptical(warmSkin);

      // 웜톤은 봄이나 가을 추천
      expect(['spring', 'autumn']).toContain(result.recommendedSeason);
    });

    it('쿨톤 피부는 여름/겨울 시즌이 추천되어야 함', () => {
      const coolSkin: SkinToneCharacteristics = {
        brightness: 0.55,
        warmth: -0.5,
        saturation: 0.3,
        redness: 0.35,
        melanin: 0.25,
      };

      const result = analyzeFullPaletteOptical(coolSkin);

      // 쿨톤은 여름이나 겨울 추천
      expect(['summer', 'winter']).toContain(result.recommendedSeason);
    });
  });

  // ============================================
  // 금속 테스트
  // ============================================

  describe('금속 테스트', () => {
    it('METAL_OPTICAL_PROPERTIES가 올바른 속성을 가져야 함', () => {
      expect(METAL_OPTICAL_PROPERTIES.gold.warmth).toBeGreaterThan(0);
      expect(METAL_OPTICAL_PROPERTIES.silver.warmth).toBeLessThan(0);
    });

    it('calculateMetalScore가 0-100 범위의 점수를 반환해야 함', () => {
      const skin: SkinToneCharacteristics = {
        brightness: 0.6,
        warmth: 0.3,
        saturation: 0.3,
        redness: 0.25,
        melanin: 0.35,
      };

      const goldScore = calculateMetalScore(skin, 'gold');
      const silverScore = calculateMetalScore(skin, 'silver');

      expect(goldScore).toBeGreaterThanOrEqual(0);
      expect(goldScore).toBeLessThanOrEqual(100);
      expect(silverScore).toBeGreaterThanOrEqual(0);
      expect(silverScore).toBeLessThanOrEqual(100);
    });

    it('웜톤 피부에 골드가 추천되어야 함', () => {
      const warmSkin: SkinToneCharacteristics = {
        brightness: 0.6,
        warmth: 0.6,
        saturation: 0.3,
        redness: 0.2,
        melanin: 0.35,
      };

      const result = recommendMetal(warmSkin);

      expect(result.recommended).toBe('gold');
      expect(result.goldScore).toBeGreaterThan(result.silverScore);
      expect(result.explanation).toBeTruthy();
    });

    it('쿨톤 피부에 실버가 추천되어야 함', () => {
      const coolSkin: SkinToneCharacteristics = {
        brightness: 0.55,
        warmth: -0.5,
        saturation: 0.3,
        redness: 0.35,
        melanin: 0.25,
      };

      const result = recommendMetal(coolSkin);

      expect(result.recommended).toBe('silver');
      expect(result.silverScore).toBeGreaterThan(result.goldScore);
    });
  });

  // ============================================
  // 유틸리티 함수
  // ============================================

  describe('getSeasonPalette', () => {
    it('시즌별 팔레트를 올바르게 반환해야 함', () => {
      expect(getSeasonPalette('spring')).toBe(SPRING_PALETTE);
      expect(getSeasonPalette('summer')).toBe(SUMMER_PALETTE);
      expect(getSeasonPalette('autumn')).toBe(AUTUMN_PALETTE);
      expect(getSeasonPalette('winter')).toBe(WINTER_PALETTE);
    });
  });

  describe('toSimpleDrapeColor', () => {
    it('DrapeOpticalProperties를 DrapeColor로 변환해야 함', () => {
      const drape = SPRING_PALETTE[0];
      const simple = toSimpleDrapeColor(drape);

      expect(simple.hex).toBe(drape.hex);
      expect(simple.name).toBe(drape.name);
      expect(simple.season).toBe(drape.season);
      expect(simple).not.toHaveProperty('reflectance');
      expect(simple).not.toHaveProperty('warmth');
    });
  });

  describe('paletteToHexArray', () => {
    it('팔레트를 HEX 배열로 변환해야 함', () => {
      const hexArray = paletteToHexArray(SPRING_PALETTE);

      expect(hexArray).toHaveLength(8);
      hexArray.forEach((hex) => {
        expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('extractSkinToneFromImage', () => {
    it('빈 마스크에 대해 기본값을 반환해야 함', () => {
      // 빈 이미지 데이터
      const imageData = {
        data: new Uint8ClampedArray(16), // 2x2 픽셀
        width: 2,
        height: 2,
        colorSpace: 'srgb' as PredefinedColorSpace,
      };
      const emptyMask = new Uint8Array(4); // 모두 0

      const result = extractSkinToneFromImage(imageData, emptyMask);

      expect(result.brightness).toBe(0.5);
      expect(result.warmth).toBe(0);
      expect(result.saturation).toBe(0.3);
    });

    it('피부 영역에서 특성을 추출해야 함', () => {
      // 따뜻한 피부톤 시뮬레이션 (R=200, G=160, B=140)
      const width = 2;
      const height = 2;
      const data = new Uint8ClampedArray(16);
      for (let i = 0; i < 4; i++) {
        data[i * 4] = 200; // R
        data[i * 4 + 1] = 160; // G
        data[i * 4 + 2] = 140; // B
        data[i * 4 + 3] = 255; // A
      }

      const imageData = {
        data,
        width,
        height,
        colorSpace: 'srgb' as PredefinedColorSpace,
      };
      const fullMask = new Uint8Array(4).fill(255);

      const result = extractSkinToneFromImage(imageData, fullMask, 0.4, 0.3);

      expect(result.brightness).toBeGreaterThan(0.5);
      expect(result.warmth).toBeGreaterThan(0); // 따뜻한 톤
      expect(result.melanin).toBe(0.4);
      expect(result.redness).toBe(0.3);
    });
  });
});
