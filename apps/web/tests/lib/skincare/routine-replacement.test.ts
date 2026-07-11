/**
 * 교체 제안 엔진 테스트 (G4 폐루프 v1 일부)
 * @see lib/skincare/routine-replacement.ts
 */
import { describe, it, expect } from 'vitest';
import {
  suggestRoutineReplacements,
  REPLACEMENT_COMPAT_THRESHOLD,
} from '@/lib/skincare/routine-replacement';
import type { RoutineStep } from '@/types/skincare-routine';
import type { ShelfItem } from '@/lib/scan/product-shelf';

// 함수는 id·compatibilityScore만 읽으므로 최소 필드만 채워 캐스팅
function shelf(id: string, compatibilityScore?: number): ShelfItem {
  return { id, compatibilityScore } as unknown as ShelfItem;
}

function step(overrides: Partial<RoutineStep>): RoutineStep {
  return {
    order: 1,
    category: 'serum',
    name: '세럼',
    purpose: '고민 케어',
    tips: [],
    isOptional: false,
    ...overrides,
  };
}

const OWNED_LOW = step({
  category: 'serum',
  specName: '비타민C 세럼',
  ownedProduct: { shelfItemId: 'shelf-1', name: '내 세럼' },
  recommendedProducts: [
    {
      id: 'cos-1',
      name: '브라이트닝 세럼',
      brand: '테스트브랜드',
    } as unknown as NonNullable<RoutineStep['recommendedProducts']>[number],
  ],
});

describe('suggestRoutineReplacements', () => {
  it('should 적합도 낮은 보유 제품 → 다 쓴 뒤 교체 제안', () => {
    const shelfItems = [shelf('shelf-1', 45)];
    const out = suggestRoutineReplacements([OWNED_LOW], shelfItems);
    expect(out).toHaveLength(1);
    expect(out[0].shelfItemId).toBe('shelf-1');
    expect(out[0].compatibilityScore).toBe(45);
    expect(out[0].direction).toBe('비타민C 세럼');
    expect(out[0].message).toContain('다 쓰신 뒤');
    expect(out[0].alternative?.id).toBe('cos-1');
  });

  it('should 적합도 충분(임계 이상) → 제안 안 함', () => {
    const shelfItems = [shelf('shelf-1', REPLACEMENT_COMPAT_THRESHOLD)];
    expect(suggestRoutineReplacements([OWNED_LOW], shelfItems)).toHaveLength(0);
  });

  it('should 점수 없는 미스캔 제품 → 판단 불가로 제안 안 함(지어내지 않음)', () => {
    const shelfItems = [shelf('shelf-1')]; // compatibilityScore undefined
    expect(suggestRoutineReplacements([OWNED_LOW], shelfItems)).toHaveLength(0);
  });

  it('should specName·대안 둘 다 없으면 제안 안 함(지어내지 않음)', () => {
    const noHint = step({
      ownedProduct: { shelfItemId: 'shelf-2', name: '내 토너' },
      category: 'toner',
      // specName 없음, recommendedProducts 없음
    });
    const out = suggestRoutineReplacements([noHint], [shelf('shelf-2', 30)]);
    expect(out).toHaveLength(0);
  });

  it('should specName 없으면 대안 제품명으로 방향 제시', () => {
    const altOnly = step({
      ownedProduct: { shelfItemId: 'shelf-3', name: '내 크림' },
      category: 'cream',
      recommendedProducts: [
        {
          id: 'cos-3',
          name: '수분크림',
          brand: '라운드랩',
        } as unknown as NonNullable<RoutineStep['recommendedProducts']>[number],
      ],
    });
    const out = suggestRoutineReplacements([altOnly], [shelf('shelf-3', 40)]);
    expect(out).toHaveLength(1);
    expect(out[0].direction).toBe('라운드랩 수분크림');
  });

  it('should 같은 제품이 여러 스텝에 있어도 1회만', () => {
    const dup = step({
      ownedProduct: { shelfItemId: 'shelf-1', name: '내 세럼' },
      specName: '비타민C 세럼',
    });
    const out = suggestRoutineReplacements([OWNED_LOW, dup], [shelf('shelf-1', 45)]);
    expect(out).toHaveLength(1);
  });

  it('should 보유 제품 없는 스텝은 대상 아님', () => {
    const catalogOnly = step({ specName: '비타민C 세럼' }); // ownedProduct 없음
    expect(suggestRoutineReplacements([catalogOnly], [shelf('shelf-1', 45)])).toHaveLength(0);
  });

  it("should 메시지에 '처방·치료' 없음 + '다 쓴 뒤' 프레이밍 고정", () => {
    const out = suggestRoutineReplacements([OWNED_LOW], [shelf('shelf-1', 45)]);
    for (const r of out) {
      expect(r.message).not.toMatch(/처방|치료|완치/);
      expect(r.message).toContain('다 쓰신 뒤');
    }
  });
});
