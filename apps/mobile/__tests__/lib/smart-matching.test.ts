/**
 * Smart-matching 모듈 테스트
 */

import {
  SizeRecommendation,
  UserBodyMeasurements,
  SizeHistoryItem,
  getConfidenceLabel,
  getBasisDescription,
  getCategoryLabel,
} from '../../lib/smart-matching';

describe('SizeRecommendation 타입', () => {
  it('사이즈 추천 구조가 올바라야 함', () => {
    const recommendation: SizeRecommendation = {
      recommendedSize: 'M',
      confidence: 85,
      basis: 'measurements',
      alternatives: [
        { size: 'L', note: '여유있는 핏을 원하시면' },
        { size: 'S', note: '타이트한 핏을 원하시면' },
      ],
    };

    expect(recommendation.recommendedSize).toBe('M');
    expect(recommendation.confidence).toBe(85);
    expect(recommendation.basis).toBe('measurements');
    expect(recommendation.alternatives?.length).toBe(2);
  });

  it('브랜드 정보를 포함할 수 있어야 함', () => {
    const recommendation: SizeRecommendation = {
      recommendedSize: 'L',
      confidence: 90,
      basis: 'brand_chart',
      alternatives: [],
      brandInfo: {
        fitStyle: '슬림핏',
        sizeNote: '이 브랜드는 작게 나옵니다',
      },
    };

    expect(recommendation.brandInfo?.fitStyle).toBe('슬림핏');
    expect(recommendation.brandInfo?.sizeNote).toBeDefined();
  });
});

describe('UserBodyMeasurements 타입', () => {
  it('신체 측정값 구조가 올바라야 함', () => {
    const measurements: UserBodyMeasurements = {
      height: 175,
      weight: 70,
      chest: 95,
      waist: 80,
      hip: 95,
      shoulder: 45,
      preferredFit: 'regular',
    };

    expect(measurements.height).toBe(175);
    expect(measurements.weight).toBe(70);
    expect(measurements.chest).toBe(95);
    expect(measurements.preferredFit).toBe('regular');
  });

  it('선호 핏 타입이 올바라야 함', () => {
    const tight: UserBodyMeasurements = { preferredFit: 'tight' };
    const regular: UserBodyMeasurements = { preferredFit: 'regular' };
    const loose: UserBodyMeasurements = { preferredFit: 'loose' };

    expect(tight.preferredFit).toBe('tight');
    expect(regular.preferredFit).toBe('regular');
    expect(loose.preferredFit).toBe('loose');
  });
});

describe('SizeHistoryItem 타입', () => {
  it('사이즈 기록 구조가 올바라야 함', () => {
    const item: SizeHistoryItem = {
      id: 'sh-123',
      brandId: 'uniqlo',
      brandName: '유니클로',
      category: 'top',
      size: 'M',
      fit: 'perfect',
      createdAt: '2024-01-01T00:00:00Z',
    };

    expect(item.brandId).toBe('uniqlo');
    expect(item.size).toBe('M');
    expect(item.fit).toBe('perfect');
  });
});

describe('getConfidenceLabel', () => {
  it('높은 신뢰도에 적절한 라벨을 반환해야 함', () => {
    const result = getConfidenceLabel(90);
    expect(result.label).toBe('매우 정확');
    expect(result.color).toBe('green');

    const result2 = getConfidenceLabel(80);
    expect(result2.label).toBe('매우 정확');
  });

  it('중간 신뢰도에 적절한 라벨을 반환해야 함', () => {
    const result = getConfidenceLabel(70);
    expect(result.label).toBe('정확');
    expect(result.color).toBe('green');

    const result2 = getConfidenceLabel(60);
    expect(result2.label).toBe('정확');
  });

  it('낮은 신뢰도에 적절한 라벨을 반환해야 함', () => {
    const result = getConfidenceLabel(50);
    expect(result.label).toBe('참고용');
    expect(result.color).toBe('yellow');

    const result2 = getConfidenceLabel(40);
    expect(result2.label).toBe('참고용');
  });

  it('매우 낮은 신뢰도에 적절한 라벨을 반환해야 함', () => {
    const result = getConfidenceLabel(30);
    expect(result.label).toBe('추정');
    expect(result.color).toBe('gray');
  });
});

describe('getBasisDescription', () => {
  it('구매 기록 기반 설명을 반환해야 함', () => {
    expect(getBasisDescription('history')).toBe('이전 구매 기록 기반');
  });

  it('신체 치수 기반 설명을 반환해야 함', () => {
    expect(getBasisDescription('measurements')).toBe('내 신체 치수 기반');
  });

  it('브랜드 사이즈 차트 기반 설명을 반환해야 함', () => {
    expect(getBasisDescription('brand_chart')).toBe(
      '브랜드 사이즈 차트 + 내 치수 기반'
    );
  });

  it('일반 추정 설명을 반환해야 함', () => {
    expect(getBasisDescription('general')).toBe('일반적인 사이즈 추정');
  });

  it('알 수 없는 기준은 빈 문자열을 반환해야 함', () => {
    expect(getBasisDescription('unknown' as never)).toBe('');
  });
});

describe('getCategoryLabel', () => {
  it('카테고리 한글 이름을 반환해야 함', () => {
    expect(getCategoryLabel('top')).toBe('상의');
    expect(getCategoryLabel('bottom')).toBe('하의');
    expect(getCategoryLabel('outer')).toBe('아우터');
    expect(getCategoryLabel('dress')).toBe('원피스');
    expect(getCategoryLabel('shoes')).toBe('신발');
  });

  it('알 수 없는 카테고리는 원래 값을 반환해야 함', () => {
    expect(getCategoryLabel('unknown' as never)).toBe('unknown');
  });
});
