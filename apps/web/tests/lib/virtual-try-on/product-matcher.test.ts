import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  rgbToLab,
  calculateDeltaE,
  matchProductsByColor,
} from '@/lib/virtual-try-on/product-matcher';
import type { LabColor } from '@/lib/virtual-try-on/product-matcher';

// Supabase mock — getCosmeticProducts를 제어
vi.mock('@/lib/products/repositories/cosmetic', () => ({
  getCosmeticProducts: vi.fn().mockResolvedValue([]),
}));

import { getCosmeticProducts } from '@/lib/products/repositories/cosmetic';
const mockGetCosmeticProducts = vi.mocked(getCosmeticProducts);

// ================================================
// rgbToLab 변환 테스트
// ================================================

describe('rgbToLab - RGB → CIE Lab 변환', () => {
  it('흰색 (255,255,255) → L≈100, a≈0, b≈0', () => {
    const lab = rgbToLab(255, 255, 255);
    expect(lab.L).toBeCloseTo(100, 0);
    expect(lab.a).toBeCloseTo(0, 0);
    expect(lab.b).toBeCloseTo(0, 0);
  });

  it('검정색 (0,0,0) → L≈0, a≈0, b≈0', () => {
    const lab = rgbToLab(0, 0, 0);
    expect(lab.L).toBeCloseTo(0, 0);
    expect(lab.a).toBeCloseTo(0, 0);
    expect(lab.b).toBeCloseTo(0, 0);
  });

  it('빨강 (255,0,0) → L≈53, a≈80, b≈67', () => {
    // sRGB 빨강의 Lab 근사값
    const lab = rgbToLab(255, 0, 0);
    expect(lab.L).toBeCloseTo(53.2, 0);
    expect(lab.a).toBeCloseTo(80.1, 0);
    expect(lab.b).toBeCloseTo(67.2, 0);
  });

  it('초록 (0,128,0) → L≈46, a≈-51, b≈50', () => {
    const lab = rgbToLab(0, 128, 0);
    expect(lab.L).toBeCloseTo(46.2, 0);
    expect(lab.a).toBeCloseTo(-51.7, 0);
    expect(lab.b).toBeCloseTo(49.9, 0);
  });

  it('파랑 (0,0,255) → L≈32, a≈79, b≈-108', () => {
    const lab = rgbToLab(0, 0, 255);
    expect(lab.L).toBeCloseTo(32.3, 0);
    expect(lab.a).toBeCloseTo(79.2, 0);
    expect(lab.b).toBeCloseTo(-107.9, 0);
  });

  it('회색 (128,128,128) → L≈54, a≈0, b≈0', () => {
    const lab = rgbToLab(128, 128, 128);
    expect(lab.L).toBeCloseTo(53.6, 0);
    expect(lab.a).toBeCloseTo(0, 0);
    expect(lab.b).toBeCloseTo(0, 0);
  });

  it('반환 객체에 L, a, b 키 존재', () => {
    const lab = rgbToLab(100, 50, 200);
    expect(lab).toHaveProperty('L');
    expect(lab).toHaveProperty('a');
    expect(lab).toHaveProperty('b');
    expect(typeof lab.L).toBe('number');
    expect(typeof lab.a).toBe('number');
    expect(typeof lab.b).toBe('number');
  });
});

// ================================================
// calculateDeltaE 테스트
// ================================================

describe('calculateDeltaE - CIE76 색차 계산', () => {
  it('동일 색상 → Delta-E = 0', () => {
    const lab: LabColor = { L: 50, a: 20, b: -10 };
    expect(calculateDeltaE(lab, lab)).toBe(0);
  });

  it('다른 색상 → Delta-E > 0', () => {
    const lab1: LabColor = { L: 50, a: 20, b: 10 };
    const lab2: LabColor = { L: 60, a: 30, b: 20 };
    const deltaE = calculateDeltaE(lab1, lab2);
    expect(deltaE).toBeGreaterThan(0);
  });

  it('교환 법칙 성립 (deltaE(a,b) === deltaE(b,a))', () => {
    const lab1: LabColor = { L: 30, a: -10, b: 40 };
    const lab2: LabColor = { L: 70, a: 50, b: -20 };
    expect(calculateDeltaE(lab1, lab2)).toBeCloseTo(calculateDeltaE(lab2, lab1));
  });

  it('L만 다를 때 정확한 거리', () => {
    const lab1: LabColor = { L: 0, a: 0, b: 0 };
    const lab2: LabColor = { L: 10, a: 0, b: 0 };
    expect(calculateDeltaE(lab1, lab2)).toBeCloseTo(10);
  });

  it('a만 다를 때 정확한 거리', () => {
    const lab1: LabColor = { L: 50, a: 0, b: 0 };
    const lab2: LabColor = { L: 50, a: 30, b: 0 };
    expect(calculateDeltaE(lab1, lab2)).toBeCloseTo(30);
  });

  it('3차원 유클리드 거리 검증', () => {
    const lab1: LabColor = { L: 0, a: 0, b: 0 };
    const lab2: LabColor = { L: 3, a: 4, b: 0 };
    // sqrt(9 + 16 + 0) = 5
    expect(calculateDeltaE(lab1, lab2)).toBeCloseTo(5);
  });

  it('매우 유사한 색상 (Delta-E < 2.3 = JND)', () => {
    // 흰색과 거의 흰색
    const white = rgbToLab(255, 255, 255);
    const nearWhite = rgbToLab(254, 255, 255);
    expect(calculateDeltaE(white, nearWhite)).toBeLessThan(2.3);
  });

  it('매우 다른 색상 (Delta-E > 50)', () => {
    // 흰색과 검정
    const white = rgbToLab(255, 255, 255);
    const black = rgbToLab(0, 0, 0);
    expect(calculateDeltaE(white, black)).toBeGreaterThan(50);
  });
});

// ================================================
// matchProductsByColor 통합 테스트
// ================================================

describe('matchProductsByColor - 색상 기반 제품 매칭', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const coralColor = { r: 255, g: 127, b: 80, a: 1 };

  it('lip 타입으로 요청하면 makeup 카테고리 제품 조회', async () => {
    mockGetCosmeticProducts.mockResolvedValue([]);

    await matchProductsByColor('lip', coralColor);

    // lip → subcategory: 'lip', 'lip-gloss', 'lip-liner'
    expect(mockGetCosmeticProducts).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'makeup', subcategory: 'lip' }),
      30
    );
  });

  it('제품 없을 때 빈 배열 반환', async () => {
    mockGetCosmeticProducts.mockResolvedValue([]);

    const result = await matchProductsByColor('blush', coralColor);

    expect(result).toEqual([]);
  });

  it('매칭된 제품에 필수 필드 포함', async () => {
    // lip은 3개 서브카테고리(lip, lip-gloss, lip-liner)를 조회
    // 첫 번째 호출만 제품 반환, 나머지는 빈 배열
    mockGetCosmeticProducts
      .mockResolvedValueOnce([createMockProduct('1', '코랄 립스틱', '브랜드A')])
      .mockResolvedValue([]);

    const result = await matchProductsByColor('lip', coralColor);

    expect(result.length).toBe(1);
    expect(result[0]).toMatchObject({
      productId: '1',
      name: '코랄 립스틱',
      brand: '브랜드A',
      matchScore: expect.any(Number),
      colorDeltaE: expect.any(Number),
    });
  });

  it('색상 유사도 높은 제품이 상위 정렬', async () => {
    // 코랄 색상(255,127,80)과 유사한 이름의 제품이 높은 점수
    mockGetCosmeticProducts
      .mockResolvedValueOnce([
        createMockProduct('1', '스모키 립', '브랜드A'), // 회색 계열 → 코랄과 거리 멈
        createMockProduct('2', '코랄 틴트', '브랜드B'), // 코랄 → 거리 가까움
      ])
      .mockResolvedValue([]);

    const result = await matchProductsByColor('lip', coralColor);

    expect(result.length).toBe(2);
    // 코랄 제품이 더 높은 점수
    const coralProduct = result.find((p) => p.name === '코랄 틴트');
    const smokyProduct = result.find((p) => p.name === '스모키 립');
    expect(coralProduct!.matchScore).toBeGreaterThan(smokyProduct!.matchScore);
  });

  it('시즌 보정 시 매칭 점수 증가', async () => {
    // personalColorSeasons에 Spring 포함된 제품
    const productWithSeason = createMockProduct('1', '코랄 립', '브랜드A');
    productWithSeason.personalColorSeasons = ['Spring'];

    const productWithoutSeason = createMockProduct('2', '코랄 틴트', '브랜드B');
    productWithoutSeason.personalColorSeasons = ['Winter'];

    mockGetCosmeticProducts
      .mockResolvedValueOnce([productWithSeason, productWithoutSeason])
      .mockResolvedValue([]);

    const result = await matchProductsByColor('lip', coralColor, 'spring');

    const withSeason = result.find((p) => p.productId === '1');
    const withoutSeason = result.find((p) => p.productId === '2');
    // 시즌 보정 +15
    expect(withSeason!.matchScore).toBeGreaterThan(withoutSeason!.matchScore);
  });

  it('limit 파라미터로 반환 수 제한', async () => {
    const products = Array.from({ length: 10 }, (_, i) =>
      createMockProduct(`${i}`, `제품${i}`, `브랜드${i}`)
    );
    mockGetCosmeticProducts.mockResolvedValueOnce(products).mockResolvedValue([]);

    const result = await matchProductsByColor('lip', coralColor, undefined, 3);

    expect(result.length).toBe(3);
  });

  it('기본 limit은 5', async () => {
    const products = Array.from({ length: 10 }, (_, i) =>
      createMockProduct(`${i}`, `제품${i}`, `브랜드${i}`)
    );
    mockGetCosmeticProducts.mockResolvedValueOnce(products).mockResolvedValue([]);

    const result = await matchProductsByColor('lip', coralColor);

    expect(result.length).toBe(5);
  });

  it('hair 타입은 현재 빈 배열 반환 (DB 카테고리 미지원)', async () => {
    const result = await matchProductsByColor('hair', coralColor);

    expect(result).toEqual([]);
    // getCosmeticProducts 호출하지 않음
    expect(mockGetCosmeticProducts).not.toHaveBeenCalled();
  });

  it('매칭 점수가 0-100 범위', async () => {
    const product = createMockProduct('1', '코랄 립', '브랜드A');
    product.personalColorSeasons = ['Spring'];
    product.rating = 4.8;
    product.reviewCount = 10000;
    mockGetCosmeticProducts.mockResolvedValueOnce([product]).mockResolvedValue([]);

    const result = await matchProductsByColor('lip', coralColor, 'spring');

    expect(result[0].matchScore).toBeGreaterThanOrEqual(0);
    expect(result[0].matchScore).toBeLessThanOrEqual(100);
  });

  it('colorDeltaE는 소수점 2자리까지 반올림', async () => {
    mockGetCosmeticProducts
      .mockResolvedValueOnce([createMockProduct('1', '코랄 립', '브랜드A')])
      .mockResolvedValue([]);

    const result = await matchProductsByColor('lip', coralColor);

    const deltaE = result[0].colorDeltaE;
    // 소수점 2자리 이하인지 확인
    const decimalPlaces = (deltaE.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

  it('eyeshadow 타입 매칭', async () => {
    mockGetCosmeticProducts
      .mockResolvedValueOnce([createMockProduct('1', '골드 섀도우', '브랜드A')])
      .mockResolvedValue([]);

    const result = await matchProductsByColor('eyeshadow', { r: 212, g: 175, b: 55, a: 1 });

    expect(result.length).toBe(1);
    expect(mockGetCosmeticProducts).toHaveBeenCalledWith(
      expect.objectContaining({ subcategory: 'eyeshadow' }),
      30
    );
  });

  it('foundation 타입은 foundation + cushion 서브카테고리 조회', async () => {
    mockGetCosmeticProducts.mockResolvedValue([]);

    await matchProductsByColor('foundation', { r: 210, g: 180, b: 140, a: 1 });

    // foundation, cushion 두 번 호출
    expect(mockGetCosmeticProducts).toHaveBeenCalledTimes(2);
    expect(mockGetCosmeticProducts).toHaveBeenCalledWith(
      expect.objectContaining({ subcategory: 'foundation' }),
      30
    );
    expect(mockGetCosmeticProducts).toHaveBeenCalledWith(
      expect.objectContaining({ subcategory: 'cushion' }),
      30
    );
  });

  it('affiliateUrl이 있으면 반환, 없으면 purchaseUrl 반환', async () => {
    const product = createMockProduct('1', '립 제품', '브랜드');
    product.affiliateUrl = 'https://affiliate.example.com';
    product.purchaseUrl = 'https://shop.example.com';
    mockGetCosmeticProducts.mockResolvedValueOnce([product]).mockResolvedValue([]);

    const result = await matchProductsByColor('lip', coralColor);

    expect(result[0].affiliateUrl).toBe('https://affiliate.example.com');
  });
});

// ================================================
// 테스트 헬퍼
// ================================================

function createMockProduct(
  id: string,
  name: string,
  brand: string
): import('@/types/product').CosmeticProduct {
  return {
    id,
    name,
    brand,
    category: 'makeup',
    subcategory: 'lip',
    isActive: true,
  };
}
