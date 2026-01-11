/**
 * 마스크팩 추천 시스템 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  recommendMasks,
  recommendMaskForToday,
  recommendMultiMasking,
  MASK_TYPES,
} from '@/lib/skincare/mask-recommendation';
import type { SkinTypeId, SkinConcernId } from '@/lib/mock/skin-analysis';

describe('mask-recommendation', () => {
  describe('recommendMasks', () => {
    it('지성 피부에 클레이 마스크를 우선 추천해야 함', () => {
      const result = recommendMasks('oily', ['acne']);

      expect(result.recommended).toBeDefined();
      expect(result.recommended.length).toBeGreaterThan(0);
      // 지성 피부는 클레이 마스크가 첫 번째
      expect(result.recommended[0].type).toBe('clay');
    });

    it('건성 피부에 시트/슬리핑 마스크를 추천해야 함', () => {
      const result = recommendMasks('dry', ['dehydration']);

      expect(result.recommended).toBeDefined();
      const types = result.recommended.map((m) => m.type);
      expect(types).toContain('sheet');
    });

    it('민감성 피부에 시트/크림 마스크를 추천해야 함', () => {
      const result = recommendMasks('sensitive', ['redness']);

      expect(result.recommended).toBeDefined();
      const types = result.recommended.map((m) => m.type);
      expect(types).toContain('sheet');
      // 민감성 피부는 클레이나 필링 마스크를 피해야 함
      expect(types).not.toContain('clay');
    });

    it('주간 플랜이 생성되어야 함', () => {
      const result = recommendMasks('normal', []);

      expect(result.weeklyPlan).toBeDefined();
      // 적어도 하나의 요일에 마스크가 배정되어야 함
      const weekDays = Object.values(result.weeklyPlan);
      const hasMask = weekDays.some((day) => day !== undefined);
      expect(hasMask).toBe(true);
    });

    it('개인화 노트가 생성되어야 함', () => {
      const result = recommendMasks('dry', ['dryness']);

      expect(result.personalizationNote).toBeDefined();
      expect(result.personalizationNote.length).toBeGreaterThan(0);
      expect(result.personalizationNote).toContain('건성');
    });

    it('여드름 고민에 클레이 마스크를 추천해야 함', () => {
      const result = recommendMasks('oily', ['acne']);

      const types = result.recommended.map((m) => m.type);
      expect(types).toContain('clay');
    });
  });

  describe('recommendMaskForToday', () => {
    it('건조한 날 시트 마스크를 추천해야 함', () => {
      const result = recommendMaskForToday('normal', {
        hydration: 'dry',
        concerns: [],
      });

      expect(result).toBeDefined();
      expect(result?.type).toBe('sheet');
    });

    it('유분기 많은 날 클레이 마스크를 추천해야 함', () => {
      const result = recommendMaskForToday('oily', {
        hydration: 'oily',
        concerns: [],
      });

      expect(result).toBeDefined();
      expect(result?.type).toBe('clay');
    });

    it('여드름이 있고 민감성 피부면 시트 마스크를 추천해야 함', () => {
      const result = recommendMaskForToday('sensitive', {
        hydration: 'normal',
        concerns: ['acne'],
      });

      expect(result).toBeDefined();
      // 민감성은 클레이 대신 시트
      expect(result?.type).toBe('sheet');
    });

    it('칙칙한 날 필링 마스크를 추천해야 함 (민감성 제외)', () => {
      const result = recommendMaskForToday('normal', {
        hydration: 'normal',
        concerns: ['dullness'],
      });

      expect(result).toBeDefined();
      expect(result?.type).toBe('peel');
    });
  });

  describe('recommendMultiMasking', () => {
    it('복합성 피부용 멀티 마스킹 추천을 반환해야 함', () => {
      const result = recommendMultiMasking();

      expect(result.tZone).toBeDefined();
      expect(result.uZone).toBeDefined();
      expect(result.usage).toBeDefined();

      // T존은 클레이, U존은 시트
      expect(result.tZone.type).toBe('clay');
      expect(result.uZone.type).toBe('sheet');
    });
  });

  describe('MASK_TYPES', () => {
    it('모든 마스크 타입이 정의되어 있어야 함', () => {
      const expectedTypes = ['sheet', 'clay', 'sleeping', 'peel', 'cream'];

      expectedTypes.forEach((type) => {
        expect(MASK_TYPES[type as keyof typeof MASK_TYPES]).toBeDefined();
      });
    });

    it('각 마스크 타입에 필수 필드가 있어야 함', () => {
      Object.values(MASK_TYPES).forEach((mask) => {
        expect(mask.type).toBeDefined();
        expect(mask.name).toBeDefined();
        expect(mask.description).toBeDefined();
        expect(mask.frequency).toBeDefined();
        expect(mask.timing).toBeDefined();
        expect(mask.keyIngredients).toBeDefined();
        expect(mask.suitableFor).toBeDefined();
        expect(mask.targetConcerns).toBeDefined();
        expect(mask.usage).toBeDefined();
      });
    });
  });
});
