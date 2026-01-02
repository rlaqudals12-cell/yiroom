/**
 * S-1 피부 분석 Mock 로직 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateMockAnalysisResult,
  getScoreColor,
  getScoreBgColor,
  getStatusLabel,
  LOADING_TIPS,
  type SkinMetric,
} from '@/lib/mock/skin-analysis';

describe('S-1 피부 분석 Mock', () => {
  describe('generateMockAnalysisResult', () => {
    it('분석 결과를 반환한다', () => {
      const result = generateMockAnalysisResult();

      expect(result).toBeDefined();
      expect(result.overallScore).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.insight).toBeDefined();
      expect(result.recommendedIngredients).toBeDefined();
      expect(result.analyzedAt).toBeInstanceOf(Date);
    });

    it('전체 점수는 0~100 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockAnalysisResult();
        expect(result.overallScore).toBeGreaterThanOrEqual(0);
        expect(result.overallScore).toBeLessThanOrEqual(100);
      }
    });

    it('7가지 피부 지표를 반환한다', () => {
      const result = generateMockAnalysisResult();
      expect(result.metrics).toHaveLength(7);

      const expectedIds = [
        'hydration',
        'oil',
        'pores',
        'wrinkles',
        'elasticity',
        'pigmentation',
        'trouble',
      ];
      const metricIds = result.metrics.map((m) => m.id);
      expect(metricIds).toEqual(expectedIds);
    });

    it('각 지표는 올바른 구조를 가진다', () => {
      const result = generateMockAnalysisResult();

      result.metrics.forEach((metric: SkinMetric) => {
        expect(metric.id).toBeDefined();
        expect(metric.name).toBeDefined();
        expect(typeof metric.value).toBe('number');
        expect(metric.value).toBeGreaterThanOrEqual(0);
        expect(metric.value).toBeLessThanOrEqual(100);
        expect(['good', 'normal', 'warning']).toContain(metric.status);
        expect(metric.description).toBeDefined();
      });
    });

    it('지표 값에 따라 올바른 상태가 부여된다', () => {
      // 여러 번 실행해서 다양한 케이스 확인
      for (let i = 0; i < 20; i++) {
        const result = generateMockAnalysisResult();

        result.metrics.forEach((metric: SkinMetric) => {
          if (metric.value >= 71) {
            expect(metric.status).toBe('good');
          } else if (metric.value >= 41) {
            expect(metric.status).toBe('normal');
          } else {
            expect(metric.status).toBe('warning');
          }
        });
      }
    });

    it('전체 점수는 지표들의 평균이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockAnalysisResult();
        const expectedAvg = Math.round(
          result.metrics.reduce((sum, m) => sum + m.value, 0) / result.metrics.length
        );
        expect(result.overallScore).toBe(expectedAvg);
      }
    });

    it('인사이트는 문자열이다', () => {
      const result = generateMockAnalysisResult();
      expect(typeof result.insight).toBe('string');
      expect(result.insight.length).toBeGreaterThan(0);
    });

    it('추천 성분은 2~3개를 반환한다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockAnalysisResult();
        expect(result.recommendedIngredients.length).toBeGreaterThanOrEqual(2);
        expect(result.recommendedIngredients.length).toBeLessThanOrEqual(3);
      }
    });

    it('추천 성분은 이름과 이유를 포함한다', () => {
      const result = generateMockAnalysisResult();

      result.recommendedIngredients.forEach((ingredient) => {
        expect(ingredient.name).toBeDefined();
        expect(typeof ingredient.name).toBe('string');
        expect(ingredient.reason).toBeDefined();
        expect(typeof ingredient.reason).toBe('string');
      });
    });
  });

  describe('유틸리티 함수', () => {
    describe('getScoreColor', () => {
      it('71점 이상은 녹색을 반환한다', () => {
        expect(getScoreColor(71)).toBe('text-green-500');
        expect(getScoreColor(85)).toBe('text-green-500');
        expect(getScoreColor(100)).toBe('text-green-500');
      });

      it('41~70점은 노란색을 반환한다', () => {
        expect(getScoreColor(41)).toBe('text-yellow-500');
        expect(getScoreColor(55)).toBe('text-yellow-500');
        expect(getScoreColor(70)).toBe('text-yellow-500');
      });

      it('40점 이하는 빨간색을 반환한다', () => {
        expect(getScoreColor(40)).toBe('text-red-500');
        expect(getScoreColor(20)).toBe('text-red-500');
        expect(getScoreColor(0)).toBe('text-red-500');
      });
    });

    describe('getScoreBgColor', () => {
      it('71점 이상은 녹색 배경을 반환한다', () => {
        expect(getScoreBgColor(71)).toBe('bg-green-500');
        expect(getScoreBgColor(100)).toBe('bg-green-500');
      });

      it('41~70점은 노란색 배경을 반환한다', () => {
        expect(getScoreBgColor(41)).toBe('bg-yellow-500');
        expect(getScoreBgColor(70)).toBe('bg-yellow-500');
      });

      it('40점 이하는 빨간색 배경을 반환한다', () => {
        expect(getScoreBgColor(40)).toBe('bg-red-500');
        expect(getScoreBgColor(0)).toBe('bg-red-500');
      });
    });

    describe('getStatusLabel', () => {
      it('상태에 따른 한글 라벨을 반환한다', () => {
        expect(getStatusLabel('good')).toBe('좋음');
        expect(getStatusLabel('normal')).toBe('보통');
        expect(getStatusLabel('warning')).toBe('주의');
      });
    });
  });

  describe('상수 데이터 검증', () => {
    it('LOADING_TIPS에 4개의 팁이 있다', () => {
      expect(LOADING_TIPS).toHaveLength(4);
      LOADING_TIPS.forEach((tip) => {
        expect(typeof tip).toBe('string');
        expect(tip.length).toBeGreaterThan(0);
      });
    });
  });

  describe('지표별 값 범위 테스트', () => {
    it('수분도(hydration)는 40~85 범위이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockAnalysisResult();
        const hydration = result.metrics.find((m) => m.id === 'hydration');
        expect(hydration?.value).toBeGreaterThanOrEqual(40);
        expect(hydration?.value).toBeLessThanOrEqual(85);
      }
    });

    it('유분도(oil)는 30~70 범위이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockAnalysisResult();
        const oil = result.metrics.find((m) => m.id === 'oil');
        expect(oil?.value).toBeGreaterThanOrEqual(30);
        expect(oil?.value).toBeLessThanOrEqual(70);
      }
    });

    it('모공(pores)은 50~90 범위이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockAnalysisResult();
        const pores = result.metrics.find((m) => m.id === 'pores');
        expect(pores?.value).toBeGreaterThanOrEqual(50);
        expect(pores?.value).toBeLessThanOrEqual(90);
      }
    });

    it('주름(wrinkles)은 60~95 범위이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockAnalysisResult();
        const wrinkles = result.metrics.find((m) => m.id === 'wrinkles');
        expect(wrinkles?.value).toBeGreaterThanOrEqual(60);
        expect(wrinkles?.value).toBeLessThanOrEqual(95);
      }
    });

    it('탄력(elasticity)은 55~90 범위이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockAnalysisResult();
        const elasticity = result.metrics.find((m) => m.id === 'elasticity');
        expect(elasticity?.value).toBeGreaterThanOrEqual(55);
        expect(elasticity?.value).toBeLessThanOrEqual(90);
      }
    });

    it('색소침착(pigmentation)은 45~85 범위이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockAnalysisResult();
        const pigmentation = result.metrics.find((m) => m.id === 'pigmentation');
        expect(pigmentation?.value).toBeGreaterThanOrEqual(45);
        expect(pigmentation?.value).toBeLessThanOrEqual(85);
      }
    });

    it('트러블(trouble)은 35~80 범위이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockAnalysisResult();
        const trouble = result.metrics.find((m) => m.id === 'trouble');
        expect(trouble?.value).toBeGreaterThanOrEqual(35);
        expect(trouble?.value).toBeLessThanOrEqual(80);
      }
    });
  });
});

/**
 * 마이그레이션 파일 완료됨:
 * - 00000000000002_phase1_analysis_tables.sql (테이블 생성)
 * - 202512220100_phase1_rls_policies.sql (RLS 정책)
 * - 00000000000001_setup_storage.sql (uploads 버킷)
 */
