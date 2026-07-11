/**
 * 소진 예측 어댑터 테스트
 * @see lib/skincare/shelf-depletion.ts
 */
import { describe, it, expect } from 'vitest';
import { estimateShelfDepletion } from '@/lib/skincare/shelf-depletion';
import type { ShelfItem } from '@/lib/scan/product-shelf';

function makeShelf(overrides: Partial<ShelfItem>): ShelfItem {
  return {
    id: 'shelf-1',
    clerkUserId: 'user_1',
    productName: '제품',
    productIngredients: [],
    scannedAt: new Date(),
    scanMethod: 'manual',
    status: 'owned',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const NOW = new Date('2026-07-09T00:00:00');

describe('estimateShelfDepletion', () => {
  it('should expiresAt 있으면 그 기준 (high 신뢰)', () => {
    const item = makeShelf({
      productName: '선크림',
      expiresAt: new Date('2026-08-08T00:00:00'), // 30일 후
    });
    const result = estimateShelfDepletion(item, NOW);
    expect(result?.confidence).toBe('high');
    expect(result?.daysRemaining).toBe(30);
  });

  it('should openedAt만 있으면 카테고리 PAO 추정 (선크림 6개월, medium)', () => {
    const item = makeShelf({
      productName: '선크림 SPF50',
      openedAt: new Date('2026-07-09T00:00:00'),
    });
    const result = estimateShelfDepletion(item, NOW);
    expect(result?.confidence).toBe('medium');
    // 개봉 +6개월 = 2027-01-09 → 약 184일
    expect(result?.daysRemaining).toBeGreaterThan(150);
    expect(result?.daysRemaining).toBeLessThan(200);
  });

  it('should 크림은 12개월 PAO (선크림보다 김)', () => {
    const cream = makeShelf({ productName: '보습 크림', openedAt: NOW });
    const sunscreen = makeShelf({ productName: '선크림', openedAt: NOW });
    const creamDays = estimateShelfDepletion(cream, NOW)?.daysRemaining ?? 0;
    const sunDays = estimateShelfDepletion(sunscreen, NOW)?.daysRemaining ?? 0;
    expect(creamDays).toBeGreaterThan(sunDays);
  });

  it('should expiresAt이 openedAt보다 우선', () => {
    const item = makeShelf({
      productName: '토너',
      openedAt: new Date('2026-01-01T00:00:00'),
      expiresAt: new Date('2026-07-19T00:00:00'), // 10일 후
    });
    const result = estimateShelfDepletion(item, NOW);
    expect(result?.confidence).toBe('high');
    expect(result?.daysRemaining).toBe(10);
  });

  it('should openedAt·expiresAt 둘 다 없으면 null (지어내지 않음)', () => {
    const item = makeShelf({ productName: '세럼' });
    expect(estimateShelfDepletion(item, NOW)).toBeNull();
  });

  it('should 이미 만료된 경우 음수 daysRemaining', () => {
    const item = makeShelf({ productName: '크림', expiresAt: new Date('2026-07-01T00:00:00') });
    const result = estimateShelfDepletion(item, NOW);
    expect(result?.daysRemaining).toBeLessThan(0);
  });

  // 재발 방지: API 응답을 JSON.parse해 넘긴 소비처(제품함 상세)는 날짜를 ISO 문자열로 담는다.
  // 문자열 expiresAt/openedAt에 .getTime()을 호출하면 크래시하므로 강제 변환·NaN 가드해야 한다.
  it('should 문자열 expiresAt(JSON)이 와도 크래시 없이 계산한다', () => {
    const item = makeShelf({
      productName: '선크림',
      // ShelfItem 타입은 Date를 약속하지만 런타임엔 JSON 문자열이 온다 → 그 상황 재현
      expiresAt: '2026-08-08T00:00:00' as unknown as Date,
    });
    expect(() => estimateShelfDepletion(item, NOW)).not.toThrow();
    const result = estimateShelfDepletion(item, NOW);
    expect(result?.confidence).toBe('high');
    expect(result?.daysRemaining).toBe(30);
  });

  it('should 문자열 openedAt(JSON)이 와도 크래시 없이 PAO 추정한다', () => {
    const item = makeShelf({
      productName: '선크림 SPF50',
      openedAt: '2026-07-09T00:00:00' as unknown as Date,
    });
    expect(() => estimateShelfDepletion(item, NOW)).not.toThrow();
    expect(estimateShelfDepletion(item, NOW)?.confidence).toBe('medium');
  });

  it('should 무효 날짜 문자열은 근거 없음으로 취급(null, 지어내지 않음)', () => {
    const item = makeShelf({
      productName: '토너',
      expiresAt: 'not-a-date' as unknown as Date,
    });
    expect(estimateShelfDepletion(item, NOW)).toBeNull();
  });
});
