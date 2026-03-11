/**
 * 한국 브랜드 사이즈 차트 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  KOREAN_BRAND_SIZE_CHARTS,
  getKoreanBrandChart,
  searchKoreanBrands,
  getKoreanBrandSizeMappings,
  getBrandFitAdjustment,
  getAllKoreanBrands,
  FIT_TENDENCY_INFO,
} from '@/lib/smart-matching/korean-brands';

describe('한국 브랜드 사이즈 차트', () => {
  describe('KOREAN_BRAND_SIZE_CHARTS', () => {
    it('20개 이상의 브랜드가 등록되어 있다', () => {
      expect(KOREAN_BRAND_SIZE_CHARTS.length).toBeGreaterThanOrEqual(20);
    });

    it('모든 브랜드에 필수 필드가 존재한다', () => {
      for (const brand of KOREAN_BRAND_SIZE_CHARTS) {
        expect(brand.brandId).toBeTruthy();
        expect(brand.brandName).toBeTruthy();
        expect(['slim', 'regular', 'oversized']).toContain(brand.fitTendency);
        expect(Object.keys(brand.categories).length).toBeGreaterThan(0);
      }
    });

    it('브랜드 ID가 고유하다', () => {
      const ids = KOREAN_BRAND_SIZE_CHARTS.map((b) => b.brandId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('모든 사이즈 매핑에 최소 S/M/L이 포함된다', () => {
      for (const brand of KOREAN_BRAND_SIZE_CHARTS) {
        for (const mappings of Object.values(brand.categories)) {
          if (!mappings) continue;
          const labels = mappings.map((m) => m.label);
          expect(labels).toContain('S');
          expect(labels).toContain('M');
          expect(labels).toContain('L');
        }
      }
    });
  });

  describe('getKoreanBrandChart', () => {
    it('존재하는 브랜드를 찾는다', () => {
      const result = getKoreanBrandChart('musinsa-standard');
      expect(result).toBeDefined();
      expect(result?.brandName).toBe('무신사 스탠다드');
    });

    it('존재하지 않는 브랜드는 undefined를 반환한다', () => {
      expect(getKoreanBrandChart('nonexistent')).toBeUndefined();
    });
  });

  describe('searchKoreanBrands', () => {
    it('한글 이름으로 검색한다', () => {
      const results = searchKoreanBrands('무신사');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].brandName).toContain('무신사');
    });

    it('영문 ID로 검색한다', () => {
      const results = searchKoreanBrands('covernat');
      expect(results.length).toBe(1);
    });

    it('부분 일치로 검색한다', () => {
      const results = searchKoreanBrands('스타일');
      expect(results.length).toBeGreaterThan(0);
    });

    it('결과가 없으면 빈 배열을 반환한다', () => {
      expect(searchKoreanBrands('zzzzz')).toEqual([]);
    });
  });

  describe('getKoreanBrandSizeMappings', () => {
    it('존재하는 카테고리의 매핑을 반환한다', () => {
      const mappings = getKoreanBrandSizeMappings('topten', 'top');
      expect(mappings).not.toBeNull();
      expect(mappings!.length).toBeGreaterThan(0);
    });

    it('브랜드가 없으면 null을 반환한다', () => {
      expect(getKoreanBrandSizeMappings('nonexistent', 'top')).toBeNull();
    });

    it('카테고리가 없으면 null을 반환한다', () => {
      expect(getKoreanBrandSizeMappings('kirsh', 'bottom')).toBeNull();
    });
  });

  describe('getBrandFitAdjustment', () => {
    it('슬림핏 브랜드는 -1을 반환한다', () => {
      expect(getBrandFitAdjustment('chuu')).toBe(-1);
    });

    it('레귤러핏 브랜드는 0을 반환한다', () => {
      expect(getBrandFitAdjustment('topten')).toBe(0);
    });

    it('오버사이즈 브랜드는 1을 반환한다', () => {
      expect(getBrandFitAdjustment('covernat')).toBe(1);
    });

    it('존재하지 않는 브랜드는 0을 반환한다', () => {
      expect(getBrandFitAdjustment('nonexistent')).toBe(0);
    });
  });

  describe('getAllKoreanBrands', () => {
    it('전체 브랜드 목록을 반환한다', () => {
      const brands = getAllKoreanBrands();
      expect(brands.length).toBe(KOREAN_BRAND_SIZE_CHARTS.length);
      expect(brands[0]).toHaveProperty('brandId');
      expect(brands[0]).toHaveProperty('brandName');
      expect(brands[0]).toHaveProperty('fitTendency');
    });
  });

  describe('FIT_TENDENCY_INFO', () => {
    it('3가지 핏 경향 정보가 정의되어 있다', () => {
      expect(Object.keys(FIT_TENDENCY_INFO)).toHaveLength(3);
      expect(FIT_TENDENCY_INFO.slim).toBeDefined();
      expect(FIT_TENDENCY_INFO.regular).toBeDefined();
      expect(FIT_TENDENCY_INFO.oversized).toBeDefined();
    });

    it('각 핏 정보에 라벨과 설명이 있다', () => {
      for (const info of Object.values(FIT_TENDENCY_INFO)) {
        expect(info.label).toBeTruthy();
        expect(info.description).toBeTruthy();
        expect(typeof info.adjustment).toBe('number');
      }
    });
  });
});
