/**
 * 루틴 브릿지 테스트
 * 웹 tests/lib/inventory/routine-bridge.test.ts 포팅
 */

import {
  matchProductsToRoutine,
  getMissingStepMessages,
  getLowStockMessages,
  getRoutineCoverageSummary,
} from '../../../lib/inventory/routine-bridge';
import type { InventoryProduct } from '../../../lib/inventory/routine-bridge';

// 테스트용 제품 팩토리
function createProduct(overrides: Partial<InventoryProduct> = {}): InventoryProduct {
  return {
    id: 'prod-1',
    name: '순한 클렌저',
    remainingPercent: 80,
    ...overrides,
  };
}

describe('matchProductsToRoutine', () => {
  it('빈 제품 목록이면 모든 스텝이 missing이어야 한다', () => {
    const result = matchProductsToRoutine([], 'morning');
    expect(result.stepMatches.length).toBeGreaterThan(0);
    expect(result.stepMatches.every((m) => m.isMissing)).toBe(true);
    expect(result.missingSteps.length).toBe(result.stepMatches.length);
    expect(result.missingSteps.length).toBeGreaterThan(0);
    expect(result.coveragePercent).toBe(0);
  });

  it('아침 루틴 제품을 매칭해야 한다', () => {
    const products: InventoryProduct[] = [
      createProduct({ id: '1', name: '폼 클렌저' }),
      createProduct({ id: '2', name: '토너' }),
      createProduct({ id: '3', name: '에센스' }),
      createProduct({ id: '4', name: '세럼' }),
      createProduct({ id: '5', name: '선크림' }),
    ];

    const result = matchProductsToRoutine(products, 'morning');
    expect(result.orderedSteps.length).toBeGreaterThan(0);
    expect(result.coveragePercent).toBeGreaterThan(0);
  });

  it('저녁 루틴 제품을 매칭해야 한다', () => {
    const products: InventoryProduct[] = [
      createProduct({ id: '1', name: '클렌징 오일' }),
      createProduct({ id: '2', name: '토너' }),
      createProduct({ id: '3', name: '크림' }),
    ];

    const result = matchProductsToRoutine(products, 'evening');
    expect(result.orderedSteps.length).toBeGreaterThan(0);
  });

  it('잔량이 낮은 제품을 lowStockProducts에 포함해야 한다', () => {
    const products: InventoryProduct[] = [
      createProduct({ id: '1', name: '토너', remainingPercent: 10 }),
      createProduct({ id: '2', name: '크림', remainingPercent: 80 }),
    ];

    const result = matchProductsToRoutine(products, 'morning');
    expect(result.lowStockProducts.some((p) => p.id === '1')).toBe(true);
    expect(result.lowStockProducts.some((p) => p.id === '2')).toBe(false);
  });

  it('커버리지가 0-100 범위여야 한다', () => {
    const products: InventoryProduct[] = [createProduct({ id: '1', name: '토너' })];

    const result = matchProductsToRoutine(products, 'morning');
    expect(result.coveragePercent).toBeGreaterThanOrEqual(0);
    expect(result.coveragePercent).toBeLessThanOrEqual(100);
  });

  it('아침 필수 단계 5개가 모두 매칭되면 100%여야 한다', () => {
    const products: InventoryProduct[] = [
      createProduct({ id: '1', name: '폼 클렌저' }),
      createProduct({ id: '2', name: '토너' }),
      createProduct({ id: '3', name: '세럼' }),
      createProduct({ id: '4', name: '수분크림' }),
      createProduct({ id: '5', name: '선크림' }),
    ];

    const result = matchProductsToRoutine(products, 'morning');
    expect(result.coveragePercent).toBe(100);
    expect(result.missingSteps).toHaveLength(0);
  });
});

describe('getMissingStepMessages', () => {
  it('빈 배열이면 빈 메시지 배열을 반환해야 한다', () => {
    const messages = getMissingStepMessages([]);
    expect(messages).toEqual([]);
  });

  it('누락된 스텝에 대한 메시지를 생성해야 한다', () => {
    const messages = getMissingStepMessages(['cleansing', 'sunscreen']);
    expect(messages).toHaveLength(2);
    messages.forEach((msg) => {
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    });
  });
});

describe('getLowStockMessages', () => {
  it('빈 배열이면 빈 메시지 배열을 반환해야 한다', () => {
    const messages = getLowStockMessages([]);
    expect(messages).toEqual([]);
  });

  it('잔량 부족 제품에 대한 메시지를 생성해야 한다', () => {
    const products: InventoryProduct[] = [
      createProduct({ name: '토너', remainingPercent: 10 }),
      createProduct({ name: '크림', remainingPercent: 5 }),
    ];
    const messages = getLowStockMessages(products);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toContain('토너');
    expect(messages[1]).toContain('크림');
  });
});

describe('getRoutineCoverageSummary', () => {
  it('100% 커버리지 처리', () => {
    const summary = getRoutineCoverageSummary(100, 'morning');
    expect(typeof summary).toBe('string');
    expect(summary).toContain('아침');
  });

  it('높은 커버리지에 긍정적 메시지를 반환해야 한다', () => {
    const summary = getRoutineCoverageSummary(90, 'morning');
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
  });

  it('낮은 커버리지에 안내 메시지를 반환해야 한다', () => {
    const summary = getRoutineCoverageSummary(20, 'evening');
    expect(typeof summary).toBe('string');
    expect(summary).toContain('저녁');
  });

  it('0% 커버리지 처리', () => {
    const summary = getRoutineCoverageSummary(0, 'morning');
    expect(typeof summary).toBe('string');
  });
});
