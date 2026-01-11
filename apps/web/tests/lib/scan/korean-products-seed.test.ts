/**
 * 한국 제품 시드 데이터 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  KOREAN_PRODUCTS_SEED,
  findProductByBarcode,
  getProductsByBrand,
  getProductsByCategory,
  searchProductsByIngredient,
  SEED_STATS,
} from '@/lib/scan/korean-products-seed';

describe('KOREAN_PRODUCTS_SEED', () => {
  describe('시드 데이터 무결성', () => {
    it('30개 이상의 제품이 있어야 함', () => {
      expect(KOREAN_PRODUCTS_SEED.length).toBeGreaterThanOrEqual(30);
    });

    it('모든 제품에 필수 필드가 있어야 함', () => {
      KOREAN_PRODUCTS_SEED.forEach((product) => {
        expect(product.id).toBeDefined();
        expect(product.barcode).toBeDefined();
        expect(product.name).toBeDefined();
        expect(product.brand).toBeDefined();
        expect(product.category).toBeDefined();
        expect(product.dataSource).toBe('manual');
        expect(product.verified).toBe(true);
      });
    });

    it('모든 제품에 성분 목록이 있어야 함', () => {
      KOREAN_PRODUCTS_SEED.forEach((product) => {
        expect(product.ingredients).toBeDefined();
        expect(product.ingredients!.length).toBeGreaterThan(0);
      });
    });

    it('모든 바코드가 유니크해야 함', () => {
      const barcodes = KOREAN_PRODUCTS_SEED.map((p) => p.barcode);
      const uniqueBarcodes = new Set(barcodes);
      expect(uniqueBarcodes.size).toBe(barcodes.length);
    });

    it('모든 ID가 유니크해야 함', () => {
      const ids = KOREAN_PRODUCTS_SEED.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('카테고리별 분류', () => {
    it('스킨케어 제품이 가장 많아야 함', () => {
      const skincare = KOREAN_PRODUCTS_SEED.filter((p) => p.category === 'skincare');
      expect(skincare.length).toBeGreaterThan(10);
    });

    it('모든 카테고리가 유효해야 함', () => {
      const validCategories = [
        'skincare',
        'makeup',
        'suncare',
        'haircare',
        'bodycare',
        'fragrance',
        'other',
      ];
      KOREAN_PRODUCTS_SEED.forEach((product) => {
        expect(validCategories).toContain(product.category);
      });
    });
  });

  describe('브랜드별 분류', () => {
    it('다양한 브랜드가 포함되어야 함', () => {
      const brands = new Set(KOREAN_PRODUCTS_SEED.map((p) => p.brand));
      expect(brands.size).toBeGreaterThanOrEqual(10);
    });

    it('인기 K-뷰티 브랜드가 포함되어야 함', () => {
      const brands = KOREAN_PRODUCTS_SEED.map((p) => p.brand);
      expect(brands).toContain('COSRX');
      expect(brands).toContain('SOME BY MI');
      expect(brands.some((b) => b.includes('Klairs'))).toBe(true);
    });
  });
});

describe('findProductByBarcode', () => {
  it('존재하는 바코드로 제품 찾기', () => {
    const product = findProductByBarcode('8809598453234');
    expect(product).toBeDefined();
    expect(product?.brand).toBe('SOME BY MI');
  });

  it('존재하지 않는 바코드는 undefined 반환', () => {
    const product = findProductByBarcode('0000000000000');
    expect(product).toBeUndefined();
  });

  it('COSRX 스네일 에센스 찾기', () => {
    const product = findProductByBarcode('8809530069233');
    expect(product).toBeDefined();
    expect(product?.brand).toBe('COSRX');
    expect(product?.name).toContain('Snail');
  });
});

describe('getProductsByBrand', () => {
  it('브랜드별 그룹화', () => {
    const grouped = getProductsByBrand();

    expect(grouped['COSRX']).toBeDefined();
    expect(grouped['COSRX'].length).toBeGreaterThanOrEqual(2);
    expect(grouped['SOME BY MI']).toBeDefined();
  });

  it('모든 제품이 그룹에 포함되어야 함', () => {
    const grouped = getProductsByBrand();
    const totalInGroups = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
    expect(totalInGroups).toBe(KOREAN_PRODUCTS_SEED.length);
  });
});

describe('getProductsByCategory', () => {
  it('카테고리별 그룹화', () => {
    const grouped = getProductsByCategory();

    expect(grouped['skincare']).toBeDefined();
    expect(grouped['skincare'].length).toBeGreaterThan(0);
    expect(grouped['makeup']).toBeDefined();
  });

  it('모든 제품이 그룹에 포함되어야 함', () => {
    const grouped = getProductsByCategory();
    const totalInGroups = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
    expect(totalInGroups).toBe(KOREAN_PRODUCTS_SEED.length);
  });
});

describe('searchProductsByIngredient', () => {
  it('INCI 이름으로 검색', () => {
    const results = searchProductsByIngredient('NIACINAMIDE');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((product) => {
      const hasIngredient = product.ingredients?.some((ing) =>
        ing.inciName.includes('NIACINAMIDE')
      );
      expect(hasIngredient).toBe(true);
    });
  });

  it('한글 성분명으로 검색', () => {
    const results = searchProductsByIngredient('히알루론산');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((product) => {
      const hasIngredient = product.ingredients?.some((ing) => ing.nameKo?.includes('히알루론산'));
      expect(hasIngredient).toBe(true);
    });
  });

  it('존재하지 않는 성분은 빈 배열 반환', () => {
    const results = searchProductsByIngredient('NOTEXISTINGREDIENT');
    expect(results).toHaveLength(0);
  });

  it('대소문자 구분 없이 검색', () => {
    const upperResults = searchProductsByIngredient('WATER');
    const lowerResults = searchProductsByIngredient('water');
    expect(upperResults.length).toBe(lowerResults.length);
  });
});

describe('SEED_STATS', () => {
  it('통계 정보 정확성', () => {
    expect(SEED_STATS.total).toBe(KOREAN_PRODUCTS_SEED.length);

    const actualSkincare = KOREAN_PRODUCTS_SEED.filter((p) => p.category === 'skincare').length;
    const actualMakeup = KOREAN_PRODUCTS_SEED.filter((p) => p.category === 'makeup').length;
    const actualSuncare = KOREAN_PRODUCTS_SEED.filter((p) => p.category === 'suncare').length;
    const actualHaircare = KOREAN_PRODUCTS_SEED.filter((p) => p.category === 'haircare').length;

    expect(SEED_STATS.skincare).toBe(actualSkincare);
    expect(SEED_STATS.makeup).toBe(actualMakeup);
    expect(SEED_STATS.suncare).toBe(actualSuncare);
    expect(SEED_STATS.haircare).toBe(actualHaircare);
  });

  it('총합이 맞아야 함', () => {
    const sum = SEED_STATS.skincare + SEED_STATS.suncare + SEED_STATS.makeup + SEED_STATS.haircare;
    expect(sum).toBe(SEED_STATS.total);
  });
});

describe('성분 데이터 품질', () => {
  it('성분 순서가 정확해야 함', () => {
    KOREAN_PRODUCTS_SEED.forEach((product) => {
      const orders = product.ingredients?.map((ing) => ing.order) || [];
      for (let i = 0; i < orders.length; i++) {
        expect(orders[i]).toBe(i + 1);
      }
    });
  });

  it('농도 값이 유효해야 함', () => {
    const validConcentrations = ['high', 'medium', 'low', undefined];
    KOREAN_PRODUCTS_SEED.forEach((product) => {
      product.ingredients?.forEach((ing) => {
        expect(validConcentrations).toContain(ing.concentration);
      });
    });
  });

  it('EWG 등급이 1-10 범위 내', () => {
    KOREAN_PRODUCTS_SEED.forEach((product) => {
      if (product.ewgGrade !== undefined) {
        expect(product.ewgGrade).toBeGreaterThanOrEqual(1);
        expect(product.ewgGrade).toBeLessThanOrEqual(10);
      }
    });
  });
});
