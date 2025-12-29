/**
 * 사이즈 추천 서비스 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getConfidenceLabel,
  getBasisDescription,
} from '@/lib/smart-matching/size-recommend';

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
}));

import { getMeasurements } from '@/lib/smart-matching/measurements';
import { getSizeHistoryByBrand, getPerfectFitHistory } from '@/lib/smart-matching/size-history';
import { getSizeChart, recommendSizeFromMeasurements } from '@/lib/smart-matching/size-charts';
import { getSizeRecommendation } from '@/lib/smart-matching/size-recommend';

describe('사이즈 추천 서비스', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSizeRecommendation', () => {
    it('구매 기록이 있으면 기록 기반으로 추천한다', async () => {
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

      const result = await getSizeRecommendation('user-1', 'nike', 'Nike', 'top');

      expect(result.recommendedSize).toBe('M');
      expect(result.basis).toBe('history');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    it('이전에 작다고 느꼈으면 사이즈 업 추천', async () => {
      // 2개 이상의 기록이 있어야 80% 이상 신뢰도 (perfect fit 없이)
      vi.mocked(getSizeHistoryByBrand).mockResolvedValue([
        {
          id: 'history-1',
          clerkUserId: 'user-1',
          brandId: 'nike',
          brandName: 'Nike',
          category: 'top',
          size: 'M',
          fit: 'small',
          createdAt: new Date(),
        },
        {
          id: 'history-2',
          clerkUserId: 'user-1',
          brandId: 'nike',
          brandName: 'Nike',
          category: 'top',
          size: 'M',
          fit: 'small',
          createdAt: new Date(Date.now() - 86400000),
        },
      ]);

      const result = await getSizeRecommendation('user-1', 'nike', 'Nike', 'top');

      expect(result.recommendedSize).toBe('L');
      expect(result.basis).toBe('history');
    });

    it('이전에 크다고 느꼈으면 사이즈 다운 추천', async () => {
      vi.mocked(getSizeHistoryByBrand).mockResolvedValue([
        {
          id: 'history-1',
          clerkUserId: 'user-1',
          brandId: 'nike',
          brandName: 'Nike',
          category: 'top',
          size: 'L',
          fit: 'large',
          createdAt: new Date(),
        },
        {
          id: 'history-2',
          clerkUserId: 'user-1',
          brandId: 'nike',
          brandName: 'Nike',
          category: 'top',
          size: 'L',
          fit: 'large',
          createdAt: new Date(Date.now() - 86400000),
        },
      ]);

      const result = await getSizeRecommendation('user-1', 'nike', 'Nike', 'top');

      expect(result.recommendedSize).toBe('M');
    });

    it('기록이 없으면 사이즈 차트 기반으로 추천한다', async () => {
      vi.mocked(getSizeHistoryByBrand).mockResolvedValue([]);
      vi.mocked(getSizeChart).mockResolvedValue({
        id: 'chart-1',
        brandId: 'nike',
        brandName: 'Nike',
        category: 'top',
        sizeMappings: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(getMeasurements).mockResolvedValue({
        clerkUserId: 'user-1',
        height: 175,
        weight: 70,
        preferredFit: 'regular',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(recommendSizeFromMeasurements).mockReturnValue({
        size: 'L',
        confidence: 70,
        reason: '키, 몸무게 기준',
      });

      const result = await getSizeRecommendation('user-1', 'nike', 'Nike', 'top');

      expect(result.recommendedSize).toBe('L');
      expect(result.basis).toBe('brand_chart');
    });

    it('차트도 없으면 일반 추론으로 추천한다', async () => {
      vi.mocked(getSizeHistoryByBrand).mockResolvedValue([]);
      vi.mocked(getSizeChart).mockResolvedValue(null);
      vi.mocked(getPerfectFitHistory).mockResolvedValue([
        {
          id: 'history-1',
          clerkUserId: 'user-1',
          brandId: 'other',
          brandName: 'Other',
          category: 'top',
          size: 'M',
          fit: 'perfect',
          createdAt: new Date(),
        },
      ]);

      const result = await getSizeRecommendation('user-1', 'nike', 'Nike', 'top');

      expect(result.recommendedSize).toBe('M');
      expect(result.basis).toBe('general');
    });

    it('모든 데이터가 없으면 기본값 M을 반환한다', async () => {
      vi.mocked(getSizeHistoryByBrand).mockResolvedValue([]);
      vi.mocked(getSizeChart).mockResolvedValue(null);
      vi.mocked(getPerfectFitHistory).mockResolvedValue([]);
      vi.mocked(getMeasurements).mockResolvedValue(null);

      const result = await getSizeRecommendation('user-1', 'nike', 'Nike', 'top');

      expect(result.recommendedSize).toBe('M');
      expect(result.confidence).toBe(20);
    });
  });

  describe('getConfidenceLabel', () => {
    it('80% 이상이면 "매우 정확"을 반환한다', () => {
      expect(getConfidenceLabel(80).label).toBe('매우 정확');
      expect(getConfidenceLabel(95).label).toBe('매우 정확');
    });

    it('60~79%이면 "정확"을 반환한다', () => {
      expect(getConfidenceLabel(60).label).toBe('정확');
      expect(getConfidenceLabel(79).label).toBe('정확');
    });

    it('40~59%이면 "참고용"을 반환한다', () => {
      expect(getConfidenceLabel(40).label).toBe('참고용');
      expect(getConfidenceLabel(59).label).toBe('참고용');
    });

    it('40% 미만이면 "추정"을 반환한다', () => {
      expect(getConfidenceLabel(20).label).toBe('추정');
      expect(getConfidenceLabel(39).label).toBe('추정');
    });
  });

  describe('getBasisDescription', () => {
    it('추천 근거에 따른 설명을 반환한다', () => {
      expect(getBasisDescription('history')).toBe('이전 구매 기록 기반');
      expect(getBasisDescription('brand_chart')).toBe('브랜드 사이즈 차트 + 내 치수 기반');
      expect(getBasisDescription('measurements')).toBe('내 신체 치수 기반');
      expect(getBasisDescription('general')).toBe('일반적인 사이즈 추정');
    });
  });
});
