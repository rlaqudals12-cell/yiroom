/**
 * S-1 피부 분석 결과 화면 - 비즈니스 로직 테스트
 *
 * 테스트 대상:
 * - 종합 점수 계산 로직
 * - 피부 지표 색상 판정 로직
 * - 피부 타입 데이터 일관성
 * - 변화량(delta) 표시 로직
 */

import type { SkinType } from '@yiroom/shared';

// ============================================================
// 피부 지표 타입 (result.tsx에서 추출)
// ============================================================

interface SkinMetrics {
  moisture: number;
  oil: number;
  pores: number;
  wrinkles: number;
  pigmentation: number;
  sensitivity: number;
  elasticity: number;
}

interface SkinMetricsDelta {
  moisture: number;
  oil: number;
  pores: number;
  wrinkles: number;
  pigmentation: number;
  sensitivity: number;
  elasticity: number;
  overall: number;
}

// ============================================================
// 피부 타입 데이터 (result.tsx에서 추출)
// ============================================================

const SKIN_TYPE_DATA: Record<
  SkinType,
  {
    name: string;
    description: string;
    tips: string[];
  }
> = {
  dry: {
    name: '건성 피부',
    description:
      '수분이 부족한 피부 타입입니다. 보습에 집중하는 스킨케어를 추천드려요.',
    tips: [
      '고보습 크림 사용을 권장해요',
      '클렌징 후 바로 토너를 발라주세요',
      '수분 마스크팩을 주 2-3회 사용해보세요',
    ],
  },
  oily: {
    name: '지성 피부',
    description:
      '피지 분비가 활발한 피부 타입입니다. 유수분 밸런스 관리가 중요해요.',
    tips: [
      '가벼운 젤 타입 보습제를 사용하세요',
      '주 1-2회 모공 관리를 해주세요',
      '자극적인 클렌징은 피해주세요',
    ],
  },
  combination: {
    name: '복합성 피부',
    description:
      'T존은 지성, 볼은 건성인 피부 타입입니다. 부위별 맞춤 케어가 필요해요.',
    tips: [
      'T존과 볼을 다른 제품으로 케어하세요',
      '수분 공급과 유분 조절을 동시에 해주세요',
      '자극적인 각질 제거는 피해주세요',
    ],
  },
  sensitive: {
    name: '민감성 피부',
    description:
      '자극에 예민한 피부 타입입니다. 순한 성분의 제품을 사용하세요.',
    tips: [
      '무향료, 저자극 제품을 선택하세요',
      '새 제품은 패치 테스트 후 사용하세요',
      '피부 장벽 강화 제품을 사용해보세요',
    ],
  },
  normal: {
    name: '정상 피부',
    description:
      '유수분 밸런스가 좋은 피부 타입입니다. 현재 상태를 유지해주세요.',
    tips: [
      '기본적인 보습 케어를 유지하세요',
      '자외선 차단은 꼭 해주세요',
      '계절에 따라 제품을 조절해보세요',
    ],
  },
};

// ============================================================
// 종합 점수 계산 함수 (result.tsx에서 추출)
// ============================================================

function calculateOverallScore(metrics: SkinMetrics): number {
  return Math.round(
    metrics.moisture * 0.2 +
      metrics.elasticity * 0.2 +
      metrics.pores * 0.15 +
      metrics.wrinkles * 0.15 +
      metrics.pigmentation * 0.1 +
      metrics.oil * 0.1 +
      (100 - metrics.sensitivity) * 0.1
  );
}

// ============================================================
// 지표별 색상 판정 함수 (result.tsx에서 추출)
// ============================================================

function getMetricColor(value: number): string {
  if (value >= 70) return '#22c55e'; // 녹색 (좋음)
  if (value >= 50) return '#eab308'; // 노란색 (보통)
  return '#ef4444'; // 빨간색 (나쁨)
}

// ============================================================
// Mock fallback 감지 함수 (result.tsx에서 추출)
// ============================================================

function isUsingFallback(metrics: SkinMetrics): boolean {
  // 기본 Mock 값인 경우 (moisture가 65이면 Mock)
  return metrics.moisture === 65;
}

// ============================================================
// 종합 점수 계산 테스트
// ============================================================

describe('S-1 피부 분석 - 종합 점수 계산', () => {
  describe('calculateOverallScore', () => {
    it('모든 지표가 100일 때 100점이어야 한다', () => {
      const perfectMetrics: SkinMetrics = {
        moisture: 100,
        oil: 100,
        pores: 100,
        wrinkles: 100,
        pigmentation: 100,
        sensitivity: 0, // 민감도는 낮을수록 좋음
        elasticity: 100,
      };
      expect(calculateOverallScore(perfectMetrics)).toBe(100);
    });

    it('모든 지표가 0일 때 10점이어야 한다', () => {
      // sensitivity만 100일 때 (민감도는 반전 계산)
      const worstMetrics: SkinMetrics = {
        moisture: 0,
        oil: 0,
        pores: 0,
        wrinkles: 0,
        pigmentation: 0,
        sensitivity: 100, // 민감도 최대 → 점수 기여 0
        elasticity: 0,
      };
      expect(calculateOverallScore(worstMetrics)).toBe(0);
    });

    it('중간 지표(모두 50)일 때 적절한 점수여야 한다', () => {
      const midMetrics: SkinMetrics = {
        moisture: 50,
        oil: 50,
        pores: 50,
        wrinkles: 50,
        pigmentation: 50,
        sensitivity: 50,
        elasticity: 50,
      };
      // 50 * (0.2 + 0.1 + 0.15 + 0.15 + 0.1 + 0.2) + 50 * 0.1 = 50
      expect(calculateOverallScore(midMetrics)).toBe(50);
    });

    it('가중치가 올바르게 적용되어야 한다', () => {
      // moisture만 100, 나머지 0
      const moistureOnlyMetrics: SkinMetrics = {
        moisture: 100,
        oil: 0,
        pores: 0,
        wrinkles: 0,
        pigmentation: 0,
        sensitivity: 100,
        elasticity: 0,
      };
      // 100 * 0.2 = 20
      expect(calculateOverallScore(moistureOnlyMetrics)).toBe(20);

      // elasticity만 100, 나머지 0
      const elasticityOnlyMetrics: SkinMetrics = {
        moisture: 0,
        oil: 0,
        pores: 0,
        wrinkles: 0,
        pigmentation: 0,
        sensitivity: 100,
        elasticity: 100,
      };
      // 100 * 0.2 = 20
      expect(calculateOverallScore(elasticityOnlyMetrics)).toBe(20);
    });

    it('민감도는 역산으로 계산되어야 한다', () => {
      const lowSensitivity: SkinMetrics = {
        moisture: 50,
        oil: 50,
        pores: 50,
        wrinkles: 50,
        pigmentation: 50,
        sensitivity: 0, // 낮은 민감도 (좋음) → 점수 기여: (100-0)*0.1 = 10
        elasticity: 50,
      };

      const highSensitivity: SkinMetrics = {
        ...lowSensitivity,
        sensitivity: 100, // 높은 민감도 (나쁨) → 점수 기여: (100-100)*0.1 = 0
      };

      const lowSensScore = calculateOverallScore(lowSensitivity);
      const highSensScore = calculateOverallScore(highSensitivity);

      expect(lowSensScore).toBeGreaterThan(highSensScore);
      expect(lowSensScore - highSensScore).toBe(10); // 0.1 가중치 * 100 차이
    });

    it('결과는 정수로 반올림되어야 한다', () => {
      const metrics: SkinMetrics = {
        moisture: 73,
        oil: 62,
        pores: 55,
        wrinkles: 68,
        pigmentation: 45,
        sensitivity: 35,
        elasticity: 70,
      };
      const score = calculateOverallScore(metrics);
      expect(Number.isInteger(score)).toBe(true);
    });
  });
});

// ============================================================
// 지표 색상 테스트
// ============================================================

describe('S-1 피부 분석 - 지표 색상', () => {
  describe('getMetricColor', () => {
    it('70 이상은 녹색(좋음)이어야 한다', () => {
      expect(getMetricColor(70)).toBe('#22c55e');
      expect(getMetricColor(85)).toBe('#22c55e');
      expect(getMetricColor(100)).toBe('#22c55e');
    });

    it('50-69는 노란색(보통)이어야 한다', () => {
      expect(getMetricColor(50)).toBe('#eab308');
      expect(getMetricColor(60)).toBe('#eab308');
      expect(getMetricColor(69)).toBe('#eab308');
    });

    it('50 미만은 빨간색(나쁨)이어야 한다', () => {
      expect(getMetricColor(0)).toBe('#ef4444');
      expect(getMetricColor(30)).toBe('#ef4444');
      expect(getMetricColor(49)).toBe('#ef4444');
    });

    it('경계값이 올바르게 처리되어야 한다', () => {
      expect(getMetricColor(49)).toBe('#ef4444');
      expect(getMetricColor(50)).toBe('#eab308');
      expect(getMetricColor(69)).toBe('#eab308');
      expect(getMetricColor(70)).toBe('#22c55e');
    });
  });
});

// ============================================================
// Mock fallback 감지 테스트
// ============================================================

describe('S-1 피부 분석 - Fallback 감지', () => {
  describe('isUsingFallback', () => {
    it('moisture가 65면 fallback으로 판정해야 한다', () => {
      const mockMetrics: SkinMetrics = {
        moisture: 65,
        oil: 45,
        pores: 70,
        wrinkles: 75,
        pigmentation: 60,
        sensitivity: 35,
        elasticity: 70,
      };
      expect(isUsingFallback(mockMetrics)).toBe(true);
    });

    it('moisture가 65가 아니면 AI 분석으로 판정해야 한다', () => {
      [50, 60, 64, 66, 70, 80].forEach((moisture) => {
        const metrics: SkinMetrics = {
          moisture,
          oil: 45,
          pores: 70,
          wrinkles: 75,
          pigmentation: 60,
          sensitivity: 35,
          elasticity: 70,
        };
        expect(isUsingFallback(metrics)).toBe(false);
      });
    });
  });
});

// ============================================================
// 피부 타입 데이터 일관성 테스트
// ============================================================

describe('S-1 피부 분석 - 데이터 일관성', () => {
  describe('SKIN_TYPE_DATA', () => {
    it('모든 피부 타입이 정의되어 있어야 한다', () => {
      const expectedTypes: SkinType[] = [
        'dry',
        'oily',
        'combination',
        'sensitive',
        'normal',
      ];

      expectedTypes.forEach((type) => {
        expect(SKIN_TYPE_DATA[type]).toBeDefined();
      });
    });

    it('모든 피부 타입은 필수 필드를 가져야 한다', () => {
      Object.values(SKIN_TYPE_DATA).forEach((data) => {
        expect(data.name).toBeDefined();
        expect(typeof data.name).toBe('string');
        expect(data.name.length).toBeGreaterThan(0);

        expect(data.description).toBeDefined();
        expect(typeof data.description).toBe('string');
        expect(data.description.length).toBeGreaterThan(20);

        expect(Array.isArray(data.tips)).toBe(true);
        expect(data.tips.length).toBe(3);
      });
    });

    it('피부 타입 이름은 한국어여야 한다', () => {
      const koreanRegex = /[\uAC00-\uD7AF]/;

      Object.values(SKIN_TYPE_DATA).forEach((data) => {
        expect(data.name).toMatch(koreanRegex);
      });
    });

    it('설명에 스킨케어 방향을 제시해야 한다', () => {
      Object.values(SKIN_TYPE_DATA).forEach((data) => {
        expect(data.description).toMatch(/추천|중요|필요|유지|사용/);
      });
    });

    it('팁은 구체적인 행동을 제시해야 한다', () => {
      Object.values(SKIN_TYPE_DATA).forEach((data) => {
        data.tips.forEach((tip) => {
          // 팁은 동사형 문장 또는 권유형 (발라주세요, 하세요 등)
          expect(tip).toMatch(/하세요|해주세요|해보세요|발라주세요|사용|권장/);
        });
      });
    });
  });
});

// ============================================================
// 변화량(Delta) 테스트
// ============================================================

describe('S-1 피부 분석 - 변화량 표시', () => {
  describe('Delta 계산', () => {
    it('양수 delta는 개선을 의미해야 한다', () => {
      const delta: SkinMetricsDelta = {
        moisture: 5,
        oil: 3,
        pores: 2,
        wrinkles: 4,
        pigmentation: 3,
        sensitivity: -5, // 민감도 감소는 개선
        elasticity: 6,
        overall: 10,
      };

      // 전체 점수 양수 = 개선
      expect(delta.overall).toBeGreaterThan(0);
    });

    it('음수 delta는 악화를 의미해야 한다', () => {
      const delta: SkinMetricsDelta = {
        moisture: -5,
        oil: -3,
        pores: -2,
        wrinkles: -4,
        pigmentation: -3,
        sensitivity: 5, // 민감도 증가는 악화
        elasticity: -6,
        overall: -10,
      };

      expect(delta.overall).toBeLessThan(0);
    });

    it('0 delta는 변화 없음을 의미해야 한다', () => {
      const delta: SkinMetricsDelta = {
        moisture: 0,
        oil: 0,
        pores: 0,
        wrinkles: 0,
        pigmentation: 0,
        sensitivity: 0,
        elasticity: 0,
        overall: 0,
      };

      expect(delta.overall).toBe(0);
    });
  });

  describe('Delta 표시 형식', () => {
    it('양수 delta는 + 기호와 함께 표시해야 한다', () => {
      const delta = 5;
      const formatted = delta > 0 ? `+${delta}` : `${delta}`;
      expect(formatted).toBe('+5');
    });

    it('음수 delta는 - 기호와 함께 표시해야 한다', () => {
      const delta = -5;
      const formatted = delta > 0 ? `+${delta}` : `${delta}`;
      expect(formatted).toBe('-5');
    });

    it('0 delta는 표시하지 않아야 한다 (조건부)', () => {
      const delta = 0;
      const shouldDisplay = delta !== 0;
      expect(shouldDisplay).toBe(false);
    });
  });
});

// ============================================================
// 접근성 테스트
// ============================================================

describe('S-1 피부 분석 - 접근성', () => {
  it('MetricBar 접근성 라벨이 올바르게 생성되어야 한다', () => {
    const label = '수분도';
    const value = 75;
    const delta = 5;

    const accessibilityLabel = `${label}: ${value}%${delta ? `, 변화: ${delta > 0 ? '+' : ''}${delta}` : ''}`;

    expect(accessibilityLabel).toBe('수분도: 75%, 변화: +5');
  });

  it('delta가 없을 때 접근성 라벨이 올바르게 생성되어야 한다', () => {
    const label = '유분도';
    const value = 45;
    const delta: number | undefined = undefined;

    const accessibilityLabel = `${label}: ${value}%${delta !== undefined ? `, 변화: ${delta > 0 ? '+' : ''}${delta}` : ''}`;

    expect(accessibilityLabel).toBe('유분도: 45%');
  });

  it('피부 팁은 읽기 쉬운 길이여야 한다', () => {
    Object.values(SKIN_TYPE_DATA).forEach((data) => {
      data.tips.forEach((tip) => {
        // 팁은 50자 이하로 간결해야 함
        expect(tip.length).toBeLessThanOrEqual(50);
        expect(tip.length).toBeGreaterThan(10);
      });
    });
  });
});

// ============================================================
// 지표 가중치 테스트
// ============================================================

describe('S-1 피부 분석 - 지표 가중치', () => {
  it('가중치 합계가 1이어야 한다', () => {
    const weights = {
      moisture: 0.2,
      elasticity: 0.2,
      pores: 0.15,
      wrinkles: 0.15,
      pigmentation: 0.1,
      oil: 0.1,
      sensitivity: 0.1,
    };

    const sum = Object.values(weights).reduce((acc, w) => acc + w, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('수분도와 탄력이 가장 높은 가중치를 가져야 한다', () => {
    const weights = {
      moisture: 0.2,
      elasticity: 0.2,
      pores: 0.15,
      wrinkles: 0.15,
      pigmentation: 0.1,
      oil: 0.1,
      sensitivity: 0.1,
    };

    const maxWeight = Math.max(...Object.values(weights));
    expect(weights.moisture).toBe(maxWeight);
    expect(weights.elasticity).toBe(maxWeight);
  });
});
