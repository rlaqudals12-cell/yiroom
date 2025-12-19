/**
 * Sprint 3: 어필리에이트 테스트
 * @description 어필리에이트 타입 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  toAffiliateProductType,
  toAffiliateClick,
  toDailyClickStats,
  type AffiliateClickRow,
  type AffiliateDailyStatsRow,
  type AffiliateProductType,
} from '@/types/affiliate';
import type { ProductType } from '@/types/product';

// ================================================
// toAffiliateProductType 테스트
// ================================================

describe('toAffiliateProductType', () => {
  it('cosmetic → cosmetic', () => {
    const result = toAffiliateProductType('cosmetic');
    expect(result).toBe('cosmetic');
  });

  it('supplement → supplement', () => {
    const result = toAffiliateProductType('supplement');
    expect(result).toBe('supplement');
  });

  it('workout_equipment → equipment', () => {
    const result = toAffiliateProductType('workout_equipment');
    expect(result).toBe('equipment');
  });

  it('health_food → healthfood', () => {
    const result = toAffiliateProductType('health_food');
    expect(result).toBe('healthfood');
  });

  it('모든 ProductType에 대해 AffiliateProductType 반환', () => {
    const productTypes: ProductType[] = [
      'cosmetic',
      'supplement',
      'workout_equipment',
      'health_food',
    ];
    const expectedTypes: AffiliateProductType[] = [
      'cosmetic',
      'supplement',
      'equipment',
      'healthfood',
    ];

    productTypes.forEach((type, index) => {
      expect(toAffiliateProductType(type)).toBe(expectedTypes[index]);
    });
  });
});

// ================================================
// toAffiliateClick 테스트
// ================================================

describe('toAffiliateClick', () => {
  const mockRow: AffiliateClickRow = {
    id: 'click-1',
    clerk_user_id: 'user-1',
    product_type: 'cosmetic',
    product_id: 'product-1',
    referrer: 'https://google.com',
    user_agent: 'Mozilla/5.0',
    ip_hash: 'abc123',
    clicked_at: '2025-01-01T12:00:00Z',
  };

  it('DB row를 AffiliateClick으로 변환', () => {
    const result = toAffiliateClick(mockRow);

    expect(result.id).toBe('click-1');
    expect(result.clerkUserId).toBe('user-1');
    expect(result.productType).toBe('cosmetic');
    expect(result.productId).toBe('product-1');
    expect(result.referrer).toBe('https://google.com');
    expect(result.userAgent).toBe('Mozilla/5.0');
    expect(result.ipHash).toBe('abc123');
    expect(result.clickedAt).toBe('2025-01-01T12:00:00Z');
  });

  it('null 필드를 undefined로 변환', () => {
    const rowWithNulls: AffiliateClickRow = {
      ...mockRow,
      clerk_user_id: null,
      referrer: null,
      user_agent: null,
      ip_hash: null,
    };

    const result = toAffiliateClick(rowWithNulls);

    expect(result.clerkUserId).toBeUndefined();
    expect(result.referrer).toBeUndefined();
    expect(result.userAgent).toBeUndefined();
    expect(result.ipHash).toBeUndefined();
  });

  it('필수 필드는 항상 존재', () => {
    const rowWithNulls: AffiliateClickRow = {
      id: 'click-2',
      clerk_user_id: null,
      product_type: 'supplement',
      product_id: 'product-2',
      referrer: null,
      user_agent: null,
      ip_hash: null,
      clicked_at: '2025-01-02T12:00:00Z',
    };

    const result = toAffiliateClick(rowWithNulls);

    expect(result.id).toBe('click-2');
    expect(result.productType).toBe('supplement');
    expect(result.productId).toBe('product-2');
    expect(result.clickedAt).toBe('2025-01-02T12:00:00Z');
  });
});

// ================================================
// toDailyClickStats 테스트
// ================================================

describe('toDailyClickStats', () => {
  const mockRow: AffiliateDailyStatsRow = {
    date: '2025-01-01',
    product_type: 'cosmetic',
    product_id: 'product-1',
    click_count: 150,
    unique_users: 42,
  };

  it('DB row를 DailyClickStats로 변환', () => {
    const result = toDailyClickStats(mockRow);

    expect(result.date).toBe('2025-01-01');
    expect(result.productType).toBe('cosmetic');
    expect(result.productId).toBe('product-1');
    expect(result.clickCount).toBe(150);
    expect(result.uniqueUsers).toBe(42);
  });

  it('다양한 제품 타입 처리', () => {
    const testCases: AffiliateDailyStatsRow[] = [
      { ...mockRow, product_type: 'supplement' },
      { ...mockRow, product_type: 'equipment' },
      { ...mockRow, product_type: 'healthfood' },
    ];

    testCases.forEach((row) => {
      const result = toDailyClickStats(row);
      expect(result.productType).toBe(row.product_type);
    });
  });

  it('클릭 수와 사용자 수 0 처리', () => {
    const zeroRow: AffiliateDailyStatsRow = {
      ...mockRow,
      click_count: 0,
      unique_users: 0,
    };

    const result = toDailyClickStats(zeroRow);

    expect(result.clickCount).toBe(0);
    expect(result.uniqueUsers).toBe(0);
  });
});

// ================================================
// AffiliateProductType 유효성 테스트
// ================================================

describe('AffiliateProductType', () => {
  it('유효한 타입만 허용', () => {
    const validTypes: AffiliateProductType[] = [
      'cosmetic',
      'supplement',
      'equipment',
      'healthfood',
    ];

    validTypes.forEach((type) => {
      expect(['cosmetic', 'supplement', 'equipment', 'healthfood']).toContain(type);
    });
  });
});
