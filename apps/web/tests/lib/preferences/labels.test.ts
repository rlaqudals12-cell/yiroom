/**
 * 선호/기피 시스템 다국어 레이블 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  AVOID_LEVEL_LABELS,
  CANNOT_VERB_LABELS,
  AVOID_REASON_LABELS,
  AVOID_LEVEL_COLORS,
  FDA_ALLERGEN_LABELS,
  DIETARY_RESTRICTION_LABELS,
  getAvoidLevelLabel,
  getCannotLabel,
  getAvoidReasonLabel,
  getAvoidLevelColors,
} from '@/lib/preferences/labels';
import type { SupportedLocale } from '@/lib/preferences/labels';

const LOCALES: SupportedLocale[] = ['ko', 'en', 'ja', 'zh_CN', 'zh_TW'];

describe('preferences/labels', () => {
  // ============================================
  // 데이터 무결성
  // ============================================
  describe('데이터 무결성', () => {
    it('AVOID_LEVEL_LABELS: 모든 로케일에 4개 수준 존재', () => {
      const levels = ['dislike', 'avoid', 'cannot', 'danger'];
      for (const locale of LOCALES) {
        for (const level of levels) {
          expect(
            AVOID_LEVEL_LABELS[locale][level as keyof (typeof AVOID_LEVEL_LABELS)['ko']]
          ).toBeTruthy();
        }
      }
    });

    it('CANNOT_VERB_LABELS: 모든 로케일에 5개 도메인 존재', () => {
      const domains = ['nutrition', 'workout', 'beauty', 'color', 'style'];
      for (const locale of LOCALES) {
        for (const domain of domains) {
          expect(
            CANNOT_VERB_LABELS[locale][domain as keyof (typeof CANNOT_VERB_LABELS)['ko']]
          ).toBeTruthy();
        }
      }
    });

    it('AVOID_REASON_LABELS: 모든 로케일에 12개 이유 존재', () => {
      for (const locale of LOCALES) {
        expect(Object.keys(AVOID_REASON_LABELS[locale])).toHaveLength(12);
      }
    });

    it('FDA_ALLERGEN_LABELS: 모든 로케일에 9대 알레르겐 존재', () => {
      const allergens = [
        'milk',
        'eggs',
        'fish',
        'shellfish',
        'tree_nuts',
        'peanuts',
        'wheat',
        'soybeans',
        'sesame',
      ];
      for (const locale of LOCALES) {
        for (const allergen of allergens) {
          expect(
            FDA_ALLERGEN_LABELS[locale][allergen as keyof (typeof FDA_ALLERGEN_LABELS)['ko']]
          ).toBeTruthy();
        }
      }
    });

    it('DIETARY_RESTRICTION_LABELS: 모든 로케일에 11개 제한 존재', () => {
      for (const locale of LOCALES) {
        expect(Object.keys(DIETARY_RESTRICTION_LABELS[locale])).toHaveLength(11);
      }
    });

    it('AVOID_LEVEL_COLORS: 4개 수준 모두 bg/text/border/icon 포함', () => {
      const levels = ['dislike', 'avoid', 'cannot', 'danger'] as const;
      for (const level of levels) {
        const colors = AVOID_LEVEL_COLORS[level];
        expect(colors.bg).toBeTruthy();
        expect(colors.text).toBeTruthy();
        expect(colors.border).toBeTruthy();
        expect(colors.icon).toBeTruthy();
      }
    });
  });

  // ============================================
  // getAvoidLevelLabel
  // ============================================
  describe('getAvoidLevelLabel', () => {
    it('한국어 기본값', () => {
      expect(getAvoidLevelLabel('dislike')).toBe('안 좋아해요');
      expect(getAvoidLevelLabel('danger')).toBe('절대 안 돼요');
    });

    it('영어 레이블', () => {
      expect(getAvoidLevelLabel('avoid', 'en')).toBe('I prefer to avoid');
    });

    it('일본어 레이블', () => {
      expect(getAvoidLevelLabel('cannot', 'ja')).toBe('食べられない');
    });
  });

  // ============================================
  // getCannotLabel
  // ============================================
  describe('getCannotLabel', () => {
    it('도메인별 한국어 동사 변형', () => {
      expect(getCannotLabel('nutrition')).toBe('못 먹어요');
      expect(getCannotLabel('workout')).toBe('못 해요');
      expect(getCannotLabel('beauty')).toBe('못 써요');
      expect(getCannotLabel('color')).toBe('안 어울려요');
      expect(getCannotLabel('style')).toBe('못 입어요');
    });

    it('영어 도메인별 동사', () => {
      expect(getCannotLabel('nutrition', 'en')).toBe("I can't eat");
      expect(getCannotLabel('workout', 'en')).toBe("I can't do");
    });
  });

  // ============================================
  // getAvoidReasonLabel
  // ============================================
  describe('getAvoidReasonLabel', () => {
    it('한국어 기피 이유', () => {
      expect(getAvoidReasonLabel('allergy')).toBe('알레르기');
      expect(getAvoidReasonLabel('religious')).toBe('종교적 이유');
    });

    it('중국어 간체 기피 이유', () => {
      expect(getAvoidReasonLabel('skin_reaction', 'zh_CN')).toBe('皮肤反应');
    });
  });

  // ============================================
  // getAvoidLevelColors
  // ============================================
  describe('getAvoidLevelColors', () => {
    it('danger → 빨간색 계열', () => {
      const colors = getAvoidLevelColors('danger');
      expect(colors.bg).toContain('red');
      expect(colors.icon).toBe('🔴');
    });

    it('dislike → 회색 계열', () => {
      const colors = getAvoidLevelColors('dislike');
      expect(colors.bg).toContain('gray');
      expect(colors.icon).toBe('⚪');
    });
  });

  // ============================================
  // 로케일 일관성
  // ============================================
  describe('로케일 일관성', () => {
    it('모든 레이블 객체의 로케일 키가 동일', () => {
      const expectedLocales = new Set(LOCALES);

      expect(new Set(Object.keys(AVOID_LEVEL_LABELS))).toEqual(expectedLocales);
      expect(new Set(Object.keys(CANNOT_VERB_LABELS))).toEqual(expectedLocales);
      expect(new Set(Object.keys(AVOID_REASON_LABELS))).toEqual(expectedLocales);
      expect(new Set(Object.keys(FDA_ALLERGEN_LABELS))).toEqual(expectedLocales);
      expect(new Set(Object.keys(DIETARY_RESTRICTION_LABELS))).toEqual(expectedLocales);
    });

    it('빈 문자열 레이블 없음', () => {
      for (const locale of LOCALES) {
        for (const val of Object.values(AVOID_LEVEL_LABELS[locale])) {
          expect(val.trim().length).toBeGreaterThan(0);
        }
        for (const val of Object.values(AVOID_REASON_LABELS[locale])) {
          expect(val.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });
});
