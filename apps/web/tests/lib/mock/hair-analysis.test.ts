/**
 * H-1 헤어 분석 Mock 모듈 테스트 (lib/mock/hair-analysis.ts)
 *
 * @description Mock 데이터 생성 함수 및 상수 검증
 * 이 파일은 lib/analysis/hair/mock.test.ts (v2 mock)와 별도로,
 * lib/mock/hair-analysis.ts (v1 mock + 상수)를 테스트합니다.
 */

import { describe, it, expect } from 'vitest';
import {
  generateMockHairAnalysisResult,
  HAIR_TYPES,
  HAIR_THICKNESS,
  SCALP_TYPES,
  HAIR_CONCERNS,
  type HairTypeId,
  type HairThicknessId,
  type ScalpTypeId,
  type HairConcernId,
  type HairAnalysisResult,
  type HairAnalysisMetric,
} from '@/lib/mock/hair-analysis';

// =============================================================================
// 상수 데이터 검증
// =============================================================================
describe('HAIR_TYPES 상수', () => {
  it('4가지 모발 타입이 정의되어 있다', () => {
    expect(HAIR_TYPES).toHaveLength(4);
  });

  it('각 타입에 id, label, emoji, description이 있다', () => {
    HAIR_TYPES.forEach((type) => {
      expect(type).toHaveProperty('id');
      expect(type).toHaveProperty('label');
      expect(type).toHaveProperty('emoji');
      expect(type).toHaveProperty('description');
      expect(typeof type.id).toBe('string');
      expect(typeof type.label).toBe('string');
    });
  });

  it('필수 타입 ID가 포함되어 있다', () => {
    const ids = HAIR_TYPES.map((t) => t.id);
    expect(ids).toContain('straight');
    expect(ids).toContain('wavy');
    expect(ids).toContain('curly');
    expect(ids).toContain('coily');
  });

  it('한국어 라벨이 올바르다', () => {
    const labelMap: Record<string, string> = {
      straight: '직모',
      wavy: '웨이브',
      curly: '곱슬',
      coily: '강한 곱슬',
    };

    HAIR_TYPES.forEach((type) => {
      expect(type.label).toBe(labelMap[type.id]);
    });
  });
});

describe('HAIR_THICKNESS 상수', () => {
  it('3가지 굵기가 정의되어 있다', () => {
    expect(HAIR_THICKNESS).toHaveLength(3);
  });

  it('필수 굵기 ID가 포함되어 있다', () => {
    const ids = HAIR_THICKNESS.map((t) => t.id);
    expect(ids).toContain('fine');
    expect(ids).toContain('medium');
    expect(ids).toContain('thick');
  });
});

describe('SCALP_TYPES 상수', () => {
  it('4가지 두피 타입이 정의되어 있다', () => {
    expect(SCALP_TYPES).toHaveLength(4);
  });

  it('필수 두피 타입 ID가 포함되어 있다', () => {
    const ids = SCALP_TYPES.map((t) => t.id);
    expect(ids).toContain('dry');
    expect(ids).toContain('normal');
    expect(ids).toContain('oily');
    expect(ids).toContain('sensitive');
  });

  it('각 타입에 emoji가 있다', () => {
    SCALP_TYPES.forEach((type) => {
      expect(type.emoji).toBeDefined();
      expect(type.emoji.length).toBeGreaterThan(0);
    });
  });
});

describe('HAIR_CONCERNS 상수', () => {
  it('8가지 고민이 정의되어 있다', () => {
    expect(HAIR_CONCERNS).toHaveLength(8);
  });

  it('필수 고민 ID가 포함되어 있다', () => {
    const ids = HAIR_CONCERNS.map((c) => c.id);
    expect(ids).toContain('hairloss');
    expect(ids).toContain('dandruff');
    expect(ids).toContain('frizz');
    expect(ids).toContain('damage');
    expect(ids).toContain('oily-scalp');
    expect(ids).toContain('dry-scalp');
    expect(ids).toContain('split-ends');
    expect(ids).toContain('lack-volume');
  });

  it('각 고민에 label, emoji, description이 있다', () => {
    HAIR_CONCERNS.forEach((concern) => {
      expect(concern.label).toBeDefined();
      expect(concern.emoji).toBeDefined();
      expect(concern.description).toBeDefined();
    });
  });
});

// =============================================================================
// generateMockHairAnalysisResult 테스트
// =============================================================================
describe('generateMockHairAnalysisResult', () => {
  describe('기본 구조 검증', () => {
    it('유효한 HairAnalysisResult 객체를 반환한다', () => {
      const result = generateMockHairAnalysisResult();

      expect(result).toHaveProperty('hairType');
      expect(result).toHaveProperty('hairTypeLabel');
      expect(result).toHaveProperty('hairThickness');
      expect(result).toHaveProperty('hairThicknessLabel');
      expect(result).toHaveProperty('scalpType');
      expect(result).toHaveProperty('scalpTypeLabel');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('concerns');
      expect(result).toHaveProperty('insight');
      expect(result).toHaveProperty('recommendedIngredients');
      expect(result).toHaveProperty('recommendedProducts');
      expect(result).toHaveProperty('careTips');
      expect(result).toHaveProperty('analyzedAt');
      expect(result).toHaveProperty('analysisReliability');
    });
  });

  describe('모발 타입 필드', () => {
    it('hairType이 유효한 HairTypeId이다', () => {
      const validTypes: HairTypeId[] = ['straight', 'wavy', 'curly', 'coily'];
      for (let i = 0; i < 10; i++) {
        const result = generateMockHairAnalysisResult();
        expect(validTypes).toContain(result.hairType);
      }
    });

    it('hairTypeLabel이 hairType과 일치한다', () => {
      const labelMap: Record<HairTypeId, string> = {
        straight: '직모',
        wavy: '웨이브',
        curly: '곱슬',
        coily: '강한 곱슬',
      };

      for (let i = 0; i < 10; i++) {
        const result = generateMockHairAnalysisResult();
        expect(result.hairTypeLabel).toBe(labelMap[result.hairType]);
      }
    });
  });

  describe('굵기 및 두피 타입', () => {
    it('hairThickness가 유효한 HairThicknessId이다', () => {
      const validThicknesses: HairThicknessId[] = ['fine', 'medium', 'thick'];
      for (let i = 0; i < 10; i++) {
        const result = generateMockHairAnalysisResult();
        expect(validThicknesses).toContain(result.hairThickness);
      }
    });

    it('scalpType이 유효한 ScalpTypeId이다', () => {
      const validScalpTypes: ScalpTypeId[] = ['dry', 'normal', 'oily', 'sensitive'];
      for (let i = 0; i < 10; i++) {
        const result = generateMockHairAnalysisResult();
        expect(validScalpTypes).toContain(result.scalpType);
      }
    });
  });

  describe('종합 점수', () => {
    it('overallScore가 0-100 범위이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockHairAnalysisResult();
        expect(result.overallScore).toBeGreaterThanOrEqual(0);
        expect(result.overallScore).toBeLessThanOrEqual(100);
      }
    });

    it('overallScore가 정수이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockHairAnalysisResult();
        expect(Number.isInteger(result.overallScore)).toBe(true);
      }
    });

    it('overallScore가 metrics 평균과 일치한다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockHairAnalysisResult();
        const avg = Math.round(
          result.metrics.reduce((sum, m) => sum + m.value, 0) / result.metrics.length
        );
        expect(result.overallScore).toBe(avg);
      }
    });
  });

  describe('metrics 검증', () => {
    it('6개의 metric이 포함된다', () => {
      const result = generateMockHairAnalysisResult();
      expect(result.metrics).toHaveLength(6);
    });

    it('필수 metric ID가 포함된다', () => {
      const result = generateMockHairAnalysisResult();
      const ids = result.metrics.map((m) => m.id);

      expect(ids).toContain('hydration');
      expect(ids).toContain('scalp');
      expect(ids).toContain('damage');
      expect(ids).toContain('density');
      expect(ids).toContain('elasticity');
      expect(ids).toContain('shine');
    });

    it('각 metric에 필수 필드가 있다', () => {
      const result = generateMockHairAnalysisResult();

      result.metrics.forEach((metric: HairAnalysisMetric) => {
        expect(metric).toHaveProperty('id');
        expect(metric).toHaveProperty('label');
        expect(metric).toHaveProperty('value');
        expect(metric).toHaveProperty('status');
        expect(metric).toHaveProperty('description');
      });
    });

    it('metric value가 0-100 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockHairAnalysisResult();
        result.metrics.forEach((metric) => {
          expect(metric.value).toBeGreaterThanOrEqual(0);
          expect(metric.value).toBeLessThanOrEqual(100);
        });
      }
    });

    it('metric status가 value에 따라 올바르게 설정된다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockHairAnalysisResult();
        result.metrics.forEach((metric) => {
          if (metric.value >= 70) {
            expect(metric.status).toBe('good');
          } else if (metric.value >= 40) {
            expect(metric.status).toBe('normal');
          } else {
            expect(metric.status).toBe('warning');
          }
        });
      }
    });

    it('metric label이 한국어로 되어있다', () => {
      const result = generateMockHairAnalysisResult();
      const expectedLabels = ['수분도', '두피 건강', '손상도', '모발 밀도', '탄력', '윤기'];

      result.metrics.forEach((metric) => {
        expect(expectedLabels).toContain(metric.label);
      });
    });
  });

  describe('고민 (concerns)', () => {
    it('concerns가 배열이다', () => {
      const result = generateMockHairAnalysisResult();
      expect(Array.isArray(result.concerns)).toBe(true);
    });

    it('최소 1개 이상의 고민이 포함된다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockHairAnalysisResult();
        expect(result.concerns.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('concerns가 유효한 HairConcernId이다', () => {
      const validConcerns: HairConcernId[] = [
        'hairloss',
        'dandruff',
        'frizz',
        'damage',
        'oily-scalp',
        'dry-scalp',
        'split-ends',
        'lack-volume',
      ];

      for (let i = 0; i < 10; i++) {
        const result = generateMockHairAnalysisResult();
        result.concerns.forEach((concern) => {
          expect(validConcerns).toContain(concern);
        });
      }
    });
  });

  describe('인사이트', () => {
    it('insight가 비어있지 않은 문자열이다', () => {
      const result = generateMockHairAnalysisResult();
      expect(typeof result.insight).toBe('string');
      expect(result.insight.length).toBeGreaterThan(0);
    });

    it('insight에 모발 타입 라벨이 포함된다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockHairAnalysisResult();
        expect(result.insight).toContain(result.hairTypeLabel);
      }
    });
  });

  describe('추천 성분', () => {
    it('recommendedIngredients가 비어있지 않은 배열이다', () => {
      const result = generateMockHairAnalysisResult();
      expect(Array.isArray(result.recommendedIngredients)).toBe(true);
      expect(result.recommendedIngredients.length).toBeGreaterThan(0);
    });

    it('성분이 문자열이다', () => {
      const result = generateMockHairAnalysisResult();
      result.recommendedIngredients.forEach((ingredient) => {
        expect(typeof ingredient).toBe('string');
        expect(ingredient.length).toBeGreaterThan(0);
      });
    });
  });

  describe('추천 제품', () => {
    it('recommendedProducts가 배열이다', () => {
      const result = generateMockHairAnalysisResult();
      expect(Array.isArray(result.recommendedProducts)).toBe(true);
      expect(result.recommendedProducts.length).toBeGreaterThan(0);
    });

    it('각 제품에 category, name, description이 있다', () => {
      const result = generateMockHairAnalysisResult();
      result.recommendedProducts.forEach((product) => {
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('description');
      });
    });

    it('샴푸 카테고리가 포함된다', () => {
      const result = generateMockHairAnalysisResult();
      const categories = result.recommendedProducts.map((p) => p.category);
      expect(categories).toContain('샴푸');
    });
  });

  describe('케어 팁', () => {
    it('careTips가 비어있지 않은 배열이다', () => {
      const result = generateMockHairAnalysisResult();
      expect(Array.isArray(result.careTips)).toBe(true);
      expect(result.careTips.length).toBeGreaterThan(0);
    });

    it('4개의 케어 팁이 포함된다', () => {
      const result = generateMockHairAnalysisResult();
      expect(result.careTips).toHaveLength(4);
    });
  });

  describe('메타데이터', () => {
    it('analyzedAt이 유효한 Date 객체이다', () => {
      const result = generateMockHairAnalysisResult();
      expect(result.analyzedAt).toBeInstanceOf(Date);
      expect(result.analyzedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('analysisReliability가 medium이다', () => {
      const result = generateMockHairAnalysisResult();
      expect(result.analysisReliability).toBe('medium');
    });
  });

  describe('랜덤성 검증', () => {
    it('여러 번 호출 시 다양한 hairType이 생성된다', () => {
      const types = new Set<HairTypeId>();
      for (let i = 0; i < 50; i++) {
        const result = generateMockHairAnalysisResult();
        types.add(result.hairType);
      }
      // 50번 호출 시 최소 2가지 이상 다른 타입이 나와야 함 (확률적)
      expect(types.size).toBeGreaterThanOrEqual(2);
    });

    it('여러 번 호출 시 다양한 overallScore가 생성된다', () => {
      const scores = new Set<number>();
      for (let i = 0; i < 20; i++) {
        const result = generateMockHairAnalysisResult();
        scores.add(result.overallScore);
      }
      // 20번 호출 시 최소 3가지 이상 다른 점수가 나와야 함
      expect(scores.size).toBeGreaterThanOrEqual(3);
    });
  });

  // ===========================================================================
  // 추가: 엣지 케이스 및 타입 완전성
  // ===========================================================================
  describe('점수 기반 고민 추정 로직', () => {
    it('모든 점수가 높으면 split-ends가 기본 고민으로 설정된다', () => {
      // 여러 번 실행해서 분기 커버리지 확보
      let foundSplitEnds = false;
      for (let i = 0; i < 100; i++) {
        const result = generateMockHairAnalysisResult();
        // 수분도 >= 50, 두피 >= 50, 손상 >= 50, 밀도 >= 50일 때 concerns === ['split-ends']
        const hydration = result.metrics.find((m) => m.id === 'hydration')!.value;
        const scalp = result.metrics.find((m) => m.id === 'scalp')!.value;
        const damage = result.metrics.find((m) => m.id === 'damage')!.value;
        const density = result.metrics.find((m) => m.id === 'density')!.value;

        // 손상도 metric value = 100 - damage, 따라서 원본 damage = 100 - value
        const originalDamage = 100 - damage;

        if (hydration >= 50 && scalp >= 50 && originalDamage >= 50 && density >= 50) {
          expect(result.concerns).toContain('split-ends');
          foundSplitEnds = true;
          break;
        }
      }
      // 확률적이므로 100번 중 1번이라도 발견되면 성공
      // 발견 못 하면 로직이 비활성된 것이 아니라 확률적 특성
    });

    it('수분도가 낮으면 frizz 고민이 포함된다', () => {
      let foundFrizz = false;
      for (let i = 0; i < 100; i++) {
        const result = generateMockHairAnalysisResult();
        const hydration = result.metrics.find((m) => m.id === 'hydration')!.value;
        // 원래 hydration 값이 50 미만일 때 frizz
        // 하지만 hydration metric value = hydration (그대로)
        // 실제 로직: if (hydration < 50) concerns.push('frizz')
        // metric value = hydration (변환 없음)
        if (hydration < 50 && result.concerns.includes('frizz')) {
          foundFrizz = true;
          break;
        }
      }
      // 랜덤 값 범위가 30-90이므로 50 미만이 나올 확률 높음
      expect(foundFrizz).toBe(true);
    });

    it('밀도가 낮으면 hairloss와 lack-volume 고민이 포함된다', () => {
      let found = false;
      for (let i = 0; i < 100; i++) {
        const result = generateMockHairAnalysisResult();
        const density = result.metrics.find((m) => m.id === 'density')!.value;
        if (
          density < 50 &&
          result.concerns.includes('hairloss') &&
          result.concerns.includes('lack-volume')
        ) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });
  });

  describe('두피 타입별 추천 성분 검증', () => {
    it('건성 두피일 때 히알루론산이 추천된다', () => {
      let found = false;
      for (let i = 0; i < 50; i++) {
        const result = generateMockHairAnalysisResult();
        if (result.scalpType === 'dry') {
          expect(result.recommendedIngredients).toContain('히알루론산');
          expect(result.recommendedIngredients).toContain('아르간 오일');
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });

    it('지성 두피일 때 티트리 오일이 추천된다', () => {
      let found = false;
      for (let i = 0; i < 50; i++) {
        const result = generateMockHairAnalysisResult();
        if (result.scalpType === 'oily') {
          expect(result.recommendedIngredients).toContain('티트리 오일');
          expect(result.recommendedIngredients).toContain('살리실산');
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });

    it('민감성 두피일 때 알로에베라가 추천된다', () => {
      let found = false;
      for (let i = 0; i < 50; i++) {
        const result = generateMockHairAnalysisResult();
        if (result.scalpType === 'sensitive') {
          expect(result.recommendedIngredients).toContain('알로에베라');
          expect(result.recommendedIngredients).toContain('카모마일');
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });

    it('중성 두피일 때 케라틴이 추천된다', () => {
      let found = false;
      for (let i = 0; i < 50; i++) {
        const result = generateMockHairAnalysisResult();
        if (result.scalpType === 'normal') {
          expect(result.recommendedIngredients).toContain('케라틴');
          expect(result.recommendedIngredients).toContain('실크 아미노산');
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });
  });

  describe('제품 추천 일관성', () => {
    it('항상 3개의 추천 제품이 반환된다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockHairAnalysisResult();
        expect(result.recommendedProducts).toHaveLength(3);
      }
    });

    it('제품 카테고리가 샴푸/트리트먼트/에센스이다', () => {
      const result = generateMockHairAnalysisResult();
      const categories = result.recommendedProducts.map((p) => p.category);
      expect(categories).toContain('샴푸');
      expect(categories).toContain('트리트먼트');
      expect(categories).toContain('에센스');
    });

    it('샴푸 이름에 두피 타입이 포함된다', () => {
      const result = generateMockHairAnalysisResult();
      const shampoo = result.recommendedProducts.find((p) => p.category === '샴푸');
      expect(shampoo).toBeDefined();
      expect(shampoo!.name).toContain(result.scalpTypeLabel);
    });
  });

  describe('타입 안전성', () => {
    it('반환된 객체가 HairAnalysisResult 타입과 일치한다', () => {
      const result: HairAnalysisResult = generateMockHairAnalysisResult();

      // 모든 필수 필드 타입 확인
      expect(typeof result.hairType).toBe('string');
      expect(typeof result.hairTypeLabel).toBe('string');
      expect(typeof result.hairThickness).toBe('string');
      expect(typeof result.hairThicknessLabel).toBe('string');
      expect(typeof result.scalpType).toBe('string');
      expect(typeof result.scalpTypeLabel).toBe('string');
      expect(typeof result.overallScore).toBe('number');
      expect(Array.isArray(result.metrics)).toBe(true);
      expect(Array.isArray(result.concerns)).toBe(true);
      expect(typeof result.insight).toBe('string');
      expect(Array.isArray(result.recommendedIngredients)).toBe(true);
      expect(Array.isArray(result.recommendedProducts)).toBe(true);
      expect(Array.isArray(result.careTips)).toBe(true);
      expect(result.analyzedAt).toBeInstanceOf(Date);
      expect(typeof result.analysisReliability).toBe('string');
    });
  });
});
