/**
 * 제품별 사이즈 추천 서비스 테스트
 * getProductSizeRecommendation 함수의 실측 데이터 보정 로직 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// 모듈 모킹
vi.mock('@/lib/smart-matching/measurements', () => ({
  getMeasurements: vi.fn(),
}));

vi.mock('@/lib/smart-matching/size-history', () => ({
  getSizeHistory: vi.fn(),
  getSizeHistoryByBrand: vi.fn(),
  getPerfectFitHistory: vi.fn(),
}));

vi.mock('@/lib/smart-matching/size-charts', () => ({
  getSizeChart: vi.fn(),
  recommendSizeFromMeasurements: vi.fn(),
  getProductMeasurements: vi.fn(),
}));

import { getMeasurements } from '@/lib/smart-matching/measurements';
import { getSizeHistoryByBrand } from '@/lib/smart-matching/size-history';
import { getProductMeasurements } from '@/lib/smart-matching/size-charts';
import { getProductSizeRecommendation } from '@/lib/smart-matching/size-recommend';

describe('getProductSizeRecommendation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 기본 추천을 위한 공통 설정
  const setupBaseRecommendation = () => {
    vi.mocked(getSizeHistoryByBrand).mockResolvedValue([
      {
        id: 'history-1',
        clerkUserId: 'user-1',
        brandId: 'nike',
        brandName: 'Nike',
        category: 'top',
        size: 'M',
        fit: 'perfect',
        createdAt: new Date(),
      },
    ]);
  };

  it('제품 실측 데이터가 없으면 기본 추천을 반환한다', async () => {
    setupBaseRecommendation();
    vi.mocked(getProductMeasurements).mockResolvedValue(null);

    const result = await getProductSizeRecommendation('user-1', 'product-1', 'nike', 'Nike', 'top');

    expect(result.recommendedSize).toBe('M');
    expect(result.basis).toBe('history');
  });

  it('사용자 치수가 없으면 기본 추천을 반환한다', async () => {
    setupBaseRecommendation();
    vi.mocked(getProductMeasurements).mockResolvedValue({
      id: 'pm-1',
      productId: 'product-1',
      reliability: 0.9,
      sizeMeasurements: [
        {
          size: 'M',
          actualMeasurements: { chestWidth: 50, shoulderWidth: 45, totalLength: 70 },
        },
      ],
      source: 'official',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(getMeasurements).mockResolvedValue(null);

    const result = await getProductSizeRecommendation('user-1', 'product-1', 'nike', 'Nike', 'top');

    expect(result.recommendedSize).toBe('M');
  });

  it('상의: 가슴 둘레가 작으면 사이즈 업 추천', async () => {
    setupBaseRecommendation();
    // 제품 가슴 단면: 50cm -> 둘레 100cm
    // 사용자 가슴 둘레: 108cm (차이 8cm > 6cm 기준)
    vi.mocked(getProductMeasurements).mockResolvedValue({
      id: 'pm-1',
      productId: 'product-1',
      reliability: 0.9,
      sizeMeasurements: [
        {
          size: 'M',
          actualMeasurements: { chestWidth: 50, shoulderWidth: 45, totalLength: 70 },
        },
        {
          size: 'L',
          actualMeasurements: { chestWidth: 54, shoulderWidth: 47, totalLength: 73 },
        },
      ],
      source: 'official',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(getMeasurements).mockResolvedValue({
      clerkUserId: 'user-1',
      height: 175,
      weight: 75,
      chest: 108, // 제품 기준(100cm)보다 8cm 큼
      preferredFit: 'regular',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getProductSizeRecommendation('user-1', 'product-1', 'nike', 'Nike', 'top');

    expect(result.recommendedSize).toBe('L');
    expect(result.brandInfo?.sizeNote).toContain('실측 데이터 기반');
  });

  it('상의: 가슴 둘레가 충분히 크면 사이즈 다운 추천', async () => {
    setupBaseRecommendation();
    // 제품 가슴 단면: 50cm -> 둘레 100cm
    // 사용자 가슴 둘레: 88cm (차이 -12cm < -10cm 기준)
    vi.mocked(getProductMeasurements).mockResolvedValue({
      id: 'pm-1',
      productId: 'product-1',
      reliability: 0.8,
      sizeMeasurements: [
        {
          size: 'S',
          actualMeasurements: { chestWidth: 46, shoulderWidth: 43, totalLength: 67 },
        },
        {
          size: 'M',
          actualMeasurements: { chestWidth: 50, shoulderWidth: 45, totalLength: 70 },
        },
      ],
      source: 'official',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(getMeasurements).mockResolvedValue({
      clerkUserId: 'user-1',
      height: 170,
      weight: 60,
      chest: 88, // 제품 기준(100cm)보다 12cm 작음
      preferredFit: 'regular',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getProductSizeRecommendation('user-1', 'product-1', 'nike', 'Nike', 'top');

    expect(result.recommendedSize).toBe('S');
  });

  it('하의: 허리 둘레 기준 사이즈 업 추천', async () => {
    // 하의 카테고리 테스트
    vi.mocked(getSizeHistoryByBrand).mockResolvedValue([
      {
        id: 'history-1',
        clerkUserId: 'user-1',
        brandId: 'nike',
        brandName: 'Nike',
        category: 'bottom',
        size: 'M',
        fit: 'perfect',
        createdAt: new Date(),
      },
    ]);
    // 제품 허리 단면: 38cm -> 둘레 76cm
    // 사용자 허리 둘레: 82cm (차이 6cm > 4cm 기준)
    vi.mocked(getProductMeasurements).mockResolvedValue({
      id: 'pm-2',
      productId: 'product-2',
      reliability: 0.85,
      sizeMeasurements: [
        {
          size: 'M',
          actualMeasurements: { waistWidth: 38, hipWidth: 48, totalLength: 100 },
        },
        {
          size: 'L',
          actualMeasurements: { waistWidth: 41, hipWidth: 51, totalLength: 102 },
        },
      ],
      source: 'musinsa',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(getMeasurements).mockResolvedValue({
      clerkUserId: 'user-1',
      height: 175,
      weight: 75,
      waist: 82,
      hip: 98,
      preferredFit: 'regular',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getProductSizeRecommendation(
      'user-1',
      'product-2',
      'nike',
      'Nike',
      'bottom'
    );

    expect(result.recommendedSize).toBe('L');
    expect(result.brandInfo?.sizeNote).toContain('허리');
  });

  it('실측 데이터 보정 불필요 시 신뢰도만 소폭 상향', async () => {
    setupBaseRecommendation();
    // 제품 가슴 단면: 50cm -> 둘레 100cm
    // 사용자 가슴 둘레: 98cm (차이 -2cm, 범위 내)
    vi.mocked(getProductMeasurements).mockResolvedValue({
      id: 'pm-1',
      productId: 'product-1',
      reliability: 0.9,
      sizeMeasurements: [
        {
          size: 'M',
          actualMeasurements: { chestWidth: 50, shoulderWidth: 45, totalLength: 70 },
        },
      ],
      source: 'official',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(getMeasurements).mockResolvedValue({
      clerkUserId: 'user-1',
      height: 175,
      weight: 70,
      chest: 98, // 제품 기준과 거의 일치
      preferredFit: 'regular',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getProductSizeRecommendation('user-1', 'product-1', 'nike', 'Nike', 'top');

    expect(result.recommendedSize).toBe('M');
    expect(result.brandInfo?.sizeNote).toContain('실측 확인됨');
  });

  it('실측 데이터 조회 실패 시 기본 추천 반환', async () => {
    setupBaseRecommendation();
    vi.mocked(getProductMeasurements).mockRejectedValue(new Error('DB error'));

    const result = await getProductSizeRecommendation('user-1', 'product-1', 'nike', 'Nike', 'top');

    expect(result.recommendedSize).toBe('M');
    expect(result.basis).toBe('history');
  });

  it('실측 데이터에 해당 사이즈가 없으면 기본 추천 반환', async () => {
    setupBaseRecommendation();
    // M 사이즈 추천되었지만 실측 데이터에 L만 있음
    vi.mocked(getProductMeasurements).mockResolvedValue({
      id: 'pm-1',
      productId: 'product-1',
      reliability: 0.9,
      sizeMeasurements: [
        {
          size: 'L',
          actualMeasurements: { chestWidth: 54, shoulderWidth: 47, totalLength: 73 },
        },
      ],
      source: 'official',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(getMeasurements).mockResolvedValue({
      clerkUserId: 'user-1',
      height: 175,
      weight: 70,
      chest: 100,
      preferredFit: 'regular',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getProductSizeRecommendation('user-1', 'product-1', 'nike', 'Nike', 'top');

    // 실측 데이터에 M이 없으므로 기본 추천 유지
    expect(result.recommendedSize).toBe('M');
    expect(result.basis).toBe('history');
  });
});
