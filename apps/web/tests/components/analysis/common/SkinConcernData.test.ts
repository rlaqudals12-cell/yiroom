import { describe, it, expect, vi } from 'vitest';

// lucide-react 아이콘 mock
vi.mock('lucide-react', () => {
  const createMockIcon = (name: string) => {
    const MockIcon = () => null;
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    Droplets: createMockIcon('Droplets'),
    Flame: createMockIcon('Flame'),
    CircleDot: createMockIcon('CircleDot'),
    Activity: createMockIcon('Activity'),
    Sparkles: createMockIcon('Sparkles'),
    Eye: createMockIcon('Eye'),
    AlertCircle: createMockIcon('AlertCircle'),
    Shield: createMockIcon('Shield'),
  };
});

import {
  getSeverity,
  getTipForScore,
  mapSkinMetricsToConcernCards,
} from '@/components/analysis/skin/SkinConcernData';
import type { SkinMetric } from '@/lib/mock/skin-analysis';

describe('getSeverity', () => {
  it('should return good for score >= 71', () => {
    expect(getSeverity(71)).toEqual({ severity: 'good', severityLabel: '좋음' });
    expect(getSeverity(100)).toEqual({ severity: 'good', severityLabel: '좋음' });
  });

  it('should return normal for score 41-70', () => {
    expect(getSeverity(41)).toEqual({ severity: 'normal', severityLabel: '보통' });
    expect(getSeverity(70)).toEqual({ severity: 'normal', severityLabel: '보통' });
    expect(getSeverity(55)).toEqual({ severity: 'normal', severityLabel: '보통' });
  });

  it('should return warning for score < 41', () => {
    expect(getSeverity(40)).toEqual({ severity: 'warning', severityLabel: '관리 필요' });
    expect(getSeverity(0)).toEqual({ severity: 'warning', severityLabel: '관리 필요' });
    expect(getSeverity(1)).toEqual({ severity: 'warning', severityLabel: '관리 필요' });
  });

  // 경계값 테스트
  it('should handle boundary values correctly', () => {
    expect(getSeverity(40).severity).toBe('warning');
    expect(getSeverity(41).severity).toBe('normal');
    expect(getSeverity(70).severity).toBe('normal');
    expect(getSeverity(71).severity).toBe('good');
  });
});

describe('getTipForScore', () => {
  it('should return good tip for high score', () => {
    const tip = getTipForScore('hydration', 85);
    expect(tip).toBe('수분 밸런스가 잘 유지되고 있어요');
  });

  it('should return normal tip for mid score', () => {
    const tip = getTipForScore('hydration', 55);
    expect(tip).toBe('수분 크림으로 보습을 강화해보세요');
  });

  it('should return warning tip for low score', () => {
    const tip = getTipForScore('hydration', 30);
    expect(tip).toBe('히알루론산 세럼으로 수분 충전이 필요해요');
  });

  it('should return empty string for unknown metric', () => {
    const tip = getTipForScore('unknown_metric', 50);
    expect(tip).toBe('');
  });

  it('should return correct tips for all 8 metrics', () => {
    const metrics = [
      'hydration',
      'oil',
      'pores',
      'wrinkles',
      'elasticity',
      'pigmentation',
      'trouble',
      'sensitivity',
    ];
    for (const metricId of metrics) {
      const tip = getTipForScore(metricId, 50);
      expect(tip).toBeTruthy();
      expect(typeof tip).toBe('string');
    }
  });
});

describe('mapSkinMetricsToConcernCards', () => {
  const mockMetrics: SkinMetric[] = [
    { id: 'hydration', name: '수분도', value: 75, status: 'good', description: '수분 상태' },
    { id: 'oil', name: '유분도', value: 55, status: 'normal', description: '유분 상태' },
    { id: 'pores', name: '모공', value: 30, status: 'warning', description: '모공 상태' },
  ];

  it('should map all valid metrics to concern cards', () => {
    const cards = mapSkinMetricsToConcernCards(mockMetrics);
    expect(cards).toHaveLength(3);
  });

  it('should set correct severity based on score', () => {
    const cards = mapSkinMetricsToConcernCards(mockMetrics);
    expect(cards[0].severity).toBe('good'); // 75
    expect(cards[1].severity).toBe('normal'); // 55
    expect(cards[2].severity).toBe('warning'); // 30
  });

  it('should set correct severity labels', () => {
    const cards = mapSkinMetricsToConcernCards(mockMetrics);
    expect(cards[0].severityLabel).toBe('좋음');
    expect(cards[1].severityLabel).toBe('보통');
    expect(cards[2].severityLabel).toBe('관리 필요');
  });

  it('should preserve metric label and score', () => {
    const cards = mapSkinMetricsToConcernCards(mockMetrics);
    expect(cards[0].label).toBe('수분도');
    expect(cards[0].score).toBe(75);
    expect(cards[0].id).toBe('hydration');
  });

  it('should generate dynamic tips', () => {
    const cards = mapSkinMetricsToConcernCards(mockMetrics);
    expect(cards[0].tip).toBe('수분 밸런스가 잘 유지되고 있어요');
    expect(cards[2].tip).toBe('주 2회 클레이 마스크를 추천해요');
  });

  it('should create icon ReactNode for each card', () => {
    const cards = mapSkinMetricsToConcernCards(mockMetrics);
    for (const card of cards) {
      expect(card.icon).toBeDefined();
    }
  });

  it('should filter out unknown metric ids', () => {
    const metricsWithUnknown: SkinMetric[] = [
      ...mockMetrics,
      { id: 'unknown', name: '미지', value: 50, status: 'normal', description: '?' },
    ];
    const cards = mapSkinMetricsToConcernCards(metricsWithUnknown);
    expect(cards).toHaveLength(3); // unknown 제외
  });

  it('should handle empty array', () => {
    const cards = mapSkinMetricsToConcernCards([]);
    expect(cards).toHaveLength(0);
  });

  it('should map all 8 skin metrics correctly', () => {
    const allMetrics: SkinMetric[] = [
      { id: 'hydration', name: '수분도', value: 80, status: 'good', description: '' },
      { id: 'oil', name: '유분도', value: 60, status: 'normal', description: '' },
      { id: 'pores', name: '모공', value: 40, status: 'normal', description: '' },
      { id: 'wrinkles', name: '주름', value: 35, status: 'warning', description: '' },
      { id: 'elasticity', name: '탄력', value: 85, status: 'good', description: '' },
      { id: 'pigmentation', name: '색소침착', value: 25, status: 'warning', description: '' },
      { id: 'trouble', name: '트러블', value: 50, status: 'normal', description: '' },
      { id: 'sensitivity', name: '민감도', value: 72, status: 'good', description: '' },
    ];
    const cards = mapSkinMetricsToConcernCards(allMetrics);
    expect(cards).toHaveLength(8);
  });
});
