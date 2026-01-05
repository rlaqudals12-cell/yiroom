/**
 * 사용자 선호/기피 타입 및 유틸리티 테스트
 * @description preferences.ts 타입 변환 및 유틸 함수 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  toUserPreference,
  isCriticalAvoid,
  getAvoidLevelPriority,
  type UserPreferenceRow,
  type AvoidLevel,
} from '@/types/preferences';
import {
  getAvoidLevelLabel,
  getCannotLabel,
  getAvoidReasonLabel,
  getAvoidLevelColors,
  AVOID_LEVEL_LABELS,
  FDA_ALLERGEN_LABELS,
  DIETARY_RESTRICTION_LABELS,
} from '@/lib/preferences/labels';

// =============================================================================
// Mock 데이터
// =============================================================================

const mockPreferenceRow: UserPreferenceRow = {
  id: 'pref-001',
  clerk_user_id: 'user_123',
  domain: 'nutrition',
  item_type: 'allergen',
  item_id: null,
  item_name: '땅콩',
  item_name_en: 'Peanuts',
  is_favorite: false,
  avoid_level: 'danger',
  avoid_reason: 'allergy',
  avoid_note: '아나필락시스 위험',
  priority: 5,
  source: 'user',
  created_at: '2026-01-05T00:00:00Z',
  updated_at: '2026-01-05T00:00:00Z',
};

// =============================================================================
// 테스트
// =============================================================================

describe('preferences types', () => {
  // ---------------------------------------------------------------------------
  // toUserPreference
  // ---------------------------------------------------------------------------

  describe('toUserPreference', () => {
    it('DB row를 UserPreference로 변환해야 함', () => {
      const result = toUserPreference(mockPreferenceRow);

      expect(result.id).toBe('pref-001');
      expect(result.clerkUserId).toBe('user_123');
      expect(result.domain).toBe('nutrition');
      expect(result.itemType).toBe('allergen');
      expect(result.itemName).toBe('땅콩');
      expect(result.itemNameEn).toBe('Peanuts');
      expect(result.isFavorite).toBe(false);
      expect(result.avoidLevel).toBe('danger');
      expect(result.avoidReason).toBe('allergy');
      expect(result.avoidNote).toBe('아나필락시스 위험');
      expect(result.priority).toBe(5);
      expect(result.source).toBe('user');
    });

    it('null 필드는 undefined로 변환해야 함', () => {
      const rowWithNulls: UserPreferenceRow = {
        ...mockPreferenceRow,
        item_id: null,
        item_name_en: null,
        avoid_level: null,
        avoid_reason: null,
        avoid_note: null,
      };

      const result = toUserPreference(rowWithNulls);

      expect(result.itemId).toBeUndefined();
      expect(result.itemNameEn).toBeUndefined();
      expect(result.avoidLevel).toBeUndefined();
      expect(result.avoidReason).toBeUndefined();
      expect(result.avoidNote).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // isCriticalAvoid
  // ---------------------------------------------------------------------------

  describe('isCriticalAvoid', () => {
    it('danger는 true를 반환해야 함', () => {
      expect(isCriticalAvoid('danger')).toBe(true);
    });

    it('cannot는 true를 반환해야 함', () => {
      expect(isCriticalAvoid('cannot')).toBe(true);
    });

    it('avoid는 false를 반환해야 함', () => {
      expect(isCriticalAvoid('avoid')).toBe(false);
    });

    it('dislike는 false를 반환해야 함', () => {
      expect(isCriticalAvoid('dislike')).toBe(false);
    });

    it('undefined는 false를 반환해야 함', () => {
      expect(isCriticalAvoid(undefined)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // getAvoidLevelPriority
  // ---------------------------------------------------------------------------

  describe('getAvoidLevelPriority', () => {
    it('danger는 4를 반환해야 함', () => {
      expect(getAvoidLevelPriority('danger')).toBe(4);
    });

    it('cannot는 3을 반환해야 함', () => {
      expect(getAvoidLevelPriority('cannot')).toBe(3);
    });

    it('avoid는 2를 반환해야 함', () => {
      expect(getAvoidLevelPriority('avoid')).toBe(2);
    });

    it('dislike는 1을 반환해야 함', () => {
      expect(getAvoidLevelPriority('dislike')).toBe(1);
    });

    it('undefined는 0을 반환해야 함', () => {
      expect(getAvoidLevelPriority(undefined)).toBe(0);
    });

    it('우선순위가 올바른 순서여야 함', () => {
      const levels: AvoidLevel[] = ['dislike', 'avoid', 'cannot', 'danger'];
      const priorities = levels.map(getAvoidLevelPriority);

      // 각 레벨이 이전 레벨보다 높아야 함
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBeGreaterThan(priorities[i - 1]);
      }
    });
  });
});

describe('preferences labels', () => {
  // ---------------------------------------------------------------------------
  // getAvoidLevelLabel
  // ---------------------------------------------------------------------------

  describe('getAvoidLevelLabel', () => {
    it('한국어 레이블을 반환해야 함', () => {
      expect(getAvoidLevelLabel('danger', 'ko')).toBe('절대 안 돼요');
      expect(getAvoidLevelLabel('cannot', 'ko')).toBe('못 먹어요');
      expect(getAvoidLevelLabel('avoid', 'ko')).toBe('피하고 싶어요');
      expect(getAvoidLevelLabel('dislike', 'ko')).toBe('안 좋아해요');
    });

    it('영어 레이블을 반환해야 함', () => {
      expect(getAvoidLevelLabel('danger', 'en')).toBe('Life-threatening');
      expect(getAvoidLevelLabel('cannot', 'en')).toBe("I can't have this");
    });

    it('일본어 레이블을 반환해야 함', () => {
      expect(getAvoidLevelLabel('danger', 'ja')).toBe('絶対ダメ');
      expect(getAvoidLevelLabel('cannot', 'ja')).toBe('食べられない');
    });

    it('중국어 간체 레이블을 반환해야 함', () => {
      expect(getAvoidLevelLabel('danger', 'zh_CN')).toBe('绝对不行');
    });

    it('중국어 번체 레이블을 반환해야 함', () => {
      expect(getAvoidLevelLabel('danger', 'zh_TW')).toBe('絕對不行');
    });

    it('기본값(한국어)을 사용해야 함', () => {
      expect(getAvoidLevelLabel('danger')).toBe('절대 안 돼요');
    });
  });

  // ---------------------------------------------------------------------------
  // getCannotLabel
  // ---------------------------------------------------------------------------

  describe('getCannotLabel', () => {
    it('도메인별로 다른 동사를 반환해야 함 (한국어)', () => {
      expect(getCannotLabel('nutrition', 'ko')).toBe('못 먹어요');
      expect(getCannotLabel('workout', 'ko')).toBe('못 해요');
      expect(getCannotLabel('beauty', 'ko')).toBe('못 써요');
      expect(getCannotLabel('color', 'ko')).toBe('안 어울려요');
      expect(getCannotLabel('style', 'ko')).toBe('못 입어요');
    });

    it('도메인별로 다른 동사를 반환해야 함 (일본어)', () => {
      expect(getCannotLabel('nutrition', 'ja')).toBe('食べられない');
      expect(getCannotLabel('workout', 'ja')).toBe('できない');
      expect(getCannotLabel('beauty', 'ja')).toBe('使えない');
    });
  });

  // ---------------------------------------------------------------------------
  // getAvoidReasonLabel
  // ---------------------------------------------------------------------------

  describe('getAvoidReasonLabel', () => {
    it('한국어 이유 레이블을 반환해야 함', () => {
      expect(getAvoidReasonLabel('allergy', 'ko')).toBe('알레르기');
      expect(getAvoidReasonLabel('religious', 'ko')).toBe('종교적 이유');
      expect(getAvoidReasonLabel('taste', 'ko')).toBe('맛/식감');
    });

    it('영어 이유 레이블을 반환해야 함', () => {
      expect(getAvoidReasonLabel('allergy', 'en')).toBe('Allergy');
      expect(getAvoidReasonLabel('religious', 'en')).toBe('Religious reason');
    });
  });

  // ---------------------------------------------------------------------------
  // getAvoidLevelColors
  // ---------------------------------------------------------------------------

  describe('getAvoidLevelColors', () => {
    it('각 레벨에 대한 색상 객체를 반환해야 함', () => {
      const levels: AvoidLevel[] = ['dislike', 'avoid', 'cannot', 'danger'];

      levels.forEach((level) => {
        const colors = getAvoidLevelColors(level);
        expect(colors).toHaveProperty('bg');
        expect(colors).toHaveProperty('text');
        expect(colors).toHaveProperty('border');
        expect(colors).toHaveProperty('icon');
      });
    });

    it('danger는 빨간색 계열이어야 함', () => {
      const colors = getAvoidLevelColors('danger');
      expect(colors.bg).toContain('red');
      expect(colors.text).toContain('red');
    });

    it('cannot는 주황색 계열이어야 함', () => {
      const colors = getAvoidLevelColors('cannot');
      expect(colors.bg).toContain('orange');
      expect(colors.text).toContain('orange');
    });

    it('avoid는 노란색 계열이어야 함', () => {
      const colors = getAvoidLevelColors('avoid');
      expect(colors.bg).toContain('yellow');
      expect(colors.text).toContain('yellow');
    });

    it('dislike는 회색 계열이어야 함', () => {
      const colors = getAvoidLevelColors('dislike');
      expect(colors.bg).toContain('gray');
      expect(colors.text).toContain('gray');
    });
  });

  // ---------------------------------------------------------------------------
  // 상수 검증
  // ---------------------------------------------------------------------------

  describe('AVOID_LEVEL_LABELS', () => {
    it('5개 언어가 정의되어야 함', () => {
      expect(Object.keys(AVOID_LEVEL_LABELS)).toHaveLength(5);
      expect(AVOID_LEVEL_LABELS).toHaveProperty('ko');
      expect(AVOID_LEVEL_LABELS).toHaveProperty('en');
      expect(AVOID_LEVEL_LABELS).toHaveProperty('ja');
      expect(AVOID_LEVEL_LABELS).toHaveProperty('zh_CN');
      expect(AVOID_LEVEL_LABELS).toHaveProperty('zh_TW');
    });

    it('각 언어에 4개 레벨이 정의되어야 함', () => {
      const levels = ['dislike', 'avoid', 'cannot', 'danger'];
      Object.values(AVOID_LEVEL_LABELS).forEach((labels) => {
        levels.forEach((level) => {
          expect(labels).toHaveProperty(level);
          expect(typeof labels[level as AvoidLevel]).toBe('string');
        });
      });
    });
  });

  describe('FDA_ALLERGEN_LABELS', () => {
    it('9대 알레르겐이 정의되어야 함', () => {
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

      allergens.forEach((allergen) => {
        expect(FDA_ALLERGEN_LABELS.ko).toHaveProperty(allergen);
        expect(FDA_ALLERGEN_LABELS.en).toHaveProperty(allergen);
      });
    });
  });

  describe('DIETARY_RESTRICTION_LABELS', () => {
    it('식이 제한 유형이 정의되어야 함', () => {
      const restrictions = [
        'vegetarian',
        'vegan',
        'halal',
        'kosher',
        'lactose_free',
        'gluten_free',
      ];

      restrictions.forEach((restriction) => {
        expect(DIETARY_RESTRICTION_LABELS.ko).toHaveProperty(restriction);
        expect(DIETARY_RESTRICTION_LABELS.en).toHaveProperty(restriction);
      });
    });
  });
});
