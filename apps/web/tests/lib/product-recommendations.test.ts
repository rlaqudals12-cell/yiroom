/**
 * 제품 추천 시스템 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  getRoutineForSkinType,
  getProductsForConcerns,
  getMakeupRecommendations,
  extractConcernsFromMetrics,
  generateProductRecommendations,
  formatProductsForDB,
} from '@/lib/product-recommendations';
import type { SkinType } from '@/lib/ingredients';

describe('제품 추천 시스템', () => {
  describe('getRoutineForSkinType', () => {
    const skinTypes: SkinType[] = [
      'dry',
      'oily',
      'sensitive',
      'combination',
      'normal',
    ];

    skinTypes.forEach((skinType) => {
      it(`${skinType} 피부 타입의 루틴을 반환한다`, () => {
        const routine = getRoutineForSkinType(skinType);

        expect(routine).toBeDefined();
        expect(routine.length).toBe(5); // 5단계 루틴
        routine.forEach((step, index) => {
          expect(step.step).toBe(index + 1);
          expect(step.category).toBeDefined();
          expect(step.categoryLabel).toBeDefined();
          expect(step.products.length).toBeGreaterThan(0);
          expect(step.tip).toBeDefined();
        });
      });
    });

    it('건성 피부 루틴은 클렌저부터 선크림까지 포함한다', () => {
      const routine = getRoutineForSkinType('dry');
      const categories = routine.map((r) => r.category);

      expect(categories).toContain('cleanser');
      expect(categories).toContain('toner');
      expect(categories).toContain('serum');
      expect(categories).toContain('moisturizer');
      expect(categories).toContain('sunscreen');
    });
  });

  describe('getProductsForConcerns', () => {
    it('수분 부족 고민에 적합한 제품을 반환한다', () => {
      const products = getProductsForConcerns(['hydration'], 'dry');

      expect(products.length).toBeGreaterThan(0);
      products.forEach((product) => {
        expect(product.suitableFor).toContain('dry');
      });
    });

    it('유분 과다 고민에 적합한 제품을 반환한다', () => {
      const products = getProductsForConcerns(['oil'], 'oily');

      expect(products.length).toBeGreaterThan(0);
      products.forEach((product) => {
        expect(product.suitableFor).toContain('oily');
      });
    });

    it('민감성 피부에 부적합한 제품은 제외된다', () => {
      const products = getProductsForConcerns(
        ['pigmentation', 'pores'],
        'sensitive'
      );

      products.forEach((product) => {
        // avoidFor가 있는 경우에만 확인 (선택적 필드)
        if (product.avoidFor) {
          expect(product.avoidFor).not.toContain('sensitive');
        }
      });
    });

    it('여러 고민을 동시에 처리한다', () => {
      const products = getProductsForConcerns(
        ['hydration', 'wrinkles', 'pores'],
        'normal'
      );

      expect(products.length).toBeGreaterThan(0);
    });

    it('중복 제품은 제거된다', () => {
      const products = getProductsForConcerns(
        ['hydration', 'trouble'],
        'normal'
      );
      const names = products.map((p) => p.name);
      const uniqueNames = [...new Set(names)];

      expect(names.length).toBe(uniqueNames.length);
    });
  });

  describe('getMakeupRecommendations', () => {
    const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];

    seasons.forEach((season) => {
      it(`${season} 시즌의 메이크업 추천을 반환한다`, () => {
        const makeup = getMakeupRecommendations(season);

        expect(makeup.length).toBe(4); // foundation, lipstick, blush, eyeshadow
        makeup.forEach((rec) => {
          expect(rec.category).toBeDefined();
          expect(rec.categoryLabel).toBeDefined();
          expect(rec.recommendations.length).toBeGreaterThan(0);
          expect(rec.colorTone).toBeDefined();
        });
      });
    });

    it('null 시즌은 빈 배열을 반환한다', () => {
      const makeup = getMakeupRecommendations(null);
      expect(makeup).toEqual([]);
    });

    it('잘못된 시즌은 빈 배열을 반환한다', () => {
      const makeup = getMakeupRecommendations('Invalid');
      expect(makeup).toEqual([]);
    });
  });

  describe('extractConcernsFromMetrics', () => {
    it('수분도가 낮으면 hydration 고민을 추출한다', () => {
      const concerns = extractConcernsFromMetrics({
        hydration: 40,
        oil_level: 50,
        pores: 60,
        pigmentation: 60,
        wrinkles: 60,
        sensitivity: 60,
      });

      expect(concerns).toContain('hydration');
    });

    it('유분도가 높으면 oil 고민을 추출한다', () => {
      const concerns = extractConcernsFromMetrics({
        hydration: 60,
        oil_level: 70,
        pores: 60,
        pigmentation: 60,
        wrinkles: 60,
        sensitivity: 60,
      });

      expect(concerns).toContain('oil');
    });

    it('모공 점수가 낮으면 pores 고민을 추출한다', () => {
      const concerns = extractConcernsFromMetrics({
        hydration: 60,
        oil_level: 50,
        pores: 40,
        pigmentation: 60,
        wrinkles: 60,
        sensitivity: 60,
      });

      expect(concerns).toContain('pores');
    });

    it('null 값은 무시된다', () => {
      const concerns = extractConcernsFromMetrics({
        hydration: null,
        oil_level: null,
        pores: null,
        pigmentation: null,
        wrinkles: null,
        sensitivity: null,
      });

      expect(concerns).toEqual([]);
    });

    it('복합적인 고민을 모두 추출한다', () => {
      const concerns = extractConcernsFromMetrics({
        hydration: 30,
        oil_level: 75,
        pores: 35,
        pigmentation: 40,
        wrinkles: 45,
        sensitivity: 40,
      });

      expect(concerns).toContain('hydration');
      expect(concerns).toContain('oil');
      expect(concerns).toContain('pores');
      expect(concerns).toContain('pigmentation');
      expect(concerns).toContain('wrinkles');
      expect(concerns).toContain('trouble');
    });
  });

  describe('generateProductRecommendations', () => {
    it('통합 제품 추천을 생성한다', () => {
      const recommendations = generateProductRecommendations('oily', {
        hydration: 60,
        oil_level: 75,
        pores: 40,
        pigmentation: 60,
        wrinkles: 70,
        sensitivity: 60,
      });

      expect(recommendations.routine).toBeDefined();
      expect(recommendations.routine.length).toBe(5);
      expect(recommendations.specialCare).toBeDefined();
      expect(recommendations.skincareRoutine).toBeDefined();
      expect(recommendations.skincareRoutine.morning).toBeDefined();
      expect(recommendations.skincareRoutine.evening).toBeDefined();
      expect(recommendations.careTips).toBeDefined();
      expect(recommendations.careTips.weeklyCare).toBeDefined();
      expect(recommendations.careTips.lifestyleTips).toBeDefined();
    });

    it('퍼스널 컬러가 있으면 메이크업 추천을 포함한다', () => {
      const recommendations = generateProductRecommendations(
        'normal',
        {
          hydration: 60,
          oil_level: 50,
          pores: 60,
          pigmentation: 60,
          wrinkles: 60,
          sensitivity: 60,
        },
        'Spring'
      );

      expect(recommendations.makeupRecommendations).toBeDefined();
      expect(recommendations.makeupRecommendations?.length).toBe(4);
    });

    it('퍼스널 컬러가 없으면 메이크업 추천이 undefined이다', () => {
      const recommendations = generateProductRecommendations('normal', {
        hydration: 60,
        oil_level: 50,
        pores: 60,
        pigmentation: 60,
        wrinkles: 60,
        sensitivity: 60,
      });

      expect(recommendations.makeupRecommendations).toBeUndefined();
    });

    it('특화 제품은 가격대별로 정렬된다', () => {
      const recommendations = generateProductRecommendations('normal', {
        hydration: 30, // low - will trigger hydration concern
        oil_level: 50,
        pores: 60,
        pigmentation: 60,
        wrinkles: 30, // low - will trigger wrinkles concern
        sensitivity: 60,
      });

      // 특화 제품이 있는 경우 가격대 순서 확인
      if (recommendations.specialCare.length > 1) {
        const priceOrder = { budget: 1, mid: 2, premium: 3 };
        for (let i = 1; i < recommendations.specialCare.length; i++) {
          const prev = priceOrder[recommendations.specialCare[i - 1].priceRange];
          const curr = priceOrder[recommendations.specialCare[i].priceRange];
          expect(prev).toBeLessThanOrEqual(curr);
        }
      }
    });
  });

  describe('formatProductsForDB', () => {
    it('추천을 DB 저장 형식으로 변환한다', () => {
      const recommendations = generateProductRecommendations('dry', {
        hydration: 40,
        oil_level: 50,
        pores: 60,
        pigmentation: 60,
        wrinkles: 60,
        sensitivity: 60,
      });

      const formatted = formatProductsForDB(recommendations);

      expect(formatted).toBeDefined();
      expect(formatted.cleanser).toBeDefined();
      expect(formatted.toner).toBeDefined();
      expect(formatted.serum).toBeDefined();
      expect(formatted.moisturizer).toBeDefined();
      expect(formatted.sunscreen).toBeDefined();
    });

    it('특화 제품이 있으면 specialCare 키가 포함된다', () => {
      const recommendations = generateProductRecommendations('normal', {
        hydration: 30,
        oil_level: 50,
        pores: 60,
        pigmentation: 60,
        wrinkles: 60,
        sensitivity: 60,
      });

      const formatted = formatProductsForDB(recommendations);

      if (recommendations.specialCare.length > 0) {
        expect(formatted.specialCare).toBeDefined();
        expect(formatted.specialCare.length).toBe(
          recommendations.specialCare.length
        );
      }
    });
  });
});

/**
 * TODO: 배포 전 마이그레이션 파일 작성 필요
 * - supabase/migrations/에 Phase 1 테이블 생성 SQL 추가
 * - ingredients 테이블 마이그레이션
 * - 관련 RLS 정책 설정
 */
