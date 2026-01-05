/**
 * 변환 헬퍼 함수 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  allergiesToPreferences,
  dislikedFoodsToPreferences,
  injuriesToPreferences,
  preferencesToAllergies,
  preferencesToDislikedFoods,
  preferencesToInjuries,
} from '@/lib/preferences/converters';
import type { AllergyType } from '@/types/nutrition';
import type { UserPreference } from '@/types/preferences';

const TEST_USER_ID = 'user_test123';

describe('allergiesToPreferences', () => {
  it('알레르기 목록을 UserPreference 배열로 변환', () => {
    const allergies: AllergyType[] = ['dairy', 'nuts'];
    const result = allergiesToPreferences(allergies, TEST_USER_ID);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      clerkUserId: TEST_USER_ID,
      domain: 'nutrition',
      itemType: 'food_category',
      itemName: '유제품',
      itemNameEn: 'dairy',
      isFavorite: false,
      avoidLevel: 'cannot',
      avoidReason: 'allergy',
      priority: 5,
      source: 'user',
    });
    expect(result[1].itemName).toBe('견과류');
  });

  it('빈 배열을 처리', () => {
    const result = allergiesToPreferences([], TEST_USER_ID);
    expect(result).toHaveLength(0);
  });
});

describe('dislikedFoodsToPreferences', () => {
  it('기피 음식 목록을 UserPreference 배열로 변환', () => {
    const dislikedFoods = ['브로콜리', '당근'];
    const result = dislikedFoodsToPreferences(dislikedFoods, TEST_USER_ID);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      clerkUserId: TEST_USER_ID,
      domain: 'nutrition',
      itemType: 'food',
      itemName: '브로콜리',
      isFavorite: false,
      avoidLevel: 'avoid',
      avoidReason: 'taste',
      priority: 3,
      source: 'user',
    });
  });
});

describe('injuriesToPreferences', () => {
  it('부상 목록을 UserPreference 배열로 변환', () => {
    const injuries = ['knee', 'back'];
    const result = injuriesToPreferences(injuries, TEST_USER_ID);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      clerkUserId: TEST_USER_ID,
      domain: 'workout',
      itemType: 'body_part',
      itemName: '무릎',
      itemNameEn: 'knee',
      isFavorite: false,
      avoidLevel: 'avoid',
      avoidReason: 'injury',
      priority: 4,
      source: 'user',
    });
    expect(result[1].itemName).toBe('허리');
  });

  it('none을 필터링', () => {
    const injuries = ['none', 'knee'];
    const result = injuriesToPreferences(injuries, TEST_USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].itemName).toBe('무릎');
  });

  it('빈 배열을 처리', () => {
    const result = injuriesToPreferences([], TEST_USER_ID);
    expect(result).toHaveLength(0);
  });
});

describe('preferencesToAllergies (역변환)', () => {
  it('UserPreference 배열을 알레르기 목록으로 역변환', () => {
    const preferences: UserPreference[] = [
      {
        id: 'pref_1',
        clerkUserId: TEST_USER_ID,
        domain: 'nutrition',
        itemType: 'food_category',
        itemName: '유제품',
        itemNameEn: 'dairy',
        isFavorite: false,
        avoidLevel: 'cannot',
        avoidReason: 'allergy',
        priority: 5,
        source: 'user',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'pref_2',
        clerkUserId: TEST_USER_ID,
        domain: 'nutrition',
        itemType: 'food_category',
        itemName: '견과류',
        itemNameEn: 'nuts',
        isFavorite: false,
        avoidLevel: 'cannot',
        avoidReason: 'allergy',
        priority: 5,
        source: 'user',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const result = preferencesToAllergies(preferences);
    expect(result).toEqual(['dairy', 'nuts']);
  });

  it('알레르기가 아닌 항목을 필터링', () => {
    const preferences: UserPreference[] = [
      {
        id: 'pref_1',
        clerkUserId: TEST_USER_ID,
        domain: 'nutrition',
        itemType: 'food',
        itemName: '브로콜리',
        isFavorite: false,
        avoidLevel: 'avoid',
        avoidReason: 'taste',
        priority: 3,
        source: 'user',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const result = preferencesToAllergies(preferences);
    expect(result).toHaveLength(0);
  });
});

describe('preferencesToDislikedFoods (역변환)', () => {
  it('UserPreference 배열을 기피 음식 목록으로 역변환', () => {
    const preferences: UserPreference[] = [
      {
        id: 'pref_1',
        clerkUserId: TEST_USER_ID,
        domain: 'nutrition',
        itemType: 'food',
        itemName: '브로콜리',
        isFavorite: false,
        avoidLevel: 'avoid',
        avoidReason: 'taste',
        priority: 3,
        source: 'user',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const result = preferencesToDislikedFoods(preferences);
    expect(result).toEqual(['브로콜리']);
  });
});

describe('preferencesToInjuries (역변환)', () => {
  it('UserPreference 배열을 부상 목록으로 역변환', () => {
    const preferences: UserPreference[] = [
      {
        id: 'pref_1',
        clerkUserId: TEST_USER_ID,
        domain: 'workout',
        itemType: 'body_part',
        itemName: '무릎',
        itemNameEn: 'knee',
        isFavorite: false,
        avoidLevel: 'avoid',
        avoidReason: 'injury',
        priority: 4,
        source: 'user',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const result = preferencesToInjuries(preferences);
    expect(result).toEqual(['knee']);
  });

  it('부상이 없을 때 none 반환', () => {
    const preferences: UserPreference[] = [];
    const result = preferencesToInjuries(preferences);
    expect(result).toEqual(['none']);
  });
});
