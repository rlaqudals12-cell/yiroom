import { describe, expect, it } from 'vitest';
import type { ShelfItem } from '@/lib/scan/product-shelf';
import {
  filterRoutineShelfItems,
  getRoutineSafetyNotice,
  resolveRoutineSafety,
  type RoutineSafetyProfile,
} from '@/lib/safety/routine-guard';

function profile(overrides: Partial<RoutineSafetyProfile> = {}): RoutineSafetyProfile {
  return {
    consentGiven: true,
    allergies: [],
    conditions: [],
    skinConditions: [],
    medications: [],
    age: null,
    ...overrides,
  };
}

function shelf(ingredient: string): ShelfItem {
  return {
    id: `shelf-${ingredient}`,
    clerkUserId: 'user-1',
    productName: `${ingredient} 세럼`,
    productIngredients: [{ order: 1, inciName: ingredient }],
    scannedAt: new Date('2026-09-01T00:00:00Z'),
    scanMethod: 'manual',
    status: 'owned',
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-01T00:00:00Z'),
  };
}

describe('resolveRoutineSafety', () => {
  it('문진 전에는 레티노이드 일정을 fail-closed로 잠근다', () => {
    expect(resolveRoutineSafety(null)).toEqual({
      retinoidAllowed: false,
      reason: 'unassessed',
    });
  });

  it.each(['pregnancy', 'breastfeeding', 'pregnancy_or_breastfeeding'])(
    '%s 상태면 레티노이드를 잠근다',
    (condition) => {
      expect(resolveRoutineSafety(profile({ conditions: [condition] }))).toEqual({
        retinoidAllowed: false,
        reason: 'pregnancy_or_breastfeeding',
      });
    }
  );

  it('이소트레티노인 복용 중이면 레티노이드를 잠근다', () => {
    expect(resolveRoutineSafety(profile({ medications: ['isotretinoin'] }))).toEqual({
      retinoidAllowed: false,
      reason: 'isotretinoin',
    });
  });

  it('동의한 문진에서 해당 상태가 없을 때만 레티노이드를 허용한다', () => {
    expect(resolveRoutineSafety(profile())).toEqual({ retinoidAllowed: true, reason: null });
  });
});

describe('filterRoutineShelfItems', () => {
  it('임신·수유 또는 이소트레티노인 상태에서 레티놀 보유 제품을 루틴에서 제외한다', () => {
    const result = filterRoutineShelfItems(
      [shelf('retinol')],
      profile({ conditions: ['breastfeeding'] })
    );
    expect(result.items).toEqual([]);
    expect(result.removedCount).toBe(1);
  });

  it('기존 임신 금기 규칙으로 살리실산 보유 제품을 루틴에서 제외한다', () => {
    const result = filterRoutineShelfItems(
      [shelf('salicylic acid')],
      profile({ conditions: ['pregnancy'] })
    );
    expect(result.items).toEqual([]);
    expect(result.removedCount).toBe(1);
  });

  it('알레르겐 BLOCK 경고가 난 보유 제품을 루틴에서 제외한다', () => {
    const result = filterRoutineShelfItems(
      [shelf('propolis extract')],
      profile({ allergies: ['balsam peru'] })
    );
    expect(result.items).toEqual([]);
    expect(result.removedCount).toBe(1);
  });

  it('문진상 해당 없음이면 일반 보유 제품을 유지한다', () => {
    const item = shelf('niacinamide');
    expect(filterRoutineShelfItems([item], profile()).items).toEqual([item]);
  });
});

describe('getRoutineSafetyNotice', () => {
  it('제한 원인별로 의료 조언이 아닌 상담 안내를 반환한다', () => {
    expect(getRoutineSafetyNotice('pregnancy_or_breastfeeding')).toContain('임신·수유');
    expect(getRoutineSafetyNotice('isotretinoin')).toContain('처방 의료인');
    expect(getRoutineSafetyNotice('unassessed')).toContain('안전 문진');
  });
});
